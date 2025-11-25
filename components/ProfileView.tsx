
import React, { useState } from 'react';
import { User as UserIcon, LogOut, Shield, ChevronRight, Lock, UserPlus } from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';

interface ProfileViewProps {
  currentUser: string | null;
  onLogin: (username: string) => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogin, onLogout }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLoginMode) {
      const result = loginUser(username, password);
      if (result.success) {
        onLogin(username);
      } else {
        setError(result.message);
      }
    } else {
      const result = registerUser(username, password);
      if (result.success) {
        setSuccessMsg(result.message + '，请登录');
        setIsLoginMode(true);
        setPassword('');
      } else {
        setError(result.message);
      }
    }
  };

  if (currentUser) {
    return (
      <div className="max-w-md mx-auto animate-fade-in space-y-6 pt-8">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex items-center gap-4 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-inner">
            <span className="text-2xl font-bold">{currentUser.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{currentUser}</h2>
            <p className="text-sm text-gray-400">普通会员</p>
          </div>
        </div>

        <div className="space-y-3">
           <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
             <button className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0">
               <div className="flex items-center gap-3 text-gray-200">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span>账户安全</span>
               </div>
               <ChevronRight className="w-4 h-4 text-gray-500" />
             </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0">
               <div className="flex items-center gap-3 text-gray-200">
                  <UserIcon className="w-5 h-5 text-blue-500" />
                  <span>个人设置</span>
               </div>
               <ChevronRight className="w-4 h-4 text-gray-500" />
             </button>
           </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-gray-800 hover:bg-gray-700 text-rose-400 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" /> 退出登录
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-10 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
          智投·价值
        </h1>
        <p className="text-gray-500">AI 驱动的专业价值投资助手</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex mb-6 border-b border-gray-700">
          <button 
            onClick={() => { setIsLoginMode(true); setError(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${isLoginMode ? 'text-emerald-400' : 'text-gray-500'}`}
          >
            账号登录
            {isLoginMode && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>}
          </button>
          <button 
            onClick={() => { setIsLoginMode(false); setError(''); setSuccessMsg(''); }}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${!isLoginMode ? 'text-emerald-400' : 'text-gray-500'}`}
          >
            注册新账号
            {!isLoginMode && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-xs text-gray-400 mb-1">用户名</label>
             <div className="relative">
               <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
               <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-gray-600"
                  placeholder="请输入用户名"
               />
             </div>
          </div>
          
          <div>
             <label className="block text-xs text-gray-400 mb-1">密码</label>
             <div className="relative">
               <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
               <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-gray-600"
                  placeholder="请输入密码"
               />
             </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
          >
            {isLoginMode ? '登 录' : '注 册'}
          </button>
        </form>
      </div>
      
      <div className="text-center mt-6 text-xs text-gray-600">
        {isLoginMode ? "还没有账号？点击上方注册" : "已有账号？点击上方登录"}
      </div>
    </div>
  );
};

export default ProfileView;
