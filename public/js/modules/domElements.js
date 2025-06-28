// Exporta todas as constantes de elementos do DOM para serem usadas em outros módulos.

export const filtroNome = document.getElementById('nome');
export const filtroEspecialidade = document.getElementById('especialidade');
export const filtroCidade = document.getElementById('cidade');
export const filtroValorMin = document.getElementById('valor-min');
export const filtroValorMax = document.getElementById('valor-max');
export const seletorOrdenacao = document.getElementById('ordenar');
export const btnLimpar = document.querySelector('.btn-limpar');
export const btnCadastrar = document.querySelector('.btn-cadastrar');

export const resultadosContainer = document.getElementById('resultados-container');
export const paginationContainer = document.getElementById('pagination-container');
export const comparacaoContainer = document.getElementById('comparacao-vizinhos-container');

export const modalCadastro = document.getElementById('modal-cadastro');
export const fecharModal = document.querySelector('.fechar-modal');
export const formCadastro = document.getElementById('form-cadastro');
export const modalTitulo = document.querySelector('#modal-cadastro h2');
export const modalBotaoSubmit = document.querySelector('#modal-cadastro .botao-form-submit');
export const campoHiddenEdit = document.getElementById('edit-row-index');