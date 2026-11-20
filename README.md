# Personal Portfolio

A portfolio site built with Express and EJS: a home page, a portfolio page, and a contact form that saves each submission to a Google Sheet and thanks the person by name.

## Run it locally

```
npm install express morgan ejs googleapis
npm install --save-dev mocha supertest
npm start
```

Open http://localhost:3000.

## Run the tests

```
npm test
```

The tests use a fake in place of Google Sheets, so they pass without any Google setup. CircleCI runs the same tests on every push (`.circleci/config.yml`).

## Make it yours

- `data/profile.js` - your name, tagline, and GitHub link
- `data/projects.js` - your projects; the home page shows the first three
- `public/styles.css` - colors and fonts (the color variables are at the top)

## Google Sheets setup

This uses a Google service account, which works on Render without the copy-the-code login step.

1. In Google Cloud Console, create a project and enable the **Google Sheets API**.
2. Go to **IAM & Admin > Service Accounts**, create a service account, then open it and choose **Keys > Add key > JSON**. A JSON file downloads.
3. Create a Google Sheet. Put `First Name`, `Last Name`, `Email`, `Message`, `Submitted` in row 1.
4. Click **Share** on the sheet and share it with the service account's email (it ends in `iam.gserviceaccount.com`) as an **Editor**.
5. Copy the sheet ID from its URL: the long part between `/d/` and `/edit`.

Locally: rename the downloaded key to `credentials.json`, put it in this folder (it's in `.gitignore`, so it won't be pushed), and start the server with the sheet ID:

```
set SHEET_ID=your-sheet-id
npm start
```

On Render, add two environment variables instead: `SHEET_ID`, and `GOOGLE_CREDENTIALS` with the entire contents of the JSON key pasted in.

If either is missing, the form still works but logs a warning instead of saving.
