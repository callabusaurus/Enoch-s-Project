// lib/pdfExtractor.js
// PDF text extraction helper with pdf-parse (as class) and pdfjs-dist fallback

// Use dynamic imports for ESM compatibility in Next.js
export async function extractTextFromBuffer(buffer) {
  try {
    // Try pdf-parse as a class
    const pdfParseModule = await import('pdf-parse');
    
    if (pdfParseModule && pdfParseModule.PDFParse && typeof pdfParseModule.PDFParse === 'function') {
      // PDFParse requires { data: buffer } in constructor
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      return result?.text ?? '';
    }
  } catch (err) {
    console.warn('pdf-parse failed, using pdfjs-dist:', err.message);
  }

  // Fallback to pdfjs-dist
  try {
    // Try multiple pdfjs-dist import paths
    const pdfjsPaths = [
      'pdfjs-dist/legacy/build/pdf.js',
      'pdfjs-dist/build/pdf.js',
      'pdfjs-dist/es5/build/pdf.js'
    ];
    
    let pdfjsLib = null;
    for (const p of pdfjsPaths) {
      try {
        const mod = await import(p);
        pdfjsLib = mod.default || mod;
        if (pdfjsLib && pdfjsLib.getDocument) break;
      } catch (e) {
        // Continue to next path
      }
    }
    
    if (!pdfjsLib || !pdfjsLib.getDocument) {
      throw new Error('pdf-parse failed and pdfjs-dist is not available');
    }
    
    // Use pdfjs-dist to extract text
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    
    return text;
  } catch (err) {
    throw new Error(`PDF extraction failed: ${err?.message ?? String(err)}`);
  }
}
