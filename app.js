var supabaseUrl = 'https://porbwxrsvtqlnnefvftu.supabase.co'; 
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcmJ3eHJzdnRxbG5uZWZ2ZnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDMyNDMsImV4cCI6MjA5MTYxOTI0M30.Fh6n5CRDxOXftlbPQy72CSWmAhAnC_iU8MEnayKhamo';
window.meuSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);
var carreiraAtualId = null;
var agendaAtual = [];
var elencoFixo = [];
window.estadoAvaliacao = {};

async function iniciarApp() {
    try {
        const { data } = await window.meuSupabase.from('carreiras').select('*').order('criado_em', { ascending: false }).limit(1).single();
        if (data) {
            carreiraAtualId = data.id;
            document.getElementById('dashNomeTreinador').innerText = data.treinador;
            document.getElementById('barraNavegacao').classList.remove('hidden');
            window.mudarTela('dashboard', 'Dashboard', 'fa-chart-pie');
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
            window.renderizarAvaliacaoRapida();
        }
    } catch(e) { console.error(e); }
}

window.renderizarAvaliacaoRapida = function() {
    let container = document.getElementById('miniCardsAvaliacao');
    if (!container) return;
    
    let html = '';
    elencoFixo.forEach(jogador => {
        window.estadoAvaliacao[jogador.id] = null; // Default neutro
        
        html += `
        <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex justify-between items-center shadow-inner">
            <span class="text-[11px] font-bold text-zinc-300 w-1/2 line-clamp-1">${jogador.nome}</span>
            <div class="flex gap-2">
                <button type="button" id="btn_frio_${jogador.id}" onclick="selecionarAvaliacao('${jogador.id}', 'frio')" class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs hover:scale-110 transition active:scale-95 text-opacity-50 grayscale shadow">🥶</button>
                <button type="button" id="btn_neutro_${jogador.id}" onclick="selecionarAvaliacao('${jogador.id}', 'neutro')" class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs hover:scale-110 transition active:scale-95 text-opacity-50 grayscale shadow">😐</button>
                <button type="button" id="btn_fogo_${jogador.id}" onclick="selecionarAvaliacao('${jogador.id}', 'fogo')" class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs hover:scale-110 transition active:scale-95 text-opacity-50 grayscale shadow">🔥</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

window.selecionarAvaliacao = function(jogadorId, tipo) {
    document.getElementById(`btn_frio_${jogadorId}`).className = "w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs hover:scale-110 transition active:scale-95 text-opacity-50 grayscale shadow";
    document.getElementById(`btn_neutro_${jogadorId}`).className = "w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs hover:scale-110 transition active:scale-95 text-opacity-50 grayscale shadow";
    document.getElementById(`btn_fogo_${jogadorId}`).className = "w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs hover:scale-110 transition active:scale-95 text-opacity-50 grayscale shadow";
    
    if (window.estadoAvaliacao[jogadorId] === tipo) {
        window.estadoAvaliacao[jogadorId] = null;
    } else {
        window.estadoAvaliacao[jogadorId] = tipo;
        if (tipo === 'frio') { document.getElementById(`btn_frio_${jogadorId}`).classList.replace('bg-zinc-800', 'bg-blue-600'); document.getElementById(`btn_frio_${jogadorId}`).classList.replace('border-zinc-700', 'border-blue-500'); document.getElementById(`btn_frio_${jogadorId}`).classList.remove('grayscale', 'text-opacity-50'); }
        if (tipo === 'neutro') { document.getElementById(`btn_neutro_${jogadorId}`).classList.replace('bg-zinc-800', 'bg-zinc-500'); document.getElementById(`btn_neutro_${jogadorId}`).classList.replace('border-zinc-700', 'border-zinc-400'); document.getElementById(`btn_neutro_${jogadorId}`).classList.remove('grayscale', 'text-opacity-50'); }
        if (tipo === 'fogo') { document.getElementById(`btn_fogo_${jogadorId}`).classList.replace('bg-zinc-800', 'bg-orange-600'); document.getElementById(`btn_fogo_${jogadorId}`).classList.replace('border-zinc-700', 'border-orange-500'); document.getElementById(`btn_fogo_${jogadorId}`).classList.remove('grayscale', 'text-opacity-50'); }
    }
}

window.popularSeletorSúmula = function() {
    let html = '';
    
    if (elencoFixo.length > 0) {
        elencoFixo.forEach(jogador => {
            html += `<option value="${jogador.nome}"></option>`;
        });
    }
    
    const dataList = document.getElementById('listaElencoFixo');
    if (dataList) dataList.innerHTML = html;
}

window.adicionarLinhaGol = function() {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" list="listaElencoFixo" placeholder="Nome do Jogador" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none focus:border-zinc-600"><input type="number" min="1" value="1" class="w-14 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none text-center focus:border-zinc-600"><button type="button" onclick="this.parentElement.remove()" class="text-zinc-600 px-1 hover:text-rose-500 transition"><i class="fa-solid fa-xmark"></i></button>`;
    document.getElementById('containerGols').appendChild(div);
}

window.adicionarLinhaAssist = function() {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" list="listaElencoFixo" placeholder="Nome do Jogador" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none focus:border-zinc-600"><input type="number" min="1" value="1" class="w-14 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none text-center focus:border-zinc-600"><button type="button" onclick="this.parentElement.remove()" class="text-zinc-600 px-1 hover:text-rose-500 transition"><i class="fa-solid fa-xmark"></i></button>`;
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
            let icone = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `<span class="text-zinc-600">${i+1}</span>`;
            htmlGols += `<div class="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800 shadow-sm"><span class="font-medium text-sm text-zinc-300"><span class="mr-2 text-zinc-500 font-bold">${icone}.</span> ${j.nome}</span><span class="text-zinc-100 text-sm font-bold bg-zinc-800 px-2.5 py-0.5 rounded">${j.gols}</span></div>`;
        });
        document.getElementById('rankingGols').innerHTML = htmlGols || '<p class="text-xs text-zinc-600 text-center py-4">Falta bola na rede.</p>';

        // Monta a tela de ASSISTÊNCIAS
        let garcons = [...arrayJogadores].filter(j => j.assists > 0).sort((a, b) => b.assists - a.assists);
        let htmlAssists = '';
        garcons.forEach((j, i) => {
            let icone = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `<span class="text-zinc-600">${i+1}</span>`;
            htmlAssists += `<div class="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800 shadow-sm"><span class="font-medium text-sm text-zinc-300"><span class="mr-2 text-zinc-500 font-bold">${icone}.</span> ${j.nome}</span><span class="text-zinc-100 text-sm font-bold bg-zinc-800 px-2.5 py-0.5 rounded">${j.assists}</span></div>`;
        });
        document.getElementById('rankingAssists').innerHTML = htmlAssists || '<p class="text-xs text-zinc-600 text-center py-4">Faltam assistências.</p>';

        // RENDERIZAÇÃO DO ELENCO PROFUNDO
        let htmlPlantel = '';
        elencoFixo.forEach(jogador => {
            // Merge
            let jStats = statsJogadores[jogador.nome] || { gols: 0, assists: 0 };
            
            // Lógica Energia
            let energiaNum = parseInt(jogador.energia) || 100;
            let energiaColor = energiaNum > 70 ? 'bg-emerald-500' : (energiaNum > 40 ? 'bg-amber-500' : 'bg-rose-500');
            
            // Lógica Moral
            let mStr = (jogador.moral || '').toLowerCase();
            let moralIcon = '😐';
            if (mStr === 'excelente') moralIcon = '🔥';
            else if (mStr === 'boa') moralIcon = '🙂';
            else if (mStr === 'baixa') moralIcon = '😡';

            htmlPlantel += `
            <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg relative overflow-hidden transition">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-[9px] font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700 uppercase tracking-widest">${jogador.posicao || 'N/A'}</span>
                            <span class="text-[10px] text-zinc-500" title="Moral: ${jogador.moral}">Moral: ${moralIcon}</span>
                        </div>
                        <h4 class="font-bold text-zinc-100 mt-1">${jogador.nome}</h4>
                    </div>
                    <div class="flex gap-2 text-[10px] bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-md text-zinc-400 font-semibold h-fit">
                        <span title="Gols Marcados"><i class="fa-solid fa-bullseye text-zinc-600 mr-0.5"></i> ${jStats.gols}</span>
                        <span title="Assistências"><i class="fa-solid fa-share-nodes text-zinc-600 mr-0.5 ml-1"></i> ${jStats.assists}</span>
                    </div>
                </div>
                
                <!-- Energy Bar -->
                <div>
                    <div class="flex justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                        <span>Energia Física</span>
                        <span>${energiaNum}%</span>
                    </div>
                    <div class="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                        <div class="h-full ${energiaColor} transition-all duration-500" style="width: ${energiaNum}%"></div>
                    </div>
                </div>
            </div>`;
        });
        
        let containerPlantel = document.getElementById('listaPlantel');
        if (containerPlantel) containerPlantel.innerHTML = htmlPlantel || '<p class="text-xs text-zinc-600 text-center py-4">Nenhum jogador no plantel.</p>';

    } catch(e) { console.error(e); }
}

window.carregarAgenda = async function() {
    try {
        const { data, error } = await window.meuSupabase.from('agenda').select('*').eq('carreira_id', carreiraAtualId).order('data_jogo', { ascending: true });
        if (error || !data || data.length === 0) throw new Error("Sem dados");
        agendaAtual = data; renderizarListaJogos(agendaAtual);
        gerarDiagnosticoPreditivo();
    } catch (error) {
        agendaAtual = [
            { id: 'mock1', adversario: 'Juventude', competicao: 'Brasileirão', local: 'Fora' },
            { id: 'mock2', adversario: 'Flamengo', competicao: 'Brasileirão', local: 'Casa' }
        ];
        renderizarListaJogos(agendaAtual);
        gerarDiagnosticoPreditivo();
    }
}

window.gerarDiagnosticoPreditivo = async function() {
    const diagEl = document.getElementById('textoDiagnostico');
    if (!diagEl) return;
    if (agendaAtual.length === 0) { diagEl.innerHTML = "Sem jogos na agenda para observar."; return; }
    
    diagEl.innerHTML = "Puxando scout do adversário... ⏳";
    
    try {
        const { data } = await window.meuSupabase.from('partidas').select('gols_pro, gols_contra').eq('carreira_id', carreiraAtualId);
        let v = 0, e = 0, d = 0;
        if(data) { data.forEach(j => { if (j.gols_pro > j.gols_contra) v++; else if (j.gols_pro === j.gols_contra) e++; else d++; }); }
        
        let adversario = agendaAtual[0].adversario;
        
        const response = await fetch('/api/auxiliar-tecnico', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vitorias: v, empates: e, derrotas: d, adversario })
        });
        
        if (response.ok) {
            const result = await response.json();
            const textoFinal = result.conselho || "Vamos firmes para esse jogo.";
            
            diagEl.innerHTML = "";
            let i = 0;
            let textArray = textoFinal.split('');
            clearInterval(window.typingInterval);
            window.typingInterval = setInterval(() => {
                if (i < textArray.length) {
                    diagEl.innerHTML += textArray[i];
                    i++;
                } else {
                    clearInterval(window.typingInterval);
                }
            }, 30); 
            
        } else {
            diagEl.innerHTML = '"Foco total hoje. Bora pra cima!"';
        }
    } catch (err) {
        diagEl.innerHTML = '"Sem comunicação no momento. Foco no treino!"';
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
        let isFirst = index === 0;
        let borderClass = isFirst ? 'border-zinc-600 shadow-md' : 'border-zinc-800/40 opacity-80';
        let statusBadge = isFirst ? '<span class="bg-zinc-100 text-zinc-900 text-[9px] px-2 py-1 rounded font-bold tracking-widest">PRÓXIMO</span>' : '<span class="bg-zinc-950 text-zinc-500 text-[9px] px-2 py-1 rounded font-bold tracking-widest border border-zinc-800">PENDENTE</span>';
        let bg = isFirst ? 'bg-zinc-900' : 'bg-zinc-900/50';
        html += `<div class="${bg} p-4 rounded-xl border ${borderClass} flex justify-between items-center transition"><div><p class="text-[10px] text-zinc-500 font-semibold tracking-widest mb-1">${jogo.competicao} • ${jogo.local}</p><p class="font-bold text-lg text-zinc-100">${jogo.adversario}</p></div><div>${statusBadge}</div></div>`;
    });
    document.getElementById('listaAgenda').innerHTML = html || '<div class="text-center p-10 text-zinc-600 text-xs bg-zinc-900 rounded-xl border border-dashed border-zinc-800">Fixture limpo!</div>';
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
    document.getElementById('tituloTela').innerHTML = `<i class="fa-solid ${icone} text-base"></i> ${titulo}`;
    
    document.querySelectorAll('.nav-btn').forEach(b => { 
        b.classList.remove('text-zinc-100'); 
        b.classList.add('text-zinc-600'); 
    });
    
    if (event && event.currentTarget && event.currentTarget.classList.contains('nav-btn')) {
        event.currentTarget.classList.remove('text-zinc-600'); 
        event.currentTarget.classList.add('text-zinc-100');
    } else if (idTela === 'sumula') {
        document.querySelectorAll('.nav-btn')[1].classList.remove('text-zinc-600'); 
        document.querySelectorAll('.nav-btn')[1].classList.add('text-zinc-100');
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
                    feedSocial.innerHTML = `<div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-3"><p class="font-bold text-[9px] text-zinc-500 mb-1.5 tracking-widest"><i class="fa-regular fa-newspaper"></i> MANCHETE</p><p class="text-xs text-zinc-300 leading-relaxed">${respostasIA.jornalista}</p></div>` + feedSocial.innerHTML;
                }
                
                let feedAuxiliar = document.getElementById('feed-auxiliar');
                if (feedAuxiliar && feedAuxiliar.innerHTML.includes('Aguardando final')) feedAuxiliar.innerHTML = '';
                if (respostasIA.auxiliar && feedAuxiliar) {
                    feedAuxiliar.innerHTML = `<div class="mb-4 pb-4 border-b border-zinc-800/50"><p class="font-mono text-[11px] leading-relaxed text-zinc-400">"${respostasIA.auxiliar}"</p><p class="text-[9px] text-zinc-600 font-bold mt-2 text-right">Vs ${adv}</p></div>` + feedAuxiliar.innerHTML;
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
        document.getElementById('containerGols').innerHTML = '<div class="flex gap-2"><input type="text" list="listaElencoFixo" placeholder="Nome do Jogador" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none focus:border-zinc-600"><input type="number" min="1" value="1" class="w-14 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none text-center focus:border-zinc-600"><button type="button" onclick="this.parentElement.remove()" class="text-zinc-600 px-1 hover:text-rose-500 transition"><i class="fa-solid fa-xmark"></i></button></div>';
        document.getElementById('containerAssists').innerHTML = '<div class="flex gap-2"><input type="text" list="listaElencoFixo" placeholder="Nome do Jogador" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none focus:border-zinc-600"><input type="number" min="1" value="1" class="w-14 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none text-center focus:border-zinc-600"><button type="button" onclick="this.parentElement.remove()" class="text-zinc-600 px-1 hover:text-rose-500 transition"><i class="fa-solid fa-xmark"></i></button></div>';
        document.getElementById('amarelos').value = ""; document.getElementById('vermelhos').value = "";
        document.getElementById('lesoes').value = ""; document.getElementById('fatoDoJogo').value = "";
        
        // UPDATE EM MASSA (ENERGIA E MORAL) - VESTIÁRIO TINDER //
        let placarMoralBase = 'Boa';
        let golsTime = parseInt(pro);
        let golsAdv = parseInt(contra);
        if (golsTime > golsAdv) placarMoralBase = 'Excelente';
        if (golsTime < golsAdv) placarMoralBase = 'Baixa';

        let updatesAvaliacao = [];
        elencoFixo.forEach(jogador => {
            let energiaAtual = parseInt(jogador.energia) || 100;
            let ava = window.estadoAvaliacao[jogador.id];
            
            let novaMoral = placarMoralBase;
            let novaEnergia = energiaAtual;

            if (ava === 'fogo') {
                novaMoral = 'Excelente';
                novaEnergia = Math.max(0, energiaAtual - 15);
            } else if (ava === 'neutro') {
                novaEnergia = Math.max(0, energiaAtual - 20);
            } else if (ava === 'frio') {
                novaMoral = 'Baixa';
                novaEnergia = Math.max(0, energiaAtual - 25);
            } else {
                novaEnergia = Math.min(100, energiaAtual + 15); // Descansou
            }

            // Garante que é numérico pro supabase
            if(isNaN(novaEnergia)) novaEnergia = 100;

            updatesAvaliacao.push(
                window.meuSupabase.from('jogadores').update({ moral: novaMoral, energia: novaEnergia }).eq('id', jogador.id)
            );
        });
        
        await Promise.all(updatesAvaliacao);
        await window.carregarElenco(); // Recarrega os dados com as energias frescas
        
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
        document.getElementById('barraNavegacao').classList.remove('hidden'); window.mudarTela('dashboard', 'Dashboard', 'fa-chart-pie');
    } catch(e) {}
}



iniciarApp();
