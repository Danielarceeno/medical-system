/**
 * Script completo para a página de busca de clínicas.
 *
 * Funcionalidades:
 * - Busca dados de uma planilha Google via API do backend.
 * - Filtra os resultados por cidade, nome, especialidade e valor.
 * - Possui uma lógica especial de busca para a cidade de Orleans e seus arredores.
 * - Exibe os resultados em cards, calculando a economia para o paciente.
 * - Permite o cadastro de novos profissionais através de um formulário.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERÊNCIAS AOS ELEMENTOS HTML ---
    // Filtros
    const filtroCidade = document.getElementById('filtro-cidade');
    const filtroNome = document.getElementById('filtro-nome');
    const filtroEspecialidade = document.getElementById('filtro-especialidade');
    const filtroValorMin = document.getElementById('filtro-valor-min');
    const filtroValorMax = document.getElementById('filtro-valor-max');
    const btnLimpar = document.getElementById('btn-limpar');
    
    // Área de resultados
    const resultadosContainer = document.getElementById('resultados-container');

    // Formulário de Cadastro
    const formCadastro = document.getElementById('form-cadastro');

    // --- VARIÁVEL GLOBAL PARA ARMAZENAR OS DADOS ---
    let dadosCompletos = [];

    /**
     * Busca os dados da API do backend e inicia a renderização.
     */
    async function buscarDados() {
        try {
            const response = await fetch('/api/dados');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            dadosCompletos = await response.json();
            aplicarFiltros(); // Exibe todos os dados inicialmente
        } catch (error) {
            console.error('Erro ao buscar dados da planilha:', error);
            resultadosContainer.innerHTML = '<p>Falha ao carregar os dados. Verifique a conexão com o servidor e a planilha.</p>';
        }
    }

    /**
     * Renderiza os cards de resultados na tela.
     * @param {Array} dados - O array de dados a ser exibido.
     */
    function renderizarResultados(dados) {
        resultadosContainer.innerHTML = ''; 
        if (dados.length === 0) {
            resultadosContainer.innerHTML = '<p>Nenhum resultado encontrado para os filtros aplicados.</p>';
            return;
        }
    
        dados.forEach(item => {
            const valorSns = parseFloat(item.valor_pela_sns) || 0;
            const valorOriginal = parseFloat(item.valor_original) || 0;
            const diferenca = valorOriginal - valorSns;
    
            const card = document.createElement('div');
            card.className = 'card';
            if (item.destaque === 'principal') card.classList.add('destaque-cidade');
            if (item.destaque === 'vizinha') card.classList.add('vizinha');
    
            // Adicionamos a nova linha para a data de atualização no final
            card.innerHTML = `
               <div class="card-header">
                <h3>${item.nome_da_clinica}</h3>
                
                

            <p><strong>Médico(a):</strong> ${item.nome_do_medico || 'Não informado'}</p>
            <p><strong>Especialidade:</strong> ${item.especialidade || 'Não informado'}</p>
            <p><strong>Local:</strong> ${item.cidade || 'Não informado'} - ${item.estado || ''}</p>
            <hr>
            <p class="preco-original">Valor Original: R$ ${valorOriginal.toFixed(2).replace('.', ',')}</p>
            <p class="preco-sns">Valor SNS: R$ ${valorSns.toFixed(2).replace('.', ',')}</p>
            <p class="economia"><strong>Sua economia: R$ ${diferenca.toFixed(2).replace('.', ',')}</strong></p>
            <p class="data-atualizacao">Atualizado em: ${item.atualizado || 'Não informado'}</p>
            <button class="btn-excluir" data-row-index="${item.rowIndex}" title="Excluir Registro">🗑️</button>
            </div>
        `;
            resultadosContainer.appendChild(card);
        });
    }

    /**
     * Aplica toda a lógica de filtragem com base nos inputs do usuário.
     */
    function aplicarFiltros() {
        // Pega os valores dos filtros de texto
        const cidade = filtroCidade.value.trim().toLowerCase();
        const nome = filtroNome.value.trim().toLowerCase();
        const especialidade = filtroEspecialidade.value.trim().toLowerCase();
    
        // --- LÓGICA DE VALOR CORRIGIDA ---
        // Pega o valor mínimo. Se o campo estiver vazio ou for inválido, o resultado de parseFloat será NaN.
        // A operação `|| 0` garante que, nesse caso, usemos 0 como padrão.
        const valorMin = parseFloat(filtroValorMin.value) || 0;
        
        // Pega o valor máximo. Se o campo estiver vazio, o resultado será NaN.
        // A operação `|| Infinity` garante que usemos Infinity (infinito) como padrão.
        const valorMax = parseFloat(filtroValorMax.value) || Infinity;
    
        // Filtra a lista completa de dados
        dadosFiltrados = dadosCompletos.filter(item => {
            // Pega os valores do item da planilha de forma segura
            const cidadeItem = item.cidade ? item.cidade.toLowerCase() : '';
            const medicoItem = item.nome_do_medico ? item.nome_do_medico.toLowerCase() : '';
            const clinicaItem = item.nome_da_clinica ? item.nome_da_clinica.toLowerCase() : '';
            const especialidadeItem = item.especialidade ? item.especialidade.toLowerCase() : '';
            const valorItem = item.valor_original ? parseFloat(item.valor_original) : 0;
    
            // Comparações dos filtros
            const matchCidade = cidade ? cidadeItem.includes(cidade) : true;
            const matchNome = nome ? (medicoItem.includes(nome) || clinicaItem.includes(nome)) : true;
            const matchEspecialidade = especialidade ? especialidadeItem.includes(especialidade) : true;
            
            // A comparação de valor agora funciona corretamente para campos vazios
            const matchValor = valorItem >= valorMin && valorItem <= valorMax;
            
            return matchCidade && matchNome && matchEspecialidade && matchValor;
        });
    
        renderizarResultados(dadosFiltrados);
    }

    // --- EVENT LISTENERS PARA OS FILTROS ---
    filtroCidade.addEventListener('input', aplicarFiltros);
    filtroNome.addEventListener('input', aplicarFiltros);
    filtroEspecialidade.addEventListener('input', aplicarFiltros);
    filtroValorMin.addEventListener('input', aplicarFiltros);
    filtroValorMax.addEventListener('input', aplicarFiltros);


    btnLimpar.addEventListener('click', () => {
        filtroCidade.value = '';
        filtroNome.value = '';
        filtroEspecialidade.value = '';
        filtroValorMin.value = ''; 
        filtroValorMax.value = ''; 
        aplicarFiltros();
    });

    // --- EVENT LISTENER PARA O FORMULÁRIO DE CADASTRO ---
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o recarregamento padrão da página

            // Coleta os dados dos campos do formulário
            const dadosParaCadastrar = {
                nomeClinica: document.getElementById('cad-nome-clinica').value,
                nomeMedico: document.getElementById('cad-nome-medico').value,
                especialidade: document.getElementById('cad-especialidade').value,
                cidade: document.getElementById('cad-cidade').value,
                estado: document.getElementById('cad-estado').value,
                valorSns: document.getElementById('cad-valor-sns').value,
                valorOriginal: document.getElementById('cad-valor-original').value,
            };

            try {
                // Envia os dados para a API no backend usando fetch
                const response = await fetch('/api/cadastrar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dadosParaCadastrar),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message); // Exibe mensagem de sucesso
                    formCadastro.reset(); // Limpa os campos do formulário
                    buscarDados(); // Atualiza a lista de profissionais na tela
                } else {
                    // Se o servidor retornar um erro, exibe a mensagem de erro
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                alert('Falha ao realizar o cadastro. Verifique o console para mais detalhes.');
            }
        });
    }
   // Delegação de evento para os botões de excluir
resultadosContainer.addEventListener('click', async (event) => {
    // Verifica se o elemento clicado foi um botão com a classe 'btn-excluir'
    if (event.target.classList.contains('btn-excluir')) {
        const button = event.target;
        const rowIndex = button.dataset.rowIndex;

        // Pede confirmação ao usuário
        const confirmar = confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.');

        if (confirmar) {
            try {
                const response = await fetch(`/api/excluir/${rowIndex}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Registro excluído com sucesso!');
                    buscarDados(); // Atualiza a lista na tela para remover o item excluído
                } else {
                    const result = await response.json();
                    throw new Error(result.error || 'Falha ao excluir');
                }
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert(`Não foi possível excluir o registro. ${error.message}`);
            }
        }
    }
}); 

    // --- INICIA A APLICAÇÃO ---
    // Busca os dados da planilha assim que a página carrega.
    buscarDados();
});