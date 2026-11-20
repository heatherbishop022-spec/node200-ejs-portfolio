// Sends each contact form submission to a Google Sheet as a new row.
//
// This uses a Google "service account" instead of the handout's copy-the-code
// OAuth flow. A service account works on Render with no terminal prompt.
//
// Setup (see README.md):
//   SHEET_ID            - the long ID in your sheet's URL
//   GOOGLE_CREDENTIALS  - the full contents of your service account JSON key
//                         (or put that file in this folder as credentials.json)

const fs = require('fs');
const path = require('path');

function loadCredentials() {
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  const file = path.join(__dirname, 'credentials.json');
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return null;
}

async function saveContact(contact) {
  const credentials = loadCredentials();
  const spreadsheetId = process.env.SHEET_ID;

  if (!credentials || !spreadsheetId) {
    console.warn('Google Sheets is not set up yet (missing SHEET_ID or credentials). Contact not saved:', contact);
    return;
  }

  const { google } = require('googleapis');

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // append adds the row under the last filled row, so we don't need to count rows first
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:E',
    // RAW stores text exactly as typed, so a message starting with "=" isn't run as a formula
    valueInputOption: 'RAW',
    requestBody: {
      values: [[contact.firstName, contact.lastName, contact.email, contact.message, new Date().toISOString()]],
    },
  });
}

module.exports = { saveContact };
