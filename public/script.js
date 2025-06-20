document.addEventListener('DOMContentLoaded', () => {
    
    // --- DECLARAÇÃO DE CONSTANTES (REFERÊNCIAS AOS ELEMENTOS HTML) ---

    // Elementos dos Filtros
    const filtroCidade = document.getElementById('filtro-cidade');
    const filtroNome = document.getElementById('filtro-nome');
    const filtroEspecialidade = document.getElementById('filtro-especialidade');
    const filtroValorMin = document.getElementById('filtro-valor-min');
    const filtroValorMax = document.getElementById('filtro-valor-max');
    const btnLimpar = document.getElementById('btn-limpar');
    
    // Container de Resultados
    const resultadosContainer = document.getElementById('resultados-container');

    // Elementos do Modal de Cadastro/Edição
    const btnAbrirModal = document.getElementById('btn-abrir-modal');
    const modalCadastro = document.getElementById('modal-cadastro');
    const fecharModal = document.querySelector('.fechar-modal');
    const formCadastro = document.getElementById('form-cadastro');
    const modalTitulo = document.querySelector('#modal-cadastro h2');
    const modalBotaoSubmit = document.querySelector('#modal-cadastro .botao-form-submit');
    const campoHiddenEdit = document.getElementById('edit-row-index');

    // Variável para armazenar todos os dados da planilha
    let dadosCompletos = [];

    // --- FUNÇÕES PRINCIPAIS ---

    /**
     * Busca os dados da API no backend e inicia a renderização.
     */
    async function buscarDados() {
        try {
            // Lembre-se de usar a URL completa do seu serviço no Render.com quando for para produção
            // Ex: const response = await fetch('https://seu-app.onrender.com/api/dados');
            const response = await fetch('/api/dados'); 
            
            if (!response.ok) throw new Error('Falha ao carregar dados da API.');
            
            dadosCompletos = await response.json();
            aplicarFiltros(); // Exibe todos os dados inicialmente
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            resultadosContainer.innerHTML = '<p>Não foi possível carregar os dados. Verifique a conexão com o servidor.</p>';
        }
    }

    /**
     * Renderiza os cards na tela a partir de um array de dados.
     * @param {Array} dados - O array de registros a serem exibidos.
     */
    function renderizarResultados(dados) {
        resultadosContainer.innerHTML = '';
        if (dados.length === 0) {
            resultadosContainer.innerHTML = '<p>Nenhum resultado encontrado para os filtros aplicados.</p>';
            return;
        }

       // Na função renderizarResultados
dados.forEach(item => {
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
    }

    /**
     * Aplica os filtros com base nos valores dos inputs e chama a renderização.
     */
    function aplicarFiltros() {
        const cidade = filtroCidade.value.trim().toLowerCase();
        const nome = filtroNome.value.trim().toLowerCase();
        const especialidade = filtroEspecialidade.value.trim().toLowerCase();
        const valorMin = parseFloat(filtroValorMin.value) || 0;
        const valorMax = parseFloat(filtroValorMax.value) || Infinity;

        const dadosFiltrados = dadosCompletos.filter(item => {
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

        renderizarResultados(dadosFiltrados);
    }
    
    /**
     * Abre ou fecha o modal de cadastro/edição.
     */
    function toggleModal() {
        modalCadastro.classList.toggle('ativo');
    }


    // --- LÓGICA DE EVENTOS (EVENT LISTENERS) ---

    // Listeners para os campos de filtro
    filtroCidade.addEventListener('input', aplicarFiltros);
    filtroNome.addEventListener('input', aplicarFiltros);
    filtroEspecialidade.addEventListener('input', aplicarFiltros);
    filtroValorMin.addEventListener('input', aplicarFiltros);
    filtroValorMax.addEventListener('input', aplicarFiltros);

    // Listener para o botão de limpar filtros
    btnLimpar.addEventListener('click', () => {
        filtroCidade.value = '';
        filtroNome.value = '';
        filtroEspecialidade.value = '';
        filtroValorMin.value = '';
        filtroValorMax.value = '';
        aplicarFiltros();
    });

    // Listener para o botão principal "CADASTRAR NOVO PROFISSIONAL"
    btnAbrirModal.addEventListener('click', () => {
        formCadastro.reset(); // Limpa qualquer dado de uma edição anterior
        campoHiddenEdit.value = ''; // Garante que estamos em modo de criação
        modalTitulo.textContent = 'Cadastrar Novo Profissional';
        modalBotaoSubmit.textContent = 'Cadastrar';
        toggleModal();
    });

    // Listeners para fechar o modal
    fecharModal.addEventListener('click', toggleModal);
    modalCadastro.addEventListener('click', (event) => {
        if (event.target === modalCadastro) {
            toggleModal();
        }
    });

    // Delegação de evento para os botões de EDITAR e EXCLUIR nos cards
    resultadosContainer.addEventListener('click', async (event) => {
        const target = event.target.closest('button'); // Pega o botão mais próximo que foi clicado
        if (!target) return;

        // Lógica para o botão EDITAR
        if (target.classList.contains('btn-editar')) {
            const rowIndex = target.dataset.rowIndex;
            const itemData = dadosCompletos.find(item => item.rowIndex == rowIndex);

            if (itemData) {
                // Preenche o formulário com os dados existentes
                document.getElementById('cad-nome-clinica').value = itemData.nome_da_clinica;
                document.getElementById('cad-nome-medico').value = itemData.nome_do_medico;
                document.getElementById('cad-especialidade').value = itemData.especialidade;
                document.getElementById('cad-cidade').value = itemData.cidade;
                document.getElementById('cad-estado').value = itemData.estado;
                document.getElementById('cad-valor-sns').value = parseFloat(itemData.valor_pela_sns) || '';
                document.getElementById('cad-valor-original').value = parseFloat(itemData.valor_original) || '';
                
                if (itemData.atualizado && itemData.atualizado.includes('/')) {
                    const partesData = itemData.atualizado.split('/'); // DD/MM/YYYY
                    const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`; // YYYY-MM-DD
                    document.getElementById('cad-atualizado').value = dataFormatada;
                } else {
                     document.getElementById('cad-atualizado').value = itemData.atualizado || '';
                }

                // Configura o modal para o modo de edição
                campoHiddenEdit.value = rowIndex;
                modalTitulo.textContent = 'Editar Registro';
                modalBotaoSubmit.textContent = 'Salvar Alterações';
                toggleModal();
            }
        }

        // Lógica para o botão EXCLUIR
        if (target.classList.contains('btn-excluir')) {
            const rowIndex = target.dataset.rowIndex;
            const confirmar = confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.');

            if (confirmar) {
                try {
                    const response = await fetch(`/api/excluir/${rowIndex}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    
                    alert(result.message);
                    buscarDados();
                } catch (error) {
                    console.error('Erro ao excluir:', error);
                    alert(`Não foi possível excluir o registro. ${error.message}`);
                }
            }
        }
    });

    // Listener para a SUBMISSÃO DO FORMULÁRIO (inteligente: cria ou edita)
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

        // Se o campo oculto tiver um valor, estamos editando. Mude a URL e o método.
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

            alert(result.message);
            toggleModal();
            buscarDados();

        } catch (error) {
            console.error('Falha na operação:', error);
            alert(`Erro: ${error.message}`);
        }
    });
    
    // --- INICIA A APLICAÇÃO ---
    buscarDados();

});