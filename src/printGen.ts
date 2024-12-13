import PDFDocument from 'pdfkit';
import qr from 'qrcode';
import { Response } from 'express';

/**
 * Generates a QR image from a URL.
 * @param url - The URL to encode in the QR code.
 * @param data - The QR image data.
 */
function generateQR(url: string): Promise<string> {
    return qr.toDataURL(url, {
        errorCorrectionLevel: 'H',
        margin: 0,
    });
}

// Pages
export interface PageSetting {
    name: string;
    width: number;
    height: number;
}

export let pageSettings: PageSetting[] = [
    {
        name: 'A4',
        width: 210,
        height: 297
    },
    {
        name: 'Letter',
        width: 215.9,
        height: 279.4
    }
]

// Gen options
export interface PDFGenerationOptions {
    filename: string;
    
    // Refactor to set page size objects
    page?: PageSetting;
    width: number;
    height: number;
    margin: number;

    guideSize: number;
    guideColor: string;

    qrPadding: number;
    textPadding: number;

    urlPrefix: string;
}

export function getQrCount(options: PDFGenerationOptions): number {
    if (!options.page)
        options.page = pageSettings[0];

    const boxWidth = options.page!.width - 2*options.margin;
    const boxHeight = options.page!.height - 2*options.margin;

    const rows = Math.floor(boxWidth / options.width);
    const cols = Math.floor(boxHeight / options.height);

    return rows * cols;
}

/**
 * Generates a PDF with a grid of QR codes and IDs.
 * @param options - The options for PDF generation process.
 * @returns A promise that resolves when the PDF generation is complete.
 */
export async function QrIdListToPDF(idList: string[], res: Response, options: PDFGenerationOptions): Promise<void> {
    if (!options.page) {
        options.page = pageSettings[0];
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${options.filename}"`);

    // Create a PDF document
    const doc = new PDFDocument({ size: options.page.name });

    // Pipe output to the specified PDF path
    doc.pipe(res);

    // constants for converting page units to mm
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const pageToMmRatio = pageWidth / options.page.width;

    const width = options.width * pageToMmRatio;
    const height = options.height * pageToMmRatio;

    const boxWidth = options.page.width - 2*options.margin;
    const boxHeight = options.page.height - 2*options.margin;

    const rows = Math.floor(boxWidth / options.width);
    const cols = Math.floor(boxHeight / options.height);

    // Calculate unused space on the page for centering the grid
    const unusedWidth = boxWidth % options.width;
    const unusedHeight = boxHeight % options.height;

    const offX = (options.margin + unusedWidth/2) * pageToMmRatio;
    const offY = (options.margin + unusedHeight/2) * pageToMmRatio;
    
    const guideSize = options.guideSize * pageToMmRatio;

    const qrPadding = options.qrPadding * pageToMmRatio;
    let qrSize = width - 2*qrPadding;

    const textPadding = options.textPadding * pageToMmRatio;
    const fontSize = height - width + qrPadding - 2*textPadding;

    try {

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = offX + width * j;
                const y = offY + height * i;

                // Cutting guide corners
                doc.stroke(options.guideColor).lineWidth(0.5);
                doc.moveTo(x, y + guideSize) // Top left
                    .lineTo(x, y)
                    .lineTo(x + guideSize, y)

                    .moveTo(x + width - guideSize, y) // Top right
                    .lineTo(x + width, y)
                    .lineTo(x + width, y + guideSize)

                    .moveTo(x + width, y + height - guideSize) // Bottom right
                    .lineTo(x + width, y + height)
                    .lineTo(x + width - guideSize, y + height)

                    .moveTo(x + guideSize, y + height) // Bottom left
                    .lineTo(x, y + height)
                    .lineTo(x, y + height - guideSize)
                    .stroke('#AAA').lineWidth(0.5);

                let id = idList.pop()!;

                // Add QR code image
                const qrURI = await generateQR(options.urlPrefix + id);
                doc.image(qrURI, x + qrPadding, y + qrPadding, { width: qrSize, height: qrSize });
                // doc.rect(x + qrPadding, y + qrPadding, qrSize, qrSize).stroke();

                // Add ID text
                doc.font('./CourierPrime-Regular.ttf')
                    .fontSize(fontSize)
                    .fillColor('black')
                    .text(id, x, y + qrPadding + qrSize + textPadding, {
                        width: width,
                        height: height - width + qrPadding,
                        align: 'center',
                    });
            }
        }

        // Finalize the PDF
        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err);
        throw err;
    }
}
