import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

// Use Node.js runtime for file processing (required for PDF parsing and OCR)
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large files

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Writes the buffer to a temp file, spawns scripts/pdfWorker.js using node,
 * reads its stdout (JSON), cleans up temp file and returns extracted text.
 */
async function extractTextFromPDF(buffer: Buffer, attachmentId?: string, filename?: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const fileName = `pdf-${Date.now()}-${Math.random().toString(36).slice(2,8)}.pdf`;
  const filePath = path.join(tmpDir, fileName);
  // write temp PDF
  await fs.writeFile(filePath, buffer);

  try {
    console.log('[PROCESS DEBUG] Spawning pdf worker', { attachmentId, filename, filePath });
    const workerPath = path.join(process.cwd(), 'scripts', 'pdfWorker.js');
    const { stdout, stderr } = await execFileAsync('node', [workerPath, filePath], {
      // Increase maxBuffer for large PDFs -> captured stdout
      maxBuffer: 1024 * 1024 * 30, // 30MB
    });

    if (stderr && stderr.trim()) {
      // worker writes JSON error objects to stderr
      try {
        const parsedErr = JSON.parse(stderr.trim());
        const msg = parsedErr?.error || stderr.trim();
        console.error('[PROCESS DEBUG] pdfWorker stderr JSON', parsedErr);
        throw new Error(msg);
      } catch (parseErr) {
        // fallback to raw stderr
        console.error('[PROCESS DEBUG] pdfWorker stderr', stderr);
        throw new Error(stderr.trim());
      }
    }

    if (!stdout || !stdout.trim()) {
      throw new Error('pdfWorker produced no output');
    }

    const parsed = JSON.parse(stdout);
    const text = parsed?.text ?? '';
    console.log('[PROCESS DEBUG] pdfWorker extracted length', { length: text.length, attachmentId, filename });
    
    // Validate extraction - throw error if extraction failed or returned minimal content
    if (!text || typeof text !== 'string') {
      throw new Error('PDF extraction returned invalid or empty text. The PDF may be corrupted, encrypted, or image-based.');
    }
    
    if (text.trim().length < 10) {
      // Very short text likely means extraction failed or PDF is image-based
      throw new Error('PDF extraction returned minimal text (less than 10 characters). The PDF may be image-based, encrypted, or have complex formatting that could not be extracted.');
    }
    
    return text;
  } catch (err: any) {
    console.error('[PROCESS DEBUG] PDF extraction error:', { error: err?.message ?? String(err) , attachmentId, filename });
    throw new Error(`Failed to extract text from PDF: ${err?.message ?? String(err)}`);
  } finally {
    // cleanup
    try { await fs.unlink(filePath); } catch(e) { /* ignore cleanup errors */ }
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

async function extractTextFromExcel(buffer: Buffer): Promise<string> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(sheet);
      text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
    });
    
    return text;
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error('Failed to extract text from Excel');
  }
}

async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    // OCR can be slow and resource-intensive, wrap in try-catch for graceful failure
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text || '';
  } catch (error) {
    console.error('OCR error:', error);
    // Return informative message if OCR fails
    // Images without text or unsupported formats will return this
    return '[Image file - OCR extraction attempted but may be unavailable for this image type]';
  }
}

async function extractTextFromFile(file: File | { arrayBuffer: () => Promise<ArrayBuffer>, name: string, type: string }, attachmentId?: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || '';
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const filename = file.name;

  // Handle text files
  if (mimeType.startsWith('text/') || extension === 'txt' || extension === 'md' || extension === 'json' || extension === 'csv') {
    try {
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('Text extraction error:', error);
      return '';
    }
  }

  // Handle PDFs
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return await extractTextFromPDF(buffer, attachmentId, filename);
  }

  // Handle DOCX
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
  ) {
    return await extractTextFromDOCX(buffer);
  }

  // Handle DOC (legacy Word format - limited support)
  if (
    mimeType === 'application/msword' ||
    extension === 'doc'
  ) {
    // DOC format is harder to parse, you might want to use a different library
    // or convert to DOCX first
    return '[DOC file detected. Please convert to DOCX for better text extraction.]';
  }

  // Handle Excel files
  if (
    mimeType.includes('spreadsheet') ||
    extension === 'xlsx' ||
    extension === 'xls'
  ) {
    return await extractTextFromExcel(buffer);
  }

  // Handle images with OCR
  if (mimeType.startsWith('image/')) {
    return await extractTextFromImage(buffer, mimeType);
  }

  // For other file types, return empty string
  return '';
}

export async function POST(req: Request) {
  console.log('[PROCESS DEBUG] ========== PROCESS REQUEST START ==========');
  console.log('[PROCESS DEBUG] Request URL:', req.url);
  console.log('[PROCESS DEBUG] Request method:', req.method);
  console.log('[PROCESS DEBUG] Request headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    console.log('[PROCESS DEBUG] Step 1: Authenticating user');
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      console.error('[PROCESS DEBUG] Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, supabase } = authResult;
    console.log('[PROCESS DEBUG] Step 2: User authenticated', { userId: user.id });
    
    // Accept either JSON (for server-side calls) or FormData (for backward compatibility)
    let attachmentId: string;
    let file: File | null = null;
    
    console.log('[PROCESS DEBUG] Step 3: Parsing request body');
    const contentType = req.headers.get('content-type') || '';
    console.log('[PROCESS DEBUG] Content-Type:', contentType);
    
    try {
      if (contentType.includes('application/json')) {
        const body = await req.json();
        attachmentId = body.attachmentId;
        console.log('[PROCESS DEBUG] Parsed JSON body', { attachmentId });
      } else {
        const form = await req.formData();
        file = form.get('file') as File;
        attachmentId = form.get('attachmentId') as string;
        console.log('[PROCESS DEBUG] Parsed FormData', { attachmentId, hasFile: !!file });
      }
    } catch (parseError) {
      console.error('[PROCESS DEBUG] Failed to parse request body:', parseError);
      throw parseError;
    }

    if (!attachmentId) {
      console.error('[PROCESS DEBUG] Missing attachmentId');
      return NextResponse.json({ error: 'attachmentId required' }, { status: 400 });
    }
    
    console.log('[PROCESS DEBUG] Step 4: AttachmentId validated', { attachmentId });

    // If file is not provided in request, fetch it from storage
    if (!file) {
      console.log('[PROCESS DEBUG] Step 5: File not in request, fetching from database');
      // Fetch attachment record to get file path
      const { data: attachment, error: attachmentError } = await supabase
        .from('attachments')
        .select('file_path, file_name, file_type')
        .eq('id', attachmentId)
        .eq('user_id', user.id)
        .single();

      if (attachmentError || !attachment) {
        console.error('[PROCESS DEBUG] Attachment not found:', {
          attachmentError,
          attachmentId,
          userId: user.id,
          errorCode: attachmentError?.code,
          errorMessage: attachmentError?.message
        });
        return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
      }
      
      console.log('[PROCESS DEBUG] Attachment found:', {
        file_path: attachment.file_path,
        file_name: attachment.file_name,
        file_type: attachment.file_type
      });

      console.log('[PROCESS DEBUG] Step 6: Downloading file from storage');
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('chat-files')
        .download(attachment.file_path);

      if (downloadError || !fileData) {
        console.error('[PROCESS DEBUG] Failed to download file:', {
          error: downloadError,
          errorCode: downloadError?.statusCode,
          errorMessage: downloadError?.message,
          filePath: attachment.file_path,
          attachmentId
        });
        return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
      }
      
      console.log('[PROCESS DEBUG] File downloaded successfully', {
        fileSize: fileData instanceof Blob ? fileData.size : 'unknown',
        fileType: typeof fileData
      });

      // Convert Blob to Buffer for processing
      // In Node.js runtime, we need to handle Blob differently
      let buffer: Buffer;
      if (fileData instanceof Blob) {
        const arrayBuffer = await fileData.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else if (Buffer.isBuffer(fileData)) {
        buffer = fileData;
      } else {
        // If it's a Uint8Array or other type
        buffer = Buffer.from(fileData);
      }

      // Create a File-like object for the extraction function
      // We'll create a proper ArrayBuffer view of the buffer
      const arrayBufferView = new Uint8Array(buffer);
      const clonedArrayBuffer = arrayBufferView.buffer.slice(
        arrayBufferView.byteOffset,
        arrayBufferView.byteOffset + arrayBufferView.byteLength
      );

      file = {
        arrayBuffer: async () => clonedArrayBuffer,
        name: attachment.file_name,
        type: attachment.file_type || 'application/octet-stream',
        size: buffer.length
      } as File;
    }

    console.log('[PROCESS DEBUG] Starting text extraction:', {
      attachmentId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Extract text from file
    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(file, attachmentId);
      console.log('[PROCESS DEBUG] Text extraction completed:', {
        attachmentId,
        textLength: extractedText.length
      });
    } catch (extractionError) {
      console.error('[PROCESS DEBUG] Text extraction failed:', {
        error: extractionError,
        attachmentId,
        filename: file.name,
        fileType: file.type
      });
      // Return empty string or error message instead of failing completely
      extractedText = `[File processing failed: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}]`;
    }

    // Update attachment with extracted text
    const { error: updateError } = await supabase
      .from('attachments')
      .update({ extracted_text: extractedText })
      .eq('id', attachmentId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[PROCESS DEBUG] Failed to update attachment:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Verify the text was actually stored correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('attachments')
      .select('extracted_text')
      .eq('id', attachmentId)
      .eq('user_id', user.id)
      .single();
    
    if (verifyData) {
      const storedLength = verifyData.extracted_text?.length || 0;
      console.log('[PROCESS DEBUG] Verification - Extracted length:', extractedText.length, 'Stored length:', storedLength);
      if (storedLength !== extractedText.length) {
        console.error('[PROCESS DEBUG] WARNING: Text length mismatch! Extracted:', extractedText.length, 'Stored:', storedLength);
      }
    } else if (verifyError) {
      console.error('[PROCESS DEBUG] Verification query error:', verifyError);
    }

    return NextResponse.json({ 
      success: true, 
      extractedText,
      textLength: extractedText.length 
    });
  } catch (error) {
    console.error('[PROCESS DEBUG] ========== ERROR CAUGHT ==========');
    console.error('[PROCESS DEBUG] Error type:', typeof error);
    console.error('[PROCESS DEBUG] Error name:', error instanceof Error ? error.name : 'N/A');
    console.error('[PROCESS DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[PROCESS DEBUG] Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('[PROCESS DEBUG] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[PROCESS DEBUG] ====================================');
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'File processing failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
