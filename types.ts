
export enum Market {
  CN = 'CN (A-Share)',
  HK = 'HK (Hong Kong)',
  US = 'US (United States)',
}

export type TimeRange = '1D' | '1W' | '1M' | '1Q' | '1Y';

export interface StrategyReport {
  score: number; // 0-100
  summary: string;
  keyPoints: string[];
}

export interface StockAnalysis {
  lastUpdated: string;
  currentPrice: number;
  currency: string;
  peTTM: number | null;
  peForward: number | null; // Dynamic PE / Forward PE
  pb: number | null;
  dividendYield: number | null;
  marketCap: string;
  revenueGrowth: string;
  
  // Valuation
  intrinsicValue: number;
  buyPrice: number; // Margin of Safety
  addPositionPrice: number;
  sellPrice: number;
  stopLossPrice: number;
  
  // Recommendations
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  reasoning: string;

  // Specific Strategies
  graham: StrategyReport;
  schloss: StrategyReport;
  fisher: StrategyReport;
  
  // Source Links for grounding
  sources?: Array<{title: string, uri: string}>;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  group: string; // New field for grouping
  isAnalyzing: boolean;
  error?: string;
  data?: StockAnalysis;
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  isUp: boolean;
  // History for charts
  history?: { time: string; value: number }[];
}

export interface MarketSentiment {
  region: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  indices: MarketIndex[];
}

export const SAMPLE_STOCKS: Stock[] = [
  { id: '1', symbol: '600519', name: '贵州茅台', market: Market.CN, group: '白酒龙头', isAnalyzing: false },
  { id: '2', symbol: '00700', name: '腾讯控股', market: Market.HK, group: '科技巨头', isAnalyzing: false },
  { id: '3', symbol: 'AAPL', name: 'Apple Inc.', market: Market.US, group: '科技巨头', isAnalyzing: false },
];
