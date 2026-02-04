import React from 'react';
import { LayoutDashboard, LogIn, LogOut, Package, Bot } from 'lucide-react';
import { ViewState } from '../types';

interface MobileNavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ currentView, setView }) => {
  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Accueil', icon: <LayoutDashboard size={20} /> },
    { id: 'ENTRIES', label: 'Entrée', icon: <LogIn size={20} /> },
    { id: 'EXITS', label: 'Sortie', icon: <LogOut size={20} /> },
    { id: 'INVENTORY', label: 'Stock', icon: <Package size={20} /> },
    { id: 'ASSISTANT', label: 'IA', icon: <Bot size={20} /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe z-50 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-90 ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-blue-50 -translate-y-1' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavbar;