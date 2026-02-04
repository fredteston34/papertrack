import React, { useState, useMemo } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Search, Filter, Trash2, Download } from 'lucide-react';
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
        ].join(";"); // Utilisation du point-virgule pour meilleure compatibilité Excel FR
    });

    const csvBody = [headers.join(";"), ...rows].join("\n");
    // Ajout du BOM pour l'encodage UTF-8 dans Excel
    const blob = new Blob(["\uFEFF" + csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventaire_papertrack_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé !");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Inventaire Global</h2>
          <p className="text-slate-500">Gérez et consultez l'historique complet.</p>
        </div>
        <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
        >
            <Download size={18} />
            Exporter CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher (Bobine, Commande, Détails)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            <Filter size={18} className="ml-2 text-slate-400 flex-shrink-0" />
            <button 
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Tout
            </button>
            <button 
                onClick={() => setFilterStatus('IN_STOCK')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filterStatus === 'IN_STOCK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                En Stock
            </button>
            <button 
                onClick={() => setFilterStatus('SHIPPED')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${filterStatus === 'SHIPPED' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Expédié
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[800px]">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Bobine</th>
                <th className="px-6 py-4">Produit (EAN)</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Commande</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{item.rollNumber}</td>
                    <td className="px-6 py-4 font-mono">{item.eanProductCode}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={item.details}>{item.details}</td>
                    <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono">
                            {item.customerOrderNumber}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.status === StockStatus.IN_STOCK 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === StockStatus.IN_STOCK ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        {item.status === StockStatus.IN_STOCK ? 'En Stock' : 'Expédié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 size={18} />
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Aucun résultat trouvé pour votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500">
            Affichage de {filteredData.length} élément(s)
        </div>
      </div>
    </div>
  );
};

export default Inventory;