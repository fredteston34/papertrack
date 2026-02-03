import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { LogOut, CheckCircle, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExitsProps {
  onShip: (rollNumber: string) => PaperRoll | null;
  inventory: PaperRoll[];
}

const Exits: React.FC<ExitsProps> = ({ onShip, inventory }) => {
  const [scanValue, setScanValue] = useState('');
  const [lastScanned, setLastScanned] = useState<PaperRoll | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue.trim()) return;

    const result = onShip(scanValue);
    
    if (result) {
      setLastScanned(result);
      toast.success(`Sortie enregistrée: ${result.rollNumber}`);
      setScanValue('');
    } else {
        // Check if it was already shipped
        const alreadyShipped = inventory.find(r => r.rollNumber === scanValue && r.status === StockStatus.SHIPPED);
        if (alreadyShipped) {
            toast.error(`Erreur: Bobine ${scanValue} déjà expédiée !`);
        } else {
            toast.error(`Bobine ${scanValue} introuvable en stock.`);
        }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
       <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Sorties de Stock</h2>
          <p className="text-slate-500 mt-2">Scanner une bobine pour valider son expédition.</p>
        </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <form onSubmit={handleScan} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            <input
                ref={inputRef}
                type="text"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-2xl font-mono text-slate-900 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all"
                placeholder="Scanner Bobine..."
                autoFocus
            />
            <button 
                type="submit" 
                className="absolute right-3 top-3 bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
                Sortir
            </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-4">Appuyez sur Entrée après le scan</p>
      </div>

      {lastScanned && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="text-green-600" size={32} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-green-900">Sortie Validée</h3>
                    <div className="mt-2 space-y-1 text-sm text-green-800">
                        <p><span className="font-semibold">Bobine:</span> {lastScanned.rollNumber}</p>
                        <p><span className="font-semibold">Commande:</span> {lastScanned.customerOrderNumber}</p>
                        <p><span className="font-semibold">Produit:</span> {lastScanned.details}</p>
                        <p><span className="font-semibold">Heure:</span> {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Exits;