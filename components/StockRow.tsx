
import React from 'react';
import { Stock } from '../types';
import { Loader2, AlertTriangle, RefreshCw, Trash2, Search, GripVertical } from 'lucide-react';

interface StockRowProps {
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

const StockRow: React.FC<StockRowProps> = ({ 
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

  const getRecLabel = (rec: string) => {
     switch (rec) {
      case 'BUY': return '买入';
      case 'SELL': return '卖出';
      case 'HOLD': return '持有';
      case 'WAIT': return '观望';
      default: return rec;
    }
  };

  const getRecStyle = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'text-emerald-400 bg-emerald-900/20 border-emerald-800';
      case 'SELL': return 'text-rose-400 bg-rose-900/20 border-rose-800';
      default: return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
    }
  };

  return (
    <div 
      className="group grid grid-cols-12 gap-4 items-center bg-gray-900/50 border-b border-gray-800 p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
      onClick={() => data && onSelect(stock)}
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, stock.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, stock.id)}
    >
      {/* Name & Symbol with Drag Handle */}
      <div className="col-span-3 flex items-center gap-2">
         {draggable && (
           <div className="text-gray-700 group-hover:text-gray-500 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4" />
           </div>
         )}
         <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm truncate">{stock.name}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 font-mono">{stock.symbol}</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-1 rounded">{stock.market.split(' ')[0]}</span>
            </div>
         </div>
      </div>

      {/* Status / Price */}
      <div className="col-span-2">
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">分析中...</span>
          </div>
        ) : error ? (
           <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <button onClick={(e) => {e.stopPropagation(); onRefresh(stock)}} className="text-xs underline">重试</button>
          </div>
        ) : data ? (
          <div>
             <div className="font-mono text-white font-medium">{data.currentPrice.toFixed(2)} <span className="text-xs text-gray-500">{data.currency}</span></div>
             <div className={`text-[10px] inline-block px-2 py-0.5 rounded border mt-1 ${getRecStyle(data.recommendation)}`}>
               {getRecLabel(data.recommendation)}
             </div>
          </div>
        ) : (
          <button 
            onClick={(e) => {e.stopPropagation(); onRefresh(stock)}}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-1 rounded"
          >
            <RefreshCw className="w-3 h-3" /> 分析
          </button>
        )}
      </div>

      {/* Price Monitoring (Valuation) */}
      <div className="col-span-2 hidden md:block">
        {data ? (
           <div className="space-y-1">
             <div className="text-xs text-gray-400">买入价: <span className="text-emerald-400 font-mono">{data.buyPrice.toFixed(2)}</span></div>
             <div className="text-xs text-gray-400">内在价值: <span className="text-blue-400 font-mono">{data.intrinsicValue.toFixed(2)}</span></div>
           </div>
        ) : <span className="text-gray-600">-</span>}
      </div>

       {/* New Financials Column (PE, PB, Cap) */}
      <div className="col-span-3 hidden md:grid grid-cols-2 gap-x-2 gap-y-1">
        {data ? (
          <>
            <div className="text-xs text-gray-400 flex justify-between">
               <span>PE(TTM):</span> <span className="text-white font-mono">{data.peTTM ? data.peTTM.toFixed(1) : '-'}</span>
            </div>
             <div className="text-xs text-gray-400 flex justify-between">
               <span>PE(动):</span> <span className="text-blue-300 font-mono">{data.peForward ? data.peForward.toFixed(1) : '-'}</span>
            </div>
            <div className="text-xs text-gray-400 flex justify-between">
               <span>PB:</span> <span className="text-white font-mono">{data.pb ? data.pb.toFixed(1) : '-'}</span>
            </div>
             <div className="text-xs text-gray-400 flex justify-between col-span-2 border-t border-gray-800 pt-1 mt-1">
               <span>市值:</span> <span className="text-white font-mono truncate ml-1" title={data.marketCap}>{data.marketCap.split(' ')[0]}</span>
            </div>
          </>
        ) : <span className="text-gray-600">-</span>}
      </div>

      {/* Actions */}
      <div className="col-span-2 md:col-span-2 flex justify-end gap-2">
         <button 
            onClick={(e) => { e.stopPropagation(); data ? onSelect(stock) : onRefresh(stock); }}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="查看详情"
         >
            <Search className="w-4 h-4" />
         </button>
         <button 
            onClick={(e) => { e.stopPropagation(); onRemove(stock.id); }}
            className="p-2 text-gray-400 hover:text-rose-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title="删除"
         >
            <Trash2 className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};

export default StockRow;
