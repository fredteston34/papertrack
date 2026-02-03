import React from 'react';
import { LayoutDashboard, LogIn, LogOut, Package, Bot, Box } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
    { id: 'ENTRIES', label: 'Entrées (Scan)', icon: <LogIn size={20} /> },
    { id: 'EXITS', label: 'Sorties (Scan)', icon: <LogOut size={20} /> },
    { id: 'INVENTORY', label: 'Inventaire', icon: <Package size={20} /> },
    { id: 'ASSISTANT', label: 'Assistant IA', icon: <Bot size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Box size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">PaperTrack</h1>
          <p className="text-xs text-slate-400">Gestion de Stock</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className={`${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Système Prêt</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-green-400">En ligne</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;