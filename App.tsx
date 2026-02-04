import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNavbar from './components/MobileNavbar';
import { ViewState, PaperRoll, StockStatus } from './types';
import { getInventory, saveRoll, updateRollStatus, deleteRoll } from './services/storageService';
import Dashboard from './pages/Dashboard';
import Entries from './pages/Entries';
import Exits from './pages/Exits';
import Inventory from './pages/Inventory';
import Assistant from './pages/Assistant';
import { Toaster } from 'react-hot-toast';
import { Box } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [inventory, setInventory] = useState<PaperRoll[]>([]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
      />
      
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 h-16 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded text-white">
                <Box size={20} />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">PaperTrack</span>
          </div>
      </header>

      <main className="lg:ml-64 pt-20 lg:pt-8 pb-24 lg:pb-8 min-h-screen transition-all duration-300">
        <div className="px-4 md:px-8 max-w-7xl mx-auto">
            <div className="animate-enter">
                {renderView()}
            </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavbar currentView={currentView} setView={setCurrentView} />

      <Toaster 
        position="top-right"
        toastOptions={{
            className: 'text-sm font-medium',
            style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
        }} 
       />
    </div>
  );
};

export default App;