// Funções que manipulam e renderizam a interface do usuário (UI).
import * as DOMElements from './domElements.js';

// Função para renderizar os cards de resultados na página
export function renderizarPagina(dadosFiltrados, currentPage, itemsPerPage) {
    const { resultadosContainer, paginationContainer } = DOMElements;
    const resultadosHeader = document.querySelector('.resultados-header');
    const totalResultados = dadosFiltrados.length;

    if (resultadosHeader) {
        const textoContador = totalResultados === 1 ? 'médico encontrado' : 'médicos encontrados';
        resultadosHeader.innerHTML = `
            <h2><i class="fas fa-list-ul"></i> Resultados da Busca</h2>
            <span class="contador-resultados">${totalResultados} ${textoContador}</span>
        `;
    }

    // 1. Apaga os cards antigos
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

    // 2. Desenha os novos cards
    itensDaPagina.forEach(item => {
        const card = criarCard(item);
        resultadosContainer.appendChild(card);
    });

    // 3. Verifica se o usuário está logado e mostra os botões nos novos cards
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const adminButtonsOnCards = resultadosContainer.querySelectorAll('.admin-only');
        adminButtonsOnCards.forEach(btn => {
            btn.classList.add('is-visible');
        });
    }
    // ==================================================================

    // 4. Configura a nova paginação
    setupPagination(dadosFiltrados.length, currentPage, itemsPerPage);
}


// Função auxiliar para criar um único card
function criarCard(item) {
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
            <button class="btn-editar admin-only">✏️ Editar</button>
            <button class="btn-excluir admin-only" title="Excluir Registro">🗑️ Excluir</button>
        </div>
            ${item.atualizado ? `<span class="data-atualizacao">Atualizado em: ${item.atualizado}</span>` : ''}
        </div>
    `;
    return card;
}


// Configura a paginação principal
function setupPagination(totalItems, currentPage, itemsPerPage) {
    const { paginationContainer } = DOMElements;
    const pageCount = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = '';

    if (pageCount <= 1) return;

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

    const pagesToShow = new Set([1, pageCount]);
    for (let i = -1; i <= 1; i++) {
        const page = currentPage + i;
        if (page > 1 && page < pageCount) {
            pagesToShow.add(page);
        }
    }
    
    const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
    let lastPage = 0;
    for (const page of sortedPages) {
        if (page > lastPage + 1) {
            createEllipsis();
        }
        createButton(page, page, false, page === currentPage);
        lastPage = page;
    }

    createButton(currentPage + 1, 'Próxima', currentPage === pageCount);
}

// Renderiza o painel de comparação
export function renderizarComparacao(dadosCompletos, especialidade, cidadeSelecionada, comparisonCurrentPage, comparisonItemsPerPage) {
    if (!especialidade) {
        renderizarPlaceholderComparacao('Card sem especialidade para poder comparar.');
        return;
    }

    const resultadosDaEspecialidade = dadosCompletos.filter(item => 
        item.especialidade && item.especialidade.toLowerCase() === especialidade.toLowerCase()
    );

    renderizarResultadosComparacao(resultadosDaEspecialidade, especialidade, cidadeSelecionada, comparisonCurrentPage, comparisonItemsPerPage);
}

// Lógica interna da renderização da comparação
function renderizarResultadosComparacao(resultados, especialidade, cidadeOriginal, comparisonCurrentPage, comparisonItemsPerPage) {
    const { comparacaoContainer } = DOMElements;
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
    } else {
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
            <button id="btn-copiar-comparativo" title="Copiar resumo da cidade ${cidadeOriginal} selecionada">
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
        setupComparisonPagination(listaFinal.length, comparisonCurrentPage, comparisonItemsPerPage);
    }
}


// Renderiza o placeholder inicial da comparação
export function renderizarPlaceholderComparacao(mensagem = 'Clique em um card para ver a comparação de preços da especialidade em outras cidades.') {
    DOMElements.comparacaoContainer.innerHTML = `
        <div class="info-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            </svg>
            <p>${mensagem}</p>
        </div>
    `;
}

// Configura a paginação da comparação
function setupComparisonPagination(totalItems, comparisonCurrentPage, comparisonItemsPerPage) {
    const container = document.getElementById('comparison-pagination-container');
    if (!container) return;
    
    const pageCount = Math.ceil(totalItems / comparisonItemsPerPage);
    container.innerHTML = `
        <button class="comparison-page-btn comparison-btn-prev" ${comparisonCurrentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
        <span class="comparison-page-info">${comparisonCurrentPage} de ${pageCount}</span>
        <button class="comparison-page-btn comparison-btn-next" ${comparisonCurrentPage === pageCount ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

// Abre e fecha o modal
export function toggleModal() {
    DOMElements.modalCadastro.classList.toggle('ativo');
}

// Prepara o modal para edição de um item
export function prepararModalParaEdicao(itemData) {
    const { formCadastro, campoHiddenEdit, modalTitulo, modalBotaoSubmit } = DOMElements;
    formCadastro.reset();
    
    document.getElementById('cad-nome-clinica').value = itemData.nome_da_clinica || '';
    document.getElementById('cad-nome-medico').value = itemData.nome_do_medico || '';
    document.getElementById('cad-especialidade').value = itemData.especialidade || '';
    document.getElementById('cad-cidade').value = itemData.cidade || '';
    document.getElementById('cad-estado').value = itemData.estado || '';
    document.getElementById('cad-valor-sns').value = String(itemData.valor_pela_sns || '').replace(',', '.');
    document.getElementById('cad-valor-original').value = String(itemData.valor_original || '').replace(',', '.');
    
    if (itemData.atualizado && itemData.atualizado.includes('/')) {
        const [dia, mes, ano] = itemData.atualizado.split('/');
        document.getElementById('cad-atualizado').value = `${ano}-${mes}-${dia}`;
    } else {
        document.getElementById('cad-atualizado').value = itemData.atualizado || '';
    }

    campoHiddenEdit.value = itemData.rowIndex;
    modalTitulo.textContent = 'Editar Registro';
    modalBotaoSubmit.textContent = 'Salvar Alterações';
    toggleModal();
}
export function toggleLoginModal() {
    DOMElements.modalLogin.classList.toggle('ativo');
}

export function gerenciarControlesAdmin(logado) {
    const controlesAdmin = document.querySelectorAll('.admin-only');
    const btnLogin = DOMElements.btnLogin;

    if (logado) {
       document.body.classList.add('is-logged-in') // Se está logado: mostra os controles de admin e esconde o botão de login
        controlesAdmin.forEach(c => c.classList.add('is-visible'));
        if (btnLogin) btnLogin.style.display = 'none';

    } else {
        document.body.classList.add('is-logged-in')
        // Se NÃO está logado: esconde os controles de admin e mostra o botão de login
        controlesAdmin.forEach(c => c.classList.remove('is-visible'));
        if (btnLogin) btnLogin.style.display = 'flex';
    }
}

// Prepara o modal para um novo cadastro
export function prepararModalParaCadastro() {
    const { formCadastro, campoHiddenEdit, modalTitulo, modalBotaoSubmit } = DOMElements;
    formCadastro.reset();
    campoHiddenEdit.value = '';
    modalTitulo.textContent = 'Cadastrar Novo Profissional';
    modalBotaoSubmit.textContent = 'Cadastrar';
    toggleModal();
}

// Gera e copia o texto de comparação
export function gerarEcopiarTextoComparativo(currentComparisonData, dadosCompletos) {
    if (!currentComparisonData) return;

    const { especialidade, cidadeSelecionada } = currentComparisonData;
    const especialidadeFormatada = especialidade.charAt(0).toUpperCase() + especialidade.slice(1).toLowerCase();
    const cidadeFormatada = cidadeSelecionada.charAt(0).toUpperCase() + cidadeSelecionada.slice(1).toLowerCase();

    const resultadosDaCidade = dadosCompletos.filter(item =>
        item.especialidade && item.cidade &&
        item.especialidade.toLowerCase() === especialidade.toLowerCase() &&
        item.cidade.toLowerCase() === cidadeSelecionada.toLowerCase()
    );

    const clinicas = new Map();
    resultadosDaCidade.forEach(item => {
        const nomeClinica = item.nome_da_clinica || 'Clínica não informada';
        if (!clinicas.has(nomeClinica)) {
            clinicas.set(nomeClinica, []);
        }
        clinicas.get(nomeClinica).push(item);
    });

    let textoFinal = `\n\n*${especialidadeFormatada} em ${cidadeFormatada}*\n`;

    clinicas.forEach((profissionais, nomeClinica) => {
        textoFinal += `\n🏥 *${nomeClinica.trim()}*\n`;
        profissionais.forEach(p => {
            const valorSnsNum = p.valor_pela_sns ? parseFloat(String(p.valor_pela_sns).replace(',', '.')) : null;
            const valorOriginalNum = p.valor_original ? parseFloat(String(p.valor_original).replace(',', '.')) : null;
            const valorSns = valorSnsNum ? valorSnsNum.toFixed(2).replace('.', ',') : null;
            const valorOriginal = valorOriginalNum ? valorOriginalNum.toFixed(2).replace('.', ',') : null;
            const nomeMedico = p.nome_do_medico ? `*${p.nome_do_medico.trim()}*` : 'Profissional';
            
            if (valorOriginalNum && valorSnsNum && valorOriginalNum > valorSnsNum) {
                textoFinal += `  • ${nomeMedico}: De *R$${valorOriginal}* por *R$${valorSns}* \n`;
            } else if (valorSns) {
                textoFinal += `  • ${nomeMedico}: *R$${valorSns}* pela SNS \n`;
            }
        });
    });

    textoFinal += `\n---\n_Valores sujeitos a alteração._`;

    navigator.clipboard.writeText(textoFinal.trim()).then(() => {
        Toastify({ text: "Resumo copiado!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        Toastify({ text: "Falha ao copiar texto.", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
    });
}