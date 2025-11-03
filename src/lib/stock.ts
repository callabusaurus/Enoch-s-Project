/**
 * Stock query detection and Yahoo Finance API integration
 */

import yahooFinance from 'yahoo-finance2';

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Unix timestamp
}

export interface StockCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  t: number[]; // Timestamps
  v: number[]; // Volume
}

export interface StockData {
  symbol: string;
  quote: StockQuote | null;
  candles: StockCandle | null;
  companyName?: string;
  currency?: string;
  exchange?: string;
}

/**
 * Detect if a query is asking about stock prices
 * and extract stock symbols (tickers)
 */
export function detectStockQuery(query: string): { isStockQuery: boolean; symbols: string[] } {
  const queryLower = query.toLowerCase();
  
  // Stock-related keywords
  const stockKeywords = [
    'stock', 'stocks', 'stock price', 'stock prices', 'stock chart', 'stock charts',
    'share', 'shares', 'share price',
    'ticker', 'tickers',
    'quote', 'quotes',
    'price', 'prices', 'trading',
    'market', 'markets',
    'nasdaq', 'nyse', 's&p', 'sp500',
    'how much is', 'what is the price of', 'show me stock', 'show me chart',
    'apple stock', 'tesla stock', 'microsoft stock', 'google stock',
    'amazon stock', 'meta stock', 'nvidia stock'
  ];

  // Check if query contains stock keywords
  const hasStockKeyword = stockKeywords.some(keyword => queryLower.includes(keyword));
  
  // Extract stock symbols (ticker patterns)
  // Matches letter combinations like AAPL, TSLA, MSFT, etc. (case insensitive)
  // Also matches patterns like "AAPL stock" or "price of TSLA" or "what's aapl?"
  const tickerPattern = /\b([A-Z]{1,5})\b/gi;
  const matches = query.match(tickerPattern);
  
  // Extract potential tickers (1-5 letters)
  let extractedSymbols: string[] = [];
  if (matches) {
    extractedSymbols = matches.filter(ticker => {
      // Filter out common words that might match the pattern
      const commonWords = ['I', 'A', 'AM', 'IT', 'IS', 'THE', 'FOR', 'ARE', 'WAS', 'WERE', 'YOU', 'TO', 'OF', 'IN', 'ON', 'AT', 'BY', 
                           'WHEN', 'TRUMP', 'WHAT', 'WHERE', 'WITH', 'FROM', 'THEN', 'THEM', 'THIS', 'THAT', 'THESE', 'THOSE',
                           'WHO', 'WHOM', 'WHOSE', 'WHICH', 'HOW', 'CAN', 'BUT', 'AND', 'OR', 'NOT', 'ALL', 'HER', 'HIM', 'HIS'];
      const tickerUpper = ticker.toUpperCase();
      // Only accept if it's not a common word AND it's 2-5 characters (stock tickers are usually 2-5 chars)
      return ticker.length >= 2 && ticker.length <= 5 && !commonWords.includes(tickerUpper);
    }).map(t => t.toUpperCase());
  }

  // Also check for explicit mentions like "Apple" (AAPL), "Tesla" (TSLA), etc.
  const companyNameMap: { [key: string]: string } = {
    'apple': 'AAPL',
    'tesla': 'TSLA',
    'microsoft': 'MSFT',
    'google': 'GOOGL',
    'amazon': 'AMZN',
    'meta': 'META',
    'facebook': 'META',
    'nvidia': 'NVDA',
    'netflix': 'NFLX',
    'disney': 'DIS',
    'jpmorgan': 'JPM',
    'visa': 'V',
    'mastercard': 'MA',
    'uber': 'UBER',
    'airbnb': 'ABNB',
    'amd': 'AMD',
    'intel': 'INTC',
    'oracle': 'ORCL',
    'salesforce': 'CRM',
    'adobe': 'ADBE'
  };

  for (const [companyName, ticker] of Object.entries(companyNameMap)) {
    if (queryLower.includes(companyName) && !extractedSymbols.includes(ticker)) {
      extractedSymbols.push(ticker);
    }
  }

  // Remove duplicates
  extractedSymbols = [...new Set(extractedSymbols)];

  // Consider it a stock query if:
  // 1. Has stock keywords AND has symbols, OR
  // 2. Has extracted symbols (user might just say "AAPL" or "What's AAPL?")
  const isStockQuery = (hasStockKeyword && extractedSymbols.length > 0) || 
                       (extractedSymbols.length > 0 && extractedSymbols.length <= 5); // Limit to 5 symbols max

  return {
    isStockQuery,
    symbols: extractedSymbols
  };
}

/**
 * Fetch real-time stock quote from Yahoo Finance
 */
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const quote = await yahooFinance.quote(symbol.toUpperCase());
    
    if (!quote || quote.regularMarketPrice === null || quote.regularMarketPrice === undefined) {
      return null;
    }

    const currentPrice = quote.regularMarketPrice;
    const previousClose = quote.regularMarketPreviousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = quote.regularMarketChangePercent || ((change / previousClose) * 100);

    // Convert Yahoo Finance format to our format
    return {
      c: currentPrice,
      d: change,
      dp: changePercent,
      h: quote.regularMarketDayHigh || currentPrice,
      l: quote.regularMarketDayLow || currentPrice,
      o: quote.regularMarketOpen || currentPrice,
      pc: previousClose,
      t: quote.regularMarketTime ? Math.floor(quote.regularMarketTime / 1000) : Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch stock company profile from Yahoo Finance
 */
export async function fetchStockProfile(symbol: string): Promise<{ name?: string; currency?: string; exchange?: string } | null> {
  try {
    const quote = await yahooFinance.quote(symbol.toUpperCase());
    
    if (!quote) {
      return null;
    }

    return {
      name: quote.longName || quote.shortName || quote.displayName,
      currency: quote.currency || 'USD',
      exchange: quote.fullExchangeName || quote.exchange
    };
  } catch (error) {
    console.error(`Error fetching stock profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical candlestick data for trends from Yahoo Finance
 */
export async function fetchStockCandles(
  symbol: string, 
  resolution: 'D' | 'W' | 'M' = 'D',
  days: number = 30
): Promise<StockCandle | null> {
  try {
    const now = new Date();
    const from = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Convert resolution to Yahoo Finance interval
    let interval: '1d' | '1wk' | '1mo' = '1d';
    if (resolution === 'W') interval = '1wk';
    if (resolution === 'M') interval = '1mo';

    const historicalData = await yahooFinance.historical(symbol.toUpperCase(), {
      period1: from,
      period2: now,
      interval
    });

    if (!historicalData || historicalData.length === 0) {
      console.warn(`No historical data returned for ${symbol}`);
      return null;
    }

    // Convert Yahoo Finance format to our format
    return {
      c: historicalData.map(d => d.close),
      h: historicalData.map(d => d.high),
      l: historicalData.map(d => d.low),
      o: historicalData.map(d => d.open),
      t: historicalData.map(d => Math.floor(new Date(d.date).getTime() / 1000)),
      v: historicalData.map(d => d.volume || 0)
    };
  } catch (error) {
    console.error(`Error fetching stock candles for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch complete stock data (quote, profile, and candles)
 */
export async function fetchStockData(symbols: string[]): Promise<StockData[]> {
  // Fetch data for all symbols in parallel
  const promises = symbols.map(async (symbol) => {
    try {
      const [quote, profile, candles] = await Promise.all([
        fetchStockQuote(symbol),
        fetchStockProfile(symbol),
        fetchStockCandles(symbol, 'D', 30) // Last 30 days
      ]);

      // Only include if we got at least a quote
      if (quote) {
        return {
          symbol: symbol.toUpperCase(),
          quote,
          candles,
          companyName: profile?.name,
          currency: profile?.currency,
          exchange: profile?.exchange
        } as StockData;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  });

  const stockDataArray = await Promise.all(promises);
  return stockDataArray.filter((data): data is StockData => data !== null);
}

/**
 * Format stock data into a readable string for display
 */
export function formatStockData(stockData: StockData): string {
  const { symbol, quote, companyName, currency = 'USD', candles } = stockData;
  
  if (!quote) {
    return '';
  }

  // Add null checks for safety
  if (quote.c === null || quote.c === undefined || 
      quote.d === null || quote.d === undefined || 
      quote.dp === null || quote.dp === undefined) {
    return `**${companyName || symbol} (${symbol})**\n\n*Price data unavailable*\n`;
  }

  const name = companyName || symbol;
  const price = quote.c.toFixed(2);
  const change = quote.d.toFixed(2);
  const changePercent = quote.dp.toFixed(2);
  const changeSign = quote.d >= 0 ? '+' : '';
  const changeEmoji = quote.d >= 0 ? '📈' : '📉';
  
  let text = `**${name} (${symbol})**\n\n`;
  text += `**Price:** ${currency} ${price}\n`;
  text += `**Change:** ${changeSign}${change} (${changeSign}${changePercent}%) ${changeEmoji}\n`;
  
  // Safely format optional fields
  if (quote.o !== null && quote.o !== undefined) {
    text += `**Open:** ${currency} ${quote.o.toFixed(2)}\n`;
  }
  if (quote.h !== null && quote.h !== undefined) {
    text += `**High:** ${currency} ${quote.h.toFixed(2)}\n`;
  }
  if (quote.l !== null && quote.l !== undefined) {
    text += `**Low:** ${currency} ${quote.l.toFixed(2)}\n`;
  }
  if (quote.pc !== null && quote.pc !== undefined) {
    text += `**Previous Close:** ${currency} ${quote.pc.toFixed(2)}\n`;
  }

  // Add trend information if we have candle data
  if (candles && candles.c && candles.c.length >= 2) {
    const prices = candles.c;
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const trendChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    const trendSign = trendChange >= 0 ? '+' : '';
    const trendEmoji = trendChange >= 0 ? '↗️' : '↘️';
    
    text += `\n**30-Day Trend:** ${trendSign}${trendChange.toFixed(2)}% ${trendEmoji}\n`;
  }

  return text;
}

