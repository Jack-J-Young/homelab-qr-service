import { generatePDFWithQR } from './printGen';

(async () => {
    try {
        const outputPDFPath = 'output.pdf';
        const qrURL = 'https://example.com';
        await generatePDFWithQR(outputPDFPath, qrURL);
        console.log('PDF generated successfully!');
    } catch (err) {
        console.error('Failed to generate PDF:', err);
    }
})();
