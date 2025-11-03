# Database Migrations

## Adding extracted_text to attachments table

To enable file content extraction for LLM processing, you need to add the `extracted_text` column to the `attachments` table.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the SQL from `add_extracted_text_to_attachments.sql`

Alternatively, you can run this SQL directly:

```sql
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;
```

This adds a nullable `extracted_text` column that will store the extracted text content from uploaded files.


