import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';
import { detectStockQuery, fetchStockData, formatStockData } from '@/lib/stock';
import { isNSFWQuery, getNSFWExcludeText, getNSFWExcludeDomains } from '@/lib/nsfw-filter';

const EXA_API_KEY = process.env.EXA_API_KEY;
const EXA_API_BASE = 'https://api.exa.ai';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Generate a concise chat title (1-4 words) from the first user message
async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const prompt = `Create a very short, concise title for this conversation. The title should be 1-4 words maximum, summarizing the main topic or question. 
    
Rules:
- No punctuation (no periods, commas, quotes, etc.)
- No emojis
- Use only the most important keywords
- Keep it as brief as possible while still being descriptive

User message: "${firstMessage.trim()}"

Return ONLY the title, nothing else:`;

    const titleRes = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a title generator. Generate very short, concise titles (1-4 words) with no punctuation or emojis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 15,
        temperature: 0.3,
      }),
    });

    const titleData = await titleRes.json();
    if (titleRes.ok && titleData.choices && titleData.choices[0]) {
      let title = titleData.choices[0].message.content.trim();
      // Clean up: remove any punctuation, quotes, emojis
      title = title.replace(/[.,;:!?'"()\[\]{}]/g, '').replace(/[^\w\s]/g, '').trim();
      // Limit to 50 characters and ensure it's not empty
      if (title && title.length > 0) {
        return title.slice(0, 50);
      }
    }
  } catch (error) {
    console.error('Error generating chat title:', error);
  }
  
  // Fallback: create a simple title from the first few words
  const words = firstMessage.trim().split(/\s+/).slice(0, 4);
  return words.join(' ') || 'New Chat';
}

export async function POST(req: Request) {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authResult;
    const userId = user.id;

    // Gate by subscription plan
    const { data: userRow } = await supabase.from('users').select('subscription_plan').eq('id', user.id).single();
    if (!userRow || userRow.subscription_plan !== 'premium') {
      return NextResponse.json({ error: 'Atlas is available for premium users only' }, { status: 403 });
    }

    if (!EXA_API_KEY) {
      return NextResponse.json({ error: 'Exa API key is not configured.' }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { query, chatId = 'new-chat' } = body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Block NSFW queries before calling Exa
    if (isNSFWQuery(query)) {
      return NextResponse.json({ 
        error: 'I cannot assist with explicit or inappropriate content. Please ask a different question.' 
      }, { status: 400 });
    }

    // Generate UUID if chatId is "new-chat"
    const actualChatId = chatId === 'new-chat' ? randomUUID() : chatId;
    const now = new Date().toISOString();

    // Check if chat exists, create if needed
    const { data: existingChat, error: chatCheckError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', actualChatId)
      .eq('user_id', userId)
      .maybeSingle();

    // Track if this is a new chat (for title generation)
    const isNewChat = !existingChat && (!chatCheckError || chatCheckError.code === 'PGRST116');

    if (isNewChat) {
      const { error: insertError } = await supabase
        .from('chats')
        .insert({
          id: actualChatId,
          user_id: userId,
          title: 'New Chat', // Placeholder, will be updated after response
          created_at: now,
        });
      if (insertError) {
        return NextResponse.json({ error: `Failed to create chat: ${insertError.message}` }, { status: 400 });
      }
    }

    // Insert user message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        chat_id: actualChatId,
        user_id: userId,
        role: 'user',
        content: query.trim(),
        created_at: now,
      });

    if (userMessageError) {
      return NextResponse.json({ error: `Failed to save user message: ${userMessageError.message}` }, { status: 400 });
    }

    // Detect if query is image-related (must be explicit)
    const queryLower = query.toLowerCase();
    // More specific image phrases - user must explicitly request images
    const imagePhrases = [
      'show me images', 'show me image', 'show me pictures', 'show me picture',
      'show me photos', 'show me photo', 'show me a picture', 'show me a photo',
      'find images', 'find image', 'find pictures', 'find picture',
      'display images', 'display image', 'display pictures',
      'show graph', 'show graphs', 'show diagram', 'show diagrams',
      'image of', 'images of', 'picture of', 'pictures of', 
      'photo of', 'photos of', 'graph of', 'diagram of'
    ];
    // Check if query contains any explicit image phrase
    const isImageQuery = imagePhrases.some(phrase => queryLower.includes(phrase));

    // Detect if query is stock-related
    const stockQueryDetection = detectStockQuery(query);
    const isStockQuery = stockQueryDetection.isStockQuery;
    const stockSymbols = stockQueryDetection.symbols;

    // Create a ReadableStream to stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullAnswer = '';
        let allCitations: any[] = [];
        let allImages: string[] = [];

        try {
          // Fetch stock data if this is a stock query
          let stockDataText = '';
          if (isStockQuery && stockSymbols.length > 0) {
            try {
              const stockDataArray = await fetchStockData(stockSymbols);
              if (stockDataArray.length > 0) {
                // Prepare structured chart data for frontend
                const stockCharts = stockDataArray.map(data => {
                  let chartData = null;
                  if (data.candles && data.candles.c && data.candles.c.length > 0) {
                    try {
                      chartData = {
                        dates: data.candles.t.map(t => {
                          const date = new Date(t * 1000);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }),
                        prices: data.candles.c,
                        highs: data.candles.h,
                        lows: data.candles.l,
                        volumes: data.candles.v
                      };
                    } catch (error) {
                      console.error('Error processing candle data for', data.symbol, error);
                    }
                  } else {
                    console.log('No candle data available for', data.symbol, '- candles:', data.candles);
                  }
                  
                  return {
                    symbol: data.symbol,
                    companyName: data.companyName,
                    quote: data.quote,
                    currency: data.currency || 'USD',
                    candleData: chartData
                  };
                }).filter(chart => {
                  // Filter out charts with invalid or missing quote data
                  return chart.quote !== null && 
                         chart.quote.c !== null && 
                         chart.quote.c !== undefined &&
                         chart.quote.dp !== null && 
                         chart.quote.dp !== undefined;
                }); // Filter out invalid charts
                
                // Send structured chart data (only if we have valid charts)
                if (stockCharts.length > 0) {
                  console.log('Sending stockCharts:', JSON.stringify(stockCharts.map(c => ({ 
                    symbol: c.symbol, 
                    hasCandleData: !!c.candleData, 
                    hasQuote: !!c.quote 
                  }))));
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stockCharts })}\n\n`));
                }
                
                // Also send formatted text
                stockDataText = '\n\n## Real-Time Stock Information\n\n' + 
                  stockDataArray.map(data => formatStockData(data)).join('\n\n---\n\n') +
                  '\n\n';
                
                // Send stock text data to client
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: stockDataText })}\n\n`));
                fullAnswer += stockDataText;
              }
            } catch (stockError) {
              console.error('Error fetching stock data:', stockError);
              // Continue with Exa query even if stock fetch fails
            }
          }

          // Call Exa Search API to get raw search results
          const exaSearchResponse = await fetch(`${EXA_API_BASE}/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': EXA_API_KEY,
            },
            body: JSON.stringify({
              query: query.trim(),
              contents: {
                type: isImageQuery ? 'image' : 'text',
                extras: {
                  imageLinks: isImageQuery ? 1 : 0,
                },
              },
              num_results: 10,
              exclude_text: getNSFWExcludeText(),
              exclude_domains: getNSFWExcludeDomains(),
            }),
          });

          if (!exaSearchResponse.ok) {
            const errorText = await exaSearchResponse.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Exa API error: ' + errorText })}\n\n`));
            controller.close();
            return;
          }

          const exaSearchData = await exaSearchResponse.json();
          const searchResults = exaSearchData.results || [];

          // Fetch text contents from Exa if search results don't have text
          // Exa search may return URLs without text content, so we need to fetch contents separately
          if (searchResults.length > 0) {
            try {
              // Collect IDs or URLs from search results
              const idsToFetch = searchResults
                .map((r: any) => r.id || r.url)
                .filter((id: any) => id && typeof id === 'string')
                .slice(0, 10); // Limit to 10 to avoid token limits

              // Check if we need to fetch contents (if text is missing or very short)
              const needsContents = searchResults.some((r: any) => !r.text || (r.text && r.text.length < 100));
              
              if (idsToFetch.length > 0 && needsContents) {
                // Fetch contents to get full text
                const contentsResponse = await fetch(`${EXA_API_BASE}/contents`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': EXA_API_KEY,
                  },
                  body: JSON.stringify({
                    ids: idsToFetch,
                    text: {
                      max_characters: 3000, // Limit per result to avoid token limits
                    },
                  }),
                });

                if (contentsResponse.ok) {
                  const contentsData = await contentsResponse.json();
                  
                  // Create a map of ID/URL to text content
                  const contentsMap = new Map<string, string>();
                  if (contentsData.results && Array.isArray(contentsData.results)) {
                    contentsData.results.forEach((content: any) => {
                      const key = content.id || content.url;
                      if (key && content.text) {
                        contentsMap.set(key, content.text);
                      }
                    });
                  }

                  console.log(`Atlas: Fetched contents for ${contentsMap.size} results`);

                  // Merge text content into search results (prefer longer text)
                  let mergedCount = 0;
                  searchResults.forEach((result: any) => {
                    // Try matching by ID first, then URL
                    const idKey = result.id;
                    const urlKey = result.url;
                    let fetchedText: string | undefined;
                    
                    if (idKey && contentsMap.has(idKey)) {
                      fetchedText = contentsMap.get(idKey);
                    } else if (urlKey && contentsMap.has(urlKey)) {
                      fetchedText = contentsMap.get(urlKey);
                    }
                    
                    if (fetchedText) {
                      // Use fetched text if it's longer or if current text is missing/short
                      if (!result.text || fetchedText.length > (result.text?.length || 0)) {
                        result.text = fetchedText;
                        mergedCount++;
                      }
                    }
                  });
                  
                  console.log(`Atlas: Merged text content into ${mergedCount} search results`);
                } else {
                  const errorText = await contentsResponse.text();
                  console.error('Atlas: Contents API error:', errorText);
                }
              }
            } catch (contentsError) {
              console.error('Error fetching contents from Exa:', contentsError);
              // Continue with whatever text we have from search results
            }
          }

          // Extract text content and citations from search results
          let searchContext = '';
          const extractedCitations: any[] = [];
          const extractedImages: string[] = [];

          for (const result of searchResults) {
            // Check for text in multiple possible fields
            const text = result.text || result.text_snippet || result.excerpt || result.snippet || '';
            
            if (text) {
              searchContext += `Source: ${result.title || result.url}\n${text}\n\n`;
            }
            
            // Build citation object
            const citation: any = {
              title: result.title || result.url,
              url: result.url,
            };
            
            // Extract images if this is an image query
            if (isImageQuery) {
              if (result.imageLinks && Array.isArray(result.imageLinks)) {
                extractedImages.push(...result.imageLinks);
                citation.imageLinks = result.imageLinks;
              }
              if (result.image && typeof result.image === 'string') {
                extractedImages.push(result.image);
                citation.image = result.image;
              }
            }
            
            extractedCitations.push(citation);
          }

          // Limit images to max 3 and send to client
          if (isImageQuery && extractedImages.length > 0) {
            const uniqueImages = Array.from(new Set(extractedImages)).slice(0, 3);
            allImages = uniqueImages;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ images: allImages })}\n\n`));
          }

          // Send citations to client
          if (extractedCitations.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ citations: extractedCitations })}\n\n`));
            allCitations = extractedCitations;
          }

          // Log for debugging
          console.log(`Atlas: Found ${searchResults.length} search results, ${extractedCitations.length} citations, search context length: ${searchContext.length}`);

          // Call OpenAI to synthesize the information from search results
          const systemPrompt = `You are Atlas, an AI assistant that provides accurate, well-sourced information. 
Based on the search results provided, synthesize and describe the information in a clear, comprehensive way. 
When referencing information, cite the sources naturally in your response using format: (Source Name).
Be thorough but concise, and focus on answering the user's question: "${query.trim()}"`;

          let userPrompt: string;
          if (searchContext.trim()) {
            userPrompt = `Based on the following search results from Exa web search, please provide a comprehensive answer to: "${query.trim()}"

Search Results:
${searchContext}

Please synthesize this information into a clear, well-structured response. Include citations in the format (Source Name) when referencing specific information.`;
          } else {
            // If no search context, let OpenAI know we couldn't get web results
            console.warn('Atlas: No search context available - search results may not have contained text content');
            userPrompt = `The user asked: "${query.trim()}". 

Note: Web search was performed but no text content was available from the search results. Please provide a helpful response based on your general knowledge, but note that this response may not include the most recent information from web sources.`;
          }

          // Call OpenAI with streaming
          const openaiResponse = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: OPENAI_MODEL,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              stream: true,
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });

          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'OpenAI API error: ' + errorText })}\n\n`));
            controller.close();
            return;
          }

          // Parse OpenAI streaming response
          const reader = openaiResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response body from OpenAI' })}\n\n`));
            controller.close();
            return;
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') continue;
                
                try {
                  const data = JSON.parse(jsonStr);
                  
                  if (data.choices && data.choices[0] && data.choices[0].delta) {
                    const content = data.choices[0].delta.content;
                    if (content) {
                      fullAnswer += content;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  }
                } catch (e) {
                  console.error('Error parsing OpenAI SSE chunk:', e);
                }
              }
            }
          }

          // Save AI response to database
          if (fullAnswer.trim()) {
            await supabase
              .from('messages')
              .insert({
                chat_id: actualChatId,
                user_id: userId,
                role: 'assistant',
                content: fullAnswer.trim(),
                created_at: new Date().toISOString(),
              });
          }

          // Generate and update chat title for new chats (after first message)
          if (isNewChat && query.trim()) {
            try {
              const generatedTitle = await generateChatTitle(query);
              await supabase
                .from('chats')
                .update({ title: generatedTitle })
                .eq('id', actualChatId)
                .eq('user_id', userId);
            } catch (titleError) {
              console.error('Failed to update chat title:', titleError);
              // Don't fail the request if title generation fails
            }
          }

          // Send final message with chatId
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, chatId: actualChatId })}\n\n`));
        } catch (error) {
          console.error('Atlas API error:', error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    // Return streaming response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Atlas answer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

