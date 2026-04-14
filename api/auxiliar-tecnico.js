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
        const { vitorias, empates, derrotas, adversario } = req.body;
        
        if (!adversario) {
            return res.status(400).json({ error: 'Faltam dados do próximo adversário.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Usamos a 2.5 Flash por ser extremamente instântanea e ideal para esse tipo de payload rápido
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `Tu és um Auxiliar Técnico de futebol brasileiro experiente e leal. Com base nestas estatísticas do meu time (Vitórias: ${vitorias}, Empates: ${empates}, Derrotas: ${derrotas}), e sabendo que o próximo jogo é contra ${adversario}, dá-me um conselho tático ou motivacional curto (máximo 2 linhas) com uma pitada de personalidade de quem está no balneário e usa gírias pontuais da bola. Não uses formatações como negrito (*), apenas texto limpo.`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.9, // Um pouco criativo para trazer frases diferentes todas as vezes
            }
        });
        
        const textoResposta = result.response.text();
        
        return res.status(200).json({ conselho: textoResposta.trim() });

    } catch (error) {
        console.error("Erro na Prancheta Pré-Jogo:", error);
        return res.status(500).json({ error: 'O Assistente coringou.', text: 'Cara, tô sem comunicação aqui, vamo focar no treino que esse jogo vai ser duro!' });
    }
}
