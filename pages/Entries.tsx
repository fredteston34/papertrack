import React, { useState, useRef, useEffect } from 'react';
import { PaperRoll, StockStatus } from '../types';
import { Scan, Save, RefreshCw, CheckCircle2, Lock, Unlock, Keyboard, Zap, AlertCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { suggestCategory } from '../services/geminiService';
import { sanitizeInput } from '../utils/scanner';

interface EntriesProps {
  onAdd: (roll: PaperRoll) => boolean;
}

// Configuration centralisée des champs avec validation stricte
const FIELD_CONFIG = {
  rollNumber: { 
    length: 20, 
    strict: true,
    label: 'Bobine', 
    desc: '20 chiffres',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200 focus:ring-blue-500'
  },
  details: { 
    length: 18, 
    strict: false, // Alphanumérique
    label: 'Détails', 
    desc: '18 caractères',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200 focus:ring-purple-500'
  },
  eanProductCode: { 
    length: 13, 
    strict: true,
    label: 'EAN', 
    desc: '13 chiffres',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200 focus:ring-amber-500'
  },
  customerOrderNumber: { 
    length: 9, 
    strict: true,
    label: 'Commande', 
    desc: '9 chiffres',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200 focus:ring-emerald-500'
  }
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
  
  // États pour l'UX
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
    // Focus initial sur Bobine
    refs.rollNumber.current?.focus();
  }, []);

  // Nettoyage de l'effet visuel de détection
  useEffect(() => {
    if (lastDetected) {
      const timer = setTimeout(() => setLastDetected(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastDetected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as FieldName;
    const isStrict = FIELD_CONFIG[field].strict;
    // Sanitization immédiate à la saisie pour éviter les erreurs de mapping
    const val = sanitizeInput(e.target.value, isStrict);
    
    setFormData(prev => ({ ...prev, [field]: val }));
    
    // Effacer l'erreur dès que l'utilisateur corrige
    if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const toggleLock = (field: FieldName) => {
    setLocked(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAiSuggest = async () => {
    if (!formData.details) return;
    setLoadingAi(true);
    const category = await suggestCategory(formData.details);
    if (category) {
        toast.success(`Catégorie suggérée : ${category}`, { icon: '🤖' });
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

  // Validation des données selon FIELD_CONFIG
  const validateData = (data: typeof formData) => {
    const fields: FieldName[] = ['rollNumber', 'eanProductCode', 'details', 'customerOrderNumber'];
    let firstErrorField: FieldName | null = null;
    const newErrors: Partial<Record<FieldName, boolean>> = {};
    let isValid = true;

    for (const field of fields) {
        const config = FIELD_CONFIG[field];
        const value = data[field];
        
        // Vérification de présence
        if (!value) {
            newErrors[field] = true;
            if (!firstErrorField) firstErrorField = field;
            isValid = false;
            continue;
        }

        // Vérification de longueur stricte
        if (value.length !== config.length) {
             newErrors[field] = true;
             if (!firstErrorField) firstErrorField = field;
             isValid = false;
        }
    }
    return { isValid, newErrors, firstErrorField };
  };

  // Affichage des notifications d'erreur
  const displayValidationErrors = (newErrors: Partial<Record<FieldName, boolean>>, data: typeof formData) => {
      const fields: FieldName[] = ['rollNumber', 'eanProductCode', 'details', 'customerOrderNumber'];
      fields.forEach(field => {
          if (newErrors[field]) {
              const config = FIELD_CONFIG[field];
              const value = data[field];
              
              if (!value) {
                  toast.error(`Le champ ${config.label} est requis.`, { id: `req-${field}` });
              } else if (value.length !== config.length) {
                   const unit = config.strict ? 'chiffres' : 'caractères';
                   // Messages d'erreur spécifiques et clairs
                   let errorMsg = '';
                   switch(field) {
                       case 'rollNumber':
                           errorMsg = `Bobine invalide : 20 chiffres requis (reçu : ${value.length}).`;
                           break;
                       case 'eanProductCode':
                           errorMsg = `EAN invalide : 13 chiffres requis (reçu : ${value.length}).`;
                           break;
                       case 'details':
                           errorMsg = `Détails invalides : 18 caractères requis (reçu : ${value.length}).`;
                           break;
                       case 'customerOrderNumber':
                           errorMsg = `Commande invalide : 9 chiffres requis (reçu : ${value.length}).`;
                           break;
                       default:
                           errorMsg = `${config.label} : ${config.length} ${unit} attendus (reçu : ${value.length}).`;
                   }
                   toast.error(errorMsg, { id: `err-${field}` });
              }
          }
      });
  };

  const attemptSubmit = (dataToSubmit: typeof formData) => {
    const { isValid, newErrors, firstErrorField } = validateData(dataToSubmit);
    
    setErrors(newErrors);

    if (!isValid) {
        if (firstErrorField) {
            refs[firstErrorField].current?.focus();
        }
        displayValidationErrors(newErrors, dataToSubmit);
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
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-green-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-900">Entrée Confirmée</p>
                <p className="mt-1 text-sm text-green-700">Bobine {dataToSubmit.rollNumber.slice(-6)} ajoutée au stock.</p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 1500 });
      
      // Préparation du formulaire pour la prochaine entrée
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
      toast.error("Doublon : Cette bobine existe déjà en stock !", { icon: '🚫' });
      setFormData(prev => ({...prev, rollNumber: ''}));
      refs.rollNumber.current?.focus();
    }
  };

  const submitForm = () => {
    attemptSubmit(formData);
  };

  const handleSmartScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const rawVal = e.currentTarget.value || '';
      
      // Sanitization pour la logique de détection
      const strictVal = sanitizeInput(rawVal, true);
      const laxVal = sanitizeInput(rawVal, false);
      const strictLen = strictVal.length;

      // 1. Détection du type de champ par longueur stricte
      let detectedType: FieldName | null = null;
      let finalVal = strictVal;

      (Object.keys(FIELD_CONFIG) as FieldName[]).forEach(key => {
          if (strictLen === FIELD_CONFIG[key].length) {
              detectedType = key;
              finalVal = strictVal;
          }
      });
      
      // Fallback: Si pas de match strict, test sur longueur laxiste pour 'details'
      if (!detectedType && laxVal.length === FIELD_CONFIG.details.length) {
          detectedType = 'details';
          finalVal = laxVal;
      }

      // 2. Application de la valeur détectée
      if (detectedType) {
        const fieldName = detectedType;
        const newState = { ...formData };
        newState[fieldName] = finalVal;
        
        // Si on scanne dans un autre champ que celui détecté, on nettoie le champ courant (si c'était une erreur)
        const currentFocused = e.currentTarget.name as FieldName;
        if (currentFocused !== fieldName) {
            newState[currentFocused] = '';
        }

        setFormData(newState);
        setLastDetected(fieldName);
        setErrors(prev => ({...prev, [fieldName]: false}));

        toast.success(`${FIELD_CONFIG[fieldName].label} détecté`, {
            icon: '⚡',
            style: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
        });

        // AUTO-SUBMIT: Si on vient de scanner une Bobine (valide)
        if (fieldName === 'rollNumber') {
            const { isValid } = validateData(newState);
            if (isValid) {
                setTimeout(() => attemptSubmit(newState), 100);
                return;
            }
        }

        setTimeout(() => {
             const predictedState = { ...newState };
             focusNextEmpty(predictedState);
        }, 50);

      } else {
        // Erreur de format détectée au scan
        const currentField = e.currentTarget.name as FieldName;
        const config = FIELD_CONFIG[currentField];
        
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-red-50 border border-red-200 shadow-lg rounded-lg pointer-events-auto flex p-4 ring-1 ring-black ring-opacity-5`}>
                <div className="flex-shrink-0">
                    <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-red-900">Scan Invalide</p>
                    <p className="mt-1 text-sm text-red-700">
                        {config.label} attend <span className="font-bold">{config.length} {config.strict ? 'chiffres' : 'caractères'}</span>.
                    </p>
                    <p className="mt-1 text-xs text-red-500">
                        Reçu : {strictLen} (brut: {rawVal.length}).
                    </p>
                </div>
            </div>
        ), { duration: 4000 });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Entrées de Stock</h2>
          <p className="text-slate-500 mt-1">Scanner une donnée pour l'assigner automatiquement.</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
            <Scan size={20} />
            <span className="font-semibold">Mode Scan Auto</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex items-center gap-2 text-slate-600">
            <Keyboard size={18} />
            <span className="text-sm">Formats : Bobine(20), Détails(18), EAN(13), Commande(9).</span>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {(Object.keys(FIELD_CONFIG) as FieldName[]).map((field) => {
              const config = FIELD_CONFIG[field];
              const isFilled = formData[field].length === config.length;
              const isDetected = lastDetected === field;
              const hasError = errors[field];
              
              const colSpan = (field === 'details' || field === 'customerOrderNumber') ? 'md:col-span-2' : '';
              
              return (
                <div key={field} className={`space-y-2 ${colSpan}`}>
                   <div className="flex items-center justify-between">
                    <label className={`text-sm font-bold flex gap-2 items-center ${hasError ? 'text-red-600' : config.color}`}>
                        {config.label}
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-normal">
                           {config.desc}
                        </span>
                    </label>
                    {field !== 'rollNumber' && (
                        <button 
                            onClick={() => toggleLock(field)}
                            tabIndex={-1}
                            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                locked[field] ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                        >
                            {locked[field] ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                    )}
                  </div>
                  
                  <div className="relative flex gap-2">
                     <input
                        ref={refs[field]}
                        type="text"
                        inputMode="numeric"
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        onKeyDown={handleSmartScan}
                        className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all font-mono text-lg
                            ${hasError ? 'border-red-500 ring-2 ring-red-100 bg-red-50' : ''}
                            ${!hasError && isDetected ? 'ring-4 ring-green-300 border-green-500 scale-[1.02] bg-green-50 z-10' : ''}
                            ${!hasError && isFilled && !isDetected ? 'border-green-500 bg-slate-50' : ''}
                            ${!hasError && !isFilled && !isDetected ? `${config.border} bg-white` : ''}
                            ${!hasError && locked[field] && !isFilled ? 'bg-amber-50/50' : ''}
                        `}
                        placeholder={`Scanner ${config.label}...`}
                        autoComplete="off"
                     />
                     
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {hasError ? (
                            <AlertCircle className="text-red-500 animate-enter" size={20}/>
                        ) : isFilled ? (
                            <CheckCircle2 className="text-green-600 animate-enter" size={20}/>
                        ) : (
                             isDetected ? <Zap className="text-green-600 fill-current animate-bounce" size={20}/> : null
                        )}
                     </div>

                     {field === 'details' && (
                        <button 
                            type="button" 
                            onClick={handleAiSuggest}
                            disabled={loadingAi || !formData.details}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 border border-purple-200"
                        >
                            {loadingAi ? <RefreshCw className="animate-spin" size={20}/> : <span className="font-bold text-xs whitespace-nowrap">AI TAG</span>}
                        </button>
                     )}
                  </div>
                  {hasError && (
                    <p className="text-xs text-red-500 font-medium animate-enter">
                        {formData[field].length} {config.strict ? 'chiffres' : 'caractères'} (Requis: {config.length})
                    </p>
                  )}
                </div>
              );
            })}

          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                  setFormData({rollNumber: '', eanProductCode: '', details: '', customerOrderNumber: ''});
                  setErrors({});
                  refs.rollNumber.current?.focus();
              }}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Effacer
            </button>
            <button
              ref={refs.save}
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