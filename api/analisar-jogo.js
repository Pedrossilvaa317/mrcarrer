import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { detalhesParaIA } = req.body;
        if (!detalhesParaIA) return res.status(400).json({ error: 'Faltam dados da partida' });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const prompt = `Você é 2 personagens distintos avaliando a última partida do meu time em um Modo Carreira de eSports (Simulador de Futebol).
Aqui estão os detalhes cruos e estatísticas que aconteceram na partida recém finalizada, dadas pelo próprio jogador:
---
${detalhesParaIA}
---

Sua missão é me retornar um JSON estritamente formatado com duas chaves:
1. "jornalista": Crie um Tweet (com emojis) escrito por um jornalista esportivo cobrindo a partida. Seja corneteiro se o meu time perdeu ou empatou feio, ou seja sensacionalista e exalte os craques se ganhamos e houveram marcadores e assistências. Use fatos apontados no relato para dar contexto ao leitor. (Máximo 280 caracteres).
2. "auxiliar": Escreva um breve relatório tático do seu Assistente Técnico (2 ou 3 frases) em linguagem técnica e direta. Diga o que deu certo na armação de jogadas, comente se a disciplina foi boa (cartões) e aponte o que precisamos ajustar no treinamento para a semana, usando o resultado e o relato do técnico na súmula como base.

Retorne EXCLUSIVAMENTE json em texto puro (sem \`\`\`json):
{
  "jornalista": "texto...",
  "auxiliar": "texto..."
}`;

        const modelosParaTestar = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-lite-latest", "gemini-2.5-pro"];
        
        let ultimoErro = null;

        for (const nomeModelo of modelosParaTestar) {
            try {
                const model = genAI.getGenerativeModel({ model: nomeModelo });
                const result = await model.generateContent(prompt);
                
                const textResponse = result.response.text();
                const cleanJsonStr = textResponse.replace(/```(?:json)?/g, '').trim();
                const dados = JSON.parse(cleanJsonStr);
                
                return res.status(200).json(dados);

            } catch (err) {
                ultimoErro = err;
                if (err.message.includes('503') || err.message.includes('429') || err.message.includes('not supported') || err.message.includes('not found')) {
                    continue; 
                }
                break;
            }
        }
        
        throw ultimoErro;
        
    } catch (error) {
        console.error("Erro Fatal IA Texto:", error);
        return res.status(500).json({ error: error.message });
    }
}
