
import React, { useState, useEffect, useMemo } from 'react';
import { Stock, SAMPLE_STOCKS, Market } from './types';
import { analyzeStockWithGemini } from './services/geminiService';
import StockCard from './components/StockCard';
import StockRow from './components/StockRow';
import AddStockModal from './components/AddStockModal';
import AnalysisDetails from './components/AnalysisDetails';
import MarketOverview from './components/MarketOverview';
import BottomNav from './components/BottomNav';
import ProfileView from './components/ProfileView';
import { LayoutGrid, Plus, Activity, List as ListIcon, Filter, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

type ViewMode = 'grid' | 'list';
type Tab = 'portfolio' | 'market';
type SortField = 'price' | 'score' | 'recommendation' | 'change' | 'name' | null;
type BottomTab = 'home' | 'profile';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('smartValue_currentUser'));
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('home');

  // Helper to get storage key based on user
  const getStorageKey = (user: string | null) => user ? `smartValueStocks_${user}` : 'smartValueStocks_guest';

  // Stock Data State
  const [stocks, setStocks] = useState<Stock[]>([]); // Initial empty, loaded via effect

  // Load stocks when user changes
  useEffect(() => {
    const key = getStorageKey(currentUser);
    const saved = localStorage.getItem(key);
    if (saved) {
      setStocks(JSON.parse(saved));
    } else {
      // If guest, use sample. If user, use empty.
      setStocks(currentUser ? [] : SAMPLE_STOCKS);
    }
    // Close details when user switches
    setSelectedStock(null);
  }, [currentUser]);

  // Save stocks when they change
  useEffect(() => {
    const key = getStorageKey(currentUser);
    localStorage.setItem(key, JSON.stringify(stocks));
  }, [stocks, currentUser]);

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<Tab>('portfolio');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Filter State
  const [filterMarket, setFilterMarket] = useState<string>('ALL');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');

  // Sort State
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Drag State
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Derived State: Unique Groups
  const uniqueGroups = useMemo(() => {
    const groups = new Set(stocks.map(s => s.group || '默认分组'));
    return Array.from(groups);
  }, [stocks]);

  // Derived State: Filtered & Sorted Stocks
  const processedStocks = useMemo(() => {
    let result = stocks.filter(s => {
      const matchMarket = filterMarket === 'ALL' || s.market.startsWith(filterMarket);
      const matchGroup = filterGroup === 'ALL' || (s.group || '默认分组') === filterGroup;
      return matchMarket && matchGroup;
    });

    if (sortField) {
      result.sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;

        switch(sortField) {
          case 'price':
            valA = a.data?.currentPrice || 0;
            valB = b.data?.currentPrice || 0;
            break;
          case 'score':
            valA = a.data ? (a.data.graham.score + a.data.schloss.score + a.data.fisher.score) / 3 : 0;
            valB = b.data ? (b.data.graham.score + b.data.schloss.score + b.data.fisher.score) / 3 : 0;
            break;
          case 'recommendation':
            const getWeight = (r?: string) => {
              if (r === 'BUY') return 4;
              if (r === 'HOLD') return 3;
              if (r === 'WAIT') return 2;
              if (r === 'SELL') return 1;
              return 0;
            };
            valA = getWeight(a.data?.recommendation);
            valB = getWeight(b.data?.recommendation);
            break;
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [stocks, filterMarket, filterGroup, sortField, sortDirection]);

  // Auth Handlers
  const handleLogin = (user: string) => {
    localStorage.setItem('smartValue_currentUser', user);
    setCurrentUser(user);
    setActiveBottomTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('smartValue_currentUser');
    setCurrentUser(null);
    // Stocks will auto-reset to guest via effect
  };

  // Stock Handlers
  const handleAddStock = (symbol: string, name: string, market: Market, group: string) => {
    const newStock: Stock = {
      id: Date.now().toString(),
      symbol,
      name,
      market,
      group: group || '默认分组',
      isAnalyzing: false,
    };
    setStocks(prev => [...prev, newStock]);
    handleRefresh(newStock);
  };

  const handleRemoveStock = (id: string) => {
    setStocks(prev => prev.filter(s => s.id !== id));
    if (selectedStock?.id === id) setSelectedStock(null);
  };

  const handleRefresh = async (stock: Stock) => {
    setStocks(prev => prev.map(s => s.id === stock.id ? { ...s, isAnalyzing: true, error: undefined } : s));

    try {
      const analysisData = await analyzeStockWithGemini(stock.symbol, stock.name, stock.market);
      
      setStocks(prev => prev.map(s => s.id === stock.id ? { 
        ...s, 
        isAnalyzing: false, 
        data: analysisData 
      } : s));
      
      setSelectedStock(currentSelected => {
        if (currentSelected && currentSelected.id === stock.id) {
           return { ...currentSelected, isAnalyzing: false, data: analysisData };
        }
        return currentSelected;
      });

    } catch (error: any) {
      console.error(error);
      // Handle specific error messages suitable for UI
      const errorMsg = error.message && error.message.includes('429') 
        ? "API 限流 (429): 请稍后再试" 
        : "分析失败";

      setStocks(prev => prev.map(s => s.id === stock.id ? { 
        ...s, 
        isAnalyzing: false, 
        error: errorMsg
      } : s));

       setSelectedStock(currentSelected => {
        if (currentSelected && currentSelected.id === stock.id) {
           return { ...currentSelected, isAnalyzing: false, error: errorMsg };
        }
        return currentSelected;
      });
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshingAll || stocks.length === 0) return;
    setIsRefreshingAll(true);
    setStocks(prev => prev.map(s => ({ ...s, isAnalyzing: true, error: undefined })));

    // Sequential execution to reduce rate limit hits
    // const promises = stocks.map(...) // Parallel might hit 429 easily
    
    // Let's keep parallel for now but user should be aware of limits
    const promises = stocks.map(stock => 
      analyzeStockWithGemini(stock.symbol, stock.name, stock.market)
        .then(data => ({ id: stock.id, status: 'fulfilled', data }))
        .catch(error => ({ id: stock.id, status: 'rejected', error }))
    );

    const results = await Promise.all(promises);

    setStocks(prev => {
      const newStocks = [...prev];
      results.forEach((res: any) => {
        const index = newStocks.findIndex(s => s.id === res.id);
        if (index !== -1) {
          const is429 = res.error && (
            res.error.status === 429 || 
            (res.error.message && res.error.message.includes('429'))
          );

          newStocks[index] = {
            ...newStocks[index],
            isAnalyzing: false,
            data: res.status === 'fulfilled' ? res.data : undefined,
            error: res.status === 'rejected' ? (is429 ? 'API限流' : '失败') : undefined
          };
        }
      });
      return newStocks;
    });
    setIsRefreshingAll(false);
  };

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    setStocks(prev => {
      const newStocks = [...prev];
      const fromIndex = newStocks.findIndex(s => s.id === draggedId);
      const toIndex = newStocks.findIndex(s => s.id === targetId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [movedItem] = newStocks.splice(fromIndex, 1);
        newStocks.splice(toIndex, 0, movedItem);
      }
      return newStocks;
    });
    setDraggedId(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-30 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                智投·价值
              </h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase">
                {currentUser ? `Hi, ${currentUser}` : 'AI Value Investing'}
              </p>
            </div>
          </div>

          {activeBottomTab === 'home' && (
            <>
               <div className="hidden md:flex bg-gray-900 rounded-lg p-1 border border-gray-800 gap-1">
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'portfolio' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  自选组合
                </button>
                 <button
                  onClick={() => setActiveTab('market')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'market' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  市场行情
                </button>
              </div>

              <div className="flex items-center gap-4">
                {activeTab === 'portfolio' && (
                  <div className="hidden md:flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-emerald-900/20"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">添加股票</span>
                  <span className="sm:hidden">添加</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {activeBottomTab === 'home' ? (
          <>
             {/* Mobile Tabs for Home */}
             <div className="md:hidden flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`flex-1 py-2 text-center text-sm font-bold border-b-2 ${activeTab === 'portfolio' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500'}`}
                >
                  自选组合
                </button>
                 <button
                  onClick={() => setActiveTab('market')}
                  className={`flex-1 py-2 text-center text-sm font-bold border-b-2 ${activeTab === 'market' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500'}`}
                >
                  市场行情
                </button>
             </div>

             {activeTab === 'market' ? (
               <MarketOverview />
             ) : (
               <>
                 {/* Filters & Bulk Actions */}
                 {stocks.length > 0 && (
                   <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                     <div className="flex flex-wrap gap-4 items-center">
                       <div className="flex items-center gap-2">
                         <Filter className="w-4 h-4 text-gray-500" />
                         <span className="text-sm text-gray-400 font-bold">筛选:</span>
                       </div>
                       
                       <select 
                         value={filterGroup}
                         onChange={(e) => setFilterGroup(e.target.value)}
                         className="bg-gray-900 border border-gray-800 text-sm rounded-lg px-3 py-1.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
                       >
                         <option value="ALL">所有分组</option>
                         {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>

                       <select 
                         value={filterMarket}
                         onChange={(e) => setFilterMarket(e.target.value)}
                         className="bg-gray-900 border border-gray-800 text-sm rounded-lg px-3 py-1.5 text-white focus:ring-emerald-500 focus:border-emerald-500"
                       >
                         <option value="ALL">所有市场</option>
                         <option value="CN">A股 (CN)</option>
                         <option value="HK">港股 (HK)</option>
                         <option value="US">美股 (US)</option>
                       </select>

                        {sortField && (
                          <button 
                            onClick={() => setSortField(null)}
                            className="ml-2 text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded hover:bg-emerald-900/40"
                          >
                            重置排序 (开启拖拽)
                          </button>
                        )}
                     </div>
                     
                     <div className="flex items-center gap-4 md:ml-auto">
                        <div className="text-xs text-gray-500">
                           共 {processedStocks.length} 只股票
                        </div>
                        <button 
                         onClick={handleRefreshAll}
                         disabled={isRefreshingAll}
                         className={`flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 text-sm font-bold rounded-lg transition-colors ${isRefreshingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                         {isRefreshingAll ? '正在刷新...' : '全部刷新'}
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Empty State */}
                 {stocks.length === 0 && (
                   <div className="text-center py-20">
                     <div className="inline-block p-4 rounded-full bg-gray-900 mb-4">
                       <LayoutGrid className="w-12 h-12 text-gray-600" />
                     </div>
                     <h3 className="text-lg font-medium text-gray-300">
                       {currentUser ? '您的组合是空的' : '暂无追踪股票'}
                     </h3>
                     <p className="text-gray-500 mt-1 max-w-md mx-auto">
                       添加股票代码，开始 AI 驱动的价值投资分析。
                     </p>
                     <button 
                       onClick={() => setIsModalOpen(true)}
                       className="mt-6 text-emerald-500 font-bold hover:underline"
                     >
                       添加第一只股票
                     </button>
                   </div>
                 )}

                 {/* Content */}
                 {processedStocks.length > 0 && (
                   <>
                     {viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {processedStocks.map(stock => (
                           <StockCard 
                             key={stock.id} 
                             stock={stock} 
                             onSelect={handleSelectStock}
                             onRefresh={handleRefresh}
                             onRemove={handleRemoveStock}
                             draggable={sortField === null}
                             onDragStart={handleDragStart}
                             onDragOver={handleDragOver}
                             onDrop={handleDrop}
                           />
                         ))}
                       </div>
                     ) : (
                       <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                         <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
                           <div 
                             className="col-span-3 cursor-pointer hover:text-white flex items-center gap-1"
                             onClick={() => handleSort('name')}
                           >
                             股票信息 <SortIcon field="name" />
                           </div>
                           <div 
                             className="col-span-2 cursor-pointer hover:text-white flex items-center gap-1"
                             onClick={() => handleSort('price')}
                           >
                             现价/建议 <SortIcon field="price" />
                           </div>
                           <div className="col-span-2 hidden md:block">价格监测</div>
                           <div className="col-span-3 hidden md:block">
                              财务指标
                           </div>
                           <div className="col-span-2 md:col-span-2 text-right">操作</div>
                         </div>
                         <div>
                           {processedStocks.map(stock => (
                             <StockRow
                               key={stock.id}
                               stock={stock}
                               onSelect={handleSelectStock}
                               onRefresh={handleRefresh}
                               onRemove={handleRemoveStock}
                               draggable={sortField === null}
                               onDragStart={handleDragStart}
                               onDragOver={handleDragOver}
                               onDrop={handleDrop}
                             />
                           ))}
                         </div>
                       </div>
                     )}
                   </>
                 )}
               </>
             )}
          </>
        ) : (
          <ProfileView 
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modals */}
      <AddStockModal 
        isOpen={isModalOpen} 
        existingGroups={uniqueGroups}
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddStock} 
      />

      {selectedStock && (
        <AnalysisDetails 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)}
          onRefresh={handleRefresh}
        />
      )}

      <BottomNav activeTab={activeBottomTab} onTabChange={setActiveBottomTab} />

    </div>
  );
};

export default App;
