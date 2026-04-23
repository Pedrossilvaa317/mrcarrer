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

Gere EXATAMENTE 2 situações dramaticas nos bastidores do clube, inspiradas no contexto da partida.
Podem ser: confusão no vestiário, jogador irritado, pressão da diretoria, situação crítica com jogador, rumor de transferência, conflito interno.
Os tipos possíveis: "SITUAÇÃO CRÍTICA", "BASTIDOR", "RUMOR", "TENSÃO".
Retorne APENAS um Array JSON válido, sem markdown:
[
  { "tipo": "SITUAÇÃO CRÍTICA", "titulo": "Capitão ameaça não jogar próxima partida", "descricao": "Após a derrota, o capitão teria discutido com o técnico no vestiário e ameaçado..." },
  { "tipo": "BASTIDOR", "titulo": "Diretoria cobra reunião de emergência", "descricao": "Insatisfeita com os resultados, a diretoria teria convocado o técnico para uma reunião..." }
]
`;

    try {
        const result = await model.generateContent(prompt);
        let txt = result.response.text().replace(/```json/g,'').replace(/```/g,'').trim();
        const situacoes = JSON.parse(txt);
        res.status(200).json({ situacoes });
    } catch (err) {
        console.error('gerar-situacoes erro:', err);
        res.status(200).json({ situacoes: [
            { tipo: "SITUAÇÃO CRÍTICA", titulo: "Tensão no vestiário após o jogo", descricao: "Jogadores e comissão técnica reunidos após a partida para análise interna." },
            { tipo: "BASTIDOR",         titulo: "Diretoria monitora resultados de perto", descricao: "A pressão por desempenho continua nos bastidores do clube." }
        ]});
    }
}
