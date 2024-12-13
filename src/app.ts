import express from 'express'
import { generateQrIds } from './qrGen'
import { getQrCount, pageSettings, PDFGenerationOptions } from './printGen'
const app = express()
const port = 3000

const PDFGenOptions: PDFGenerationOptions = {
    outputPath: 'output.pdf',
    width: 25,
    height: 30,
    margin: 0,
    guideSize: 2,
    guideColor: '#AAA',
    qrPadding: 3,
    textPadding: 1.5,
    urlPrefix: 'https://api.jackyoung.xyz/'
}

app.get('/', (req, res) => {
    res.send('List sheets')
})

app.get('/n', (req, res) => {
    // Create sheet id
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();

    // Save list of QR codes
    let qrList = generateQrIds(getQrCount(PDFGenOptions));

    // return redirect to /s/:id
    res.send(qrList);
})

app.get('/s/:id', (req, res) => {
    // Get list of QR codes

    // Generate sheet view from list of QR codes

    // return sheet view
    res.send('sheet view')
})

app.get('/:id', (req, res) => {
    // get qr code redirect_url

    // send redirect
    res.send('QR code')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
