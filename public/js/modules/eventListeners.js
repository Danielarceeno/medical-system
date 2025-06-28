import * as DOMElements from './domElements.js';
import * as UI from './ui.js';
import * as API from './api.js';

// Função que configura todos os event listeners da aplicação
export function setupEventListeners(appState, methods) {
    const {
        filtroNome, filtroEspecialidade, filtroCidade, filtroValorMin, filtroValorMax, seletorOrdenacao,
        resultadosContainer, paginationContainer, comparacaoContainer, btnLimpar, btnCadastrar,
        modalCadastro, fecharModal, formCadastro
    } = DOMElements;

    // Listeners para os filtros
    const filtros = [filtroNome, filtroEspecialidade, filtroCidade, filtroValorMin, filtroValorMax, seletorOrdenacao];
    filtros.forEach(filtro => {
        filtro.addEventListener('input', () => methods.aplicarFiltrosErenderizar());
    });
    seletorOrdenacao.addEventListener('change', () => methods.aplicarFiltrosErenderizar());

    // Listener para limpar filtros
    btnLimpar.addEventListener('click', () => {
        const { comparacaoContainer } = DOMElements;
        comparacaoContainer.classList.remove('visivel');
        filtroNome.value = '';
        filtroEspecialidade.value = '';
        filtroCidade.value = '';
        filtroValorMin.value = '';
        filtroValorMax.value = '';
        seletorOrdenacao.value = 'padrao';
        methods.aplicarFiltrosErenderizar();
    });

    // Listener para o container de resultados (delegação de eventos)
    resultadosContainer.addEventListener('click', async (event) => {
        const card = event.target.closest('.card');
        if (!card) return;

        const targetButton = event.target.closest('button');
        if (targetButton) {
            // Ações de Editar ou Excluir
            const rowIndex = card.dataset.rowIndex;
            const itemData = appState.dadosCompletos.find(item => item.rowIndex == rowIndex);
            if (!itemData) return;

            if (targetButton.classList.contains('btn-editar')) {
                UI.prepararModalParaEdicao(itemData);
            } else if (targetButton.classList.contains('btn-excluir')) {
                if (confirm('Tem certeza que deseja excluir este registro?')) {
                    await API.excluirRegistro(rowIndex);
                    Toastify({ text: "Registro excluído com sucesso!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
                    methods.refreshData();
                }
            }
        } else {
            // Ação de clique no card para mostrar comparação
            document.querySelectorAll('.card.selecionado').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');
            comparacaoContainer.classList.add('visivel');

            const especialidade = card.dataset.especialidade?.trim();
            const cidadeSelecionada = card.dataset.cidade?.trim();

            if (especialidade && cidadeSelecionada) {
                appState.comparisonCurrentPage = 1;
                appState.currentComparisonData = { especialidade, cidadeSelecionada };
                UI.renderizarComparacao(appState.dadosCompletos, especialidade, cidadeSelecionada, appState.comparisonCurrentPage, appState.comparisonItemsPerPage);
            } else {
                UI.renderizarPlaceholderComparacao('Card sem especialidade ou cidade para poder comparar.');
            }

            if (window.innerWidth <= 900) {
                comparacaoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
    
    // Listeners do Modal
    btnCadastrar.addEventListener('click', UI.prepararModalParaCadastro);
    fecharModal.addEventListener('click', UI.toggleModal);
    modalCadastro.addEventListener('click', (event) => {
        if (event.target === modalCadastro) UI.toggleModal();
    });

    // Listener para submit do formulário de cadastro/edição
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
        
        await API.salvarDados(dadosDoForm, DOMElements.campoHiddenEdit.value);
        Toastify({ text: "Operação realizada com sucesso!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
        UI.toggleModal();
        methods.refreshData();
    });

    // Listener para a paginação principal
    paginationContainer.addEventListener('click', (event) => {
        const pageBtn = event.target.closest('.page-btn');
        if (pageBtn && !pageBtn.disabled) {
            appState.currentPage = parseInt(pageBtn.dataset.page);
            UI.renderizarPagina(appState.dadosFiltrados, appState.currentPage, appState.itemsPerPage);
        }
    });

    // Listener para o painel de comparação (paginação e cópia)
    comparacaoContainer.addEventListener('click', (event) => {
        if (event.target.closest('#btn-copiar-comparativo')) {
            event.stopPropagation();
            UI.gerarEcopiarTextoComparativo(appState.currentComparisonData, appState.dadosCompletos);
            return;
        }

        const pageBtn = event.target.closest('.comparison-page-btn');
        if (pageBtn && !pageBtn.disabled) {
            event.stopPropagation();
            if (pageBtn.classList.contains('comparison-btn-prev')) {
                appState.comparisonCurrentPage--;
            } else if (pageBtn.classList.contains('comparison-btn-next')) {
                appState.comparisonCurrentPage++;
            }
            if (appState.currentComparisonData) {
                const { especialidade, cidadeSelecionada } = appState.currentComparisonData;
                UI.renderizarComparacao(appState.dadosCompletos, especialidade, cidadeSelecionada, appState.comparisonCurrentPage, appState.comparisonItemsPerPage);
            }
        }
    });

    // Listener para fechar a comparação ao clicar fora
    document.addEventListener('click', (event) => {
        const isClickInsideResults = event.target.closest('.resultados-wrapper');
        const isClickInsideComparison = event.target.closest('#comparacao-vizinhos-container');
        if (!isClickInsideResults && !isClickInsideComparison) {
            comparacaoContainer.classList.remove('visivel');
            const selectedCard = document.querySelector('.card.selecionado');
            if (selectedCard) {
                selectedCard.classList.remove('selecionado');
            }
        }
    });
}