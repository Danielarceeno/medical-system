import * as DOMElements from "./domElements.js";

function ajustarAlturaModalLogin(formVisivel) {
  const { modalLogin } = DOMElements;
  const modalContent = modalLogin.querySelector('.modal-content');
  const titulo = modalLogin.querySelector('h2');

  if (modalContent && titulo && formVisivel) {
    const alturaTotal = titulo.offsetHeight + formVisivel.scrollHeight + 25;
    modalContent.style.height = `${alturaTotal}px`;
  }
}

function resetLoginModal() {
    const { modalLogin } = DOMElements;
    if (modalLogin) {
        modalLogin.classList.remove('step-2-active');
        
        const modalContent = modalLogin.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.height = '';
        }
        document.getElementById("login-email").value = "";
        document.getElementById("login-code").value = "";
    }
}

export function toggleLoginModal() {
  const { modalLogin } = DOMElements;
  const formRequestCode = document.getElementById("form-request-code");

  modalLogin.classList.toggle("ativo");

  if (modalLogin.classList.contains("ativo")) {
    setTimeout(() => {
        ajustarAlturaModalLogin(formRequestCode);
    }, 0);
  } else {
    setTimeout(() => {
        resetLoginModal();
    }, 400); 
  }
}

export function toggleModal() {
  DOMElements.modalCadastro.classList.toggle("ativo");
}

export function prepararModalParaEdicao(itemData) {
  const { formCadastro, campoHiddenEdit, modalTitulo, modalBotaoSubmit } =
    DOMElements;
  formCadastro.reset();

  document.getElementById("cad-nome-clinica").value =
    itemData.nome_da_clinica || "";
  document.getElementById("cad-nome-medico").value =
    itemData.nome_do_medico || "";
  document.getElementById("cad-especialidade").value =
    itemData.especialidade || "";
  document.getElementById("cad-observacao").value = itemData.observacao || "";
  document.getElementById("cad-cidade").value = itemData.cidade || "";
  document.getElementById("cad-estado").value = itemData.estado || "";
  document.getElementById("cad-valor-sns").value = String(
    itemData.valor_pela_sns || ""
  ).replace(",", ".");
  document.getElementById("cad-valor-original").value = String(
    itemData.valor_original || ""
  ).replace(",", ".");

  if (itemData.atualizado && itemData.atualizado.includes("/")) {
    const [dia, mes, ano] = itemData.atualizado.split("/");
    document.getElementById("cad-atualizado").value = `${ano}-${mes}-${dia}`;
  } else {
    document.getElementById("cad-atualizado").value = itemData.atualizado || "";
  }

  campoHiddenEdit.value = itemData.rowIndex;
  modalTitulo.textContent = "Editar Registro";
  modalBotaoSubmit.textContent = "Salvar Alterações";
  toggleModal();
}

export function prepararModalParaCadastro() {
  const { formCadastro, campoHiddenEdit, modalTitulo, modalBotaoSubmit } =
    DOMElements;
  formCadastro.reset();
  campoHiddenEdit.value = "";
  modalTitulo.textContent = "Cadastrar Novo Profissional";
  modalBotaoSubmit.textContent = "Cadastrar";
  toggleModal();
}

export function renderizarPagina(dadosFiltrados, currentPage, itemsPerPage) {
  const { resultadosContainer, paginationContainer } = DOMElements;
  const resultadosHeader = document.querySelector(".resultados-header");
  const totalResultados = dadosFiltrados.length;

  if (resultadosHeader) {
    const textoContador =
      totalResultados === 1 ? "médico encontrado" : "médicos encontrados";
    resultadosHeader.innerHTML = `
            <h2><i class="fas fa-list-ul"></i> Resultados da Busca</h2>
            <span class="contador-resultados">${totalResultados} ${textoContador}</span>
        `;
  }

  resultadosContainer.innerHTML = "";
  paginationContainer.innerHTML = "";

  if (totalResultados === 0) {
    resultadosContainer.innerHTML =
      "<p>Nenhum resultado encontrado para os filtros aplicados.</p>";
    if (resultadosHeader)
      document.querySelector(".contador-resultados").style.display = "none";
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itensDaPagina = dadosFiltrados.slice(startIndex, endIndex);

  itensDaPagina.forEach((item) => {
    const card = criarCard(item);
    resultadosContainer.appendChild(card);
  });

  if (sessionStorage.getItem("authToken")) {
    const adminButtonsOnCards =
      resultadosContainer.querySelectorAll(".admin-only");
    adminButtonsOnCards.forEach((btn) => {
      btn.classList.add("is-visible");
    });
  }

  setupPagination(dadosFiltrados.length, currentPage, itemsPerPage);
}

function criarCard(item) {
  const valorSns = parseFloat(String(item.valor_pela_sns).replace(",", "."));
  const valorOriginal = parseFloat(
    String(item.valor_original).replace(",", ".")
  );

  let especialidadeCompleta = item.especialidade || "";
  if (item.observacao && item.observacao.trim() !== "") {
    especialidadeCompleta += ` (${item.observacao})`;
  }

  const htmlMedico = item.nome_do_medico
    ? `<p><i class="fas fa-user-doctor"></i> ${item.nome_do_medico}</p>`
    : "";
  const htmlEspecialidade = item.especialidade
    ? `<p><i class="fas fa-stethoscope"></i> ${especialidadeCompleta}</p>`
    : "";
  const localCompleto = [item.cidade, item.estado].filter(Boolean).join(" - ");
  const htmlLocal = localCompleto
    ? `<p><i class="fas fa-map-marker-alt"></i> ${localCompleto}</p>`
    : "";
  const htmlPrecoSns =
    !isNaN(valorSns) && valorSns > 0
      ? `<p class="preco-sns">Valor SNS: R$ ${valorSns
          .toFixed(2)
          .replace(".", ",")}</p>`
      : "";
  const htmlPrecoOriginal =
    !isNaN(valorOriginal) && valorOriginal > 0
      ? `<p class="preco-original">Valor Original: R$ ${valorOriginal
          .toFixed(2)
          .replace(".", ",")}</p>`
      : "";
  const htmlEconomia =
    !isNaN(valorOriginal) && !isNaN(valorSns) && valorOriginal > valorSns
      ? `<p class="economia"><strong>Sua economia: R$ ${(
          valorOriginal - valorSns
        )
          .toFixed(2)
          .replace(".", ",")}</strong></p>`
      : "";

  const card = document.createElement("div");
  card.className = "card";
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
        ${htmlPrecoOriginal || htmlPrecoSns ? "<hr>" : ""}
        ${htmlPrecoOriginal}
        ${htmlPrecoSns}
        ${htmlEconomia}
        <div class="card-footer">
            <div class="botoes-acao">
                <button class="btn-editar admin-only">✏️ Editar</button>
                <button class="btn-excluir admin-only" title="Excluir Registro">🗑️ Excluir</button>
            </div>
            ${
              item.atualizado
                ? `<span class="data-atualizacao">Atualizado em: ${item.atualizado}</span>`
                : ""
            }
        </div>
    `;
  return card;
}

function setupPagination(totalItems, currentPage, itemsPerPage) {
  const { paginationContainer } = DOMElements;
  const pageCount = Math.ceil(totalItems / itemsPerPage);
  paginationContainer.innerHTML = "";

  if (pageCount <= 1) return;

  const createButton = (page, text, isDisabled = false, isActive = false) => {
    const btn = document.createElement("button");
    btn.className = "page-btn";
    if (text === "Anterior") {
      btn.innerHTML = `<i class="fas fa-chevron-left"></i> Anterior`;
      btn.classList.add("btn-prev");
    } else if (text === "Próxima") {
      btn.innerHTML = `Próxima <i class="fas fa-chevron-right"></i>`;
      btn.classList.add("btn-next");
    } else {
      btn.innerText = text;
    }
    btn.dataset.page = page;
    btn.disabled = isDisabled;
    if (isActive) {
      btn.classList.add("active");
    }
    paginationContainer.appendChild(btn);
  };

  const createEllipsis = () => {
    const ellipsis = document.createElement("span");
    ellipsis.className = "pagination-ellipsis";
    ellipsis.innerText = "...";
    paginationContainer.appendChild(ellipsis);
  };

  createButton(currentPage - 1, "Anterior", currentPage === 1);

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

  createButton(currentPage + 1, "Próxima", currentPage === pageCount);
}

async function fetchRegionalData(cidade, estado, especialidade, dadosCompletos) {
  console.warn("");
  return [];
  /*
  try {
    const response = await fetch(
      `/api/vizinhos/${encodeURIComponent(cidade)}/${encodeURIComponent(
        estado
      )}`
    );
    // ... resto da lógica
  } catch (error) {
    console.error("Erro ao buscar dados regionais:", error);
    return [];
  }
  */
}

export async function renderizarComparacao(
  dadosCompletos,
  especialidade,
  cidadeSelecionada,
  comparisonCurrentPage,
  comparisonItemsPerPage
) {
  if (!especialidade || !cidadeSelecionada) {
    renderizarPlaceholderComparacao(
      "Card sem especialidade ou cidade para poder comparar."
    );
    return;
  }

  const { comparacaoContainer } = DOMElements;

  const cityResults = dadosCompletos.filter(
    (item) =>
      item.especialidade?.toLowerCase() === especialidade.toLowerCase() &&
      item.cidade?.toLowerCase() === cidadeSelecionada.toLowerCase() &&
      item.nome_do_medico?.trim()
  );

  const regionalResults = await fetchRegionalData(
    cidadeSelecionada,
    dadosCompletos.find(
      (item) => item.cidade?.toLowerCase() === cidadeSelecionada.toLowerCase()
    )?.estado || "",
    especialidade,
    dadosCompletos
  );

  const criarHtmlPreco = (valor) => {
    const valorNumerico = parseFloat(String(valor).replace(",", "."));
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
      return `<p class="preco-sns">Valor SNS: R$ ${valorNumerico
        .toFixed(2)
        .replace(".", ",")}</p>`;
    }
    return "";
  };

  let cityContent = "";
  if (cityResults.length > 0) {
    cityResults.sort((a,b) => (parseFloat(String(a.valor_pela_sns).replace(",",".")) || Infinity) - (parseFloat(String(b.valor_pela_sns).replace(",",".")) || Infinity));
    const cityCampea = cityResults[0];

    const startIndex = (comparisonCurrentPage - 1) * comparisonItemsPerPage;
    const endIndex = startIndex + comparisonItemsPerPage;
    const cityItems = cityResults.slice(startIndex, endIndex);

    cityItems.forEach((item) => {
      const isCampea = cityCampea && item.rowIndex === cityCampea.rowIndex;
      const htmlPreco = criarHtmlPreco(item.valor_pela_sns);

      cityContent += `
        <div class="card-comparacao ${isCampea && htmlPreco ? "destaque-melhor-opcao" : ""}">
            <p class="local-vizinho">${item.nome_da_clinica} - <strong>${item.cidade}</strong></p>
            <p><strong>Médico(a):</strong> ${item.nome_do_medico}</p>
            ${htmlPreco}
        </div>`;
    });
  } else {
    cityContent = `<p class="nenhum-resultado-comparacao">Nenhum profissional de ${especialidade} com preço cadastrado foi encontrado em ${cidadeSelecionada}.</p>`;
  }

  let regionalContent = "";
  if (regionalResults.length > 0) {
    regionalResults.sort((a,b) => (parseFloat(String(a.valor_pela_sns).replace(",",".")) || Infinity) - (parseFloat(String(b.valor_pela_sns).replace(",",".")) || Infinity));
    const regionalCampea = regionalResults[0];

    const startIndex = (comparisonCurrentPage - 1) * comparisonItemsPerPage;
    const endIndex = startIndex + comparisonItemsPerPage;
    const regionalItems = regionalResults.slice(startIndex, endIndex);

    regionalItems.forEach((item) => {
      const isCampea = regionalCampea && item.rowIndex === regionalCampea.rowIndex;
      const htmlPreco = criarHtmlPreco(item.valor_pela_sns);

      regionalContent += `
        <div class="card-comparacao ${isCampea && htmlPreco ? "destaque-melhor-opcao" : ""} ${
          item.cidade.toLowerCase() === cidadeSelecionada.toLowerCase() ? "destaque-cidade-selecionada" : ""
        }">
            <p class="local-vizinho">${item.nome_da_clinica} - <strong>${item.cidade}</strong></p>
            <p><strong>Médico(a):</strong> ${item.nome_do_medico}</p>
            ${htmlPreco}
        </div>`;
    });
  } else {
    regionalContent = `<p class="nenhum-resultado-comparacao">Nenhum profissional de ${especialidade} com preço cadastrado foi encontrado em cidades vizinhas.</p>`;
  }

  comparacaoContainer.innerHTML = `
    <div class="comparacao-section">
        <div class="comparacao-header">
            <div class="comparacao-header-info">
                <i class="fas fa-tags"></i>
                <div class="comparacao-header-texto">
                    <span>Comparativo em ${cidadeSelecionada}</span>
                    <strong>${especialidade}</strong>
                </div>
            </div>
            <div class="comparacao-header-botoes">
                <button id="btn-copiar-comparativo-cidade" title="Copiar resumo da cidade ${cidadeSelecionada}">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="toggle-section" data-section="cidade">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        </div>
        <div class="comparacao-wrapper-interno cidade-section" style="display: block;">
            ${cityContent}
            ${cityResults.length > comparisonItemsPerPage ? `<div id="city-pagination-container" class="comparison-pagination"></div>` : ""}
        </div>
    </div>
    <div class="comparacao-section">
        <div class="comparacao-header">
            <div class="comparacao-header-info">
                <i class="fas fa-map-marker-alt"></i>
                <div class="comparacao-header-texto">
                    <span>Comparativo na Região</span>
                    <strong>${especialidade}</strong>
                </div>
            </div>
            <div class="comparacao-header-botoes">
                <button id="btn-copiar-comparativo-regiao" title="Copiar resumo da região">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="toggle-section" data-section="regiao">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        <div class="comparacao-wrapper-interno regiao-section" style="display: none;">
            ${regionalContent}
            ${regionalResults.length > comparisonItemsPerPage ? `<div id="regional-pagination-container" class="comparison-pagination"></div>` : ""}
        </div>
    </div>`;

  if (cityResults.length > comparisonItemsPerPage) {
    setupComparisonPagination(
      cityResults.length,
      comparisonCurrentPage,
      comparisonItemsPerPage,
      "city-pagination-container"
    );
  }
  if (regionalResults.length > comparisonItemsPerPage) {
    setupComparisonPagination(
      regionalResults.length,
      comparisonCurrentPage,
      comparisonItemsPerPage,
      "regional-pagination-container"
    );
  }
}

function setupComparisonPagination(totalItems, comparisonCurrentPage, comparisonItemsPerPage, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pageCount = Math.ceil(totalItems / comparisonItemsPerPage);
  container.innerHTML = `
    <button class="comparison-page-btn comparison-btn-prev" ${comparisonCurrentPage === 1 ? "disabled" : ""}>
        <i class="fas fa-chevron-left"></i>
    </button>
    <span class="comparison-page-info">${comparisonCurrentPage} de ${pageCount}</span>
    <button class="comparison-page-btn comparison-btn-next" ${comparisonCurrentPage === pageCount ? "disabled" : ""}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
}

export function renderizarPlaceholderComparacao(mensagem = "Clique em um card para ver a comparação de preços da especialidade em outras cidades.") {
  DOMElements.comparacaoContainer.innerHTML = `
    <div class="info-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
        </svg>
        <p>${mensagem}</p>
    </div>`;
}

export function gerenciarControlesAdmin(logado) {
  const controlesAdmin = document.querySelectorAll(".admin-only");
  const btnLogin = DOMElements.btnLogin;

  if (logado) {
    document.body.classList.add("is-logged-in");
    controlesAdmin.forEach((c) => c.classList.add("is-visible"));
    if (btnLogin) btnLogin.style.display = "none";
  } else {
    document.body.classList.remove("is-logged-in");
    controlesAdmin.forEach((c) => c.classList.remove("is-visible"));
    if (btnLogin) btnLogin.style.display = "flex";
  }
}

export function gerarEcopiarTextoComparativo(
  currentComparisonData,
  dadosCompletos,
  section = "cidade"
) {
  if (!currentComparisonData) return;

  const { especialidade, cidadeSelecionada } = currentComparisonData;
  const cidadeFormatada =
    cidadeSelecionada.charAt(0).toUpperCase() +
    cidadeSelecionada.slice(1).toLowerCase();

  const gerarTexto = (resultadosParaGerar) => {
    // ... (lógica interna da função continua a mesma)
    const grupos = new Map();
    resultadosParaGerar.forEach((p) => {
      const especialidadeBase = (p.especialidade || "Especialidade não informada").trim();
      const observacao = (p.observacao || "").trim();
      let especialidadeCompleta = especialidadeBase.charAt(0).toUpperCase() + especialidadeBase.slice(1).toLowerCase();
      if (observacao !== "") {
        especialidadeCompleta += ` (${observacao.toLowerCase()})`;
      }
      if (!grupos.has(especialidadeCompleta)) {
        grupos.set(especialidadeCompleta, new Map());
      }
      const clinicasDoGrupo = grupos.get(especialidadeCompleta);
      const nomeClinica = (p.nome_da_clinica || "Clínica não informada").trim();
      if (!clinicasDoGrupo.has(nomeClinica)) {
        clinicasDoGrupo.set(nomeClinica, []);
      }
      clinicasDoGrupo.get(nomeClinica).push(p);
    });

    let textoFinal = "";
    let isFirstGroup = true;
    grupos.forEach((clinicas, especialidadeDoGrupo) => {
      if (!isFirstGroup) {
        textoFinal += "\n\n";
      }
      if (section === "cidade") {
        textoFinal += `*${especialidadeDoGrupo} em ${cidadeFormatada}*`;
      } else {
        textoFinal += `*${especialidadeDoGrupo} na Região*`;
      }
      clinicas.forEach((profissionais, nomeClinica) => {
        textoFinal += `\n\n🏥 *${nomeClinica}*`;
        profissionais.forEach((p) => {
          const valorSnsNum = p.valor_pela_sns ? parseFloat(String(p.valor_pela_sns).replace(",", ".")) : null;
          const valorOriginalNum = p.valor_original ? parseFloat(String(p.valor_original).replace(",", ".")) : null;
          const nomeMedico = p.nome_do_medico ? `*${p.nome_do_medico.trim()}*` : "Profissional";
          const cidade = section === "cidade" ? "" : ` (${p.cidade})`;
          let linha = `\n  • ${nomeMedico}${cidade}`;
          if (valorOriginalNum && valorSnsNum && valorOriginalNum > valorSnsNum) {
            const valorSns = valorSnsNum.toFixed(2).replace(".", ",");
            const valorOriginal = valorOriginalNum.toFixed(2).replace(".", ",");
            linha += `: *R$${valorOriginal}* por *R$${valorSns}*`;
          } else if (valorSnsNum) {
            const valorSns = valorSnsNum.toFixed(2).replace(".", ",");
            linha += `: *R$${valorSns}* pela SNS`;
          }
          textoFinal += linha;
        });
      });
      isFirstGroup = false;
    });

    textoFinal += `\n\n---\n_Valores e nomes dos profissionais sujeitos a alteração._`;

    navigator.clipboard
      .writeText(textoFinal.trim())
      .then(() => {
        Toastify({
          text: `Resumo ${section === "cidade" ? "da cidade" : "da região"} copiado!`,
          duration: 3000,
          gravity: "top", position: "right",
          style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
        }).showToast();
      })
      .catch((err) => {
        console.error("Erro ao copiar:", err);
        Toastify({
          text: "Falha ao copiar texto.",
          duration: 3000,
          gravity: "top", position: "right",
          style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" },
        }).showToast();
      });
  };

  if (section === "cidade") {
    const resultados = dadosCompletos.filter((item) => {
      const especialidadeMatch = (item.especialidade || "").trim().toLowerCase() === (especialidade || "").trim().toLowerCase();
      const cidadeMatch = (item.cidade || "").trim().toLowerCase() === (cidadeSelecionada || "").trim().toLowerCase();
      return item.especialidade && item.cidade && especialidadeMatch && cidadeMatch;
    });
    gerarTexto(resultados);
  } else {
    fetchRegionalData(
      cidadeSelecionada,
      dadosCompletos.find(
        (item) => item.cidade?.toLowerCase() === cidadeSelecionada.toLowerCase()
      )?.estado || "",
      especialidade,
      dadosCompletos
    ).then((regionalResults) => {
      gerarTexto(regionalResults);
    });
  }
}

export { ajustarAlturaModalLogin };