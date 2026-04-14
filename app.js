var supabaseUrl = 'https://porbwxrsvtqlnnefvftu.supabase.co'; 
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcmJ3eHJzdnRxbG5uZWZ2ZnR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDMyNDMsImV4cCI6MjA5MTYxOTI0M30.Fh6n5CRDxOXftlbPQy72CSWmAhAnC_iU8MEnayKhamo';
window.meuSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);
var carreiraAtualId = null;
var agendaAtual = [];
var elencoFixo = [];

window.verificarSessao = function() {
    const savedId = localStorage.getItem('smc_carreira_id');
    if (savedId) {
        carreiraAtualId = savedId;
        iniciarApp();
    } else {
        document.getElementById('tela-cadastro').classList.remove('hidden');
        document.getElementById('btnSair').classList.add('hidden');
        document.getElementById('barraNavegacao').classList.add('hidden');
        if(window.carregarCarreirasSalvas) window.carregarCarreirasSalvas();
    }
}

async function iniciarApp() {
    try {
        const { data } = await window.meuSupabase.from('carreiras').select('*').eq('id', carreiraAtualId).single();
        if (data) {
            document.getElementById('tela-cadastro').classList.add('hidden');
            document.getElementById('btnSair').classList.remove('hidden');
            document.getElementById('barraNavegacao').classList.remove('hidden');
            
            // Abastecer o Perfil com Case Tratado Estilisticamente
            window.atualizarHomeDashboard(data);
            
            window.mudarTela('home', 'Home', 'fa-home');
            atualizarDashboard();
            await window.carregarElenco();
            window.popularSeletorSúmula();
            carregarAgenda(); 
            carregarRankings(); // CARREGA O RANKING AO ABRIR O APP
        } else {
            fazerLogout();
        }
    } catch (e) { fazerLogout(); }
}

window.setAbaCadastro = function(aba) {
    const btnNova = document.getElementById('btnTabNova');
    const btnCarr = document.getElementById('btnTabCarregar');
    
    if(aba === 'nova') {
        document.getElementById('tabNovaCarreira').classList.remove('hidden');
        document.getElementById('tabCarregarCarreira').classList.add('hidden');
        
        btnNova.classList.replace('text-zinc-500', 'text-zinc-100');
        btnNova.classList.replace('hover:text-zinc-300', 'bg-zinc-800');
        
        btnCarr.classList.replace('bg-zinc-800', 'hover:text-zinc-300');
        btnCarr.classList.replace('text-zinc-100', 'text-zinc-500');
    } else {
        document.getElementById('tabNovaCarreira').classList.add('hidden');
        document.getElementById('tabCarregarCarreira').classList.remove('hidden');
        
        btnCarr.classList.replace('hover:text-zinc-300', 'bg-zinc-800');
        btnCarr.classList.replace('text-zinc-500', 'text-zinc-100');
        
        btnNova.classList.replace('bg-zinc-800', 'hover:text-zinc-300');
        btnNova.classList.replace('text-zinc-100', 'text-zinc-500');
    }
}

window.carregarCarreirasSalvas = async function() {
    try {
        const container = document.getElementById('listaCarreirasSalvas');
        const { data, error } = await window.meuSupabase.from('carreiras').select('*').order('criado_em', { ascending: false });
        if(error) throw error;
        
        if(!data || data.length === 0) {
            container.innerHTML = '<p class="text-xs text-zinc-600 text-center py-4">Nenhum save encontrado na nuvem.</p>';
            return;
        }
        
        let html = '';
        data.forEach(c => {
            html += `
            <div onclick="entrarNaCarreira('${c.id}')" class="bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-zinc-500 cursor-pointer transition flex justify-between items-center group mb-2">
                <div>
                    <p class="text-sm font-bold text-zinc-100 group-hover:text-emerald-500 transition uppercase tracking-tight">${c.clube}</p>
                    <p class="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase mt-0.5">${c.treinador}</p>
                </div>
                <i class="fa-solid fa-cloud-arrow-down text-lg text-zinc-600 group-hover:text-emerald-500 transition"></i>
            </div>`;
        });
        container.innerHTML = html;
        
    } catch(e) { console.error(e); }
}

window.entrarNaCarreira = function(id) {
    localStorage.setItem('smc_carreira_id', id);
    location.reload();
}

window.fazerLogout = function() {
    localStorage.removeItem('smc_carreira_id');
    location.reload();
}

window.atualizarHomeDashboard = function(carreira) {
    if(!carreira) return;
    
    // Title Case Transformer
    const toTitleCase = (str) => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    
    document.getElementById('homeNomeTreinador').innerText = toTitleCase(carreira.treinador);
    document.getElementById('homeNomeClube').innerHTML = `<i class="fa-solid fa-shield text-zinc-600"></i> ` + toTitleCase(carreira.clube);
    
    document.getElementById('homeIdadeTreinador').innerText = "42 Anos";
    document.getElementById('homeNacionalidadeTreinador').innerText = "Brasileiro";
    document.getElementById('homeReputacaoTreinador').innerHTML = `Intocável <i class="fa-solid fa-star text-[10px]"></i>`;
    
    // Carrossel Mock
    let carrosselHtml = '';
    const comps = [
        { nome: 'Camp. Brasileiro', fase: '13ª Rodada', status: 'Em Andamento' },
        { nome: 'Copa do Brasil', fase: 'Oitavas', status: 'Classificado' },
        { nome: 'Libertadores', fase: 'Fase de Grupos', status: 'Líder' }
    ];
    comps.forEach(c => {
        carrosselHtml += `
        <div class="min-w-[140px] snap-center bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow text-left flex-shrink-0">
            <p class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 truncate">${c.nome}</p>
            <p class="text-sm font-bold text-zinc-200">${c.fase}</p>
            <p class="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1">${c.status}</p>
        </div>`;
    });
    
    let elCarrossel = document.getElementById('homeCompeticoesCarrossel');
    if(elCarrossel) elCarrossel.innerHTML = carrosselHtml;
}

window.carregarElenco = async function() {
    try {
        const { data, error } = await window.meuSupabase.from('jogadores').select('*').order('nome', { ascending: true });
        if (!error && data) {
            elencoFixo = data;
            if(window.renderizarAvaliacaoRapida) window.renderizarAvaliacaoRapida();
        }
    } catch(e) { console.error(e); }
}

window.renderizarAvaliacaoRapida = function() {
    let container = document.getElementById('miniCardsAvaliacao');
    if(!container) return;
    if(elencoFixo.length === 0) {
        container.innerHTML = '<div class="text-center p-4 text-zinc-600 text-xs">Elenco vazio. Sincronize a base.</div>';
        return;
    }
    
    let html = '';
    elencoFixo.forEach(jog => {
        html += `
        <div class="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center transition" data-id="${jog.id}" data-nome="${jog.nome}" data-energia="${jog.energia || 100}" data-partidas="${jog.partidas_jogadas || 0}" data-avaliacao="">
            <span class="text-[11px] font-semibold text-zinc-200 tracking-wider flex items-center gap-2">
                <span class="text-[8px] text-zinc-500 bg-zinc-800 px-1 py-0.5 rounded uppercase border border-zinc-700">${jog.posicao || '-'}</span> 
                ${jog.nome}
            </span>
            <div class="flex gap-1.5">
                <button type="button" onclick="setAvaliacao(this, 'frio')" class="btn-aval w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex justify-center items-center opacity-40 hover:opacity-100 transition text-[10px]">🥶</button>
                <button type="button" onclick="setAvaliacao(this, 'neutro')" class="btn-aval w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex justify-center items-center opacity-40 hover:opacity-100 transition text-[10px]">😐</button>
                <button type="button" onclick="setAvaliacao(this, 'fogo')" class="btn-aval w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex justify-center items-center opacity-40 hover:opacity-100 transition text-[10px]">🔥</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

window.setAvaliacao = function(btn, tipo) {
    const parent = btn.parentElement.parentElement;
    parent.setAttribute('data-avaliacao', tipo);
    
    // Reseta irmãos
    parent.querySelectorAll('.btn-aval').forEach(b => {
        b.classList.remove('bg-rose-500', 'bg-blue-500', 'bg-zinc-500', 'opacity-100', 'border-transparent', 'scale-110');
        b.classList.add('bg-zinc-800', 'opacity-40', 'border-zinc-700');
    });
    
    // Ativa este
    btn.classList.remove('bg-zinc-800', 'opacity-40', 'border-zinc-700');
    btn.classList.add('opacity-100', 'border-transparent', 'scale-110');
    
    if(tipo === 'fogo') btn.classList.add('bg-rose-500');
    if(tipo === 'neutro') btn.classList.add('bg-zinc-500');
    if(tipo === 'frio') btn.classList.add('bg-blue-500');
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
                            <span class="text-[10px] text-zinc-500 ml-1" title="Moral: ${jogador.moral}">Moral: ${moralIcon}</span>
                        </div>
                        <h4 class="font-bold text-zinc-100 mt-1 mb-1.5">${jogador.nome}</h4>
                        <span class="text-[10px] font-bold tracking-widest uppercase bg-slate-800 text-zinc-300 border border-slate-700 px-2 py-1 rounded inline-flex items-center gap-1"><i class="fa-solid fa-shirt text-zinc-500"></i> ${jogador.partidas_jogadas || 0} Jogos</span>
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
        if(document.getElementById('adversario')) document.getElementById('adversario').value = jogos[0].adversario;
        
        // Logica Home Container 3
        if(document.getElementById('homeProximoAdversario')) document.getElementById('homeProximoAdversario').innerText = jogos[0].adversario;
        if(document.getElementById('homeProximoCompeticao')) document.getElementById('homeProximoCompeticao').innerText = jogos[0].competicao + " • " + jogos[0].local;
        if(document.getElementById('homeProximoData')) document.getElementById('homeProximoData').innerText = new Date().toLocaleDateString('pt-BR');
        
    } else {
        if(document.getElementById('adversario')) document.getElementById('adversario').value = "";
        
        // Vazio Home
        if(document.getElementById('homeProximoAdversario')) document.getElementById('homeProximoAdversario').innerText = "Fim de Temporada";
        if(document.getElementById('homeProximoCompeticao')) document.getElementById('homeProximoCompeticao').innerText = "--";
        if(document.getElementById('homeProximoData')) document.getElementById('homeProximoData').innerText = "Férias";
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
        // Lógica Tinder do Vestiário (Avaliação Rápida)
        let resultPlacar = "Boa";
        let proNum = parseInt(pro) || 0;
        let conNum = parseInt(contra) || 0;
        if (proNum > conNum) resultPlacar = "Excelente";
        else if (proNum < conNum) resultPlacar = "Baixa";
        
        let updatesJogadores = [];
        const containerCards = document.getElementById('miniCardsAvaliacao');
        if (containerCards) {
            containerCards.querySelectorAll('div[data-id]').forEach(card => {
                let idJog = card.getAttribute('data-id');
                let aval = card.getAttribute('data-avaliacao');
                let energiaBase = parseInt(card.getAttribute('data-energia')) || 100;
                let partidasBase = parseInt(card.getAttribute('data-partidas')) || 0;
                
                let novaEnergia = energiaBase;
                let novaMoral = resultPlacar;
                let jogou = false;
                
                if (aval === 'fogo') {
                    novaMoral = 'Excelente';
                    novaEnergia = Math.max(0, energiaBase - 15);
                    jogou = true;
                } else if (aval === 'neutro') {
                    novaEnergia = Math.max(0, energiaBase - 20);
                    jogou = true;
                } else if (aval === 'frio') {
                    novaMoral = 'Baixa';
                    novaEnergia = Math.max(0, energiaBase - 25);
                    jogou = true;
                } else {
                    // Cuidado Físico pro Reserva (Recupera +15)
                    novaEnergia = Math.min(100, energiaBase + 15);
                }
                
                updatesJogadores.push({
                    id: idJog,
                    energia: novaEnergia,
                    moral: novaMoral,
                    partidas_jogadas: jogou ? (partidasBase + 1) : partidasBase
                });
            });
        }
        
        if (updatesJogadores.length > 0) {
            const { error: upsertErr } = await window.meuSupabase.from('jogadores').upsert(updatesJogadores);
            if (upsertErr) {
                alert("Falha Supersônica do Banco de Dados: " + upsertErr.message);
                throw upsertErr;
            }
            await window.carregarElenco(); // Refresh silently
        }

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
        
        const { error: partidaErr } = await window.meuSupabase.from('partidas').insert([{ carreira_id: carreiraAtualId, adversario: adv, gols_pro: parseInt(pro), gols_contra: parseInt(contra), fato_do_jogo: fatoJson }]);
        if (partidaErr) throw new Error("Supabase: " + partidaErr.message);
        
        if (agendaAtual.length > 0 && agendaAtual[0].adversario === adv) {
            const jogoDeletado = agendaAtual[0];
            if (!jogoDeletado.id.startsWith('mock')) {
                const { error: agendaErr } = await window.meuSupabase.from('agenda').delete().eq('id', jogoDeletado.id);
                if (agendaErr) console.warn("Erro ao apagar agenda:", agendaErr.message);
            }
            agendaAtual.shift(); renderizarListaJogos(agendaAtual);
        }
        
        document.getElementById('golsPro').value = "0"; document.getElementById('golsContra').value = "0";
        document.getElementById('containerGols').innerHTML = '<div class="flex gap-2"><input type="text" list="listaElencoFixo" placeholder="Nome do Jogador" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none focus:border-zinc-600"><input type="number" min="1" value="1" class="w-14 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none text-center focus:border-zinc-600"><button type="button" onclick="this.parentElement.remove()" class="text-zinc-600 px-1 hover:text-rose-500 transition"><i class="fa-solid fa-xmark"></i></button></div>';
        document.getElementById('containerAssists').innerHTML = '<div class="flex gap-2"><input type="text" list="listaElencoFixo" placeholder="Nome do Jogador" class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none focus:border-zinc-600"><input type="number" min="1" value="1" class="w-14 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 text-sm outline-none text-center focus:border-zinc-600"><button type="button" onclick="this.parentElement.remove()" class="text-zinc-600 px-1 hover:text-rose-500 transition"><i class="fa-solid fa-xmark"></i></button></div>';
        document.getElementById('amarelos').value = ""; document.getElementById('vermelhos').value = "";
        document.getElementById('lesoes').value = ""; document.getElementById('fatoDoJogo').value = "";
        
        // Reseta os cards do Tinder do Vestiario
        if (window.renderizarAvaliacaoRapida) window.renderizarAvaliacaoRapida();
        
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
        carreiraAtualId = data.id;
        localStorage.setItem('smc_carreira_id', data.id);
        
        window.atualizarHomeDashboard(data);
        document.getElementById('tela-cadastro').classList.add('hidden');
        document.getElementById('barraNavegacao').classList.remove('hidden'); 
        document.getElementById('btnSair').classList.remove('hidden');
        
        window.mudarTela('home', 'Home', 'fa-home');
        iniciarApp(); // Roda a master para dar o sync final
    } catch(e) {}
}

window.abrirModal = function(id) { document.getElementById(id).classList.remove('hidden'); }
window.fecharModal = function(id) { document.getElementById(id).classList.add('hidden'); }

window.salvarNovoJogo = async function() {
    const adv = document.getElementById('novoJogoAdv').value;
    const comp = document.getElementById('novoJogoComp').value || "Amistoso";
    const loc = document.getElementById('novoJogoLocal').value;
    const dateE = document.getElementById('novoJogoData').value;
    
    if(!adv) return alert("Digite o nome do adversário.");
    
    document.getElementById('btnSaveJogo').innerText = "Agendando...";
    try {
        let payload = {
            carreira_id: carreiraAtualId,
            adversario: adv,
            competicao: comp,
            local: loc
        };
        if(dateE) payload.data_jogo = dateE;
        
        const { error } = await window.meuSupabase.from('agenda').insert([payload]);
        if(error) throw new Error("DB Error: " + error.message);
        
        document.getElementById('novoJogoAdv').value = '';
        fecharModal('modal-jogo');
        carregarAgenda();
    } catch(e) { alert("Erro ao marcar jogo"); }
    finally { document.getElementById('btnSaveJogo').innerText = "Agendar"; }
}

window.salvarNovoJogador = async function() {
    const nome = document.getElementById('novoJogNome').value;
    const pos = document.getElementById('novoJogPos').value;
    const num = document.getElementById('novoJogNum').value;
    
    if(!nome) return alert("Digite o nome do jogador.");
    
    document.getElementById('btnSaveJogador').innerText = "Assinando...";
    try {
        const { error } = await window.meuSupabase.from('jogadores').insert([{
            nome: nome,
            posicao: pos,
            energia: 100,
            moral: 'Boa',
            partidas_jogadas: 0
        }]);
        if (error) throw new Error("DB Error: " + error.message);
        
        document.getElementById('novoJogNome').value = '';
        fecharModal('modal-jogador');
        
        // Sincronizando visual components pós assinaturas
        await window.carregarElenco();
        if(window.popularSeletorSúmula) window.popularSeletorSúmula();
        
    } catch(e) { alert("Erro ao assinar com jogador"); }
    finally { document.getElementById('btnSaveJogador').innerText = "Contratar"; }
}

window.verificarSessao();
