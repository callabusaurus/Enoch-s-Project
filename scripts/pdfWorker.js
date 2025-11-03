// scripts/pdfWorker.js

// Robust PDF worker with pdf-parse (as class) and pdfjs-dist fallback

const fs = require('fs');

(async () => {

  const filePath = process.argv[2];

  if (!filePath) {

    console.error(JSON.stringify({ error: 'no-file-path' }));

    process.exit(2);

  }



  const buffer = fs.readFileSync(filePath);



  // Attempt 1: Try pdf-parse as a class (new PDFParse({ data: buffer }))

  try {

    const pdfParseModule = require('pdf-parse');

    if (pdfParseModule && pdfParseModule.PDFParse && typeof pdfParseModule.PDFParse === 'function') {

      const PDFParse = pdfParseModule.PDFParse;

      // Instantiate the class with data option and call getText method

      const parser = new PDFParse({ data: buffer });

      const result = await parser.getText();

      const out = { text: result?.text ?? '', meta: { numPages: result?.total ?? null } };

      process.stdout.write(JSON.stringify(out));

      process.exit(0);

    }

  } catch (err) {

    // Fall through to pdfjs-dist fallback

  }



  // Attempt 2: Fallback to pdfjs-dist

  try {

    // Try multiple pdfjs-dist require paths

    const pdfjsPaths = [

      'pdfjs-dist/legacy/build/pdf.js',

      'pdfjs-dist/build/pdf.js',

      'pdfjs-dist/es5/build/pdf.js'

    ];



    let pdfjs = null;

    for (const p of pdfjsPaths) {

      try {

        pdfjs = require(p);

        break; // Found a working path

      } catch (e) {

        // Continue to next path

      }

    }



    if (!pdfjs) {

      throw new Error('Could not load pdfjs-dist from any known path');

    }



    // Use pdfjs-dist to extract text

    const loadingTask = pdfjs.getDocument({ data: buffer });

    const doc = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {

      const page = await doc.getPage(i);

      const content = await page.getTextContent();

      fullText += content.items.map(it => it.str).join(' ') + '\n';

    }



    const out = { text: fullText, meta: { numPages: doc.numPages } };

    process.stdout.write(JSON.stringify(out));

    process.exit(0);



  } catch (err) {

    console.error(JSON.stringify({ error: err?.message ?? String(err) }));

    process.exit(1);

  }

})();
