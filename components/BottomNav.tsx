
import React from 'react';
import { Home, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'profile';
  onTabChange: (tab: 'home' | 'profile') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-md border-t border-gray-800 z-40 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'home' ? 'text-emerald-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">首页</span>
        </button>
        
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
            activeTab === 'profile' ? 'text-emerald-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
