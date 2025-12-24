const fs = require('fs');

const minimalPdf = Buffer.from(
    "%PDF-1.7\n" +
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>\nendobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n" +
    "trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n223\n%%EOF"
);

fs.writeFileSync('backend/test.pdf', minimalPdf);
console.log('test.pdf created');
