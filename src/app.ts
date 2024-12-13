import express from 'express'
import bodyParser from 'body-parser'
import { generateQrIds } from './qrGen'
import { getQrCount, PDFGenerationOptions, QrIdListToPDF } from './printGen'
import { QRDatabase, SheetsDatabase } from './dbWrapper'

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000

// Ensure db dir exists
const fs = require('fs');
const dir = './db';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const qrDB = new QRDatabase();
const sheetsDB = new SheetsDatabase();

const PDFGenOptions: PDFGenerationOptions = {
    filename: 'output.pdf',
    width: 25,
    height: 30,
    margin: 0,
    guideSize: 2,
    guideColor: '#AAA',
    qrPadding: 3,
    textPadding: 1.5,
    urlPrefix: 'https://api.jackyoung.xyz/'
};

// passwrd from env QR_PASSWORD
const password = process.env.QR_PASSWORD;

app.get('/', (req, res) => {
    res.send('List sheets')
});

app.get('/n', (req, res) => {
    // Create sheet id
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();

    // Save list of QR codes
    let qrList = generateQrIds(getQrCount(PDFGenOptions));

    // add (TODO: and check) qrs to db
    qrDB.addMultipleQRs(qrList);

    sheetsDB.addSheet(id, qrList);

    // return redirect to {root}/s/:id
    res.redirect(`/s/${id}`);
});

app.get('/s/:id', (req, res) => {
    // Get list of QR codes
    let sheet = sheetsDB.getSheet(req.params.id);

    if (!sheet) {
        res.send('Sheet not found');
        return;
    }

    PDFGenOptions.filename = `HomelabQR-${req.params.id}.pdf`;

    // Generate sheet view from list of QR codes
    QrIdListToPDF(sheet.qr_ids, res, PDFGenOptions);
});

app.get('/:id', (req, res) => {
    // get qr code redirect_url
    let qr = qrDB.getQR(req.params.id);

    if (!qr) {
        res.send('QR code not found');
        return;
    }

    if (!(qr.redirect_url)) {
        res.redirect(`/e/${req.params.id}`);
        return;
    }

    // redirect to url (outside of domain)
    res.redirect(qr.redirect_url);
});

app.post('/e/:id', (req, res) => {
    // get form result, example: redirect-url=https%3A%2F%2Fwww.google.com%2F
    if (!req.body['redirect-url']) {
        res.send('No redirect URL provided');
        return;
    }

    if (!req.body['password'] || req.body['password'] !== password) {
        res.send('No password provided');
        return;
    }

    let redirectUrl = req.body['redirect-url'];

    // save redirect url to db
    qrDB.updateQRRedirect(req.params.id, redirectUrl);
    
    // Return simple qr update success page
    res.send(`Redirect URL set to ${redirectUrl}`);
});

app.get('/e/:id', (req, res) => {
    // Send blank page with popup to set redirect url with POST request
    
    res.send(`
        <html>
            <head>
                <title>Set Redirect URL</title>
            </head>
            <body>
                <form method="POST" action="/e/${req.params.id}">
                    <label for="redirect-url">Redirect URL:</label>
                    <input type="text" id="redirect-url" name="redirect-url">
                    <br>
                    <input type="text" id="password" name="password">
                    <button type="submit">Set</button>
                </form>
            </body>
        </html>
    `);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
