const express = require("express");
const router = express.Router();
const sheetsService = require("../services/googleSheetsService");
const { verifyToken } = require("../middleware/authMiddleware");
const axios = require("axios");

const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_NAME = "Página1";

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  });
  return auth.getClient();
}
async function getGoogleSheet(auth) {
  return google.sheets({ version: "v4", auth });
}

router.get("/dados", async (req, res) => {
  try {
    const data = await sheetsService.getClinicas();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Falha ao buscar dados da Google Sheet." });
  }
});

router.get("/vizinhos/:cidade/:estado", async (req, res) => {
    const { cidade, estado } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    try {
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cidade)},${encodeURIComponent(estado)},BR&limit=1&appid=${apiKey}`;
        const geoResponse = await axios.get(geoUrl);

        if (geoResponse.data.length === 0) {
            return res.status(404).json({ error: "Cidade não encontrada." });
        }

        const { lat, lon } = geoResponse.data[0];
        const findUrl = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=15&units=metric&lang=pt_br&appid=${apiKey}`;
        const findResponse = await axios.get(findUrl);
        res.json(findResponse.data);

    } catch (error) {
        console.error("Erro ao buscar cidades vizinhas:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Falha ao buscar dados de cidades vizinhas." });
    }
});

router.post("/cadastrar", verifyToken, async (req, res) => {
    try {
        const auth = await getAuthClient();
        const sheets = await getGoogleSheet(auth);
        const { nomeClinica, nomeMedico, especialidade, cidade, estado, valorSns, valorOriginal, atualizado, observacao } = req.body;
        const newRow = [nomeClinica, nomeMedico, especialidade, observacao, cidade, estado, valorSns, valorOriginal, atualizado];
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${SHEET_NAME}!A:I`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [newRow],
            },
        });
        res.status(201).json({ message: "Registro criado com sucesso." });
    } catch (error) {
        console.error("Error creating record:", error);
        res.status(500).json({ error: "Falha ao criar registro." });
    }
});

router.put("/editar/:rowIndex", verifyToken, async (req, res) => {
    try {
        const auth = await getAuthClient();
        const sheets = await getGoogleSheet(auth);
        const { rowIndex } = req.params;
        const { nomeClinica, nomeMedico, especialidade, cidade, estado, valorSns, valorOriginal, atualizado, observacao } = req.body;
        const updatedRow = [nomeClinica, nomeMedico, especialidade, observacao, cidade, estado, valorSns, valorOriginal, atualizado];

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `${SHEET_NAME}!A${rowIndex}:I${rowIndex}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [updatedRow],
            },
        });
        res.status(200).json({ message: "Record updated successfully." });
    } catch (error) {
        console.error("Error updating record:", error);
        res.status(500).json({ error: "Failed to update record." });
    }
});

router.delete("/excluir/:rowIndex", verifyToken, async (req, res) => {
    try {
        const auth = await getAuthClient();
        const sheets = await getGoogleSheet(auth);
        const { rowIndex } = req.params;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0,
                            dimension: "ROWS",
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex,
                        },
                    },
                }],
            },
        });
        res.status(200).json({ message: "Registro excluído com sucesso." });
    } catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({ error: "Falha ao excluir registro." });
    }
});

module.exports = router;