
import React, { useEffect, useState } from 'react';
import { MarketSentiment, TimeRange } from '../types';
import { getMarketOverview } from '../services/geminiService';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MarketOverview: React.FC = () => {
  const [data, setData] = useState<MarketSentiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  const fetchData = async (range: TimeRange) => {
    setLoading(true);
    try {
      const result = await getMarketOverview(range);
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch market data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return 'text-emerald-400 bg-emerald-900/20 border-emerald-800';
      case 'Bearish': return 'text-rose-400 bg-rose-900/20 border-rose-800';
      default: return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
     switch (sentiment) {
      case 'Bullish': return <TrendingUp className="w-5 h-5" />;
      case 'Bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getRegionName = (region: string) => {
    switch(region) {
      case 'CN': return '中国 A股市场';
      case 'HK': return '中国 香港市场';
      case 'US': return '美国 证券市场';
      default: return region;
    }
  };

  const ranges: TimeRange[] = ['1D', '1W', '1M', '1Y'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 gap-4">
         <div>
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Globe className="w-5 h-5 text-blue-400" /> 全球核心市场概览
           </h2>
           {lastUpdated && <p className="text-xs text-gray-500 mt-1">上次更新: {lastUpdated}</p>}
         </div>
         
         <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
              {ranges.map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  disabled={loading}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    timeRange === r 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button 
              onClick={() => fetchData(timeRange)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-all flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{loading ? '分析中...' : '刷新'}</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading && data.length === 0 ? (
           // Skeletons
           [1,2,3].map(i => (
             <div key={i} className="h-80 bg-gray-900 rounded-xl animate-pulse border border-gray-800"></div>
           ))
        ) : (
          data.map((market) => (
            <div key={market.region} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-white">{getRegionName(market.region)}</h3>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${getSentimentColor(market.sentiment)}`}>
                    {getSentimentIcon(market.sentiment)}
                    {market.sentiment === 'Bullish' ? '看多 (Bullish)' : market.sentiment === 'Bearish' ? '看空 (Bearish)' : '震荡 (Neutral)'}
                  </div>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">{market.summary}</p>
              </div>

              {/* Indices & Charts */}
              <div className="p-5 flex-1 flex flex-col gap-6">
                 {market.indices.map((index, idx) => (
                   <div key={idx}>
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-300">{index.name}</span>
                            <div className="text-xs text-gray-500 font-mono">{index.value}</div>
                          </div>
                          <div className={`text-xs font-mono font-bold ${index.isUp ? 'text-stock-up' : 'text-stock-down'}`}>
                            {index.isUp ? '+' : ''}{index.changePercent}
                          </div>
                      </div>
                      
                      {/* Sparkline Chart */}
                      {index.history && index.history.length > 0 && (
                        <div className="h-16 w-full bg-gray-950/50 rounded border border-gray-800/50">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={index.history}>
                              <defs>
                                <linearGradient id={`grad-${idx}-${market.region}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={index.isUp ? "#ef4444" : "#22c55e"} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={index.isUp ? "#ef4444" : "#22c55e"} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#111827', border: 'none', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ display: 'none' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={index.isUp ? "#ef4444" : "#22c55e"} 
                                fill={`url(#grad-${idx}-${market.region})`} 
                                strokeWidth={2}
                                isAnimationActive={false}
                              />
                              <YAxis domain={['auto', 'auto']} hide />
                              <XAxis dataKey="time" hide />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                   </div>
                 ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MarketOverview;
