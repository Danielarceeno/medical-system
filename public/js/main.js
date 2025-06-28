import * as DOMElements from './modules/domElements.js';
import * as API from './modules/api.js';
import * as UI from './modules/ui.js';
import { setupEventListeners } from './modules/eventListeners.js';
import { gerenciarControlesAdmin } from './modules/ui.js';

// Centraliza o estado da aplicação
const appState = {
    dadosCompletos: [],
    dadosFiltrados: [],
    currentPage: 1,
    itemsPerPage: 9,
    comparisonCurrentPage: 1,
    comparisonItemsPerPage: 5,
    currentComparisonData: null,
};

// Centraliza métodos que manipulam o estado
const methods = {
    aplicarFiltrosErenderizar: () => {
        const { filtroCidade, filtroNome, filtroEspecialidade, filtroValorMin, filtroValorMax, seletorOrdenacao } = DOMElements;
        
        const cidade = filtroCidade.value.trim().toLowerCase();
        const nome = filtroNome.value.trim().toLowerCase();
        const especialidade = filtroEspecialidade.value.trim().toLowerCase();
        const valorMin = parseFloat(filtroValorMin.value) || 0;
        const valorMax = parseFloat(filtroValorMax.value) || Infinity;

        let dadosProcessados = appState.dadosCompletos.filter(item => {
            const cidadeItem = item.cidade?.toLowerCase() || '';
            const medicoItem = item.nome_do_medico?.toLowerCase() || '';
            const clinicaItem = item.nome_da_clinica?.toLowerCase() || '';
            const especialidadeItem = item.especialidade?.toLowerCase() || '';
            const valorItem = parseFloat(String(item.valor_pela_sns).replace(',', '.')) || 0;
            
            return (cidade ? cidadeItem.includes(cidade) : true) &&
                   (nome ? (medicoItem.includes(nome) || clinicaItem.includes(nome)) : true) &&
                   (especialidade ? especialidadeItem.includes(especialidade) : true) &&
                   (valorItem >= valorMin && valorItem <= valorMax);
        });

        const ordenacao = seletorOrdenacao.value;
        if (ordenacao === 'preco-menor') {
            dadosProcessados.sort((a, b) => (parseFloat(String(a.valor_pela_sns).replace(',', '.')) || 0) - (parseFloat(String(b.valor_pela_sns).replace(',', '.')) || 0));
        } else if (ordenacao === 'preco-maior') {
            dadosProcessados.sort((a, b) => (parseFloat(String(b.valor_pela_sns).replace(',', '.')) || 0) - (parseFloat(String(a.valor_pela_sns).replace(',', '.')) || 0));
        }

        appState.dadosFiltrados = dadosProcessados;
        appState.currentPage = 1;
        UI.renderizarPagina(appState.dadosFiltrados, appState.currentPage, appState.itemsPerPage);
    },

    refreshData: async () => {
        try {
            const data = await API.buscarDados();
            appState.dadosCompletos = data;
            methods.aplicarFiltrosErenderizar();
        } catch (error) {
            DOMElements.resultadosContainer.innerHTML = '<p>Não foi possível carregar os dados. Verifique a conexão com o servidor.</p>';
        }
    }
};

// Função de inicialização
async function init() {
     // Verifica se o usuário já está logado na sessão
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        gerenciarControlesAdmin(true);
    } else {
        gerenciarControlesAdmin(false);
    }
    UI.renderizarPlaceholderComparacao();
    setupEventListeners(appState, methods);
    await methods.refreshData();
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);