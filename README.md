# Busca Clínicas – Aplicação Web Full Stack

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/pt-br/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Google Sheets API](https://img.shields.io/badge/Google%20Sheets-API-brightgreen.svg)](https://developers.google.com/sheets/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)

## 📦 Visão Geral

**Busca Clínicas** é uma aplicação web full stack que transforma uma simples planilha do Google Sheets em um banco de dados interativo e gerenciável. O sistema fornece uma interface de usuário moderna para filtrar e visualizar registros de clínicas, além de uma área administrativa protegida para gerenciar esses dados (cadastrar, editar e excluir) em tempo real.

O projeto demonstra um fluxo de dados completo, com uma arquitetura modular e segura, desde a interação do usuário no frontend até a manipulação dos dados na planilha através de uma API própria construída em Node.js.

## ✨ Funcionalidades Principais

#### 🔐 Sistema de Autenticação e Controle de Acesso
- **Tela de Login:** Acesso restrito para administradores.
- **Verificação Segura no Backend:** As credenciais são validadas no servidor, sem expor informações sensíveis no frontend.
- **UI Condicional:** Os botões de **Cadastrar, Editar e Excluir** só são visíveis e funcionais para usuários autenticados.
- **Gerenciamento de Sessão:** O estado de login persiste durante a sessão do navegador, e uma função de **Logout** está disponível.

#### ⚡ Gerenciamento de Dados (Protegido por Login)
- **Cadastro** de novos profissionais através de um formulário em modal.
- **Edição** de registros existentes, com o formulário pré-preenchido.
- **Exclusão** de registros, com janela de confirmação.

#### 🔍 Interface de Busca Dinâmica
- Filtragem em tempo real por nome, especialidade e cidade.
- Filtro por faixa de preço (valor mínimo e máximo).
- Ordenação dos resultados por preço ou nome.

#### 🎨 Experiência do Usuário (UX)
- **Paginação** para lidar com grandes volumes de dados de forma eficiente.
- **Design Responsivo** que se adapta a desktops, tablets e celulares, com layout otimizado para cada dispositivo.
- **Feedback Visual Aprimorado** com notificações "toast" para ações de sucesso ou erro.
- **Painel Comparativo** para visualizar as melhores opções de preço por região.

## 🚀 Tecnologias Utilizadas

- **Backend:**
  - **Node.js**: Ambiente de execução JavaScript.
  - **Express.js**: Framework para a construção da API RESTful.
  - **google-spreadsheet**: Biblioteca para interagir com a API do Google Sheets.
  - **dotenv**: Para gerenciar variáveis de ambiente de forma segura.

- **Frontend:**
  - **HTML5**: Estrutura semântica da página.
  - **CSS3**: Estilização e responsividade (Flexbox, Grid, Media Queries) com arquitetura modular.
  - **JavaScript (Vanilla, ES6+)**: Manipulação do DOM, interatividade e estrutura modular com ES Modules.
  - **Toastify.js**: Biblioteca para as notificações.

- **"Banco de Dados":**
  - **Google Sheets**: Utilizado como um banco de dados simples e de fácil edição manual.

## 🔧 Como Executar o Projeto

Siga os passos abaixo para configurar e rodar o projeto em sua máquina local.

#### **Pré-requisitos**
- Node.js (v18 ou superior)
- npm
- Git

#### **Instalação e Configuração**

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
    ```
2.  **Navegue para a pasta do projeto:**
    ```bash
    cd seu-repositorio
    ```
3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Configure a Planilha Google Sheets:**
    - Crie uma nova planilha e certifique-se de que a primeira linha (cabeçalho) contenha exatamente as seguintes colunas: `nome_da_clinica`, `nome_do_medico`, `cidade`, `estado`, `valor_original`, `valor_pela`, `especialidade`, `atualizado`.
5.  **Configure a API do Google:**
    - Crie um projeto no Google Cloud Console, ative a **Google Sheets API** e crie uma **Conta de Serviço (Service Account)**.
    - Faça o download da chave JSON de credenciais.
6.  **Crie os arquivos de ambiente:**
    - Coloque a chave baixada na raiz do projeto e renomeie-a para `credentials.json`.
    - Crie um arquivo `.env` na raiz e adicione as seguintes variáveis:
      ```
      GOOGLE_SHEET_ID=SEU_ID_DA_PLANILHA_AQUI
      ADMIN_EMAIL=seu-email@admin.com
      ADMIN_SENHA=sua-senha-aqui
      ```
7.  **Compartilhe a Planilha:**
    - Compartilhe sua planilha com o e-mail da Conta de Serviço (`client_email` dentro do `credentials.json`) e conceda permissão de **Editor**.
8.  **Inicie o servidor:**
    ```bash
    node index.js
    ```
9.  Acesse `http://localhost:3000` no seu navegador.

## 🗺️ Roadmap de Melhorias

Funcionalidades futuras planejadas para evoluir o projeto:

- **Segurança Aprimorada:**
    - **Hashing de Senhas**: Implementar `bcrypt` no backend para armazenar o hash da senha de admin, em vez de texto puro.
    - **Autenticação com JWT**: Substituir o `sessionStorage` por JSON Web Tokens para um padrão de mercado mais robusto e seguro.
- **Banco de Dados Real**: Migrar do Google Sheets para um banco de dados como **PostgreSQL** ou **MongoDB** para maior performance e escalabilidade.
- **Geolocalização e Mapas**: Implementar um mapa (com Leaflet.js) para visualizar a localização das clínicas.
- **Testes Automatizados**: Adicionar testes unitários e de integração (com Jest) para garantir a estabilidade do código.

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais informações.
