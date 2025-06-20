const express = require('express');
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const creds = require('./credentials.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/api/dados', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        const data = rows.map(row => {
            const rowData = {};
            sheet.headerValues.forEach(header => {
                rowData[header] = row.get(header);
            });
            rowData.rowIndex = row._rowNumber;
            return rowData;
        });
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Falha ao buscar dados' });
    }
});

app.post('/api/cadastrar', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const newRow = req.body;
        await sheet.addRow({
            nome_da_clinica: newRow.nomeClinica,
            nome_do_medico: newRow.nomeMedico,
            cidade: newRow.cidade,
            estado: newRow.estado,
            valor_pela_sns: newRow.valorSns,
            valor_original: newRow.valorOriginal,
            especialidade: newRow.especialidade,
            atualizado: newRow.atualizado
        });
        res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.status(500).json({ error: 'Falha ao cadastrar os dados.' });
    }
});

app.put('/api/editar/:rowIndex', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        const rowIndexToEdit = parseInt(req.params.rowIndex);
        const updatedData = req.body;
        const rowToEdit = rows.find(row => row._rowNumber === rowIndexToEdit);

        if (rowToEdit) {
            rowToEdit.set('nome_da_clinica', updatedData.nomeClinica);
            rowToEdit.set('nome_do_medico', updatedData.nomeMedico);
            rowToEdit.set('especialidade', updatedData.especialidade);
            rowToEdit.set('cidade', updatedData.cidade);
            rowToEdit.set('estado', updatedData.estado);
            rowToEdit.set('valor_pela_sns', updatedData.valorSns);
            rowToEdit.set('valor_original', updatedData.valorOriginal);
            rowToEdit.set('atualizado', updatedData.atualizado);
            await rowToEdit.save();
            res.status(200).json({ message: 'Registro atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Registro não encontrado para edição.' });
        }
    } catch (error) {
        console.error('Erro ao editar:', error);
        res.status(500).json({ error: 'Falha ao editar o registro.' });
    }
});

app.delete('/api/excluir/:rowIndex', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        const rowIndexToDelete = parseInt(req.params.rowIndex);
        const rowToDelete = rows.find(row => row._rowNumber === rowIndexToDelete);

        if (rowToDelete) {
            await rowToDelete.delete();
            res.status(200).json({ message: 'Registro excluído com sucesso!' });
        } else {
            res.status(404).json({ error: `Registro não encontrado para rowIndex: ${rowIndexToDelete}` });
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        res.status(500).json({ error: `Falha ao excluir o registro: ${error.message}` });
    }
});

// Função de autenticação
async function getDoc() {
    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});