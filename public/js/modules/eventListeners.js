import * as DOMElements from "./domElements.js";
import * as UI from "./ui.js";
import * as API from "./api.js";

export function setupEventListeners(appState, methods) {
  const {
    filtroNome,
    filtroEspecialidade,
    filtroCidade,
    filtroValorMin,
    filtroValorMax,
    seletorOrdenacao,
    resultadosContainer,
    paginationContainer,
    comparacaoContainer,
    btnLimpar,
    modalCadastro,
    fecharModal,
    formCadastro,
    btnLogin,
    modalLogin,
    fecharModalLogin,
    formLogin,
    btnCadastrar,
  } = DOMElements;

  const filtros = [
    filtroNome,
    filtroEspecialidade,
    filtroCidade,
    filtroValorMin,
    filtroValorMax,
    seletorOrdenacao,
  ];
  filtros.forEach((filtro) => {
    filtro.addEventListener("input", () => methods.aplicarFiltrosErenderizar());
  });
  seletorOrdenacao.addEventListener("change", () =>
    methods.aplicarFiltrosErenderizar()
  );

  btnLimpar.addEventListener("click", () => {
    DOMElements.comparacaoContainer.classList.remove("visivel");
    filtroNome.value = "";
    filtroEspecialidade.value = "";
    filtroCidade.value = "";
    filtroValorMin.value = "";
    filtroValorMax.value = "";
    seletorOrdenacao.value = "padrao";
    methods.aplicarFiltrosErenderizar();
  });

  if (btnLogin) {
    btnLogin.addEventListener("click", UI.toggleLoginModal);
  }
  if (fecharModalLogin) {
    fecharModalLogin.addEventListener("click", UI.toggleLoginModal);
  }
  if (modalLogin) {
    modalLogin.addEventListener("click", (event) => {
      if (event.target === modalLogin) UI.toggleLoginModal();
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("login-email").value;
      const senha = document.getElementById("login-senha").value;

      try {
        await API.fazerLogin(email, senha);
        sessionStorage.setItem("isLoggedIn", "true");
        UI.gerenciarControlesAdmin(true);
        UI.toggleLoginModal();
        Toastify({
          text: "Login bem-sucedido!",
          duration: 3000,
          gravity: "top",
          position: "right",
          style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
        }).showToast();
      } catch (error) {
        Toastify({
          text: error.message,
          duration: 4000,
          gravity: "top",
          position: "right",
          style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" },
        }).showToast();
      }
    });
  }

  if (btnCadastrar) {
    btnCadastrar.addEventListener("click", UI.prepararModalParaCadastro);
  }
  if (fecharModal) {
    fecharModal.addEventListener("click", UI.toggleModal);
  }
  if (modalCadastro) {
    modalCadastro.addEventListener("click", (event) => {
      if (event.target === modalCadastro) UI.toggleModal();
    });
  }

  if (formCadastro) {
    formCadastro.addEventListener("submit", async (event) => {
      event.preventDefault();
      const dadosDoForm = {
        nomeClinica: document.getElementById("cad-nome-clinica").value,
        nomeMedico: document.getElementById("cad-nome-medico").value,
        especialidade: document.getElementById("cad-especialidade").value,
        cidade: document.getElementById("cad-cidade").value,
        estado: document.getElementById("cad-estado").value,
        valorSns: document.getElementById("cad-valor-sns").value,
        valorOriginal: document.getElementById("cad-valor-original").value,
        atualizado: document.getElementById("cad-atualizado").value,
      };

      await API.salvarDados(dadosDoForm, DOMElements.campoHiddenEdit.value);
      Toastify({
        text: "Operação realizada com sucesso!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
      }).showToast();
      UI.toggleModal();
      methods.refreshData();
    });
  }

  resultadosContainer.addEventListener("click", async (event) => {
    const card = event.target.closest(".card");
    if (!card) return;

    const targetButton = event.target.closest("button");
    if (targetButton && sessionStorage.getItem("isLoggedIn") === "true") {
      const rowIndex = card.dataset.rowIndex;
      const itemData = appState.dadosCompletos.find(
        (item) => item.rowIndex == rowIndex
      );
      if (!itemData) return;

      if (targetButton.classList.contains("btn-editar")) {
        UI.prepararModalParaEdicao(itemData);
      } else if (targetButton.classList.contains("btn-excluir")) {
        if (confirm("Tem certeza que deseja excluir este registro?")) {
          await API.excluirRegistro(rowIndex);
          Toastify({
            text: "Registro excluído com sucesso!",
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
          }).showToast();
          methods.refreshData();
        }
      }
    } else {
      document
        .querySelectorAll(".card.selecionado")
        .forEach((c) => c.classList.remove("selecionado"));
      card.classList.add("selecionado");
      comparacaoContainer.classList.add("visivel");

      const especialidade = card.dataset.especialidade?.trim();
      const cidadeSelecionada = card.dataset.cidade?.trim();

      if (especialidade && cidadeSelecionada) {
        appState.comparisonCurrentPage = 1;
        appState.currentComparisonData = { especialidade, cidadeSelecionada };
        await UI.renderizarComparacao(
          appState.dadosCompletos,
          especialidade,
          cidadeSelecionada,
          appState.comparisonCurrentPage,
          appState.comparisonItemsPerPage
        );
      } else {
        UI.renderizarPlaceholderComparacao(
          "Card sem especialidade ou cidade para poder comparar."
        );
      }

      if (window.innerWidth <= 900) {
        comparacaoContainer.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  });

  paginationContainer.addEventListener("click", (event) => {
    const pageBtn = event.target.closest(".page-btn");
    if (pageBtn && !pageBtn.disabled) {
      appState.currentPage = parseInt(pageBtn.dataset.page);
      UI.renderizarPagina(
        appState.dadosFiltrados,
        appState.currentPage,
        appState.itemsPerPage
      );
    }
  });

  comparacaoContainer.addEventListener("click", async (event) => {
    const copyCidadeBtn = event.target.closest(
      "#btn-copiar-comparativo-cidade"
    );
    const copyRegiaoBtn = event.target.closest(
      "#btn-copiar-comparativo-regiao"
    );
    if (copyCidadeBtn) {
      event.stopPropagation();
      UI.gerarEcopiarTextoComparativo(
        appState.currentComparisonData,
        appState.dadosCompletos,
        "cidade"
      );
      return;
    }
    if (copyRegiaoBtn) {
      event.stopPropagation();
      UI.gerarEcopiarTextoComparativo(
        appState.currentComparisonData,
        appState.dadosCompletos,
        "regiao"
      );
      return;
    }

    const toggleBtn = event.target.closest(".toggle-section");
    if (toggleBtn) {
      event.stopPropagation();
      const section = toggleBtn.dataset.section;
      const sectionContent = comparacaoContainer.querySelector(
        `.${section}-section`
      );
      const icon = toggleBtn.querySelector("i");
      if (sectionContent.style.display === "none") {
        sectionContent.style.display = "block";
        icon.classList.remove("fa-chevron-right");
        icon.classList.add("fa-chevron-down");
      } else {
        sectionContent.style.display = "none";
        icon.classList.remove("fa-chevron-down");
        icon.classList.add("fa-chevron-right");
      }
      return;
    }

    const pageBtn = event.target.closest(".comparison-page-btn");
    if (pageBtn && !pageBtn.disabled) {
      event.stopPropagation();
      const containerId = pageBtn.closest(".comparacao-wrapper-interno").id;
      const isCity = containerId === "city-pagination-container";
      if (pageBtn.classList.contains("comparison-btn-prev")) {
        appState.comparisonCurrentPage--;
      } else if (pageBtn.classList.contains("comparison-btn-next")) {
        appState.comparisonCurrentPage++;
      }
      if (appState.currentComparisonData) {
        const { especialidade, cidadeSelecionada } =
          appState.currentComparisonData;
        await UI.renderizarComparacao(
          appState.dadosCompletos,
          especialidade,
          cidadeSelecionada,
          appState.comparisonCurrentPage,
          appState.comparisonItemsPerPage
        );
      }
    }
  });

  document.addEventListener("click", (event) => {
    const isClickInsideResults = event.target.closest(".resultados-wrapper");
    const isClickInsideComparison = event.target.closest(
      "#comparacao-vizinhos-container"
    );
    if (!isClickInsideResults && !isClickInsideComparison) {
      comparacaoContainer.classList.remove("visivel");
      const selectedCard = document.querySelector(".card.selecionado");
      if (selectedCard) {
        selectedCard.classList.remove("selecionado");
      }
    }
  });

  const { btnLogout } = DOMElements;
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      sessionStorage.removeItem("isLoggedIn");
      UI.gerenciarControlesAdmin(false);
      Toastify({
        text: "Você saiu com sucesso!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
      }).showToast();
    });
  }
}
