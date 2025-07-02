const express = require('express');
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cors = require('cors');
require('dotenv').config();
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const creds = require('./credentials.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// --- VARIÁVEIS PARA O NOSSO CACHE ---
let cacheDeDados = null;
let timestampDoCache = null;
const DURACAO_DO_CACHE_EM_MINUTOS = 0.3; 

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminSenha = process.env.ADMIN_SENHA;
    if (email === adminEmail && senha === adminSenha) {
        res.json({ success: true, message: 'Login realizado com sucesso!' });
    } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }
});

// Rota de LEITURA (GET) com lógica de cache
app.get('/api/dados', async (req, res) => {
    if (cacheDeDados && timestampDoCache) {
        const idadeDoCache = (Date.now() - timestampDoCache) / 1000 / 60;
        if (idadeDoCache < DURACAO_DO_CACHE_EM_MINUTOS) {
            return res.json(cacheDeDados);
        }
    }
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const data = rows.map(row => {
            const rowData = {};
            sheet.headerValues.forEach(header => {
                const cellValue = row.get(header);
                rowData[header] = (typeof cellValue === 'string') ? cellValue.trim() : (cellValue || '');
            });
            rowData.rowIndex = row._rowNumber;
            return rowData;
        });
        
        cacheDeDados = data;
        timestampDoCache = Date.now();

        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Falha ao buscar dados' });
    }
});

app.get('/api/vizinhos/:cidade/:estado', async (req, res) => {
    const { cidade, estado } = req.params;

    if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "Chave da API OpenWeatherMap não configurada no servidor." });
    }

    try {
        // Passo 1: Obter coordenadas da cidade principal
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cidade},${estado},BR&limit=1&appid=${OPENWEATHER_API_KEY}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            throw new Error('Não foi possível encontrar as coordenadas da cidade.');
        }

        const { lat, lon } = geoData[0];

        // Passo 2: Encontrar cidades próximas usando o endpoint 'find'
        const neighborsUrl = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=15&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const neighborsResponse = await fetch(neighborsUrl);
        const neighborsData = await neighborsResponse.json();
        
        // Retorna os dados brutos para o frontend processar
        res.json(neighborsData);

    } catch (error) {
        console.error("Erro no servidor ao buscar cidades vizinhas:", error);
        res.status(500).json({ error: `Falha ao buscar vizinhos: ${error.message}` });
    }
});

// Rota de ESCRITA (POST) com invalidação de cache
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

        // --- INVALIDA O CACHE ---
        cacheDeDados = null;
        timestampDoCache = null;

        res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        res.status(500).json({ error: 'Falha ao cadastrar os dados.' });
    }
});

// Rota de ATUALIZAÇÃO (PUT) com invalidação de cache
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

            // --- INVALIDA O CACHE ---
            cacheDeDados = null;
            timestampDoCache = null;

            res.status(200).json({ message: 'Registro atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Registro não encontrado para edição.' });
        }
    } catch (error) {
        console.error('Erro ao editar:', error);
        res.status(500).json({ error: 'Falha ao editar o registro.' });
    }
});

// Rota de EXCLUSÃO (DELETE) com invalidação de cache
app.delete('/api/excluir/:rowIndex', async (req, res) => {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        const rowIndexToDelete = parseInt(req.params.rowIndex);
        const rowToDelete = rows.find(row => row._rowNumber === rowIndexToDelete);

        if (rowToDelete) {
            await rowToDelete.delete();
            
            // --- INVALIDA O CACHE ---
            cacheDeDados = null;
            timestampDoCache = null;

            res.status(200).json({ message: 'Registro excluído com sucesso!' });
        } else {
            res.status(404).json({ error: `Registro não encontrado para rowIndex: ${rowIndexToDelete}` });
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        res.status(500).json({ error: `Falha ao excluir o registro: ${error.message}` });
    }
});

// Função de autenticação (sem mudanças)
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
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    if (!OPENWEATHER_API_KEY) {
        console.warn("AVISO: Chave da API OpenWeatherMap não encontrada. A busca por cidades vizinhas não funcionará.");
    }
});