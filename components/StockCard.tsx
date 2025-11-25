
import React from 'react';
import { Stock } from '../types';
import { Loader2, AlertTriangle, RefreshCw, Trash2, GripVertical } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
  onSelect: (stock: Stock) => void;
  onRefresh: (stock: Stock) => void;
  onRemove: (id: string) => void;
  // Drag Props
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

const StockCard: React.FC<StockCardProps> = ({ 
  stock, 
  onSelect, 
  onRefresh, 
  onRemove,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const { data, isAnalyzing, error } = stock;

  const getRecColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'SELL': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default: return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    }
  };

  const getRecLabel = (rec: string) => {
     switch (rec) {
      case 'BUY': return '买入';
      case 'SELL': return '卖出';
      case 'HOLD': return '持有';
      case 'WAIT': return '观望';
      default: return rec;
    }
  };

  return (
    <div 
      className="relative group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all duration-300 shadow-lg cursor-pointer hover:shadow-emerald-900/10"
      onClick={() => data && onSelect(stock)}
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, stock.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, stock.id)}
    >
      {/* Drag Handle */}
      {draggable && (
        <div className="absolute top-2 left-2 text-gray-600 cursor-grab hover:text-gray-400 active:cursor-grabbing p-1 z-10">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4 pl-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide truncate max-w-[160px]">{stock.name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="bg-gray-800 px-1.5 py-0.5 rounded">{stock.market.split(' ')[0]}</span>
            <span>{stock.symbol}</span>
          </div>
        </div>
        {data && (
          <div className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wider ${getRecColor(data.recommendation)}`}>
            {getRecLabel(data.recommendation)}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="min-h-[100px] flex flex-col justify-center">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center text-emerald-500 animate-pulse gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs text-gray-400">正在智能分析财报与数据...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-rose-400 gap-2">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs text-center">分析失败</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onRefresh(stock); }}
              className="mt-2 text-xs underline hover:text-rose-300"
            >
              重试
            </button>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Price Row */}
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-xs text-gray-500 mb-0.5">现价</p>
                  <p className="text-xl font-mono font-semibold text-white">
                    {data.currentPrice.toFixed(2)} <span className="text-xs text-gray-500 font-sans">{data.currency}</span>
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">建议买入价</p>
                  <p className="text-xl font-mono font-semibold text-emerald-400">
                    {data.buyPrice.toFixed(2)}
                  </p>
               </div>
            </div>

            {/* Financials Row */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-800 text-center">
               <div>
                  <p className="text-[10px] text-gray-500">市盈(TTM)</p>
                  <p className="text-xs font-mono text-white">{data.peTTM ? data.peTTM.toFixed(1) : '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500">市盈(动)</p>
                  <p className="text-xs font-mono text-blue-300">{data.peForward ? data.peForward.toFixed(1) : '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500">市净率</p>
                  <p className="text-xs font-mono text-white">{data.pb ? data.pb.toFixed(1) : '-'}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-500">总市值</p>
                  <p className="text-xs font-mono text-white truncate max-w-full" title={data.marketCap}>
                    {data.marketCap.replace(/CNY|HKD|USD/g, '').trim()}
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-600 gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onRefresh(stock); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm text-gray-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> 开始 AI 分析
            </button>
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onRefresh(stock); }}
          className="p-1.5 bg-gray-800 rounded-md text-gray-400 hover:text-emerald-400 hover:bg-gray-700"
          title="刷新数据"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(stock.id); }}
          className="p-1.5 bg-gray-800 rounded-md text-gray-400 hover:text-rose-400 hover:bg-gray-700"
          title="删除股票"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StockCard;
