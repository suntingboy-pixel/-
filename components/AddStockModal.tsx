
import React, { useState } from 'react';
import { Market } from '../types';
import { X, Plus, Tag } from 'lucide-react';

interface AddStockModalProps {
  isOpen: boolean;
  existingGroups: string[];
  onClose: () => void;
  onAdd: (symbol: string, name: string, market: Market, group: string) => void;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, existingGroups, onClose, onAdd }) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<Market>(Market.CN);
  const [group, setGroup] = useState('默认分组');
  const [isCustomGroup, setIsCustomGroup] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol && name) {
      onAdd(symbol, name, market, group);
      setSymbol('');
      setName('');
      setGroup('默认分组');
      onClose();
    }
  };

  const getMarketLabel = (m: Market) => {
    switch (m) {
      case Market.CN: return 'A股 (CN)';
      case Market.HK: return '港股 (HK)';
      case Market.US: return '美股 (US)';
      default: return m;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> 添加自选股
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">选择市场</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(Market).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  className={`px-2 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    market === m
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                  }`}
                >
                  {getMarketLabel(m)}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-400 mb-1">分组 (Group)</label>
             <div className="flex gap-2 mb-2">
               {!isCustomGroup ? (
                 <select 
                   value={group}
                   onChange={(e) => {
                     if (e.target.value === '__NEW__') {
                       setIsCustomGroup(true);
                       setGroup('');
                     } else {
                       setGroup(e.target.value);
                     }
                   }}
                   className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                 >
                   {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                   <option value="__NEW__">+ 新建分组...</option>
                 </select>
               ) : (
                 <div className="flex gap-2 w-full">
                   <input 
                     type="text"
                     value={group}
                     onChange={(e) => setGroup(e.target.value)}
                     placeholder="输入新分组名称"
                     autoFocus
                     className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                   />
                   <button 
                     type="button" 
                     onClick={() => setIsCustomGroup(false)}
                     className="text-gray-400 hover:text-white"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
               )}
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">股票代码</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="例如: 600519, 00700, AAPL"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">公司名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 贵州茅台, 腾讯控股"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
            >
              开始追踪分析
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;
