import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { detalhesParaIA } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        Você é o motor de inteligência artificial de um jogo de gestão de futebol focado no Vasco da Gama (SMC - Super Modo Carreira).
        Acabou de acontecer uma partida com o seguinte contexto:
        "${detalhesParaIA}"

        Sua tarefa é simular a repercussão nas redes sociais logo após o apito final. 
        Você deve gerar EXATAMENTE 3 postagens falsas e retornar APENAS um Array JSON válido, sem formatação markdown (\`\`\`json) e sem texto antes ou depois.

        Siga estas 3 personas rigorosamente:
        1. Conta Oficial (tipo: "clube", rede: "X"): Tom institucional, focado no resultado e no engajamento da torcida.
        2. Mídia Esportiva (tipo: "midia", rede: "Instagram"): Tom jornalístico, destacando o melhor em campo ou uma polêmica/lesão se houver.
        3. Torcedor Fanático (tipo: "torcedor", rede: "X"): Tom passional, escrito muitas vezes em caixa alta, usando gírias do futebol, exagerando tanto na vitória quanto na derrota.

        O formato exato do JSON deve ser este (substitua os valores com a sua geração baseada no contexto do jogo):
        [
          { "rede": "X", "autor": "@VascodaGama", "tipo": "clube", "texto": "Fim de jogo! Grande vitória hoje... 💢", "engajamento": "12K" },
          { "rede": "Instagram", "autor": "ge.globo", "tipo": "midia", "texto": "DESTAQUE! O Vasco garantiu o resultado após...", "engajamento": "45K" },
          { "rede": "X", "autor": "@VascainoPistola", "tipo": "torcedor", "texto": "QUE JOGO ABSURDO! NUNCA DUVIDEI DESTE ELENCO...", "engajamento": "843" }
        ]
    `;

    try {
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Limpando possível sujeira de markdown que o modelo teima em mandar
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const postsSocial = JSON.parse(responseText);

        res.status(200).json({ posts: postsSocial });
    } catch (error) {
        console.error("Erro no Gemini:", error);
        // Fallback blindado caso a IA falhe ou dê timeout
        res.status(200).json({
            posts: [
                { "rede": "X", "autor": "@VascodaGama", "tipo": "clube", "texto": "Fim de papo. Foco no próximo desafio. 💢", "engajamento": "5K" },
                { "rede": "Instagram", "autor": "ge.globo", "tipo": "midia", "texto": "Equipe encerra a rodada pensando em ajustes para o próximo compromisso.", "engajamento": "15K" }
            ]
        });
    }
}
