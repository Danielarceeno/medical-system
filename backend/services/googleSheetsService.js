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
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

exports.getClinicas = async () => {
  const auth = await getAuthClient();
  const sheets = await getGoogleSheet(auth);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:Z`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(h => h.toLowerCase().replace(/ /g, '_'));
  return rows.slice(1).map((row, index) => {
    let obj = { rowIndex: index + 2 };
    headers.forEach((header, i) => {
      obj[header] = row[i] || null;
    });
    return obj;
  });
};