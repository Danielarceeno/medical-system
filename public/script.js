document.addEventListener('DOMContentLoaded', () => {

    // --- DECLARAÇÃO DE CONSTANTES ---

    const filtroCidade = document.getElementById('filtro-cidade');
    const filtroNome = document.getElementById('filtro-nome');
    const filtroEspecialidade = document.getElementById('filtro-especialidade');
    const filtroValorMin = document.getElementById('filtro-valor-min');
    const filtroValorMax = document.getElementById('filtro-valor-max');
    const seletorOrdenacao = document.getElementById('seletor-ordenacao');
    const btnLimpar = document.getElementById('btn-limpar');
    
    const resultadosContainer = document.getElementById('resultados-container');
    const paginationContainer = document.getElementById('pagination-container');
    const comparacaoContainer = document.getElementById('comparacao-vizinhos-container');

    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    const modalCadastro = document.getElementById('modal-cadastro');
    const fecharModal = document.querySelector('.fechar-modal');
    const formCadastro = document.getElementById('form-cadastro');
    const modalTitulo = document.querySelector('#modal-cadastro h2');
    const modalBotaoSubmit = document.querySelector('#modal-cadastro .botao-form-submit');
    const campoHiddenEdit = document.getElementById('edit-row-index');

    // --- VARIÁVEIS DE ESTADO ---
    let dadosCompletos = [];
    let dadosFiltrados = [];
    let currentPage = 1;
    const itemsPerPage = 9;

    // --- FUNÇÕES ---

    async function buscarDados() {
        try {
            const response = await fetch('/api/dados');
            if (!response.ok) throw new Error('Falha ao carregar dados da API.');
            
            dadosCompletos = await response.json();
            aplicarFiltros(); 
            renderizarPlaceholderComparacao();
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            resultadosContainer.innerHTML = '<p>Não foi possível carregar os dados. Verifique a conexão com o servidor.</p>';
        }
    }
    
    function renderizarPagina() {
        const resultadosHeader = document.querySelector('.resultados-header'); // Pega o novo elemento do cabeçalho
        const totalResultados = dadosFiltrados.length;
    
        // --- 1. ATUALIZA O CABEÇALHO DE RESULTADOS ---
        if (resultadosHeader) {
            const textoContador = totalResultados === 1 ? 'médico encontrado' : 'médicos encontrados';
            resultadosHeader.innerHTML = `
                <h2><i class="fas fa-list-ul"></i> Resultados da Busca</h2>
                <span class="contador-resultados">${totalResultados} ${textoContador}</span>
            `;
        }
    
        // Limpa os containers
        resultadosContainer.innerHTML = '';
        paginationContainer.innerHTML = '';
    
        if (totalResultados === 0) {
            resultadosContainer.innerHTML = '<p>Nenhum resultado encontrado para os filtros aplicados.</p>';
            // Esconde o contador se não houver resultados
            if(resultadosHeader) document.querySelector('.contador-resultados').style.display = 'none';
            return;
        }
    
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itensDaPagina = dadosFiltrados.slice(startIndex, endIndex);
    
        itensDaPagina.forEach(item => {
            const valorSns = parseFloat(String(item.valor_pela_sns).replace(',', '.'));
            const valorOriginal = parseFloat(String(item.valor_original).replace(',', '.'));
            
            // --- 2. MONTA O HTML DO CARD COM O NOVO LAYOUT DE ÍCONES ---
            const htmlMedico = item.nome_do_medico ? `<p><i class="fas fa-user-doctor"></i> ${item.nome_do_medico}</p>` : '';
            const htmlEspecialidade = item.especialidade ? `<p><i class="fas fa-stethoscope"></i> ${item.especialidade}</p>` : '';
            const localCompleto = [item.cidade, item.estado].filter(Boolean).join(' - ');
            const htmlLocal = localCompleto ? `<p><i class="fas fa-map-marker-alt"></i> ${localCompleto}</p>` : '';
            const htmlPrecoSns = !isNaN(valorSns) && valorSns > 0 ? `<p class="preco-sns">Valor SNS: R$ ${valorSns.toFixed(2).replace('.', ',')}</p>` : '';
    
            const card = document.createElement('div');
            card.className = 'card';
            if (item.cidade) card.dataset.cidade = item.cidade;
            if (item.estado) card.dataset.estado = item.estado;
            if (item.especialidade) card.dataset.especialidade = item.especialidade;
            card.dataset.rowIndex = item.rowIndex;
    
            // Monta o card com o ícone de hospital no título
            card.innerHTML = `
                <div class="card-header">
                    <h3><i class="fas fa-hospital"></i> ${item.nome_da_clinica}</h3>
                </div>
                ${htmlMedico}
                ${htmlEspecialidade}
                ${htmlLocal}
                ${htmlPrecoSns ? '<hr>' : ''}
                ${htmlPrecoSns}
                <div class="card-footer">
                    <div class="botoes-acao">
                        <button class="btn-editar">✏️ Editar</button>
                        <button class="btn-excluir" title="Excluir Registro">🗑️ Excluir</button>
                    </div>
                    ${item.atualizado ? `<span class="data-atualizacao">Atualizado em: ${item.atualizado}</span>` : ''}
                </div>
            `;
            resultadosContainer.appendChild(card);
        });
    
        setupPagination();
    }

    function setupPagination() {
        const pageCount = Math.ceil(dadosFiltrados.length / itemsPerPage);
        if (pageCount <= 1) return;

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.classList.add('page-btn');
            btn.dataset.page = i;
            btn.innerText = i;
            if (i === currentPage) {
                btn.classList.add('active');
            }
            paginationContainer.appendChild(btn);
        }
    }

    function aplicarFiltros() {
        comparacaoContainer.classList.remove('visivel'); 
        currentPage = 1;
        const cidade = filtroCidade.value.trim().toLowerCase();
        const nome = filtroNome.value.trim().toLowerCase();
        const especialidade = filtroEspecialidade.value.trim().toLowerCase();
        const valorMin = parseFloat(filtroValorMin.value) || 0;
        const valorMax = parseFloat(filtroValorMax.value) || Infinity;

        let dadosProcessados = dadosCompletos.filter(item => {
            const cidadeItem = item.cidade ? item.cidade.toLowerCase() : '';
            const medicoItem = item.nome_do_medico ? item.nome_do_medico.toLowerCase() : '';
            const clinicaItem = item.nome_da_clinica ? item.nome_da_clinica.toLowerCase() : '';
            const especialidadeItem = item.especialidade ? item.especialidade.toLowerCase() : '';
            const valorItem = item.valor_pela_sns ? parseFloat(String(item.valor_pela_sns).replace(',', '.')) : 0;
            const matchCidade = cidade ? cidadeItem.includes(cidade) : true;
            const matchNome = nome ? (medicoItem.includes(nome) || clinicaItem.includes(nome)) : true;
            const matchEspecialidade = especialidade ? especialidadeItem.includes(especialidade) : true;
            const matchValor = valorItem >= valorMin && valorItem <= valorMax;
            return matchCidade && matchNome && matchEspecialidade && matchValor;
        });

        const ordenacao = seletorOrdenacao.value;
        if (ordenacao === 'preco-asc') {
            dadosProcessados.sort((a, b) => (parseFloat(String(a.valor_pela_sns).replace(',', '.')) || 0) - (parseFloat(String(b.valor_pela_sns).replace(',', '.')) || 0));
        } else if (ordenacao === 'preco-desc') {
            dadosProcessados.sort((a, b) => (parseFloat(String(b.valor_pela_sns).replace(',', '.')) || 0) - (parseFloat(String(a.valor_pela_sns).replace(',', '.')) || 0));
        } else if (ordenacao === 'nome-asc') {
            dadosProcessados.sort((a, b) => a.nome_da_clinica.localeCompare(b.nome_da_clinica));
        }
        
        dadosFiltrados = dadosProcessados;
        renderizarPagina();
    }

    function renderizarPlaceholderComparacao(mensagem = 'Clique em um card para ver preços de especialistas iguais em cidades vizinhas.') {
        comparacaoContainer.innerHTML = `
            <div class="info-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                <p>${mensagem}</p>
            </div>
        `;
    }
    
    // ▼▼▼ FUNÇÃO ATUALIZADA ▼▼▼
    async function buscarPrecosVizinhos(cidade, estado, especialidade) {
        if (!cidade || !estado || !especialidade) return;
        
        comparacaoContainer.innerHTML = '<p>Buscando cidades vizinhas...</p>';

        try {
            const response = await fetch(`/api/vizinhos/${cidade}/${estado}`);
            const neighborsData = await response.json();

            if (!response.ok) {
                throw new Error(neighborsData.error || 'Erro do servidor');
            }

            if (!neighborsData.list || neighborsData.list.length === 0) {
                renderizarResultadosVizinhos([], cidade, especialidade);
                return;
            }
            
            const nomesCidadesVizinhas = neighborsData.list
                .map(item => item.name.toLowerCase())
                .filter(nomeVizinho => nomeVizinho !== cidade.toLowerCase());
                
            const nomesUnicos = [...new Set(nomesCidadesVizinhas)];

            // --- MUDANÇA AQUI: Filtra também pela especialidade ---
            const resultadosVizinhos = dadosCompletos.filter(item => 
                item.cidade && 
                nomesUnicos.includes(item.cidade.toLowerCase()) &&
                item.especialidade &&
                item.especialidade.toLowerCase() === especialidade.toLowerCase()
            );

            renderizarResultadosVizinhos(resultadosVizinhos, cidade, especialidade);

        } catch (error) {
            console.error("Erro ao buscar cidades vizinhas:", error);
            renderizarPlaceholderComparacao(`Não foi possível buscar cidades vizinhas. (${error.message})`);
        }
    }
    
    function renderizarResultadosVizinhos(resultados, cidadeOriginal, especialidade) {
        // --- MUDANÇA AQUI: Título dinâmico com a especialidade ---
        let html = `<h3>Melhor valor para ${especialidade} nas cidades próximas</h3>`;
    
        const resultadosCompletos = resultados.filter(item => 
            item.nome_do_medico && item.nome_do_medico.trim() !== '' && 
            item.valor_pela_sns && parseFloat(String(item.valor_pela_sns).replace(',', '.')) > 0
        );
    
        const melhoresOpcoesPorCidade = new Map();
        resultadosCompletos.forEach(item => {
            const cidade = item.cidade;
            const precoAtual = parseFloat(String(item.valor_pela_sns).replace(',', '.'));
            if (!melhoresOpcoesPorCidade.has(cidade) || precoAtual < parseFloat(String(melhoresOpcoesPorCidade.get(cidade).valor_pela_sns).replace(',', '.'))) {
                melhoresOpcoesPorCidade.set(cidade, item);
            }
        });
    
        const listaFinal = Array.from(melhoresOpcoesPorCidade.values());
    
        let campeaGeral = null;
        if (listaFinal.length > 0) {
            campeaGeral = listaFinal.reduce((maisBarata, itemAtual) => {
                return parseFloat(String(itemAtual.valor_pela_sns).replace(',', '.')) < parseFloat(String(maisBarata.valor_pela_sns).replace(',', '.')) ? itemAtual : maisBarata;
            });
        }
    
        if (listaFinal.length > 0) {
            listaFinal.sort((a, b) => a.cidade.localeCompare(b.cidade));
            
            listaFinal.forEach(melhorOpcao => {
                const valorSns = parseFloat(String(melhorOpcao.valor_pela_sns).replace(',', '.')) || 0;
                const classeDestaque = (campeaGeral && melhorOpcao.rowIndex === campeaGeral.rowIndex) ? 'destaque-melhor-opcao' : '';
    
                html += `
                    <div class="card-comparacao ${classeDestaque}">
                        <p class="local-vizinho">${melhorOpcao.nome_da_clinica} - <strong>${melhorOpcao.cidade}</strong></p>
                        <p><strong>Médico(a):</strong> ${melhorOpcao.nome_do_medico}</p>
                        <p class="preco-sns">Valor SNS: R$ ${valorSns.toFixed(2).replace('.', ',')}</p>
                    </div>
                `;
            });
    
        } else {
            html += `<p>Nenhum profissional de ${especialidade} foi encontrado nas cidades vizinhas para comparação.</p>`;
        }
    
        comparacaoContainer.innerHTML = html;
    }
    
    document.addEventListener('click', (event) => {
        const cliqueDentroDosResultados = event.target.closest('.resultados-wrapper');
        const cliqueDentroDaComparacao = event.target.closest('#comparacao-vizinhos-container');

        if (!cliqueDentroDosResultados && !cliqueDentroDaComparacao) {
            comparacaoContainer.classList.remove('visivel');
            const cardSelecionado = document.querySelector('.card.selecionado');
            if (cardSelecionado) {
                cardSelecionado.classList.remove('selecionado');
            }
        }
    });

    ['input', 'change'].forEach(evento => {
        filtroCidade.addEventListener(evento, aplicarFiltros);
        filtroNome.addEventListener(evento, aplicarFiltros);
        filtroEspecialidade.addEventListener(evento, aplicarFiltros);
        filtroValorMin.addEventListener(evento, aplicarFiltros);
        filtroValorMax.addEventListener(evento, aplicarFiltros);
        seletorOrdenacao.addEventListener(evento, aplicarFiltros);
    });

    // ▼▼▼ FUNÇÃO ATUALIZADA ▼▼▼
    resultadosContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.card');
        if (!card) return;

        const targetButton = event.target.closest('button');
        if (targetButton) {
            const rowIndex = card.dataset.rowIndex;
            if (targetButton.classList.contains('btn-editar')) {
                const itemData = dadosCompletos.find(item => item.rowIndex == rowIndex);
                if (itemData) {
                    document.getElementById('cad-nome-clinica').value = itemData.nome_da_clinica || '';
                    document.getElementById('cad-nome-medico').value = itemData.nome_do_medico || '';
                    document.getElementById('cad-especialidade').value = itemData.especialidade || '';
                    document.getElementById('cad-cidade').value = itemData.cidade || '';
                    document.getElementById('cad-estado').value = itemData.estado || '';
                    const valorSnsFormatado = itemData.valor_pela_sns ? String(itemData.valor_pela_sns).replace(',', '.') : '';
                    const valorOriginalFormatado = itemData.valor_original ? String(itemData.valor_original).replace(',', '.') : '';
                    document.getElementById('cad-valor-sns').value = valorSnsFormatado;
                    document.getElementById('cad-valor-original').value = valorOriginalFormatado;
                    if (itemData.atualizado && itemData.atualizado.includes('/')) {
                        const partesData = itemData.atualizado.split('/');
                        document.getElementById('cad-atualizado').value = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
                    } else {
                        document.getElementById('cad-atualizado').value = itemData.atualizado || '';
                    }
                    campoHiddenEdit.value = rowIndex;
                    modalTitulo.textContent = 'Editar Registro';
                    modalBotaoSubmit.textContent = 'Salvar Alterações';
                    toggleModal();
                }
            } else if (targetButton.classList.contains('btn-excluir')) {
                if (confirm('Tem certeza que deseja excluir este registro?')) {
                    try {
                        const response = await fetch(`/api/excluir/${rowIndex}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.error);
                        Toastify({ text: result.message, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
                        buscarDados();
                    } catch (error) {
                        console.error('Erro ao excluir:', error);
                        Toastify({ text: `Não foi possível excluir: ${error.message}`, duration: 5000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
                    }
                }
            }
        } else {
            // Lógica para comparação
            document.querySelectorAll('.card.selecionado').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');
            comparacaoContainer.classList.add('visivel');

            // --- MUDANÇA AQUI: Pega a especialidade e passa para a função de busca ---
            const cidade = card.dataset.cidade ? card.dataset.cidade.trim() : null;
            const estado = card.dataset.estado ? card.dataset.estado.trim() : null;
            const especialidade = card.dataset.especialidade ? card.dataset.especialidade.trim() : null;
            
            if (cidade && estado && especialidade) {
                buscarPrecosVizinhos(cidade, estado, especialidade);
            } else {
                renderizarPlaceholderComparacao('Card sem cidade, estado ou especialidade para poder comparar.');
            }
        }
    });
    
    function toggleModal() {
        modalCadastro.classList.toggle('ativo');
    }

    btnAbrirModal.addEventListener('click', () => {
        formCadastro.reset();
        campoHiddenEdit.value = '';
        modalTitulo.textContent = 'Cadastrar Novo Profissional';
        modalBotaoSubmit.textContent = 'Cadastrar';
        toggleModal();
    });

    fecharModal.addEventListener('click', toggleModal);
    modalCadastro.addEventListener('click', (event) => {
        if (event.target === modalCadastro) toggleModal();
    });

    paginationContainer.addEventListener('click', (event) => {
        if (event.target.matches('.page-btn')) {
            currentPage = parseInt(event.target.dataset.page);
            renderizarPagina();
        }
    });

    btnLimpar.addEventListener('click', () => {
        comparacaoContainer.classList.remove('visivel');
        filtroCidade.value = '';
        filtroNome.value = '';
        filtroEspecialidade.value = '';
        filtroValorMin.value = '';
        filtroValorMax.value = '';
        seletorOrdenacao.value = 'padrao';
        aplicarFiltros();
    });

    formCadastro.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosDoForm = {
            nomeClinica: document.getElementById('cad-nome-clinica').value,
            nomeMedico: document.getElementById('cad-nome-medico').value,
            especialidade: document.getElementById('cad-especialidade').value,
            cidade: document.getElementById('cad-cidade').value,
            estado: document.getElementById('cad-estado').value,
            valorSns: document.getElementById('cad-valor-sns').value,
            valorOriginal: document.getElementById('cad-valor-original').value,
            atualizado: document.getElementById('cad-atualizado').value
        };
        const rowIndexToEdit = campoHiddenEdit.value;
        let url = '/api/cadastrar';
        let method = 'POST';

        if (rowIndexToEdit) {
            url = `/api/editar/${rowIndexToEdit}`;
            method = 'PUT';
        }
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosDoForm)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            Toastify({ text: result.message, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
            toggleModal();
            buscarDados();
        } catch (error) {
            console.error('Falha na operação:', error);
            Toastify({ text: `Erro na operação: ${error.message}`, duration: 5000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
        }
    });

    // --- INICIA A APLICAÇÃO ---
    buscarDados();
});