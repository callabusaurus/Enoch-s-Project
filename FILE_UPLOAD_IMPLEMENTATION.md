# File Upload with Text Extraction and LLM Integration

## Overview

This implementation enables users to upload files of various types (PDF, DOCX, Excel, images, text files) and have their content automatically extracted and included in LLM conversations.

## Features

✅ **Multi-format support:**
- PDF files (`.pdf`)
- Word documents (`.docx`, limited `.doc` support)
- Excel spreadsheets (`.xlsx`, `.xls`)
- Text files (`.txt`, `.md`, `.json`, `.csv`)
- Images with OCR (`.jpg`, `.png`, `.gif`, etc.)

✅ **Automatic text extraction** - Files are processed in the background after upload

✅ **LLM integration** - Extracted text is automatically included in chat context

✅ **Non-blocking uploads** - File processing happens asynchronously

## Implementation Details

### 1. File Processing Endpoint (`/api/files/process`)

Located at: `app/api/files/process/route.ts`

- Extracts text from uploaded files using format-specific libraries
- Updates the `attachments` table with extracted text
- Runs in Node.js runtime (required for PDF parsing and OCR)
- Maximum duration: 60 seconds

### 2. Upload Endpoint Updates (`/api/files/upload`)

Located at: `app/api/files/upload/route.ts`

- Automatically triggers file processing after successful upload
- Processing happens in background (non-blocking)
- Upload response is returned immediately

### 3. Chat Endpoint Updates (`/api/chat/send`)

Located at: `app/api/chat/send/route.ts`

- Automatically includes file content from attachments in LLM context
- File text is appended to user messages that have attachments
- Format: `[File: filename]\nextracted text content`

### 4. Database Schema

**Required Migration:** Add `extracted_text` column to `attachments` table

```sql
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;
```

See `migrations/add_extracted_text_to_attachments.sql` for the migration file.

## Installation

Required npm packages have been installed:

- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction
- `xlsx` - Excel file parsing
- `tesseract.js` - OCR for images

## Usage Flow

1. User clicks the paperclip icon in chat
2. User selects a file (any file type supported)
3. File is uploaded to Supabase Storage
4. File processing is triggered in background
5. Text is extracted and stored in database
6. When user sends a message, file content is automatically included in LLM context
7. LLM can answer questions about the file content

## File Type Support

| Format | Extension | Library | Status |
|--------|-----------|---------|--------|
| PDF | `.pdf` | pdf-parse | ✅ Full support |
| Word | `.docx` | mammoth | ✅ Full support |
| Word (legacy) | `.doc` | - | ⚠️ Limited (conversion recommended) |
| Excel | `.xlsx`, `.xls` | xlsx | ✅ Full support |
| Text | `.txt`, `.md`, `.json`, `.csv` | Native | ✅ Full support |
| Images | `.jpg`, `.png`, `.gif`, etc. | tesseract.js | ✅ OCR support |

## Notes

- **OCR Performance:** Image OCR can be slow for large images. Processing happens in background.
- **File Size Limit:** Maximum file size is 30MB (configured in upload endpoint)
- **Processing Timeout:** File processing has a 60-second timeout
- **Error Handling:** If extraction fails, the upload still succeeds, but extracted text will be empty

## Testing

To test the implementation:

1. Run the database migration first
2. Upload a PDF or DOCX file through the chat interface
3. Wait a few seconds for processing
4. Send a message asking about the file content
5. The LLM should respond with information from the file

## Troubleshooting

**Issue:** Files upload but LLM doesn't see content
- Check if `extracted_text` column exists in database
- Check server logs for processing errors
- Verify file processing endpoint is accessible

**Issue:** OCR not working for images
- OCR may fail for images without text
- Check server logs for tesseract.js errors
- Large images may timeout - consider resizing

**Issue:** Processing takes too long
- Large files may take time to process
- Check server logs for performance issues
- Consider implementing processing queue for production


