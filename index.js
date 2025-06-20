// Importar os pacotes necessários
const express = require('express');
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

// Configurações
const PORT = process.env.PORT || 3000;
const creds = require('./credentials.json'); // O arquivo JSON que você baixou
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Inicializar o servidor Express
const app = express();
app.use(express.static('public')); // Servir arquivos estáticos da pasta 'public'
app.use(express.json());

// Função para autenticar e carregar a planilha
async function getDoc() {
    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key.replace(/\\n/g, '\n'), // Formatação da chave
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); // Carrega as propriedades da planilha
    return doc;
}

// Rota da API para buscar os dados
app.get('/api/dados', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0]; // Pega a primeira aba da planilha
        const rows = await sheet.getRows(); // Pega todas as linhas

        // Mapeia as linhas para um formato JSON mais limpo
        const data = rows.map(row => {
            const rowData = {};
            // Pega os cabeçalhos da planilha como chaves do objeto
            sheet.headerValues.forEach(header => {
                rowData[header] = row.get(header);
            });
            rowData.rowIndex = row.rowIndex;
            return rowData;
        });

        // Filtros
        const { regiao, nomeMedico, valorMax } = req.query;
        if (regiao) data = data.filter(d => d.regiao && d.regiao.toLowerCase().includes(regiao.toLowerCase()));
        if (nomeMedico) data = data.filter(d => d.nomeMedico && d.nomeMedico.toLowerCase().includes(nomeMedico.toLowerCase()));
        if (valorMax) data = data.filter(d => Number(d.valorConsulta) <= Number(valorMax));

        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar dados da planilha:', error);
        res.status(500).json({ error: 'Falha ao buscar dados' });
    }
});
app.post('/api/cadastrar', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];

        // req.body contém os dados enviados pelo formulário no frontend
        const newRow = req.body; 

        // Adiciona a nova linha na planilha
        // As chaves do objeto (ex: 'nome_da_clinica') devem ser IDÊNTICAS aos cabeçalhos da sua planilha
        await sheet.addRow({
            nome_da_clinica: newRow.nomeClinica,
            nome_do_medico: newRow.nomeMedico,
            cidade: newRow.cidade,
            estado: newRow.estado,
            valor_pela_sns: newRow.valorSns,
            valor_original: newRow.valorOriginal,
            especialidade: newRow.especialidade
        });

        res.status(201).json({ message: 'Cadastro realizado com sucesso!' });

    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.status(500).json({ error: 'Falha ao cadastrar os dados.' });
    }
});
app.delete('/api/excluir/:rowIndex', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        
        const rowIndexToDelete = req.params.rowIndex;

        // --- LINHA MODIFICADA ---
        // Converte o índice da URL para número e usa a comparação estrita (===)
        const rowToDelete = rows.find(row => row.rowIndex === parseInt(rowIndexToDelete));

        if (rowToDelete) {
            await rowToDelete.delete();
            res.status(200).json({ message: 'Registro excluído com sucesso!' });
        } else {
            // Este bloco não será mais acionado pelo motivo de tipo
            res.status(404).json({ error: 'Registro não encontrado.' });
        }

    } catch (error) {
        console.error('Erro ao excluir:', error);
        res.status(500).json({ error: 'Falha ao excluir o registro.' });
    }
});
// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});