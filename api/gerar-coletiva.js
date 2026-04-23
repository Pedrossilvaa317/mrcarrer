import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
    const { detalhesParaIA } = req.body;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Chave da API não configurada.' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Você é o motor de IA de um jogo de gestão de futebol (SMC - Super Modo Carreira).
Contexto da partida: "${detalhesParaIA}"

Gere EXATAMENTE 3 perguntas de coletiva de imprensa que os jornalistas fariam ao técnico logo após a partida.
Varie os tons: uma AMISTOSA (curiosidade técnica), uma AGRESSIVA (critica performance/erro), uma PROVOCATIVA (questionamento de decisão).
Varie os veículos: ge.globo, ESPN Brasil, TNT Sports, UOL Esporte, Gazeta Esportiva.
Retorne APENAS um Array JSON válido, sem markdown:
[
  { "jornalista": "Marcelo Courrege", "veiculo": "ge.globo", "tipo": "AMISTOSA", "pergunta": "Técnico, como o senhor avalia..." },
  { "jornalista": "Antero Greco", "veiculo": "ESPN Brasil", "tipo": "AGRESSIVA", "pergunta": "O senhor admite que..." },
  { "jornalista": "Paulo Vinícius Coelho", "veiculo": "UOL Esporte", "tipo": "PROVOCATIVA", "pergunta": "Não seria mais eficiente se..." }
]
`;

    try {
        const result = await model.generateContent(prompt);
        let txt = result.response.text().replace(/```json/g,'').replace(/```/g,'').trim();
        const perguntas = JSON.parse(txt);
        res.status(200).json({ perguntas });
    } catch (err) {
        console.error('gerar-coletiva erro:', err);
        // Fallback com 3 perguntas genéricas
        res.status(200).json({ perguntas: [
            { jornalista: "Repórter", veiculo: "ge.globo",    tipo: "AMISTOSA",    pergunta: "Como o senhor avalia o desempenho geral da equipe nesta partida?" },
            { jornalista: "Repórter", veiculo: "ESPN Brasil", tipo: "AGRESSIVA",   pergunta: "A atuação do time ficou abaixo do esperado. O senhor concorda?" },
            { jornalista: "Repórter", veiculo: "TNT Sports",  tipo: "PROVOCATIVA", pergunta: "Qual a análise do senhor sobre as escolhas táticas desta partida?" }
        ]});
    }
}
