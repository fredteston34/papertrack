import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { LogOut, CheckCircle, XCircle, Search, PackageMinus, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { sanitizeInput } from '../utils/scanner';

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
    
    const cleanedValue = sanitizeInput(scanValue, true);

    if (cleanedValue.length !== 20) {
        toast.error("Format invalide (20 chiffres attendus)");
        setScanValue(cleanedValue); 
        return;
    }

    const result = onShip(cleanedValue);
    
    if (result) {
      setLastScanned(result);
      toast.success(`Sortie confirmée !`);
      setScanValue('');
    } else {
        const alreadyShipped = inventory.find(r => r.rollNumber === cleanedValue && r.status === StockStatus.SHIPPED);
        if (alreadyShipped) {
            toast.error(`Déjà expédiée !`, { icon: '⚠️' });
        } else {
            toast.error(`Introuvable`, { icon: '🚫' });
        }
        setScanValue('');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sortie Rapide</h2>
            <p className="text-slate-500 text-sm">Prêt à scanner</p>
          </div>
          <div className="bg-orange-50 text-orange-600 p-2 rounded-xl">
             <PackageMinus size={24} />
          </div>
        </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <form onSubmit={handleScan} className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                <Search size={28} />
            </div>
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={scanValue}
                onChange={(e) => setScanValue(sanitizeInput(e.target.value, true))}
                className="w-full pl-16 pr-4 py-6 text-2xl md:text-3xl font-mono font-bold text-slate-900 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                placeholder="Scanner..."
                autoFocus
                autoComplete="off"
            />
        </form>
        <p className="text-center text-xs text-slate-400 mt-4 font-medium uppercase tracking-wide">
             Mode Douchette Actif
        </p>
      </div>

      {lastScanned && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 animate-enter relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <CheckCircle size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <CheckCircle className="text-white" size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Sortie Enregistrée</h3>
                </div>
                <div className="space-y-2 font-mono text-sm opacity-90">
                    <div className="flex justify-between border-b border-white/20 pb-2">
                        <span>Bobine</span>
                        <span className="font-bold">{lastScanned.rollNumber.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/20 pb-2">
                        <span>Commande</span>
                        <span>{lastScanned.customerOrderNumber}</span>
                    </div>
                    <div className="pt-2 text-xs opacity-75 truncate">
                        {lastScanned.details}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Mini History List */}
      {!lastScanned && (
         <div className="mt-8">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-3 px-2">
                <History size={14} />
                <span>Dernières sorties</span>
            </div>
            <div className="space-y-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                {inventory.filter(i => i.status === StockStatus.SHIPPED).slice(0, 3).map(roll => (
                    <div key={roll.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-mono">{roll.rollNumber.slice(-10)}</span>
                        <span className="text-slate-400">{new Date(roll.dateOut!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                ))}
            </div>
         </div>
      )}
    </div>
  );
};

export default Exits;