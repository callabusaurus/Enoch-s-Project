// /src/lib/pdfParser.js
// CommonJS module for PDF parsing - runs in Node.js only
const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @param {Object} options - Optional extraction options
 * @returns {Promise<string>} - Extracted text content
 */
async function extractText(buffer, options = {}) {
  // Use options to improve extraction for complex PDFs
  const data = await pdfParse(buffer, {
    max: 0, // 0 means no limit on pages - important for large PDFs
    ...options
  });
  
  return data.text || '';
}

module.exports = { extractText };

