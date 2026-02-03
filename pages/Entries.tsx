import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Scan, Save, RefreshCw, AlertTriangle, CheckCircle2, Lock, Unlock, ArrowRight } from 'lucide-react';
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

  const [locked, setLocked] = useState({
    eanProductCode: false,
    details: false,
    customerOrderNumber: false
  });
  
  const [loadingAi, setLoadingAi] = useState(false);
  
  const rollRef = useRef<HTMLInputElement>(null);
  const eanRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    rollRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleLock = (field: keyof typeof locked) => {
    setLocked(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAiSuggest = async () => {
    if (!formData.details) return;
    setLoadingAi(true);
    const category = await suggestCategory(formData.details);
    if (category) {
        toast.success(`Catégorie suggérée : ${category}`);
        setFormData(prev => ({...prev, details: `${prev.details} [${category}]`}));
    }
    setLoadingAi(false);
  }

  const submitForm = () => {
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
      
      // Clear fields based on lock status
      setFormData(prev => ({
        rollNumber: '',
        eanProductCode: locked.eanProductCode ? prev.eanProductCode : '',
        details: locked.details ? prev.details : '',
        customerOrderNumber: locked.customerOrderNumber ? prev.customerOrderNumber : ''
      }));
      
      // Always refocus roll number for next scan
      setTimeout(() => rollRef.current?.focus(), 50);
    } else {
      toast.error("Cette bobine existe déjà en stock !");
      setFormData(prev => ({...prev, rollNumber: ''}));
      rollRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const currentName = (e.target as HTMLInputElement).name;
      const val = formData[currentName as keyof typeof formData];

      if (!val) return; 

      if (nextRef && nextRef.current) {
         // Logic to skip locked/filled fields
         if (currentName === 'rollNumber' && formData.eanProductCode && formData.details && formData.customerOrderNumber) {
             submitForm();
         } else if (currentName === 'rollNumber' && formData.eanProductCode) {
             detailsRef.current?.focus();
         } else {
             nextRef.current.focus();
         }
      } else {
        submitForm();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
            <span className="text-sm">Configurez les champs fixes (Cadenas) pour scanner en série rapide.</span>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Roll Number - Never Locked */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Numéro de Bobine (Roll Number)</label>
              <div className="relative">
                <input
                    ref={rollRef}
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, eanRef)}
                    className="w-full pl-4 pr-4 py-3 rounded-lg border-2 border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-mono text-lg font-bold text-slate-900 shadow-sm"
                    placeholder="Scanner ici..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-pulse pointer-events-none">
                    <ArrowRight size={20} />
                </div>
              </div>
            </div>

            {/* EAN Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Code Produit (EAN)</label>
                <button 
                    onClick={() => toggleLock('eanProductCode')}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${locked.eanProductCode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    {locked.eanProductCode ? <Lock size={12} /> : <Unlock size={12} />}
                    {locked.eanProductCode ? 'Figé' : 'Libre'}
                </button>
              </div>
              <input
                ref={eanRef}
                type="text"
                name="eanProductCode"
                value={formData.eanProductCode}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, detailsRef)}
                className={`w-full px-4 py-3 rounded-lg border ${locked.eanProductCode ? 'bg-amber-50 border-amber-200' : 'border-slate-300'} focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono`}
                placeholder="Code EAN..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            {/* Details */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Détails (Rolls Details)</label>
                <button 
                    onClick={() => toggleLock('details')}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${locked.details ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    {locked.details ? <Lock size={12} /> : <Unlock size={12} />}
                    {locked.details ? 'Figé' : 'Libre'}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                    ref={detailsRef}
                    type="text"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, orderRef)}
                    className={`flex-1 px-4 py-3 rounded-lg border ${locked.details ? 'bg-amber-50 border-amber-200' : 'border-slate-300'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                    placeholder="Description du papier..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
                <button 
                    type="button" 
                    onClick={handleAiSuggest}
                    disabled={loadingAi || !formData.details}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                >
                    {loadingAi ? <RefreshCw className="animate-spin" size={20}/> : <span className="font-bold text-xs">AI TAG</span>}
                </button>
              </div>
            </div>

            {/* Order Number */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Commande Client (Order Number)</label>
                <button 
                    onClick={() => toggleLock('customerOrderNumber')}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${locked.customerOrderNumber ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    {locked.customerOrderNumber ? <Lock size={12} /> : <Unlock size={12} />}
                    {locked.customerOrderNumber ? 'Figé' : 'Libre'}
                </button>
              </div>
              <input
                ref={orderRef}
                type="text"
                name="customerOrderNumber"
                value={formData.customerOrderNumber}
                onChange={handleChange}
                onKeyDown={(e) => handleKeyDown(e, null)}
                className={`w-full px-4 py-3 rounded-lg border ${locked.customerOrderNumber ? 'bg-amber-50 border-amber-200' : 'border-slate-300'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                placeholder="Référence de commande..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setFormData({rollNumber: '', eanProductCode: '', details: '', customerOrderNumber: ''})}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Tout Effacer
            </button>
            <button
              onClick={submitForm}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Save size={20} />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Entries;