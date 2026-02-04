import React, { useState, useMemo } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Search, Filter, Trash2, Download, PackageOpen, Box, CalendarClock, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventoryProps {
  inventory: PaperRoll[];
  onDelete: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onDelete }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_STOCK' | 'SHIPPED'>('ALL');

  const filteredData = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = 
        item.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.customerOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.details.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'ALL' || item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [inventory, search, filterStatus]);

  const handleDelete = (id: string) => {
      if(window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
          onDelete(id);
          toast.success('Entrée supprimée');
      }
  }

  const exportCSV = () => {
    const headers = ["Numero Bobine", "Code EAN", "Details", "Commande", "Statut", "Date Entree", "Date Sortie"];
    
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('fr-FR');
    };

    const rows = filteredData.map(e => {
        return [
            e.rollNumber,
            e.eanProductCode,
            `"${e.details.replace(/"/g, '""')}"`,
            e.customerOrderNumber,
            e.status === StockStatus.IN_STOCK ? 'En Stock' : 'Expédié',
            `"${formatDate(e.dateIn)}"`,
            `"${formatDate(e.dateOut)}"`
        ].join(";");
    });

    const csvBody = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventaire_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé !");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Inventaire</h2>
          <p className="text-sm md:text-base text-slate-500">
            {filteredData.length} bobine{filteredData.length > 1 ? 's' : ''} affichée{filteredData.length > 1 ? 's' : ''}
          </p>
        </div>
        <button 
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm active:scale-95"
        >
            <Download size={18} />
            <span className="text-sm">CSV</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4 sticky top-[4.5rem] lg:static z-20">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher bobine, commande..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm md:text-base"
            />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'IN_STOCK', 'SHIPPED'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
                        filterStatus === status 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {status === 'ALL' ? 'Tout' : status === 'IN_STOCK' ? 'En Stock' : 'Expédié'}
                </button>
            ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Bobine</th>
                <th className="px-6 py-4">EAN</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Commande</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">{item.rollNumber}</td>
                  <td className="px-6 py-4 font-mono text-xs">{item.eanProductCode}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{item.details}</td>
                  <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-medium">
                          {item.customerOrderNumber}
                      </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.status === StockStatus.IN_STOCK 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === StockStatus.IN_STOCK ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                      {item.status === StockStatus.IN_STOCK ? 'Stock' : 'Expédié'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-300 hover:text-red-500 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                          <Trash2 size={18} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-3">
        {filteredData.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${item.status === StockStatus.IN_STOCK ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {item.status === StockStatus.IN_STOCK ? <Box size={20} /> : <PackageOpen size={20} />}
                        </div>
                        <div>
                            <div className="font-mono font-bold text-slate-900 text-lg tracking-tight">
                                {item.rollNumber.slice(-6)}
                                <span className="text-slate-400 text-sm font-normal">...{item.rollNumber.slice(0,4)}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{item.details}</div>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                         item.status === StockStatus.IN_STOCK 
                         ? 'bg-blue-50 text-blue-700 border-blue-100' 
                         : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                        {item.status === StockStatus.IN_STOCK ? 'Stock' : 'Sortie'}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <Hash size={12} className="text-slate-400"/>
                        <span className="font-mono">{item.customerOrderNumber}</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <CalendarClock size={12} className="text-slate-400"/>
                        <span>{new Date(item.status === StockStatus.SHIPPED ? item.dateOut! : item.dateIn).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-300 font-mono">{item.id.slice(0,8)}</span>
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 -mr-2"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        ))}
        {filteredData.length === 0 && (
             <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Box size={48} className="mx-auto mb-2 opacity-20" />
                <p>Aucune bobine trouvée</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;