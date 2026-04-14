var supabaseUrl = 'https://porbwxrsvtqlnnefvftu.supabase.co'; 
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcmJ3eHJzdnRxbG5uZWZ2ZnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDMyNDMsImV4cCI6MjA5MTYxOTI0M30.Fh6n5CRDxOXftlbPQy72CSWmAhAnC_iU8MEnayKhamo';
window.meuSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);
var carreiraAtualId = null;
var agendaAtual = [];
var elencoFixo = [];

async function iniciarApp() {
    try {
        const { data } = await window.meuSupabase.from('carreiras').select('*').order('criado_em', { ascending: false }).limit(1).single();
        if (data) {
            carreiraAtualId = data.id;
            document.getElementById('dashNomeTreinador').innerText = data.treinador;
            document.getElementById('dashNomeClube').innerText = data.clube;
            document.getElementById('barraNavegacao').classList.remove('hidden');
            window.mudarTela('dashboard', 'Visão Geral', 'fa-house');
            atualizarDashboard();
            await window.carregarElenco();
            window.popularSeletorSúmula();
            carregarAgenda(); 
            carregarRankings(); // CARREGA O RANKING AO ABRIR O APP
        } else {
            window.mudarTela('cadastro', 'Assinar Contrato', 'fa-id-card');
        }
    } catch (e) { window.mudarTela('cadastro', 'Assinar Contrato', 'fa-id-card'); }
}

window.carregarElenco = async function() {
    try {
        const { data, error } = await window.meuSupabase.from('jogadores').select('*').order('nome', { ascending: true });
        if (!error && data) {
            elencoFixo = data;
        }
    } catch(e) { console.error(e); }
}

window.popularSeletorSúmula = function() {
    let html = '';
    let squadHtml = '';
    
    if (elencoFixo.length === 0) {
        squadHtml = '<div class="text-center p-6 text-gray-500 text-xs">Nenhum jogador cadastrado.</div>';
    } else {
        elencoFixo.forEach(jogador => {
            html += `<option value="${jogador.nome}"></option>`;
            let pos = jogador.posicao ? `<span class="text-[9px] bg-slate-700 px-1.5 py-0.5 rounded text-gray-400 font-bold">${jogador.posicao}</span>` : '';
            squadHtml += `<div class="py-2 flex justify-between items-center"><span class="font-bold text-sm text-gray-200">${jogador.nome}</span> ${pos}</div>`;
        });
    }
    
    const dataList = document.getElementById('listaElencoFixo');
    if (dataList) dataList.innerHTML = html;
    
    const displayElenco = document.getElementById('listaElencoDisplay');
    if (displayElenco) displayElenco.innerHTML = squadHtml;
}

window.adicionarLinhaGol = function() {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" list="listaElencoFixo" placeholder="Jogador" class="flex-1 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none"><input type="number" min="1" value="1" class="w-14 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none text-center"><button type="button" onclick="this.parentElement.remove()" class="text-red-500 px-1 hover:text-red-400"><i class="fa-solid fa-trash"></i></button>`;
    document.getElementById('containerGols').appendChild(div);
}

window.adicionarLinhaAssist = function() {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" list="listaElencoFixo" placeholder="Jogador" class="flex-1 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none"><input type="number" min="1" value="1" class="w-14 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none text-center"><button type="button" onclick="this.parentElement.remove()" class="text-red-500 px-1 hover:text-red-400"><i class="fa-solid fa-trash"></i></button>`;
    document.getElementById('containerAssists').appendChild(div);
}

// A MÁGICA DOS RANKINGS
window.carregarRankings = async function() {
    try {
        // Puxa todos os relatos dos jogos que você já salvou
        const { data, error } = await window.meuSupabase.from('partidas').select('fato_do_jogo').eq('carreira_id', carreiraAtualId);
        if (error) throw error;

        let statsJogadores = {};

        // Lê cada partida
        data.forEach(partida => {
            if(partida.fato_do_jogo) {
                let dadosEstruturados;
                try {
                    dadosEstruturados = JSON.parse(partida.fato_do_jogo);
                } catch(e) {
                    return; // Ignora formato de texto livre antigo
                }
                
                if (dadosEstruturados.gols && Array.isArray(dadosEstruturados.gols)) {
                    dadosEstruturados.gols.forEach(nome => {
                        if(!statsJogadores[nome]) statsJogadores[nome] = { gols: 0, assists: 0 };
                        statsJogadores[nome].gols += 1;
                    });
                }

                if (dadosEstruturados.assists && Array.isArray(dadosEstruturados.assists)) {
                    dadosEstruturados.assists.forEach(nome => {
                        if(!statsJogadores[nome]) statsJogadores[nome] = { gols: 0, assists: 0 };
                        statsJogadores[nome].assists += 1;
                    });
                }
            }
        });

        // Filtra para garantir que só entram no ranking se estiverem no elenco fixo, resolvendo os problemas de typo
        let arrayJogadores = Object.keys(statsJogadores)
            .filter(nome => elencoFixo.some(jogador => jogador.nome.toLowerCase() === nome.toLowerCase()))
            .map(nome => {
                let nomeOficial = elencoFixo.find(jogador => jogador.nome.toLowerCase() === nome.toLowerCase()).nome;
                return { nome: nomeOficial, ...statsJogadores[nome] };
            });

        // Monta a tela de GOLS
        let artilheiros = [...arrayJogadores].filter(j => j.gols > 0).sort((a, b) => b.gols - a.gols);
        let htmlGols = '';
        artilheiros.forEach((j, i) => {
            let icone = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '<i class="fa-solid fa-futbol text-gray-500"></i>';
            htmlGols += `<div class="flex justify-between items-center bg-slate-700 p-3 rounded-lg border-l-2 border-green-500 shadow"><span class="font-bold text-sm">${icone} ${j.nome}</span><span class="bg-green-600 text-white text-xs font-black px-2.5 py-1 rounded shadow-inner">${j.gols}</span></div>`;
        });
        document.getElementById('rankingGols').innerHTML = htmlGols || '<p class="text-xs text-gray-500 text-center py-4">A rede ainda não balançou.</p>';

        // Monta a tela de ASSISTÊNCIAS
        let garcons = [...arrayJogadores].filter(j => j.assists > 0).sort((a, b) => b.assists - a.assists);
        let htmlAssists = '';
        garcons.forEach((j, i) => {
            let icone = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '<i class="fa-solid fa-shoe-prints text-gray-500"></i>';
            htmlAssists += `<div class="flex justify-between items-center bg-slate-700 p-3 rounded-lg border-l-2 border-blue-500 shadow"><span class="font-bold text-sm">${icone} ${j.nome}</span><span class="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded shadow-inner">${j.assists}</span></div>`;
        });
        document.getElementById('rankingAssists').innerHTML = htmlAssists || '<p class="text-xs text-gray-500 text-center py-4">Nenhum passe para gol.</p>';

    } catch(e) { console.error(e); }
}

window.carregarAgenda = async function() {
    try {
        const { data, error } = await window.meuSupabase.from('agenda').select('*').eq('carreira_id', carreiraAtualId).order('data_jogo', { ascending: true });
        if (error || !data || data.length === 0) throw new Error("Sem dados");
        agendaAtual = data; renderizarListaJogos(agendaAtual);
    } catch (error) {
        agendaAtual = [
            { id: 'mock1', adversario: 'Juventude', competicao: 'Brasileirão', local: 'Fora' },
            { id: 'mock2', adversario: 'Flamengo', competicao: 'Brasileirão', local: 'Casa' }
        ];
        renderizarListaJogos(agendaAtual);
    }
}

function renderizarListaJogos(jogos) {
    if (jogos.length > 0) {
        document.getElementById('adversario').value = jogos[0].adversario;
        if(document.getElementById('btnSumulaHome')) document.getElementById('btnSumulaHome').innerHTML = `Súmula vs ${jogos[0].adversario} <i class="fa-solid fa-arrow-right"></i>`;
    } else {
        document.getElementById('adversario').value = "";
        if(document.getElementById('btnSumulaHome')) document.getElementById('btnSumulaHome').innerHTML = `Nenhum jogo na agenda <i class="fa-solid fa-calendar-plus"></i>`;
    }

    let html = '';
    jogos.forEach((jogo, index) => {
        let borderClass = index === 0 ? 'border-red-500 shadow-xl' : 'border-gray-600 opacity-75';
        let statusBadge = index === 0 ? '<span class="bg-red-600 text-white text-[9px] px-2 py-1 rounded font-black tracking-widest">PRÓXIMO</span>' : '<span class="bg-slate-700 text-gray-400 text-[9px] px-2 py-1 rounded font-black tracking-widest border border-slate-600">A JOGAR</span>';
        html += `<div class="bg-slate-800 p-4 rounded-xl border-l-4 ${borderClass} flex justify-between items-center transition"><div><p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">${jogo.competicao} • ${jogo.local}</p><p class="font-black text-lg text-white">${jogo.adversario}</p></div><div>${statusBadge}</div></div>`;
    });
    document.getElementById('listaAgenda').innerHTML = html || '<div class="text-center p-10 text-gray-400 text-xs bg-slate-800 rounded-xl border border-dashed border-slate-600">Agenda vazia!</div>';
}

window.atualizarDashboard = async function() {
    try {
        const { data } = await window.meuSupabase.from('partidas').select('gols_pro, gols_contra').eq('carreira_id', carreiraAtualId);
        let v = 0, e = 0, d = 0;
        if(data) { data.forEach(j => { if (j.gols_pro > j.gols_contra) v++; else if (j.gols_pro === j.gols_contra) e++; else d++; }); }
        const tot = v + e + d;
        document.getElementById('statVitorias').innerText = v; document.getElementById('statEmpates').innerText = e; document.getElementById('statDerrotas').innerText = d;
        document.getElementById('statAproveitamento').innerText = tot > 0 ? (((v * 3) + e) / (tot * 3) * 100).toFixed(1) + '%' : '0%';
    } catch (e) {}
}

window.mudarTela = function(idTela, titulo, icone) {
    document.querySelectorAll('.tab-content').forEach(t => { t.classList.add('hidden'); t.classList.remove('block'); });
    document.getElementById('tela-' + idTela).classList.remove('hidden'); document.getElementById('tela-' + idTela).classList.add('block');
    document.getElementById('tituloTela').innerHTML = `<i class="fa-solid ${icone} text-xl"></i> ${titulo}`;
    document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-red-500'); b.classList.add('text-gray-500'); });
    if(event && event.currentTarget && event.currentTarget.classList.contains('nav-btn')) {
        event.currentTarget.classList.remove('text-gray-500'); event.currentTarget.classList.add('text-red-500');
    } else if (idTela === 'sumula') {
        document.querySelectorAll('.nav-btn')[1].classList.remove('text-gray-500'); document.querySelectorAll('.nav-btn')[1].classList.add('text-red-500');
    }
    window.scrollTo(0, 0); 
}

// FUNCAO FAKE DESCARTADA
window.simularIAGemini = async function(adv, pro, contra, detalhes) {
    return {
        jornalista: "Relatório de imprensa ativado...",
        auxiliar: "Análise técnica em andamento..."
    };
}

window.salvarPartida = async function() {
    const adv = document.getElementById('adversario').value; const pro = document.getElementById('golsPro').value;
    const contra = document.getElementById('golsContra').value; const fato = document.getElementById('fatoDoJogo').value;
    
    const amarelos = document.getElementById('amarelos').value || "Nenhum";
    const vermelhos = document.getElementById('vermelhos').value || "Nenhum";
    const lesoes = document.getElementById('lesoes').value || "Nenhuma";

    if (!adv || !fato) return alert("Preencha adversário e fato do jogo!");
    
    document.getElementById('btnSalvar').innerHTML = "Enviando... ⏳";
    try {
        const parseDinamico = (containerId) => {
            let nomes = [];
            const container = document.getElementById(containerId);
            if(container) {
                container.querySelectorAll('div').forEach(linha => {
                    const textInput = linha.querySelector('input[type="text"]');
                    const numInput = linha.querySelector('input[type="number"]');
                    let n = textInput ? textInput.value.trim() : '';
                    let q = numInput ? parseInt(numInput.value) : 1;
                    if(n && n.toLowerCase() !== "nenhum" && n.toLowerCase() !== "nenhuma") {
                        for(let i=0; i<q; i++) nomes.push(n);
                    }
                });
            }
            return nomes;
        };

        const parseNomes = (str) => {
            if (!str || str.toLowerCase() === "nenhum" || str.toLowerCase() === "nenhuma") return [];
            return str.split(',').map(s => s.trim()).filter(s => s);
        };

        const golsExtraidos = parseDinamico('containerGols');
        const assistsExtraidas = parseDinamico('containerAssists');
        const marcadoresStr = golsExtraidos.join(', ') || "Nenhum";
        const assistenciasStr = assistsExtraidas.join(', ') || "Nenhum";

        const dadosEstruturados = {
            gols: golsExtraidos,
            assists: assistsExtraidas,
            cartoes: {
                amarelos: parseNomes(amarelos),
                vermelhos: parseNomes(vermelhos)
            },
            lesoes: parseNomes(lesoes),
            relato: fato
        };
        const fatoJson = JSON.stringify(dadosEstruturados);

        const detalhesParaIA = `Adversário: ${adv}. Placar: Nosso Time ${pro} x ${contra} ${adv}. Gols marcados: ${marcadoresStr}. Assists: ${assistenciasStr}. Cartões (A/V): ${amarelos} / ${vermelhos}. Lesões: ${lesoes}. Relato sumário do treinador: ${fato}`;
        
        try {
            const fetchIA = await fetch('/api/analisar-jogo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ detalhesParaIA })
            });

            if(fetchIA.ok) {
                const respostasIA = await fetchIA.json();
                
                let feedSocial = document.getElementById('feed-social');
                if (feedSocial && feedSocial.innerHTML.includes('telefone está quieto')) feedSocial.innerHTML = '';
                if (respostasIA.jornalista && feedSocial) {
                    feedSocial.innerHTML = `<div class="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 mb-3"><p class="font-bold text-[10px] text-blue-400 mb-1 tracking-widest"><i class="fa-solid fa-newspaper"></i> GE E-SPORTS</p><p class="text-xs text-gray-200">${respostasIA.jornalista}</p></div>` + feedSocial.innerHTML;
                }
                
                let feedAuxiliar = document.getElementById('feed-auxiliar');
                if (feedAuxiliar && feedAuxiliar.innerHTML.includes('Aguardando final')) feedAuxiliar.innerHTML = '';
                if (respostasIA.auxiliar && feedAuxiliar) {
                    feedAuxiliar.innerHTML = `<div class="mb-3 border-b border-amber-800/50 pb-3"><p class="font-mono text-xs leading-relaxed text-amber-100/90 italic">"${respostasIA.auxiliar}"</p><p class="text-[9px] text-amber-500 font-bold mt-2 text-right">- Jogo vs ${adv}</p></div>` + feedAuxiliar.innerHTML;
                }
            } else {
                console.error("Vercel falhou ao gerar AI Text.");
            }
        } catch(err) {
            console.error(err);
        }
        
        await window.meuSupabase.from('partidas').insert([{ carreira_id: carreiraAtualId, adversario: adv, gols_pro: parseInt(pro), gols_contra: parseInt(contra), fato_do_jogo: fatoJson }]);
        
        if (agendaAtual.length > 0 && agendaAtual[0].adversario === adv) {
            const jogoDeletado = agendaAtual[0];
            if (!jogoDeletado.id.startsWith('mock')) await window.meuSupabase.from('agenda').delete().eq('id', jogoDeletado.id);
            agendaAtual.shift(); renderizarListaJogos(agendaAtual);
        }
        
        document.getElementById('golsPro').value = "0"; document.getElementById('golsContra').value = "0";
        document.getElementById('containerGols').innerHTML = '<div class="flex gap-2"><input type="text" list="listaElencoFixo" placeholder="Jogador" class="flex-1 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none"><input type="number" min="1" value="1" class="w-14 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none text-center"><button type="button" onclick="this.parentElement.remove()" class="text-red-500 px-1 hover:text-red-400"><i class="fa-solid fa-trash"></i></button></div>';
        document.getElementById('containerAssists').innerHTML = '<div class="flex gap-2"><input type="text" list="listaElencoFixo" placeholder="Jogador" class="flex-1 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none"><input type="number" min="1" value="1" class="w-14 bg-slate-700 rounded-lg p-2.5 text-white text-sm outline-none text-center"><button type="button" onclick="this.parentElement.remove()" class="text-red-500 px-1 hover:text-red-400"><i class="fa-solid fa-trash"></i></button></div>';
        document.getElementById('amarelos').value = ""; document.getElementById('vermelhos').value = "";
        document.getElementById('lesoes').value = ""; document.getElementById('fatoDoJogo').value = "";
        
        atualizarDashboard(); 
        carregarRankings(); // RECALCULA O RANKING COM OS DADOS NOVOS!
        window.mudarTela('social', 'Feed de Notícias', 'fa-hashtag');
    } catch (e) { alert("Erro: " + e.message); } 
    finally { document.getElementById('btnSalvar').innerHTML = "Salvar e Coletiva 🎙️"; }
}

window.criarCarreira = async function() {
    const nome = document.getElementById('novoNome').value; const clube = document.getElementById('novoClube').value;
    if(!nome || !clube) return alert("Preencha o seu nome e o clube!");
    try {
        const { data } = await window.meuSupabase.from('carreiras').insert([{ treinador: nome, clube: clube }]).select().single();
        carreiraAtualId = data.id; document.getElementById('dashNomeTreinador').innerText = data.treinador; document.getElementById('dashNomeClube').innerText = data.clube;
        document.getElementById('barraNavegacao').classList.remove('hidden'); window.mudarTela('dashboard', 'Visão Geral', 'fa-house');
    } catch(e) {}
}



iniciarApp();
