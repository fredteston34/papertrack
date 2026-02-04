import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { ViewState, PaperRoll, StockStatus } from './types';
import { getInventory, saveRoll, updateRollStatus, deleteRoll } from './services/storageService';
import Dashboard from './pages/Dashboard';
import Entries from './pages/Entries';
import Exits from './pages/Exits';
import Inventory from './pages/Inventory';
import Assistant from './pages/Assistant';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [inventory, setInventory] = useState<PaperRoll[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial load
  useEffect(() => {
    refreshInventory();
  }, []);

  const refreshInventory = () => {
    setInventory(getInventory());
  };

  const handleAddRoll = (roll: PaperRoll) => {
    const success = saveRoll(roll);
    if (success) {
      refreshInventory();
      return true;
    }
    return false;
  };

  const handleShipRoll = (rollNumber: string) => {
    const result = updateRollStatus(rollNumber, StockStatus.SHIPPED);
    if (result) {
      refreshInventory();
      return result;
    }
    return null;
  };

  const handleDeleteRoll = (id: string) => {
    deleteRoll(id);
    refreshInventory();
  }

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard inventory={inventory} />;
      case 'ENTRIES':
        return <Entries onAdd={handleAddRoll} />;
      case 'EXITS':
        return <Exits onShip={handleShipRoll} inventory={inventory} />;
      case 'INVENTORY':
        return <Inventory inventory={inventory} onDelete={handleDeleteRoll} />;
      case 'ASSISTANT':
        return <Assistant inventory={inventory} />;
      default:
        return <Dashboard inventory={inventory} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md p-4 lg:hidden border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-lg">
                    <Menu size={24} />
                 </button>
                 <span className="font-bold text-slate-800">PaperTrack</span>
            </div>
        </div>

        <div className="p-4 md:p-8 overflow-y-auto min-h-[calc(100vh-4rem)] lg:min-h-screen">
            <div className="max-w-7xl mx-auto">
                {renderView()}
            </div>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default App;