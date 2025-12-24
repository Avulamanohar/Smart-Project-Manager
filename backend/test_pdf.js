async function testPdf() {
    try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        // Create a minimal valid PDF buffer (empty page)
        // This is a minimal PDF 1.7 header + body
        const minimalPdf = Buffer.from(
            "%PDF-1.7\n" +
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>\nendobj\n" +
            "xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n" +
            "trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n223\n%%EOF"
        );

        console.log("Loading PDF...");
        const uint8Array = new Uint8Array(minimalPdf);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useSystemFonts: true,
            disableFontFace: true
        });

        const doc = await loadingTask.promise;
        console.log(`PDF Loaded. Pages: ${doc.numPages}`);

        const page = await doc.getPage(1);
        const content = await page.getTextContent();
        console.log("Text content extracted:", content.items.map(i => i.str).join(" "));

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testPdf();
