import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogIn, LogOut, Package, Bot, Box } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
    { id: 'ENTRIES', label: 'Entrées (Scan)', icon: <LogIn size={20} /> },
    { id: 'EXITS', label: 'Sorties (Scan)', icon: <LogOut size={20} /> },
    { id: 'INVENTORY', label: 'Inventaire', icon: <Package size={20} /> },
    { id: 'ASSISTANT', label: 'Assistant IA', icon: <Bot size={20} /> },
  ];

  return (
    <div className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-slate-900 text-white shadow-2xl z-50 flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-2 rounded-lg shadow-lg shadow-blue-900/50">
              <Box size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">PaperTrack</h1>
              <p className="text-xs text-slate-400 font-medium">Pro Edition</p>
            </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                currentView === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
              }`}
            >
              <span className={`relative z-10 ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}`}>
                {item.icon}
              </span>
              <span className="relative z-10 font-medium tracking-wide">{item.label}</span>
              
              {currentView === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-100" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className={`rounded-xl p-4 border transition-colors ${isOnline ? 'bg-slate-800/50 border-slate-700' : 'bg-red-900/10 border-red-900/30'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Système</span>
                <span className={`w-2 h-2 rounded-full shadow-lg ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : 'bg-red-500'}`}></span>
            </div>
            <div className={`text-sm font-semibold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? 'Connecté' : 'Hors ligne'}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Sidebar;