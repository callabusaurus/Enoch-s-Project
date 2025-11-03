import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { isNSFWQuery, getNSFWExcludeText, getNSFWExcludeDomains } from '@/lib/nsfw-filter';

const EXA_API_KEY = process.env.EXA_API_KEY;
const EXA_API_BASE = 'https://api.exa.ai';

function extractExaResults(results: any[]): any[] {
  if (!results) return [];
  return results.map((item) => ({
    title: item.title || item.url,
    link: item.url,
    snippet: item.text || '',
    // Exa provides imageLinks array or image field in the response
    image: (item.imageLinks && item.imageLinks.length > 0) 
      ? item.imageLinks[0] 
      : item.image || undefined,
  }));
}

export async function POST(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  // Gate by subscription plan
  const { data: userRow } = await supabase.from('users').select('subscription_plan').eq('id', user.id).single();
  if (!userRow || userRow.subscription_plan !== 'premium') {
    return NextResponse.json({ error: 'Atlas is available for premium users only' }, { status: 403 });
  }
  if (!EXA_API_KEY) {
    return NextResponse.json({ error: 'Exa API key is not configured.' }, { status: 500 });
  }
  let payload;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const query = (payload.query || '').trim();
  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  // Block NSFW queries before calling Exa
  if (isNSFWQuery(query)) {
    return NextResponse.json({ 
      error: 'I cannot assist with explicit or inappropriate content. Please ask a different question.' 
    }, { status: 400 });
  }

  // Determine if this is an image search based on query or explicit parameter
  const searchType = payload.searchType || 'web'; // 'web' or 'images'
  const isImageSearch = searchType === 'images';

  try {
    // Call Exa Search API
    const exaResponse = await fetch(`${EXA_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query: query.trim(),
        contents: {
          type: isImageSearch ? 'image' : 'text',
          extras: {
            imageLinks: isImageSearch ? 1 : 0, // Only request images for explicit image searches
          },
        },
        num_results: 10,
        // Add NSFW filtering using Exa's built-in filters
        exclude_text: getNSFWExcludeText(),
        exclude_domains: getNSFWExcludeDomains(),
      }),
    });

    if (!exaResponse.ok) {
      const errorText = await exaResponse.text();
      return NextResponse.json({ error: 'Exa API error: ' + errorText }, { status: exaResponse.status });
    }

    const exaData = await exaResponse.json();
    const results = extractExaResults(exaData.results || []);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach Exa API.' }, { status: 502 });
  }
}




