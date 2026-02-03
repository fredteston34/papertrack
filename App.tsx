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
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
            {renderView()}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default App;