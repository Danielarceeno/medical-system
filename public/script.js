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
    const itemsPerPage = 10;

    // --- FUNÇÕES ---

    /**
     * Busca todos os dados da API e inicia a aplicação.
     */
    async function buscarDados() {
        try {
            const response = await fetch('/api/dados');
            if (!response.ok) throw new Error('Falha ao carregar dados da API.');
            
            dadosCompletos = await response.json();
            aplicarFiltros(); // Chama aplicarFiltros para renderizar o estado inicial
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            resultadosContainer.innerHTML = '<p>Não foi possível carregar os dados. Verifique a conexão com o servidor.</p>';
        }
    }

    /**
     * Renderiza os cards da PÁGINA ATUAL e os controles de paginação.
     */
    function renderizarPagina() {
        resultadosContainer.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (!dadosFiltrados || dadosFiltrados.length === 0) {
            resultadosContainer.innerHTML = '<p>Nenhum resultado encontrado para os filtros aplicados.</p>';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itensDaPagina = dadosFiltrados.slice(startIndex, endIndex);

        itensDaPagina.forEach(item => {
            const valorSns = parseFloat(item.valor_pela_sns) || 0;
            const valorOriginal = parseFloat(item.valor_original) || 0;
            const diferenca = valorOriginal - valorSns;

            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
        <div class="card-header">
            <h3>${item.nome_da_clinica}</h3>
        </div>
        <p><strong>Médico(a):</strong> ${item.nome_do_medico || 'Não informado'}</p>
        <p><strong>Especialidade:</strong> ${item.especialidade || 'Não informado'}</p>
        <p><strong>Local:</strong> ${item.cidade || 'Não informado'} - ${item.estado || ''}</p>
        <hr>
        <p class="preco-original">Valor Original: R$ ${valorOriginal.toFixed(2).replace('.', ',')}</p>
        <p class="preco-sns">Valor SNS: R$ ${valorSns.toFixed(2).replace('.', ',')}</p>
        <p class="economia"><strong>Sua economia: R$ ${diferenca.toFixed(2).replace('.', ',')}</strong></p>
        <div class="card-footer">
            <div class="botoes-acao">
                <button class="btn-editar" data-row-index="${item.rowIndex}">✏️ Editar</button>
                <button class="btn-excluir" data-row-index="${item.rowIndex}" title="Excluir Registro">🗑️ Excluir</button>
            </div>
            <span class="data-atualizacao">Atualizado em: ${item.atualizado || 'Não informado'}</span>
        </div>
    `;
            resultadosContainer.appendChild(card);
        });

        setupPagination();
    }

    /**
     * Cria e adiciona os botões de navegação da paginação.
     */
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

    /**
     * Filtra e ordena os dados, reseta a página para 1 e renderiza o resultado.
     */
    function aplicarFiltros() {
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
            const valorItem = item.valor_original ? parseFloat(item.valor_original) : 0;

            const matchCidade = cidade ? cidadeItem.includes(cidade) : true;
            const matchNome = nome ? (medicoItem.includes(nome) || clinicaItem.includes(nome)) : true;
            const matchEspecialidade = especialidade ? especialidadeItem.includes(especialidade) : true;
            const matchValor = valorItem >= valorMin && valorItem <= valorMax;
            
            return matchCidade && matchNome && matchEspecialidade && matchValor;
        });
        
        const ordenacao = seletorOrdenacao.value;
        if (ordenacao === 'preco-asc') {
            dadosProcessados.sort((a, b) => parseFloat(a.valor_original) - parseFloat(b.valor_original));
        } else if (ordenacao === 'preco-desc') {
            dadosProcessados.sort((a, b) => parseFloat(b.valor_original) - parseFloat(a.valor_original));
        } else if (ordenacao === 'nome-asc') {
            dadosProcessados.sort((a, b) => a.nome_da_clinica.localeCompare(b.nome_da_clinica));
        }
        
        dadosFiltrados = dadosProcessados;
        renderizarPagina();
    }
    
    function toggleModal() {
        modalCadastro.classList.toggle('ativo');
    }

    // --- LÓGICA DE EVENTOS (EVENT LISTENERS) ---

    filtroCidade.addEventListener('input', aplicarFiltros);
    filtroNome.addEventListener('input', aplicarFiltros);
    filtroEspecialidade.addEventListener('input', aplicarFiltros);
    filtroValorMin.addEventListener('input', aplicarFiltros);
    filtroValorMax.addEventListener('input', aplicarFiltros);
    seletorOrdenacao.addEventListener('change', aplicarFiltros);

    btnLimpar.addEventListener('click', () => {
        filtroCidade.value = '';
        filtroNome.value = '';
        filtroEspecialidade.value = '';
        filtroValorMin.value = '';
        filtroValorMax.value = '';
        seletorOrdenacao.value = 'padrao';
        aplicarFiltros();
    });

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

    resultadosContainer.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const rowIndex = target.dataset.rowIndex;

        if (target.classList.contains('btn-editar')) {
            const itemData = dadosCompletos.find(item => item.rowIndex == rowIndex);
            if (itemData) {
                document.getElementById('cad-nome-clinica').value = itemData.nome_da_clinica;
                document.getElementById('cad-nome-medico').value = itemData.nome_do_medico;
                document.getElementById('cad-especialidade').value = itemData.especialidade;
                document.getElementById('cad-cidade').value = itemData.cidade;
                document.getElementById('cad-estado').value = itemData.estado;
                document.getElementById('cad-valor-sns').value = parseFloat(itemData.valor_pela_sns) || '';
                document.getElementById('cad-valor-original').value = parseFloat(itemData.valor_original) || '';
                if (itemData.atualizado && itemData.atualizado.includes('/')) {
                    const partesData = itemData.atualizado.split('/');
                    const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
                    document.getElementById('cad-atualizado').value = dataFormatada;
                } else {
                    document.getElementById('cad-atualizado').value = itemData.atualizado || '';
                }
                campoHiddenEdit.value = rowIndex;
                modalTitulo.textContent = 'Editar Registro';
                modalBotaoSubmit.textContent = 'Salvar Alterações';
                toggleModal();
            }
        } else if (target.classList.contains('btn-excluir')) {
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