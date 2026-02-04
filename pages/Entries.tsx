import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Scan, Save, RefreshCw, CheckCircle2, Lock, Unlock, Keyboard, Zap, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { suggestCategory } from '../services/geminiService';
import { sanitizeInput } from '../utils/scanner';

interface EntriesProps {
  onAdd: (roll: PaperRoll) => boolean;
}

const FIELD_CONFIG = {
  rollNumber: { length: 20, strict: true, label: 'Bobine', desc: '20 chiffres', color: 'text-blue-600', border: 'focus:border-blue-500 focus:ring-blue-100' },
  details: { length: 18, strict: false, label: 'Détails', desc: '18 cars.', color: 'text-purple-600', border: 'focus:border-purple-500 focus:ring-purple-100' },
  eanProductCode: { length: 13, strict: true, label: 'EAN', desc: '13 chiffres', color: 'text-amber-600', border: 'focus:border-amber-500 focus:ring-amber-100' },
  customerOrderNumber: { length: 9, strict: true, label: 'Commande', desc: '9 chiffres', color: 'text-emerald-600', border: 'focus:border-emerald-500 focus:ring-emerald-100' }
} as const;

type FieldName = keyof typeof FIELD_CONFIG;

const Entries: React.FC<EntriesProps> = ({ onAdd }) => {
  const [formData, setFormData] = useState<Record<FieldName, string>>({
    rollNumber: '',
    eanProductCode: '',
    details: '',
    customerOrderNumber: '',
  });

  const [locked, setLocked] = useState<Partial<Record<FieldName, boolean>>>({
    eanProductCode: false,
    details: false,
    customerOrderNumber: false
  });

  const [errors, setErrors] = useState<Partial<Record<FieldName, boolean>>>({});
  const [lastDetected, setLastDetected] = useState<FieldName | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  const refs: Record<FieldName | 'save', React.RefObject<any>> = {
    rollNumber: useRef<HTMLInputElement>(null),
    eanProductCode: useRef<HTMLInputElement>(null),
    details: useRef<HTMLInputElement>(null),
    customerOrderNumber: useRef<HTMLInputElement>(null),
    save: useRef<HTMLButtonElement>(null),
  };

  useEffect(() => {
    refs.rollNumber.current?.focus();
  }, []);

  useEffect(() => {
    if (lastDetected) {
      const timer = setTimeout(() => setLastDetected(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastDetected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as FieldName;
    const isStrict = FIELD_CONFIG[field].strict;
    const val = sanitizeInput(e.target.value, isStrict);
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  const toggleLock = (field: FieldName) => {
    setLocked(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAiSuggest = async () => {
    if (!formData.details) return;
    setLoadingAi(true);
    const category = await suggestCategory(formData.details);
    if (category) {
        toast.success(`Catégorie : ${category}`, { icon: '✨' });
        setFormData(prev => ({...prev, details: `${prev.details} [${category}]`}));
    }
    setLoadingAi(false);
  }

  const focusNextEmpty = (currentData: typeof formData) => {
    if (!currentData.rollNumber) return refs.rollNumber.current?.focus();
    if (!currentData.eanProductCode) return refs.eanProductCode.current?.focus();
    if (!currentData.details) return refs.details.current?.focus();
    if (!currentData.customerOrderNumber) return refs.customerOrderNumber.current?.focus();
    refs.save.current?.focus();
  };

  const attemptSubmit = (dataToSubmit: typeof formData) => {
    const fields: FieldName[] = ['rollNumber', 'eanProductCode', 'details', 'customerOrderNumber'];
    let firstErrorField: FieldName | null = null;
    const newErrors: Partial<Record<FieldName, boolean>> = {};
    let isValid = true;

    for (const field of fields) {
        if (!dataToSubmit[field] || dataToSubmit[field].length !== FIELD_CONFIG[field].length) {
             newErrors[field] = true;
             if (!firstErrorField) firstErrorField = field;
             isValid = false;
        }
    }
    
    setErrors(newErrors);

    if (!isValid) {
        if (firstErrorField) refs[firstErrorField].current?.focus();
        toast.error("Veuillez vérifier les champs en rouge.", { icon: '🚨' });
        return;
    }

    const newRoll: PaperRoll = {
      id: crypto.randomUUID(),
      ...dataToSubmit,
      status: StockStatus.IN_STOCK,
      dateIn: new Date().toISOString(),
    };

    const success = onAdd(newRoll);
    if (success) {
      toast.custom(() => (
        <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
          <CheckCircle2 size={24} className="text-green-200" />
          <div>
             <p className="font-bold">Bobine Ajoutée</p>
             <p className="text-sm text-green-100 opacity-90">ID: {dataToSubmit.rollNumber.slice(-6)}</p>
          </div>
        </div>
      ), { duration: 1500 });
      
      const nextState = {
        rollNumber: '',
        eanProductCode: locked.eanProductCode ? dataToSubmit.eanProductCode : '',
        details: locked.details ? dataToSubmit.details : '',
        customerOrderNumber: locked.customerOrderNumber ? dataToSubmit.customerOrderNumber : ''
      };
      
      setFormData(nextState);
      setErrors({});
      setTimeout(() => focusNextEmpty(nextState), 50);
    } else {
      toast.error("Cette bobine existe déjà !", { icon: '🚫' });
      setFormData(prev => ({...prev, rollNumber: ''}));
      refs.rollNumber.current?.focus();
    }
  };

  const handleSmartScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawVal = e.currentTarget.value || '';
      const strictVal = sanitizeInput(rawVal, true);
      const laxVal = sanitizeInput(rawVal, false);
      const strictLen = strictVal.length;

      let detectedType: FieldName | null = null;
      let finalVal = strictVal;

      (Object.keys(FIELD_CONFIG) as FieldName[]).forEach(key => {
          if (strictLen === FIELD_CONFIG[key].length) {
              detectedType = key;
              finalVal = strictVal;
          }
      });
      
      if (!detectedType && laxVal.length === FIELD_CONFIG.details.length) {
          detectedType = 'details';
          finalVal = laxVal;
      }

      if (detectedType) {
        const fieldName = detectedType;
        const newState = { ...formData, [fieldName]: finalVal };
        const currentFocused = e.currentTarget.name as FieldName;
        if (currentFocused !== fieldName) newState[currentFocused] = '';

        setFormData(newState);
        setLastDetected(fieldName);
        setErrors(prev => ({...prev, [fieldName]: false}));

        toast.success(FIELD_CONFIG[fieldName].label, {
            icon: '⚡',
            position: 'bottom-center',
            style: { background: '#1e293b', color: '#fff', fontSize: '12px' }
        });

        if (fieldName === 'rollNumber') {
             // Check validity of other fields before auto submitting
             const isOthersValid = newState.eanProductCode && newState.details && newState.customerOrderNumber;
             if (isOthersValid) setTimeout(() => attemptSubmit(newState), 100);
             else setTimeout(() => focusNextEmpty(newState), 50);
             return;
        }

        setTimeout(() => {
             focusNextEmpty(newState);
        }, 50);

      } else {
        toast.error('Format inconnu', { position: 'bottom-center' });
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nouvelle Entrée</h2>
          <p className="text-slate-500 text-sm">Scan intelligent actif</p>
        </div>
        <div className="bg-blue-50 text-blue-700 p-2 rounded-xl animate-pulse">
            <Scan size={24} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {(Object.keys(FIELD_CONFIG) as FieldName[]).map((field) => {
              const config = FIELD_CONFIG[field];
              const isFilled = formData[field].length === config.length;
              const isDetected = lastDetected === field;
              const hasError = errors[field];
              const colSpan = (field === 'details') ? 'md:col-span-2' : '';
              
              return (
                <div key={field} className={`space-y-1 ${colSpan}`}>
                   <div className="flex items-center justify-between px-1">
                    <label className={`text-xs font-bold uppercase tracking-wider ${hasError ? 'text-red-500' : 'text-slate-500'}`}>
                        {config.label}
                    </label>
                    {field !== 'rollNumber' && (
                        <button 
                            onClick={() => toggleLock(field)}
                            tabIndex={-1}
                            className={`p-1.5 rounded-lg transition-colors ${
                                locked[field] ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            {locked[field] ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                    )}
                  </div>
                  
                  <div className="relative group">
                     <input
                        ref={refs[field]}
                        type="text"
                        inputMode={config.strict ? "numeric" : "text"}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        onKeyDown={handleSmartScan}
                        className={`w-full pl-4 pr-10 py-3.5 rounded-xl border-2 outline-none transition-all font-mono text-base md:text-lg shadow-sm
                            ${hasError ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50/50 text-slate-900'}
                            ${!hasError && isDetected ? 'ring-2 ring-blue-400 border-blue-500 bg-blue-50' : ''}
                            ${!hasError && !isDetected ? `focus:bg-white focus:border-transparent focus:ring-2 ${config.border}` : ''}
                            ${!hasError && isFilled && !isDetected ? 'border-green-400/50 bg-green-50/30' : ''}
                        `}
                        placeholder={config.desc}
                        autoComplete="off"
                     />
                     
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300">
                        {hasError ? (
                            <AlertCircle className="text-red-500" size={20}/>
                        ) : isFilled ? (
                            <CheckCircle2 className="text-emerald-500 scale-110" size={20}/>
                        ) : (
                             isDetected ? <Zap className="text-blue-500 fill-current animate-bounce" size={20}/> : <span className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-300"></span>
                        )}
                     </div>

                     {field === 'details' && (
                        <button 
                            type="button" 
                            onClick={handleAiSuggest}
                            disabled={loadingAi || !formData.details}
                            className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-0 transition-all"
                        >
                            {loadingAi ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16} />}
                        </button>
                     )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                  setFormData({rollNumber: '', eanProductCode: '', details: '', customerOrderNumber: ''});
                  setErrors({});
                  refs.rollNumber.current?.focus();
              }}
              className="flex-1 px-4 py-4 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-95 transition-all"
            >
              Effacer
            </button>
            <button
              ref={refs.save}
              onClick={() => attemptSubmit(formData)}
              className="flex-[2] px-4 py-4 rounded-xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} />
              <span className="tracking-wide">VALIDER</span>
            </button>
          </div>
        </div>
      </div>
      
       {/* Keyboard helper text for desktop */}
       <div className="hidden md:flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
            <Keyboard size={14} />
            <span>Appuyez sur Entrée pour passer au champ suivant</span>
        </div>
    </div>
  );
};

// Missing import fix
import { Sparkles } from 'lucide-react';

export default Entries;