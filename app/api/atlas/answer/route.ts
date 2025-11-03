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

          // Build Exa API request body with NSFW filtering
          const requestBody: any = {
            query: query.trim(),
            text: false,
            stream: true,
            model: 'exa',
            num_results: 10,
            // Add NSFW filtering using Exa's built-in filters
            exclude_text: getNSFWExcludeText(),
            exclude_domains: getNSFWExcludeDomains(),
          };

          // Add image content request ONLY if it's an explicit image query
          if (isImageQuery) {
            requestBody.contents = {
              type: 'image',
              extras: {
                imageLinks: 1, // Request 1 image per result (we'll collect up to 3 total)
              },
            };
          } else {
            // For non-image queries, don't request images at all
            requestBody.contents = {
              type: 'text',
              // No imageLinks extras - don't request images unless explicitly asked
            };
          }

          // Call Exa Answer API with streaming
          const exaResponse = await fetch(`${EXA_API_BASE}/answer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': EXA_API_KEY,
            },
            body: JSON.stringify(requestBody),
          });

          if (!exaResponse.ok) {
            const errorText = await exaResponse.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Exa API error: ' + errorText })}\n\n`));
            controller.close();
            return;
          }

          // Parse SSE stream from Exa
          const reader = exaResponse.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response body from Exa' })}\n\n`));
            controller.close();
            return;
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6); // Remove 'data: ' prefix
                  const data = JSON.parse(jsonStr);

                  // Handle content chunks
                  if (data.choices && data.choices[0] && data.choices[0].delta) {
                    const content = data.choices[0].delta.content;
                    if (content) {
                      fullAnswer += content;
                      // Forward chunk to client
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  }

                  // Handle citations
                  if (data.citations && Array.isArray(data.citations)) {
                    allCitations = [...allCitations, ...data.citations];
                    // Forward citations to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ citations: data.citations })}\n\n`));
                    
                    // Extract image URLs from citations ONLY if this is an explicit image query
                    if (isImageQuery) {
                      const imageUrls: string[] = [];
                      for (const citation of data.citations) {
                        // Check if citation has imageLinks array
                        if (citation.imageLinks && Array.isArray(citation.imageLinks)) {
                          imageUrls.push(...citation.imageLinks);
                        }
                        // Check if citation has image field
                        if (citation.image && typeof citation.image === 'string') {
                          imageUrls.push(citation.image);
                        }
                      }
                      
                      // Add unique image URLs and limit to max 3
                      if (imageUrls.length > 0) {
                        const uniqueImages = [...new Set([...allImages, ...imageUrls])];
                        // Limit to maximum 3 images
                        allImages = uniqueImages.slice(0, 3);
                        // Forward images to client (max 3) - only when explicitly requested
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ images: allImages })}\n\n`));
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE chunk:', e);
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
          console.error('Exa API streaming error:', error);
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

