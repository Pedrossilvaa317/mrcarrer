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
        const prompt = `Você é um especialista em análise de estatísticas de futebol (escaneamento de Súmulas/Telas de Fim de Jogo de eSports, como EA FC / FIFA).
Dada a imagem da tela de fim de jogo, extraia as seguintes informações e retorne EXCLUSIVAMENTE em formato JSON, sem marcações markdown ou qualquer outro texto:
{
  "gols_pro": (número), "gols_contra": (número), "marcadores": ["Nome 1"], "assistencias": ["Nome"], "amarelos": ["Nome"], "vermelhos": ["Nome"], "fato_do_jogo": "Um breve texto."
}
Certifique-se de que a saída seja um JSON perfeitamente válido.`;

        // Sistema Cascata: Se o Google der Overload (503) em um modelo, saltamos pro próximo silenciosamente!
        const modelosParaTestar = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-2.5-pro", "gemini-1.5-flash-latest"];
        
        let ultimoErro = null;

        for (const nomeModelo of modelosParaTestar) {
            try {
                const model = genAI.getGenerativeModel({ model: nomeModelo });
                
                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: imagemBase64, mimeType: mimeType || "image/jpeg" } }
                ]);

                const textResponse = result.response.text();
                const cleanJsonStr = textResponse.replace(/```(?:json)?/g, '').trim();
                const dados = JSON.parse(cleanJsonStr);
                
                return res.status(200).json(dados); // Se conseguiu, morre aqui e devolve sucesso.

            } catch (err) {
                ultimoErro = err;
                // Se for erro de Servidor (503) ou Quota (429) do Google, ou modelo que não processa imagens, tenta o próximo looping
                if (err.message.includes('503') || err.message.includes('429') || err.message.includes('not supported') || err.message.includes('not found')) {
                    console.log(`Modelo ${nomeModelo} falhou, tentando próximo...`);
                    continue; 
                }
                // Se for erro de Token (400), quebra e avisa o cliente.
                break;
            }
        }
        
        // Se esgotou todas as opções e nenhum funfou, emite o erro do último
        throw ultimoErro;
        
    } catch (error) {
        console.error("Erro Fatal no VAR Cascata:", error);
        return res.status(500).json({ error: error.message });
    }
}
