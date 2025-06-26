document.addEventListener('DOMContentLoaded', () => {
    // --- DECLARAÇÃO DE CONSTANTES ---
    const filtroNome = document.getElementById('nome');
    const filtroEspecialidade = document.getElementById('especialidade');
    const filtroCidade = document.getElementById('cidade');
    const filtroValorMin = document.getElementById('valor-min');
    const filtroValorMax = document.getElementById('valor-max');
    const seletorOrdenacao = document.getElementById('ordenar');
    const btnLimpar = document.querySelector('.btn-limpar');
    const btnCadastrar = document.querySelector('.btn-cadastrar');

    const resultadosContainer = document.getElementById('resultados-container');
    const paginationContainer = document.getElementById('pagination-container');
    const comparacaoContainer = document.getElementById('comparacao-vizinhos-container');

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

    let comparisonCurrentPage = 1;
    const comparisonItemsPerPage = 5;
    let currentComparisonData = null;

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
        const resultadosHeader = document.querySelector('.resultados-header');
        const totalResultados = dadosFiltrados.length;
    
        if (resultadosHeader) {
            const textoContador = totalResultados === 1 ? 'médico encontrado' : 'médicos encontrados';
            resultadosHeader.innerHTML = `
                <h2><i class="fas fa-list-ul"></i> Resultados da Busca</h2>
                <span class="contador-resultados">${totalResultados} ${textoContador}</span>
            `;
        }
    
        resultadosContainer.innerHTML = '';
        paginationContainer.innerHTML = '';
    
        if (totalResultados === 0) {
            resultadosContainer.innerHTML = '<p>Nenhum resultado encontrado para os filtros aplicados.</p>';
            if (resultadosHeader) document.querySelector('.contador-resultados').style.display = 'none';
            return;
        }
    
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itensDaPagina = dadosFiltrados.slice(startIndex, endIndex);
    
        itensDaPagina.forEach(item => {
            const valorSns = parseFloat(String(item.valor_pela_sns).replace(',', '.'));
            const valorOriginal = parseFloat(String(item.valor_original).replace(',', '.'));
            
            const htmlMedico = item.nome_do_medico ? `<p><i class="fas fa-user-doctor"></i> ${item.nome_do_medico}</p>` : '';
            const htmlEspecialidade = item.especialidade ? `<p><i class="fas fa-stethoscope"></i> ${item.especialidade}</p>` : '';
            const localCompleto = [item.cidade, item.estado].filter(Boolean).join(' - ');
            const htmlLocal = localCompleto ? `<p><i class="fas fa-map-marker-alt"></i> ${localCompleto}</p>` : '';
            const htmlPrecoSns = !isNaN(valorSns) && valorSns > 0 ? `<p class="preco-sns">Valor SNS: R$ ${valorSns.toFixed(2).replace('.', ',')}</p>` : '';
            const htmlPrecoOriginal = !isNaN(valorOriginal) && valorOriginal > 0 ? `<p class="preco-original">Valor Original: R$ ${valorOriginal.toFixed(2).replace('.', ',')}</p>` : '';
            const htmlEconomia = !isNaN(valorOriginal) && !isNaN(valorSns) && valorOriginal > valorSns ? `<p class="economia"><strong>Sua economia: R$ ${(valorOriginal - valorSns).toFixed(2).replace('.', ',')}</strong></p>` : '';

            const card = document.createElement('div');
            card.className = 'card';
            if (item.cidade) card.dataset.cidade = item.cidade;
            if (item.estado) card.dataset.estado = item.estado;
            if (item.especialidade) card.dataset.especialidade = item.especialidade;
            card.dataset.rowIndex = item.rowIndex;
    
            card.innerHTML = `
                <div class="card-header">
                    <h3><i class="fas fa-hospital"></i> ${item.nome_da_clinica}</h3>
                </div>
                ${htmlMedico}
                ${htmlEspecialidade}
                ${htmlLocal}
                ${(htmlPrecoOriginal || htmlPrecoSns) ? '<hr>' : ''}
                ${htmlPrecoOriginal}
                ${htmlPrecoSns}
                ${htmlEconomia}
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
        paginationContainer.innerHTML = '';
    
        if (pageCount <= 1) {
            return; 
        }
    
        // --- Funções auxiliares para criar os elementos ---
        const createButton = (page, text, isDisabled = false, isActive = false) => {
            const btn = document.createElement('button');
            btn.className = 'page-btn';
            if (text === 'Anterior') {
                btn.innerHTML = `<i class="fas fa-chevron-left"></i> Anterior`;
                btn.classList.add('btn-prev');
            } else if (text === 'Próxima') {
                btn.innerHTML = `Próxima <i class="fas fa-chevron-right"></i>`;
                btn.classList.add('btn-next');
            } else {
                btn.innerText = text;
            }
            
            btn.dataset.page = page;
            btn.disabled = isDisabled;
    
            if (isActive) {
                btn.classList.add('active');
            }
            paginationContainer.appendChild(btn);
        };
    
        const createEllipsis = () => {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.innerText = '...';
            paginationContainer.appendChild(ellipsis);
        };
    
        createButton(currentPage - 1, 'Anterior', currentPage === 1);
    
        const pagesToShow = new Set();
        const window = 2; 
    
        pagesToShow.add(1);
    
        for (let i = -window; i <= window; i++) {
            const page = currentPage + i;
            if (page > 1 && page < pageCount) {
                pagesToShow.add(page);
            }
        }
     
        if (pageCount > 1) pagesToShow.add(pageCount);
        if (pageCount > 2) pagesToShow.add(pageCount - 1);
        if (pageCount > 3) pagesToShow.add(pageCount - 2);
    
        // --- Montar os botões e elipses ---
        const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
        let lastPage = 0;
        
        for (const page of sortedPages) {
            if (page > lastPage + 1) {
                createEllipsis(); // Adiciona "..." se houver um salto nos números
            }
            createButton(page, page, false, page === currentPage);
            lastPage = page;
        }
    
        createButton(currentPage + 1, 'Próxima', currentPage === pageCount);
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
        if (ordenacao === 'preco-menor') {
            dadosProcessados.sort((a, b) => (parseFloat(String(a.valor_pela_sns).replace(',', '.')) || 0) - (parseFloat(String(b.valor_pela_sns).replace(',', '.')) || 0));
        } else if (ordenacao === 'preco-maior') {
            dadosProcessados.sort((a, b) => (parseFloat(String(b.valor_pela_sns).replace(',', '.')) || 0) - (parseFloat(String(a.valor_pela_sns).replace(',', '.')) || 0));
        } else if (ordenacao === 'padrao') {
            // No sorting for default
        }
        
        dadosFiltrados = dadosProcessados;
        renderizarPagina();
    }

    function renderizarPlaceholderComparacao(mensagem = 'Clique em um card para ver a comparação de preços da especialidade em outras cidades.') {
        comparacaoContainer.innerHTML = `
            <div class="info-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                <p>${mensagem}</p>
            </div>
        `;
    }
    
    function renderizarComparacaoGlobal(especialidade, cidadeSelecionada) {
        if (!especialidade) {
            renderizarPlaceholderComparacao('Card sem especialidade para poder comparar.');
            return;
        }

        const resultadosDaEspecialidade = dadosCompletos.filter(item => 
            item.especialidade &&
            item.especialidade.toLowerCase() === especialidade.toLowerCase()
        );

        renderizarResultadosComparacao(resultadosDaEspecialidade, especialidade, cidadeSelecionada);
    }
    
    function renderizarResultadosComparacao(resultados, especialidade, cidadeOriginal) {
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
            listaFinal.sort((a, b) => {
                const cidadeA = a.cidade || '';
                const cidadeB = b.cidade || '';
                if (cidadeA.toLowerCase() === cidadeOriginal.toLowerCase() && cidadeB.toLowerCase() !== cidadeOriginal.toLowerCase()) return -1;
                if (cidadeA.toLowerCase() !== cidadeOriginal.toLowerCase() && cidadeB.toLowerCase() === cidadeOriginal.toLowerCase()) return 1;
                return cidadeA.localeCompare(cidadeB);
            });
        }
    
        const startIndex = (comparisonCurrentPage - 1) * comparisonItemsPerPage;
        const endIndex = startIndex + comparisonItemsPerPage;
        const itensDaPagina = listaFinal.slice(startIndex, endIndex);
    
        let conteudoInterno = '';
        if (itensDaPagina.length > 0) {
            itensDaPagina.forEach(melhorOpcao => {
                const valorSns = parseFloat(String(melhorOpcao.valor_pela_sns).replace(',', '.')) || 0;
                let classeDestaque = '';
                if (campeaGeral && melhorOpcao.rowIndex === campeaGeral.rowIndex) classeDestaque = 'destaque-melhor-opcao';
                if (melhorOpcao.cidade.toLowerCase() === cidadeOriginal.toLowerCase()) classeDestaque += ' destaque-cidade-selecionada';
    
                conteudoInterno += `
                    <div class="card-comparacao ${classeDestaque}">
                        <p class="local-vizinho">${melhorOpcao.nome_da_clinica} - <strong>${melhorOpcao.cidade}</strong></p>
                        <p><strong>Médico(a):</strong> ${melhorOpcao.nome_do_medico}</p>
                        <p class="preco-sns">Valor SNS: R$ ${valorSns.toFixed(2).replace('.', ',')}</p>
                    </div>
                `;
            });
        } else if (listaFinal.length === 0) {
             conteudoInterno += `<p class="nenhum-resultado-comparacao">Nenhum profissional de ${especialidade} com preço cadastrado foi encontrado para comparação.</p>`;
        }

        comparacaoContainer.innerHTML = `
        <div class="comparacao-header">
            <div class="comparacao-header-info">
                <i class="fas fa-tags"></i>
                <div class="comparacao-header-texto">
                    <span>Comparativo de Preços</span>
                    <strong>${especialidade}</strong>
                </div>
            </div>
            <button id="btn-copiar-comparativo" title="Copiar resumo da cidade selecionada">
                <i class="fas fa-copy"></i>
            </button>
        </div>
        <div class="comparacao-wrapper-interno">
            ${conteudoInterno}
        </div>
    `;
    
        if (listaFinal.length > comparisonItemsPerPage) {
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'comparison-pagination-container';
            comparacaoContainer.querySelector('.comparacao-wrapper-interno').appendChild(paginationDiv);
            setupComparisonPagination(listaFinal.length);
        }
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
        filtroNome.addEventListener(evento, aplicarFiltros);
        filtroEspecialidade.addEventListener(evento, aplicarFiltros);
        filtroCidade.addEventListener(evento, aplicarFiltros);
        filtroValorMin.addEventListener(evento, aplicarFiltros);
        filtroValorMax.addEventListener(evento, aplicarFiltros);
        seletorOrdenacao.addEventListener(evento, aplicarFiltros);
    });

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
        } else { // Este é o bloco a ser alterado
            document.querySelectorAll('.card.selecionado').forEach(c => c.classList.remove('selecionado'));
            card.classList.add('selecionado');
            comparacaoContainer.classList.add('visivel');
    
            const especialidade = card.dataset.especialidade ? card.dataset.especialidade.trim() : null;
            const cidadeSelecionada = card.dataset.cidade ? card.dataset.cidade.trim() : null;
            
            if (especialidade && cidadeSelecionada) {
                // Reseta a paginação da comparação e guarda os dados para a nova busca
                comparisonCurrentPage = 1; 
                currentComparisonData = { especialidade, cidadeSelecionada };
                renderizarComparacaoGlobal(especialidade, cidadeSelecionada);
            } else {
                renderizarPlaceholderComparacao('Card sem especialidade ou cidade para poder comparar.');
            }
        }
    });
    
    function toggleModal() {
        modalCadastro.classList.toggle('ativo');
    }

    btnCadastrar.addEventListener('click', () => {
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
        filtroNome.value = '';
        filtroEspecialidade.value = '';
        filtroCidade.value = '';
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

    function setupComparisonPagination(totalItems) {
        const container = document.getElementById('comparison-pagination-container');
        if (!container) return;
    
        const pageCount = Math.ceil(totalItems / comparisonItemsPerPage);
        container.innerHTML = '';
    
        // Botão Anterior
        const prevButton = document.createElement('button');
        prevButton.className = 'comparison-page-btn comparison-btn-prev';
        prevButton.innerHTML = `<i class="fas fa-chevron-left"></i>`;
        prevButton.disabled = comparisonCurrentPage === 1;
        container.appendChild(prevButton);
    
        // Texto "Página X de Y"
        const pageInfo = document.createElement('span');
        pageInfo.className = 'comparison-page-info';
        pageInfo.innerText = `${comparisonCurrentPage} de ${pageCount}`;
        container.appendChild(pageInfo);
    
        // Botão Próxima
        const nextButton = document.createElement('button');
        nextButton.className = 'comparison-page-btn comparison-btn-next';
        nextButton.innerHTML = `<i class="fas fa-chevron-right"></i>`;
        nextButton.disabled = comparisonCurrentPage === pageCount;
        container.appendChild(nextButton);
    }
    
    // Adiciona um novo event listener para o painel de comparação
    comparacaoContainer.addEventListener('click', (event) => {
        // Lógica para o botão de copiar
        const copyBtn = event.target.closest('#btn-copiar-comparativo');
        if (copyBtn) {
            event.stopPropagation();
            gerarEcopiarTextoComparativo();
            return;
        }
    
        // Lógica para a paginação (continua a mesma)
        const pageBtn = event.target.closest('.comparison-page-btn');
        if (!pageBtn) return;
        
        event.stopPropagation();
    
        if (pageBtn.classList.contains('comparison-btn-prev') && !pageBtn.disabled) {
            comparisonCurrentPage--;
        } else if (pageBtn.classList.contains('comparison-btn-next') && !pageBtn.disabled) {
            comparisonCurrentPage++;
        } else {
            return;
        }
    
        if (currentComparisonData) {
            renderizarComparacaoGlobal(currentComparisonData.especialidade, currentComparisonData.cidadeSelecionada);
        }
    });
    function gerarEcopiarTextoComparativo() {
        if (!currentComparisonData) return;
    
        const { especialidade, cidadeSelecionada } = currentComparisonData;
    
        // 1. Filtra todos os dados para encontrar os profissionais daquela especialidade e cidade
        const resultadosDaCidade = dadosCompletos.filter(item => 
            item.especialidade && item.cidade &&
            item.especialidade.toLowerCase() === especialidade.toLowerCase() &&
            item.cidade.toLowerCase() === cidadeSelecionada.toLowerCase()
        );
    
        // 2. Agrupa os resultados por nome da clínica
        const clinicas = new Map();
        resultadosDaCidade.forEach(item => {
            const nomeClinica = item.nome_da_clinica || 'Clínica não informada';
            if (!clinicas.has(nomeClinica)) {
                clinicas.set(nomeClinica, []);
            }
            clinicas.get(nomeClinica).push(item);
        });
    
        // 3. Monta o texto no formato solicitado
        let textoFinal = `${especialidade.toUpperCase()} ${cidadeSelecionada.toUpperCase()}\n`;
    
        clinicas.forEach((profissionais, nomeClinica) => {
            textoFinal += `\n${nomeClinica.toUpperCase()}:\n`;
            profissionais.forEach(p => {
                const valorSns = p.valor_pela_sns ? parseFloat(String(p.valor_pela_sns).replace(',', '.')).toFixed(2).replace('.', ',') : null;
                const valorOriginal = p.valor_original ? parseFloat(String(p.valor_original).replace(',', '.')).toFixed(2).replace('.', ',') : null;
                const nomeMedico = p.nome_do_medico ? ` com ${p.nome_do_medico}` : '';
    
                let linha = '';
                if (valorOriginal && valorSns) {
                    linha = `Valor de R$${valorOriginal} por R$${valorSns} pela SNS${nomeMedico}`;
                } else if (valorSns) {
                    linha = `Valor R$${valorSns} pela SNS${nomeMedico}`;
                } else {
                    return; // Não adiciona linha se não houver preço
                }
                textoFinal += `${linha}\n`;
            });
        });
    
        // 4. Copia o texto para a área de transferência
        navigator.clipboard.writeText(textoFinal.trim()).then(() => {
            Toastify({ text: "Resumo copiado!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            Toastify({ text: "Falha ao copiar texto.", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
        });
    }
    // --- INICIA A APLICAÇÃO ---
    buscarDados();
});