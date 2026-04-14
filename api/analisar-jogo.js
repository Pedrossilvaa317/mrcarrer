import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { detalhesParaIA } = req.body;
        
        if (!detalhesParaIA) {
            return res.status(400).json({ error: 'Faltam dados da partida.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Fallback for stable version
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Aja como o cérebro de um Super Modo Carreira. Analise os seguintes detalhes do último jogo:
${detalhesParaIA}

Com base nestes detalhes, gere duas respostas curtas (máximo 2 linhas cada):
1. "jornalista": Uma manchete sensacionalista e um breve comentário crítico sobre o resultado (no estilo imprensa esportiva brasileira).
2. "auxiliar": Um comentário muito prático do seu auxiliar técnico fazendo uma observação rápida (pode ser elogio tático ou bronca devido a lesão/cartões/derrota).

Retorne EXATAMENTE UM objeto JSON válido com essas duas chaves (jornalista e auxiliar). Não adicione crases markdown e não adicione outro texto.`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 250,
                temperature: 0.8,
            }
        });
        
        const textoObtido = result.response.text().replace(/```(?:json)?/g, '').trim();
        let payloadFinal;
        try {
            payloadFinal = JSON.parse(textoObtido);
        } catch(e) {
            payloadFinal = { jornalista: "Treinador recusa falar com a imprensa após a partida.", auxiliar: "Chefe, não consegui entender os dados analíticos do jogo." };
        }
        
        return res.status(200).json(payloadFinal);

    } catch (error) {
        console.error("Erro na Análise Pós Jogo:", error);
        return res.status(500).json({ error: 'Falha da IA: ' + error.message, jornalista: "Sem coletiva hoje.", auxiliar: "Apagão no servidor, professor." });
    }
}
