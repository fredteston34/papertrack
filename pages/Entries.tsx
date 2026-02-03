import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Scan, Save, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { suggestCategory } from '../services/geminiService';

interface EntriesProps {
  onAdd: (roll: PaperRoll) => boolean;
}

const Entries: React.FC<EntriesProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    rollNumber: '',
    eanProductCode: '',
    details: '',
    customerOrderNumber: '',
  });
  
  const [loadingAi, setLoadingAi] = useState(false);
  const rollInputRef = useRef<HTMLInputElement>(null);

  // Auto focus on mount
  useEffect(() => {
    rollInputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiSuggest = async () => {
    if (!formData.details) return;
    setLoadingAi(true);
    const category = await suggestCategory(formData.details);
    if (category) {
        toast.success(`Catégorie suggérée : ${category}`);
        // Optionally append or replace, here we append
        setFormData(prev => ({...prev, details: `${prev.details} [${category}]`}));
    }
    setLoadingAi(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rollNumber || !formData.eanProductCode) {
      toast.error("Numéro de bobine et Code EAN requis");
      return;
    }

    const newRoll: PaperRoll = {
      id: crypto.randomUUID(),
      ...formData,
      status: StockStatus.IN_STOCK,
      dateIn: new Date().toISOString(),
    };

    const success = onAdd(newRoll);
    if (success) {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-green-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-900">Entrée Confirmée</p>
                <p className="mt-1 text-sm text-green-700">Bobine {formData.rollNumber} ajoutée.</p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 1500 });
      
      // Clear for next scan, keep Order Number as it likely stays same for batch
      setFormData({
        rollNumber: '',
        eanProductCode: '',
        details: '',
        customerOrderNumber: formData.customerOrderNumber
      });
      // Refocus for rapid scanning
      rollInputRef.current?.focus();
    } else {
      toast.error("Cette bobine existe déjà en stock !");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Entrées de Stock</h2>
          <p className="text-slate-500 mt-1">Scanner les nouvelles bobines pour les ajouter à l'inventaire.</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2">
            <Scan size={20} />
            <span className="font-semibold">Mode Scanner Actif</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center gap-2 text-slate-600">
            <AlertTriangle size={18} />
            <span className="text-sm">Assurez-vous que le curseur est dans le champ "Numéro de Bobine" avant de scanner.</span>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Numéro de Bobine (Roll Number)</label>
              <input
                ref={rollInputRef}
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-lg"
                placeholder="Scanner ici..."
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Code Produit (EAN)</label>
              <input
                type="text"
                name="eanProductCode"
                value={formData.eanProductCode}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                placeholder="Code EAN..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Détails (Rolls Details)</label>
              <div className="flex gap-2">
                <input
                    type="text"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Description du papier..."
                />
                <button 
                    type="button" 
                    onClick={handleAiSuggest}
                    disabled={loadingAi || !formData.details}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                    title="IA Suggestion"
                >
                    {loadingAi ? <RefreshCw className="animate-spin" size={20}/> : <span className="font-bold text-xs">AI TAG</span>}
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Commande Client (Order Number)</label>
              <input
                type="text"
                name="customerOrderNumber"
                value={formData.customerOrderNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Référence de commande..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setFormData({rollNumber: '', eanProductCode: '', details: '', customerOrderNumber: ''})}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Effacer
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={20} />
              Enregistrer Entrée
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Entries;