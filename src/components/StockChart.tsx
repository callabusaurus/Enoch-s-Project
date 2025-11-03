"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

interface StockChartProps {
  symbol: string;
  companyName?: string;
  data: Array<{ date: string; price: number; high: number; low: number }>;
  currentPrice: number;
  change: number;
  currency?: string;
}

export function StockChart({ 
  symbol, 
  companyName, 
  data, 
  currentPrice, 
  change, 
  currency = 'USD' 
}: StockChartProps) {
  const changeColor = change >= 0 ? '#22c55e' : '#ef4444';
  
  const chartConfig = {
    price: {
      label: 'Price',
      color: changeColor,
    },
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return `${currency} ${value.toFixed(2)}`;
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="my-4 p-4 border rounded-lg bg-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName || symbol} ({symbol})
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-[var(--text-primary)]">
            {formatCurrency(currentPrice)}
          </span>
          <span 
            className={`text-sm font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {formatPercent(change)}
          </span>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            tickFormatter={(value) => {
              // value is a formatted date string like "Jan 15, 2024"
              try {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  // If parsing fails, try to extract from the string format
                  const parts = value.split(' ');
                  if (parts.length >= 2) {
                    return `${parts[0]} ${parts[1]}`; // Return "Jan 15"
                  }
                  return value;
                }
                const month = date.getMonth() + 1;
                const day = date.getDate();
                return `${month}/${day}`;
              } catch {
                return value;
              }
            }}
            className="text-xs"
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            tickFormatter={(value) => value.toFixed(0)}
            className="text-xs"
          />
          <ChartTooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <span className="text-sm font-medium">{data.date}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="text-sm font-medium">{formatCurrency(data.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">High</span>
                        <span className="text-sm font-medium">{formatCurrency(data.high)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Low</span>
                        <span className="text-sm font-medium">{formatCurrency(data.low)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={changeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: changeColor }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

