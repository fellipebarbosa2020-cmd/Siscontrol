import React, { useState, useEffect, useCallback } from 'react';
import { Bill, BillType, FormData } from '../types';
import { InformationCircleIcon, MagnifyingGlassIcon } from './icons';
import BillSearchModal from './BillSearchModal';
import { isFuzzyMatch } from '../utils';


interface BillFormProps {
  onSave: (data: FormData) => void;
  onClose: () => void;
  categories: string[];
  costCenters: string[];
  onAddCategory: (category: string) => void;
  onAddCostCenter: (costCenter: string) => void;
  initialData?: Bill | null;
  bills: Bill[];
}

const BillForm: React.FC<BillFormProps> = ({ onSave, onClose, categories, costCenters, onAddCategory, onAddCostCenter, initialData, bills }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    beneficiary: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    category: '',
    costCenter: '',
    type: BillType.Variable,
    installments: 2,
    barcode: '',
    isRecurring: false,
  });

  const [newCategory, setNewCategory] = useState('');
  const [newCostCenter, setNewCostCenter] = useState('');
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        beneficiary: initialData.beneficiary,
        amount: initialData.amount,
        dueDate: new Date(initialData.dueDate).toISOString().split('T')[0],
        category: initialData.category,
        costCenter: initialData.costCenter,
        type: initialData.type,
        installments: initialData.totalInstallments || 2,
        barcode: initialData.barcode || '',
        isRecurring: initialData.isRecurring || false,
      });
    }
  }, [initialData]);

  const findAndSetLatestBillData = useCallback((title: string, beneficiary: string) => {
    if (isEditMode) return;

    if (title.trim() && beneficiary.trim()) {
      const similarBills = bills.filter(b => 
        isFuzzyMatch(b.title, title) && 
        isFuzzyMatch(b.beneficiary, beneficiary)
      );

      if (similarBills.length > 0) {
        similarBills.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        const latestSimilar = similarBills[0];
        
        setFormData(prev => ({
            ...prev,
            category: latestSimilar.category,
            costCenter: latestSimilar.costCenter,
            type: latestSimilar.type,
        }));
        setAutoFillMessage('Dados preenchidos com base no seu último lançamento para esta conta.');
        const timer = setTimeout(() => setAutoFillMessage(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [bills, isEditMode]);

  // Auto-fill logic
  useEffect(() => {
    findAndSetLatestBillData(formData.title, formData.beneficiary);
  }, [formData.title, formData.beneficiary, findAndSetLatestBillData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    if (e.target.type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
  
    setFormData(prev => {
      const updatedValue = (name === 'amount' || name === 'installments') ? parseFloat(value) : value;
      const newFormData = { ...prev, [name]: updatedValue };
  
      if (name === 'type') {
        const newType = value as BillType;
        if (newType !== BillType.Monthly && newType !== BillType.Annual) {
          newFormData.isRecurring = false;
        }
      }
      
      return newFormData;
    });
  };
  
  const handleAddNewCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      setFormData(prev => ({...prev, category: newCategory.trim()}));
      setNewCategory('');
    }
  };

  const handleAddNewCostCenter = () => {
    if (newCostCenter.trim() && !costCenters.includes(newCostCenter.trim())) {
      onAddCostCenter(newCostCenter.trim());
      setFormData(prev => ({...prev, costCenter: newCostCenter.trim()}));
      setNewCostCenter('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      alert("O valor da conta deve ser maior que zero.");
      return;
    }
    onSave(formData);
  };
  
  const handleBillSelectFromSearch = (bill: Bill) => {
    setFormData(prev => ({
        ...prev,
        title: bill.title,
        beneficiary: bill.beneficiary,
        category: bill.category,
        costCenter: bill.costCenter,
        type: bill.type,
    }));
    setIsSearchModalOpen(false);
    setAutoFillMessage('Dados preenchidos com base na conta selecionada.');
    const timer = setTimeout(() => setAutoFillMessage(null), 5000);
  }

  const isRecurringApplicable = formData.type === BillType.Monthly || formData.type === BillType.Annual;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            {isEditMode ? 'Editar Conta' : 'Cadastrar Nova Conta'}
          </h2>

          {autoFillMessage && (
            <div className="p-3 mb-4 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2 transition-opacity duration-300">
              <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
              <span>{autoFillMessage}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
              <div className="relative mt-1">
                 <input type="text" name="title" id="title" required value={formData.title} onChange={handleChange} className="block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 pr-10"/>
                 {!isEditMode && (
                    <button type="button" onClick={() => setIsSearchModalOpen(true)} className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Pesquisar conta existente">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 hover:text-indigo-500"/>
                    </button>
                 )}
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
              <input type="number" name="amount" id="amount" required value={formData.amount} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3" step="0.01" min="0.01" />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vencimento</label>
              <input type="date" name="dueDate" id="dueDate" required value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"/>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="beneficiary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiário</label>
              <input type="text" name="beneficiary" id="beneficiary" required value={formData.beneficiary} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"/>
            </div>
            
            {!isEditMode && (
              <div className="md:col-span-2">
                 <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                     <input
                        type="checkbox"
                        name="isRecurring"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleChange}
                        disabled={!isRecurringApplicable}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="isRecurring" className={`block text-sm font-medium  cursor-pointer ${!isRecurringApplicable ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300'}`}>
                        Ativar geração automática (Apenas para Mensal/Anual)
                    </label>
                 </div>
              </div>
            )}


            <div className="md:col-span-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Conta</label>
              <select name="type" id="type" required value={formData.type} onChange={handleChange} disabled={isEditMode} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 disabled:opacity-50 disabled:cursor-not-allowed">
                <option value={BillType.Variable}>Variável (Única)</option>
                <option value={BillType.Installment}>Parcelada</option>
                <option value={BillType.Monthly}>Mensal</option>
                <option value={BillType.Annual}>Anual</option>
              </select>
            </div>

            {formData.type === BillType.Installment && (
              <div className="md:col-span-2">
                <label htmlFor="installments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Parcelas</label>
                <input type="number" name="installments" id="installments" value={formData.installments} onChange={handleChange} disabled={isEditMode} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 disabled:opacity-50 disabled:cursor-not-allowed" min="2"/>
              </div>
            )}
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
              <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3">
                <option value="">Selecione...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="mt-2 flex">
                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nova categoria" className="flex-grow bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"/>
                <button type="button" onClick={handleAddNewCategory} className="bg-indigo-500 text-white p-2 rounded-r-md hover:bg-indigo-600 font-semibold text-sm">Adicionar</button>
              </div>
            </div>

            <div>
              <label htmlFor="costCenter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Centro de Custo</label>
              <select name="costCenter" id="costCenter" value={formData.costCenter} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3">
                <option value="">Selecione...</option>
                {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
              </select>
              <div className="mt-2 flex">
                <input type="text" value={newCostCenter} onChange={e => setNewCostCenter(e.target.value)} placeholder="Novo centro de custo" className="flex-grow bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"/>
                <button type="button" onClick={handleAddNewCostCenter} className="bg-indigo-500 text-white p-2 rounded-r-md hover:bg-indigo-600 font-semibold text-sm">Adicionar</button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código de Barras (Opcional)</label>
              <input type="text" name="barcode" id="barcode" value={formData.barcode} onChange={handleChange} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"/>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"></textarea>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150">Cancelar</button>
            <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md">
              {isEditMode ? 'Salvar Alterações' : 'Salvar Conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {isSearchModalOpen && (
        <BillSearchModal
            bills={bills}
            onClose={() => setIsSearchModalOpen(false)}
            onSelect={handleBillSelectFromSearch}
        />
    )}
    </>
  );
};

export default BillForm;