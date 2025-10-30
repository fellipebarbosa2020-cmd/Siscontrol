import React, { useState, useMemo } from 'react';
import { BankDetail, PixKeyType } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, XMarkIcon, BanknotesIcon } from './icons';
import { banks } from '../banks';

interface BankDetailsManagerProps {
  details: BankDetail[];
  onUpdate: (newDetails: BankDetail[]) => void;
}

const initialFormState: Omit<BankDetail, 'id' | 'isActive' | 'createdAt' | 'deactivatedAt'> = {
  bankName: '',
  agency: '',
  account: '',
  pixKeyType: PixKeyType.RANDOM,
  pixKey: '',
};

const BankDetailsManager: React.FC<BankDetailsManagerProps> = ({ details, onUpdate }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<BankDetail | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  
  // States for bank autocomplete
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);

  const filteredBanks = useMemo(() => {
    if (!bankSearchTerm) {
      return banks;
    }
    const lowercasedSearch = bankSearchTerm.toLowerCase();
    return banks.filter(bank =>
      bank.name.toLowerCase().includes(lowercasedSearch) ||
      (bank.code && bank.code.includes(lowercasedSearch))
    );
  }, [bankSearchTerm]);

  const showAddNewBankOption = useMemo(() => {
    if (!bankSearchTerm.trim()) {
      return false;
    }
    const exactMatch = banks.some(bank => bank.name.toLowerCase() === bankSearchTerm.trim().toLowerCase());
    return !exactMatch;
  }, [bankSearchTerm]);

  const handleBankSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBankSearchTerm(value);
    setFormData({ ...formData, bankName: value });
    if (!showBankSuggestions) {
      setShowBankSuggestions(true);
    }
  };

  const handleBankSelect = (bankName: string) => {
    const trimmedBankName = bankName.trim();
    setFormData({ ...formData, bankName: trimmedBankName });
    setBankSearchTerm(trimmedBankName);
    setShowBankSuggestions(false);
  };

  const handleOpenForm = (detail: BankDetail | null = null) => {
    setEditingDetail(detail);
    const initialData = detail ? {
      bankName: detail.bankName,
      agency: detail.agency,
      account: detail.account,
      pixKeyType: detail.pixKeyType,
      pixKey: detail.pixKey,
    } : initialFormState;

    setFormData(initialData);
    setBankSearchTerm(initialData.bankName); // Pre-fill search term for editing
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDetail(null);
    setFormData(initialFormState);
    setBankSearchTerm('');
  };

  const handleSave = () => {
    if (!formData.bankName || !formData.agency || !formData.account) {
      alert('Banco, Agência e Conta são obrigatórios.');
      return;
    }

    let updatedDetails: BankDetail[] = [...details];

    if (editingDetail) {
      updatedDetails = updatedDetails.map(d =>
        d.id === editingDetail.id ? { ...d, ...formData } : d
      );
    } else {
      updatedDetails = updatedDetails.map(d => 
        d.isActive ? { ...d, isActive: false, deactivatedAt: new Date() } : d
      );
      const newDetail: BankDetail = {
        ...formData,
        id: crypto.randomUUID(),
        isActive: true,
        createdAt: new Date(),
      };
      updatedDetails.push(newDetail);
    }

    onUpdate(updatedDetails);
    handleCloseForm();
  };
  
  const handleDelete = (id: string) => {
    const wasActive = details.find(d => d.id === id)?.isActive;
    let updatedDetails = details.filter(d => d.id !== id);
    
    if(wasActive && updatedDetails.length > 0) {
        updatedDetails.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        updatedDetails[0] = { ...updatedDetails[0], isActive: true, deactivatedAt: undefined };
    }

    onUpdate(updatedDetails);
  };

  const inputClass = "w-full mt-2 p-3 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
  const labelClass = "text-sm font-semibold text-gray-600 dark:text-gray-300";

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleOpenForm()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
      >
        <PlusIcon className="w-5 h-5" /> Adicionar Conta Bancária
      </button>

      <div className="space-y-3">
        {details.length > 0 ? (
          details.map(detail => (
            <div key={detail.id} className={`p-4 rounded-lg shadow-sm border-l-4 ${detail.isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-800/50'}`}>
              <div className="flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-3">
                        <p className="font-bold text-lg text-gray-800 dark:text-white">{detail.bankName}</p>
                        {detail.isActive && <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">Ativa</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ag: {detail.agency} / Cc: {detail.account}</p>
                    { detail.pixKey && <p className="text-sm text-gray-500 dark:text-gray-400">PIX ({detail.pixKeyType}): {detail.pixKey}</p> }
                    {!detail.isActive && detail.deactivatedAt && <p className="text-xs text-red-500 dark:text-red-400 mt-1">Desativada em: {new Date(detail.deactivatedAt).toLocaleDateString()}</p>}
                 </div>
                 <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenForm(detail)} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Editar"><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(detail.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Excluir"><TrashIcon className="w-5 h-5"/></button>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <BanknotesIcon className="w-12 h-12 mx-auto text-gray-400"/>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nenhuma conta bancária cadastrada.</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{editingDetail ? 'Editar' : 'Adicionar'} Conta Bancária</h3>
                <div className="space-y-4">
                    <div className="relative">
                        <label className={labelClass}>Nome do Banco</label>
                        <input
                            type="text"
                            value={bankSearchTerm}
                            onChange={handleBankSearchChange}
                            onFocus={() => setShowBankSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowBankSuggestions(false), 200)}
                            className={inputClass}
                            autoComplete="off"
                        />
                        {showBankSuggestions && (
                            <ul className="absolute z-20 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {filteredBanks.map(bank => (
                                <li
                                key={bank.code}
                                onMouseDown={() => handleBankSelect(bank.name)}
                                className="px-4 py-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                >
                                {bank.name}
                                </li>
                            ))}
                            {showAddNewBankOption && (
                                <li
                                onMouseDown={() => handleBankSelect(bankSearchTerm)}
                                className="px-4 py-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold border-t border-gray-200 dark:border-gray-700"
                                >
                                Adicionar "{bankSearchTerm}"
                                </li>
                            )}
                             {filteredBanks.length === 0 && !showAddNewBankOption && bankSearchTerm.length > 0 && (
                                <li className="px-4 py-2 text-gray-500 italic">Nenhum banco encontrado.</li>
                            )}
                            </ul>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelClass}>Agência</label><input type="text" value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} className={inputClass}/></div>
                        <div><label className={labelClass}>Conta</label><input type="text" value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} className={inputClass}/></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Tipo de Chave PIX</label>
                            <select value={formData.pixKeyType} onChange={e => setFormData({...formData, pixKeyType: e.target.value as PixKeyType})} className={inputClass}>
                                {Object.values(PixKeyType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div><label className={labelClass}>Chave PIX</label><input type="text" value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className={inputClass}/></div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
                <button onClick={handleCloseForm} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold">Cancelar</button>
                <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetailsManager;