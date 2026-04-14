import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imagemBase64, mimeType } = req.body;
        if (!imagemBase64) return res.status(400).json({ error: 'Imagem não fornecida' });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
Você é um especialista em análise de estatísticas de futebol (escaneamento de Súmulas/Telas de Fim de Jogo de eSports, como EA FC / FIFA).
Dada a imagem da tela de fim de jogo, extraia as seguintes informações e retorne EXCLUSIVAMENTE em formato JSON, sem marcações markdown ou qualquer outro texto:

{
  "gols_pro": (número de gols do "Nosso Time" ou jogador foco),
  "gols_contra": (número de gols do adversário),
  "marcadores": ["Nome Jogador 1", "Nome Jogador 2"], // Quem fez gol pelo Nosso Time. Array vazio se nenhum. Duplique o nome se fez mais de 1 gol.
  "assistencias": ["Nome Jogador 1", "Nome Jogador 2"], // Quem deu assistência pelo Nosso Time. Array vazio se nenhum. Duplique se tiver mais de uma.
  "amarelos": ["Nome Jogador"], // Array de quem tomou cartão amarelo
  "vermelhos": ["Nome Jogador"], // Array de quem tomou cartão vermelho
  "fato_do_jogo": "Um breve texto de 1 ou 2 frases resumindo como foi o jogo baseado nas notas e estatísticas (se foi amasso, equilibrado, defesa sólida, etc)."
}

Analise a imagem minuciosamente para extrair essas informações com base no formato que você deduzir da tela (estatísticas, placar, avaliações, etc.). Certifique-se de que a saída seja um JSON perfeitamente válido.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imagemBase64,
                    mimeType: mimeType || "image/jpeg"
                }
            }
        ]);

        const textResponse = result.response.text();
        const cleanJsonStr = textResponse.replace(/```(?:json)?/g, '').trim();
        
        const dados = JSON.parse(cleanJsonStr);
        return res.status(200).json(dados);
        
    } catch (error) {
        console.error("Erro na API do Gemini:", error);
        return res.status(500).json({ error: error.message });
    }
}
