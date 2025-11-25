
import React, { useState, useEffect } from 'react';
import { Stock, TimeRange } from '../types';
import { getStockHistory } from '../services/geminiService';
import { X, ExternalLink, ShieldCheck, TrendingUp, BookOpen, AlertOctagon, RefreshCw, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

interface AnalysisDetailsProps {
  stock: Stock;
  onClose: () => void;
  onRefresh: (stock: Stock) => void;
}

const AnalysisDetails: React.FC<AnalysisDetailsProps> = ({ stock, onClose, onRefresh }) => {
  const { data, isAnalyzing } = stock;
  const [historyRange, setHistoryRange] = useState<TimeRange>('1D');
  const [historyData, setHistoryData] = useState<{time: string, price: number}[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const history = await getStockHistory(stock.symbol, stock.name, historyRange);
        if (isMounted) setHistoryData(history);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [stock.symbol, stock.name, historyRange]);

  if (!data) return null;

  // Prepare Chart Data for "Price vs Value"
  const valuationChartData = [
    { name: '当前价格', value: data.currentPrice, color: '#9ca3af' },
    { name: '买入区间', value: data.buyPrice, color: '#10b981' }, // Emerald-500
    { name: '内在价值', value: data.intrinsicValue, color: '#3b82f6' }, // Blue-500
    { name: '卖出区间', value: data.sellPrice, color: '#ef4444' }, // Red-500
  ];

  const getRecLabel = (rec: string) => {
     switch (rec) {
      case 'BUY': return '推荐买入';
      case 'SELL': return '建议卖出';
      case 'HOLD': return '建议持有';
      case 'WAIT': return '建议观望';
      default: return rec;
    }
  };

  const ranges: TimeRange[] = ['1D', '1W', '1M', '1Q', '1Y'];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-6 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              {stock.name}
              <span className="text-lg font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded-lg font-mono">{stock.symbol}</span>
            </h2>
            <div className="flex items-end gap-3 mt-1">
               <p className="text-emerald-500 font-mono text-2xl font-bold leading-none">
                  {data.currentPrice.toFixed(2)} <span className="text-sm font-normal">{data.currency}</span>
               </p>
               {data.lastUpdated && <span className="text-xs text-gray-500 flex items-center gap-1 mb-0.5"><Clock className="w-3 h-3"/> {data.lastUpdated}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onRefresh(stock)}
              disabled={isAnalyzing}
              className={`p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="刷新最新数据"
            >
               <RefreshCw className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">

          {/* Recommendation Banner */}
          <div className={`p-6 rounded-2xl border ${
            data.recommendation === 'BUY' ? 'bg-emerald-900/20 border-emerald-800' : 
            data.recommendation === 'SELL' ? 'bg-rose-900/20 border-rose-800' : 
            'bg-yellow-900/20 border-yellow-800'
          }`}>
            <div className="flex items-center gap-4 mb-3">
              <div className={`text-xl font-bold tracking-wider px-4 py-1 rounded bg-opacity-20 ${
                 data.recommendation === 'BUY' ? 'bg-emerald-500 text-emerald-400' : 
                 data.recommendation === 'SELL' ? 'bg-rose-500 text-rose-400' : 
                 'bg-yellow-500 text-yellow-400'
              }`}>
                {getRecLabel(data.recommendation)}
              </div>
              <h3 className="text-xl font-semibold text-gray-200">AI 投资综合决策</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">{data.reasoning}</p>
          </div>

          {/* Financial Vital Signs (Updated with New Metrics) */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> 核心财务指标
             </h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block">市盈率 (PE TTM)</span>
                  <span className="text-lg font-mono text-white">{data.peTTM ? data.peTTM.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block">动态市盈率 (Dyn PE)</span>
                  <span className="text-lg font-mono text-blue-400">{data.peForward ? data.peForward.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block">市净率 (PB)</span>
                  <span className="text-lg font-mono text-white">{data.pb ? data.pb.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block">总市值</span>
                  <span className="text-lg font-mono text-white truncate" title={data.marketCap}>{data.marketCap}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block">股息率 (Dividend)</span>
                  <span className="text-lg font-mono text-emerald-400">{data.dividendYield ? `${data.dividendYield}%` : 'N/A'}</span>
                </div>
                 <div className="space-y-1 col-span-3">
                   <span className="text-xs text-gray-500 block">营收增长趋势</span>
                   <span className="text-lg font-mono text-white">{data.revenueGrowth}</span>
                 </div>
             </div>
          </div>

          {/* Historical Trend Chart */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">历史动态趋势</h4>
                <div className="flex bg-gray-800 rounded-lg p-0.5">
                  {ranges.map(range => (
                    <button
                      key={range}
                      onClick={() => setHistoryRange(range)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${historyRange === range ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
             </div>
             
             <div className="h-64 w-full bg-gray-950/50 rounded border border-gray-800/50 relative">
               {loadingHistory ? (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> 加载历史数据...
                 </div>
               ) : historyData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                     <XAxis dataKey="time" tick={{fontSize: 10, fill: '#6b7280'}} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                     <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                     <ReTooltip 
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', color: '#fff', fontSize: '12px' }}
                     />
                     <Area type="monotone" dataKey="price" stroke="#10b981" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                   </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
                   暂无历史数据
                 </div>
               )}
             </div>
          </div>

          {/* Actionable Prices Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">内在价值 (Intrinsic)</div>
              <div className="text-xl font-mono font-bold text-blue-400">{data.intrinsicValue.toFixed(2)}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">安全边际买入价</div>
              <div className="text-xl font-mono font-bold text-emerald-400">{data.buyPrice.toFixed(2)}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">目标止盈价</div>
              <div className="text-xl font-mono font-bold text-rose-400">{data.sellPrice.toFixed(2)}</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <div className="text-xs text-gray-500 mb-1">止损参考价</div>
              <div className="text-xl font-mono font-bold text-gray-300">{data.stopLossPrice.toFixed(2)}</div>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">价格与价值对比分析</h4>
             <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={valuationChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={80} tick={{fill: '#9ca3af', fontSize: 12}} />
                   <ReTooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', color: '#fff' }}
                   />
                   <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                      {valuationChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Detailed Strategies */}
          <div className="space-y-6 pt-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" /> 大师策略模型详解
            </h4>

            {/* Graham */}
            <div className="bg-gray-900 p-5 rounded-xl border border-indigo-900/30">
              <div className="flex justify-between items-center mb-3">
                 <h5 className="text-indigo-400 font-bold flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4" /> 本杰明·格雷厄姆 (价值)
                 </h5>
                 <span className="text-xs font-bold bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded">
                   符合度: {data.graham.score}/100
                 </span>
              </div>
              <p className="text-sm text-gray-300 mb-3 italic">"{data.graham.summary}"</p>
              <ul className="space-y-1">
                {data.graham.keyPoints.map((point, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span> {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Schloss */}
            <div className="bg-gray-900 p-5 rounded-xl border border-blue-900/30">
              <div className="flex justify-between items-center mb-3">
                 <h5 className="text-blue-400 font-bold flex items-center gap-2">
                   <AlertOctagon className="w-4 h-4" /> 沃尔特·施洛斯 (深度价值)
                 </h5>
                 <span className="text-xs font-bold bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                   符合度: {data.schloss.score}/100
                 </span>
              </div>
              <p className="text-sm text-gray-300 mb-3 italic">"{data.schloss.summary}"</p>
              <ul className="space-y-1">
                {data.schloss.keyPoints.map((point, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span> {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fisher */}
            <div className="bg-gray-900 p-5 rounded-xl border border-purple-900/30">
              <div className="flex justify-between items-center mb-3">
                 <h5 className="text-purple-400 font-bold flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" /> 菲利普·费雪 (高成长)
                 </h5>
                 <span className="text-xs font-bold bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                   符合度: {data.fisher.score}/100
                 </span>
              </div>
              <p className="text-sm text-gray-300 mb-3 italic">"{data.fisher.summary}"</p>
              <ul className="space-y-1">
                {data.fisher.keyPoints.map((point, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">•</span> {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sources Footer */}
          {data.sources && data.sources.length > 0 && (
             <div className="pt-6 border-t border-gray-800">
                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">数据来源与参考 (Grounding)</h5>
                <div className="flex flex-wrap gap-2">
                  {data.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-[10px] text-gray-400 transition-colors"
                    >
                      {source.title.substring(0, 30)}... <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
             </div>
          )}
           
           <div className="text-[10px] text-gray-600 pt-2 text-center leading-tight">
              免责声明：本分析由人工智能生成，仅供信息参考，不构成任何投资建议。市场数据来源于搜索引擎，可能存在延迟或误差。投资有风险，入市需谨慎。
           </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisDetails;
