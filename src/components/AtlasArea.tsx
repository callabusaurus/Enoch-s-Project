import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { MessageCard } from "./MessageCard";
import { StockChart } from "./StockChart";
import { supabase } from "../lib/supabase/client";

interface AtlasAreaProps {
  chatId?: string;
  onChatIdUpdate?: (newChatId: string) => void;
}

type StockChartData = {
  symbol: string;
  companyName?: string;
  quote: {
    c: number;
    d: number;
    dp: number;
    h: number;
    l: number;
    o: number;
    pc: number;
    t: number;
  };
  currency?: string;
  candleData: {
    dates: string[];
    prices: number[];
    highs: number[];
    lows: number[];
    volumes: number[];
  } | null;
};

type ChatMessage = { 
  type: "user" | "ai"; 
  content: string; 
  images?: string[];
  stockCharts?: StockChartData[];
};

export function AtlasArea({ chatId = "new-chat", onChatIdUpdate }: AtlasAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation history when chatId changes
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const res = await fetch(`/api/chat/history?chatId=${encodeURIComponent(chatId)}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.error('Non-JSON response from server when loading chat history:', text);
          setMessages([]);
          return;
        }
        
        if (res.ok && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([]);
      }
    };
    load();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    const optimisticMessages = [...messages, { type: "user" as const, content: userMessage }];
    setMessages(optimisticMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    // Add AI message placeholder for streaming
    setMessages([...optimisticMessages, { type: "ai", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/atlas/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: userMessage,
          chatId: chatId 
        }),
      });

      if (res.status === 403) {
        setError('Atlas is available for premium users only.');
        setMessages(optimisticMessages);
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(errorData.error || 'Failed to get answer');
        setMessages(optimisticMessages);
        setIsLoading(false);
        return;
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let accumulatedImages: string[] = [];
      let accumulatedStockCharts: StockChartData[] = [];
      let newChatId = chatId;

      if (!reader) {
        setError('No response body');
        setMessages(optimisticMessages);
        setIsLoading(false);
        return;
      }

      let streamCompleted = false;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream ended - mark as done
            if (accumulatedContent || accumulatedImages.length > 0) {
              // We have content or images, stream completed successfully
              streamCompleted = true;
              setIsLoading(false);
            } else {
              // Stream ended with no content - might be an error
              setError('Stream ended unexpectedly');
              setMessages(optimisticMessages);
              setIsLoading(false);
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonStr);

                // Handle error
                if (data.error) {
                  setError(data.error);
                  setMessages(optimisticMessages);
                  setIsLoading(false);
                  return;
                }

                // Handle stock charts
                if (data.stockCharts && Array.isArray(data.stockCharts)) {
                  console.log('Received stockCharts:', data.stockCharts.length, 'charts');
                  accumulatedStockCharts = data.stockCharts;
                  // Update the last AI message with stock charts
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].type === 'ai') {
                      newMsgs[newMsgs.length - 1] = { 
                        type: 'ai', 
                        content: accumulatedContent,
                        images: accumulatedImages.length > 0 ? [...accumulatedImages] : undefined,
                        stockCharts: accumulatedStockCharts.length > 0 ? [...accumulatedStockCharts] : undefined
                      };
                      console.log('Updated message with stockCharts:', newMsgs[newMsgs.length - 1].stockCharts?.length);
                    }
                    return newMsgs;
                  });
                }

                // Handle content chunk
                if (data.content) {
                  accumulatedContent += data.content;
                  // Update the last AI message with accumulated content and images (preserve images and charts)
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].type === 'ai') {
                      // Preserve existing images if they exist, otherwise use accumulatedImages
                      const existingImages = (newMsgs[newMsgs.length - 1] as any).images;
                      const existingCharts = (newMsgs[newMsgs.length - 1] as any).stockCharts;
                      const imagesToUse = existingImages && Array.isArray(existingImages) && existingImages.length > 0
                        ? existingImages
                        : (accumulatedImages.length > 0 ? [...accumulatedImages] : undefined);
                      const chartsToUse = existingCharts && Array.isArray(existingCharts) && existingCharts.length > 0
                        ? existingCharts
                        : (accumulatedStockCharts.length > 0 ? [...accumulatedStockCharts] : undefined);
                      newMsgs[newMsgs.length - 1] = { 
                        type: 'ai', 
                        content: accumulatedContent,
                        images: imagesToUse,
                        stockCharts: chartsToUse
                      };
                    }
                    return newMsgs;
                  });
                }

                // Handle images
                if (data.images && Array.isArray(data.images)) {
                  accumulatedImages = [...new Set([...accumulatedImages, ...data.images])].slice(0, 3); // Limit to max 3
                  // Update the last AI message with images (preserve charts)
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].type === 'ai') {
                      const existingCharts = (newMsgs[newMsgs.length - 1] as any).stockCharts;
                      newMsgs[newMsgs.length - 1] = { 
                        type: 'ai', 
                        content: accumulatedContent,
                        images: accumulatedImages.length > 0 ? [...accumulatedImages] : undefined,
                        stockCharts: existingCharts && Array.isArray(existingCharts) && existingCharts.length > 0
                          ? existingCharts
                          : undefined
                      };
                    }
                    return newMsgs;
                  });
                }

                // Handle citations (we can display these later if needed)
                if (data.citations) {
                  // Citations are received but we'll handle them in the future
                }

                // Handle completion
                if (data.done) {
                  streamCompleted = true;
                  if (data.chatId && chatId === 'new-chat' && data.chatId !== chatId && onChatIdUpdate) {
                    newChatId = data.chatId;
                    onChatIdUpdate(data.chatId);
                  }
                  setIsLoading(false);
                }
              } catch (e) {
                console.error('Error parsing SSE chunk:', e);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        setError('Error reading stream');
        setMessages(optimisticMessages);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Atlas answer failed:', error);
      setError('Failed to get answer. Please try again.');
      setMessages(optimisticMessages);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--app-bg)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-6 py-4">
        <h2 className="text-[var(--text-primary)]">Atlas</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <h1 className="text-[var(--text-primary)] mb-8">What would you like to search?</h1>
          </div>
        ) : (
          <div className="w-full">
            {messages.map((message, index) => (
              <div key={index}>
                {/* Render stock charts before message content for AI messages */}
                {message.type === 'ai' && message.stockCharts && message.stockCharts.length > 0 && (
                  <div className="px-6 py-4">
                    {message.stockCharts.map((chartData, chartIndex) => {
                      // Log for debugging
                      console.log('Rendering chart:', chartIndex, chartData.symbol, {
                        hasCandleData: !!chartData.candleData,
                        hasQuote: !!chartData.quote,
                        candleDataLength: chartData.candleData?.dates?.length
                      });
                      
                      // Render even if no candleData, but show basic info
                      if (!chartData.quote) {
                        console.warn('No quote data for chart:', chartData.symbol);
                        return null;
                      }
                      
                      // Ensure quote has valid price data
                      if (chartData.quote.c === null || chartData.quote.c === undefined || 
                          chartData.quote.dp === null || chartData.quote.dp === undefined) {
                        console.warn('Invalid quote data for chart:', chartData.symbol, chartData.quote);
                        return null;
                      }
                      
                      // If we have candle data, show full chart
                      if (chartData.candleData && chartData.candleData.dates && chartData.candleData.dates.length > 0) {
                        // Transform candle data into chart format
                        const chartDataPoints = chartData.candleData.dates.map((date, i) => ({
                          date,
                          price: chartData.candleData.prices[i],
                          high: chartData.candleData.highs[i],
                          low: chartData.candleData.lows[i],
                        }));
                        
                        return (
                          <StockChart
                            key={chartIndex}
                            symbol={chartData.symbol}
                            companyName={chartData.companyName}
                            data={chartDataPoints}
                            currentPrice={chartData.quote.c}
                            change={chartData.quote.dp}
                            currency={chartData.currency}
                          />
                        );
                      } else {
                        // Fallback: show basic stock info even without historical data
                        console.log('No candle data for', chartData.symbol, '- showing basic info only');
                        return (
                          <div key={chartIndex} className="my-4 p-4 border rounded-lg bg-card">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                              {chartData.companyName || chartData.symbol} ({chartData.symbol})
                            </h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-2xl font-bold text-[var(--text-primary)]">
                                {chartData.currency || 'USD'} {typeof chartData.quote.c === 'number' ? chartData.quote.c.toFixed(2) : 'N/A'}
                              </span>
                              <span className={`text-sm font-medium ${(chartData.quote.dp ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {(chartData.quote.dp ?? 0) >= 0 ? '+' : ''}{typeof chartData.quote.dp === 'number' ? chartData.quote.dp.toFixed(2) : '0.00'}%
                              </span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-2">
                              Historical data not available at this time.
                            </p>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
                <MessageCard 
                  type={message.type} 
                  content={message.content} 
                  images={message.images} 
                />
              </div>
            ))}
            {isLoading && (
              <div className="px-6 py-4">
                <Loader2 className="w-5 h-5 text-[#5A5BEF] animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/30">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-[var(--card-border)] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <textarea
                placeholder="Ask anything …"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                rows={1}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[12px] px-4 py-3 pr-12 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#5A5BEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden min-h-[48px] max-h-[200px]"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#5A5BEF] hover:bg-[#4A4BDF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
