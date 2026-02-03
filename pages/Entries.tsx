import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Scan, Save, RefreshCw, AlertTriangle, CheckCircle2, Lock, Unlock, ArrowRight, Keyboard } from 'lucide-react';
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
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus initial sur le champ bobine
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

  // Fonction intelligente pour trouver le prochain champ vide
  const focusNextEmpty = (currentData: typeof formData) => {
    if (!currentData.rollNumber) return rollRef.current?.focus();
    if (!currentData.eanProductCode) return eanRef.current?.focus();
    if (!currentData.details) return detailsRef.current?.focus();
    if (!currentData.customerOrderNumber) return orderRef.current?.focus();
    // Si tout est rempli, on focus le bouton sauvegarder
    saveBtnRef.current?.focus();
  };

  const submitForm = () => {
     if (!formData.rollNumber) {
      toast.error("Numéro de bobine (20 chiffres) requis");
      rollRef.current?.focus();
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
      const nextState = {
        rollNumber: '',
        eanProductCode: locked.eanProductCode ? formData.eanProductCode : '',
        details: locked.details ? formData.details : '',
        customerOrderNumber: locked.customerOrderNumber ? formData.customerOrderNumber : ''
      };
      
      setFormData(nextState);
      
      // Refocus logic after save
      setTimeout(() => focusNextEmpty(nextState), 50);
    } else {
      toast.error("Cette bobine existe déjà en stock !");
      setFormData(prev => ({...prev, rollNumber: ''}));
      rollRef.current?.focus();
    }
  };

  /**
   * C'est ici que la magie opère.
   * On intercepte "Entrée" (fin de scan).
   * On analyse la longueur de la valeur scannée pour savoir où la mettre.
   */
  const handleSmartScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const val = (e.currentTarget.value || '').trim();
      const len = val.length;
      
      // Si vide, on passe juste au suivant
      if (len === 0) {
          focusNextEmpty(formData);
          return;
      }

      let updatedData = { ...formData };
      let matchedField = '';

      // Logique de détection basée sur la longueur exacte
      if (len === 20) {
        updatedData.rollNumber = val;
        matchedField = 'Bobine (20)';
      } else if (len === 18) {
        updatedData.details = val;
        matchedField = 'Détails (18)';
      } else if (len === 13) {
        updatedData.eanProductCode = val;
        matchedField = 'EAN (13)';
      } else if (len === 9) {
        updatedData.customerOrderNumber = val;
        matchedField = 'Commande (9)';
      } else {
        // Longueur inconnue, on laisse la valeur dans le champ actuel (saisie manuelle ?)
        const currentName = e.currentTarget.name as keyof typeof formData;
        updatedData[currentName] = val;
      }

      // Si on a détecté un champ spécifique et qu'on n'était pas dedans, on vide le champ actuel s'il a pris la valeur
      if (matchedField) {
          toast.success(`${matchedField} détecté`, { position: 'bottom-center', duration: 1000 });
          
          // Si j'ai scanné dans un champ A mais que c'était une valeur pour le champ B,
          // je dois m'assurer que le champ A ne garde pas cette valeur incorrecte
          const currentInputName = e.currentTarget.name;
          // Si la valeur est maintenant stockée ailleurs, on remet l'ancienne valeur du champ courant ou vide
          if (updatedData[currentInputName as keyof typeof formData] === val && len !== getExpectedLength(currentInputName)) {
             // C'est un mismatch (ex: scan EAN dans champ Bobine) -> on nettoie le champ courant
             updatedData[currentInputName as keyof typeof formData] = ''; 
          }
      }

      setFormData(updatedData);
      
      // On attend un micro-tick pour que le state se mette à jour, puis on focus le prochain vide
      setTimeout(() => {
          // Si tout est plein, on peut soit submit auto, soit focus le bouton save
          if (updatedData.rollNumber && updatedData.eanProductCode && updatedData.details && updatedData.customerOrderNumber) {
              saveBtnRef.current?.focus();
          } else {
              focusNextEmpty(updatedData);
          }
      }, 50);
    }
  };
  
  const getExpectedLength = (fieldName: string) => {
      switch(fieldName) {
          case 'rollNumber': return 20;
          case 'details': return 18;
          case 'eanProductCode': return 13;
          case 'customerOrderNumber': return 9;
          default: return 0;
      }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Entrées de Stock</h2>
          <p className="text-slate-500 mt-1">Scanner les codes-barres dans n'importe quel ordre.</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
            <Scan size={20} />
            <span className="font-semibold">Scan Auto Actif</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center gap-2 text-slate-600">
            <Keyboard size={18} />
            <span className="text-sm">La détection automatique place le code dans le bon champ selon sa taille (20, 13, 18, 9).</span>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Roll Number - 20 Chiffres */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                  <span>Numéro de Bobine</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">20 chiffres</span>
              </label>
              <div className="relative">
                <input
                    ref={rollRef}
                    type="text"
                    inputMode="numeric"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    onKeyDown={handleSmartScan}
                    className={`w-full pl-4 pr-10 py-3 rounded-lg border-2 ${formData.rollNumber.length === 20 ? 'border-green-500 bg-green-50' : 'border-blue-500'} focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-mono text-lg font-bold text-slate-900 shadow-sm`}
                    placeholder="Scanner..."
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {formData.rollNumber.length === 20 ? <CheckCircle2 className="text-green-600" size={20}/> : <ArrowRight className="text-blue-300" size={20} />}
                </div>
              </div>
            </div>

            {/* EAN Code - 13 Chiffres */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex gap-2 items-center">
                    Code Produit (EAN)
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">13 chiffres</span>
                </label>
                <button 
                    onClick={() => toggleLock('eanProductCode')}
                    tabIndex={-1}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${locked.eanProductCode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    {locked.eanProductCode ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
              <div className="relative">
                <input
                    ref={eanRef}
                    type="text"
                    inputMode="numeric"
                    name="eanProductCode"
                    value={formData.eanProductCode}
                    onChange={handleChange}
                    onKeyDown={handleSmartScan}
                    className={`w-full px-4 py-3 rounded-lg border ${formData.eanProductCode.length === 13 ? 'border-green-500 bg-green-50' : (locked.eanProductCode ? 'bg-amber-50 border-amber-200' : 'border-slate-300')} focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono`}
                    placeholder="EAN..."
                    autoComplete="off"
                />
                 {formData.eanProductCode.length === 13 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="text-green-600" size={16}/>
                    </div>
                )}
              </div>
            </div>

            {/* Details - 18 Chiffres */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex gap-2 items-center">
                    Détails (Rolls Details)
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">18 chiffres</span>
                </label>
                <button 
                    onClick={() => toggleLock('details')}
                    tabIndex={-1}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${locked.details ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    {locked.details ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
              <div className="flex gap-2 relative">
                <input
                    ref={detailsRef}
                    type="text"
                    inputMode="numeric"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    onKeyDown={handleSmartScan}
                    className={`flex-1 px-4 py-3 rounded-lg border ${formData.details.length === 18 ? 'border-green-500 bg-green-50' : (locked.details ? 'bg-amber-50 border-amber-200' : 'border-slate-300')} focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono`}
                    placeholder="Code détails..."
                    autoComplete="off"
                />
                 {formData.details.length === 18 && (
                    <div className="absolute right-24 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="text-green-600" size={16}/>
                    </div>
                )}
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

            {/* Order Number - 9 Chiffres */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 flex gap-2 items-center">
                    Commande Client
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">9 chiffres</span>
                </label>
                <button 
                    onClick={() => toggleLock('customerOrderNumber')}
                    tabIndex={-1}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${locked.customerOrderNumber ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                >
                    {locked.customerOrderNumber ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
              <div className="relative">
                <input
                    ref={orderRef}
                    type="text"
                    inputMode="numeric"
                    name="customerOrderNumber"
                    value={formData.customerOrderNumber}
                    onChange={handleChange}
                    onKeyDown={handleSmartScan}
                    className={`w-full px-4 py-3 rounded-lg border ${formData.customerOrderNumber.length === 9 ? 'border-green-500 bg-green-50' : (locked.customerOrderNumber ? 'bg-amber-50 border-amber-200' : 'border-slate-300')} focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono`}
                    placeholder="Numéro commande..."
                    autoComplete="off"
                />
                 {formData.customerOrderNumber.length === 9 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="text-green-600" size={16}/>
                    </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                  setFormData({rollNumber: '', eanProductCode: '', details: '', customerOrderNumber: ''});
                  rollRef.current?.focus();
              }}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Effacer
            </button>
            <button
              ref={saveBtnRef}
              onClick={submitForm}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 focus:ring-4 focus:ring-blue-300 outline-none"
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