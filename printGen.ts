import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Generates a QR code from a given URL and saves it as an image file.
 * @param url - The URL to encode in the QR code.
 * @param outputPath - The path where the QR code image will be saved.
 * @returns A promise that resolves to the path of the generated QR code image.
 */
export async function generateQR(id: string, outputPath: string): Promise<string> {






    // // Placeholder: Replace this with actual QR code generation logic
    // const svg: string = fs.readFileSync('./tool-qr.svg', 'utf8');
    // const buffer: Buffer = Buffer.from(svg);

    // try {
    //     await sharp(buffer)
    //         .resize(1000, 1000)
    //         .png()
    //         .toFile(outputPath);

    //     return outputPath;
    // } catch (err) {
    //     console.error('Error generating QR code:', err);
    //     throw err;
    // }
}

/**
 * Generates a PDF with a grid of QR codes and IDs.
 * @param outputPDFPath - The path where the PDF will be saved.
 * @returns A promise that resolves when the PDF generation is complete.
 */
export async function generatePDFWithQR(outputPDFPath: string): Promise<void> {
    // Create a PDF document
    const doc = new PDFDocument({ size: 'A4' });

    // Pipe output to the specified PDF path
    doc.pipe(fs.createWriteStream(outputPDFPath));

    // constants for converting page units to mm
    const widthMM = 210.0;
    const heightMM = 297.0;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const pageToMmRatio = pageWidth / widthMM;

    const sizeMM = 30.0;
    const marginMM = 0;
    const adjustedHeightMM = heightMM - marginMM * 2;
    const adjustedWidthMM = widthMM - marginMM * 2;

    const size = sizeMM * pageToMmRatio;
    const offX = pageToMmRatio * (marginMM + (adjustedWidthMM % sizeMM) / 2);
    const offY = pageToMmRatio * (marginMM + (adjustedHeightMM % sizeMM) / 2);
    const cornerRefSizeMM = 2;
    const cornerRefSize = cornerRefSizeMM * pageToMmRatio;

    try {
        // Generate QR code
        await generateQR(qrURL);

        const rows = Math.floor(adjustedHeightMM / sizeMM);
        const cols = Math.floor(adjustedWidthMM / sizeMM);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = offX + size * j;
                const y = offY + size * i;

                // Draw reference corners
                doc.stroke('#AAA').lineWidth(0.5);
                doc.moveTo(x, y + cornerRefSize) // Top left
                    .lineTo(x, y)
                    .lineTo(x + cornerRefSize, y)

                    .moveTo(x + size - cornerRefSize, y) // Top right
                    .lineTo(x + size, y)
                    .lineTo(x + size, y + cornerRefSize)

                    .moveTo(x + size, y + size - cornerRefSize) // Bottom right
                    .lineTo(x + size, y + size)
                    .lineTo(x + size - cornerRefSize, y + size)

                    .moveTo(x + cornerRefSize, y + size) // Bottom left
                    .lineTo(x, y + size)
                    .lineTo(x, y + size - cornerRefSize)
                    .stroke('#AAA').lineWidth(0.5);

                const id = Math.random().toString(36).substr(2, 8).toUpperCase();

                // Add QR code image
                doc.image(qrImagePath, x + size * 0.15, y + size * 0.15, { width: size * 0.7 });

                // Add ID text
                doc.font('./CourierPrime-Regular.ttf')
                    .fontSize(size * 0.13)
                    .fillColor('black')
                    .text(id, x, y + size * 0.85, {
                        width: size,
                        height: size * 0.15,
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
