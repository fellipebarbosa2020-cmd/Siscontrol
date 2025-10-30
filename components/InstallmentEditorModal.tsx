import React, { useState, useEffect, useMemo } from 'react';
import { Bill } from '../types';

interface InstallmentEditorModalProps {
  installments: Bill[];
  onClose: () => void;
  onSave: (editedInstallments: Bill[]) => void;
}

const InstallmentEditorModal: React.FC<InstallmentEditorModalProps> = ({ installments, onClose, onSave }) => {
  const [editedInstallments, setEditedInstallments] = useState<Bill[]>(installments);

  useEffect(() => {
    setEditedInstallments(installments);
  }, [installments]);
  
  const handleAmountChange = (id: string, newAmount: number) => {
    setEditedInstallments(prev =>
      prev.map(inst => (inst.id === id ? { ...inst, amount: newAmount } : inst))
    );
  };

  const handleDateChange = (id: string, newDate: string) => {
    setEditedInstallments(prev =>
      prev.map(inst => (inst.id === id ? { ...inst, dueDate: new Date(newDate + 'T00:00:00') } : inst))
    );
  };

  const originalTotal = useMemo(() => installments.reduce((sum, inst) => sum + inst.amount, 0), [installments]);
  const newTotal = useMemo(() => editedInstallments.reduce((sum, inst) => sum + inst.amount, 0), [editedInstallments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedInstallments);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Revise e Edite as Parcelas</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Ajuste os valores e vencimentos de cada parcela se necessário.</p>
          </div>
          
          <div className="p-8 flex-grow overflow-y-auto space-y-4">
            {editedInstallments.map((installment, index) => (
              <div key={installment.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div className="font-semibold text-gray-700 dark:text-gray-200">
                  Parcela {index + 1}
                </div>
                <div>
                  <label htmlFor={`amount-${installment.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor (R$)</label>
                  <input
                    id={`amount-${installment.id}`}
                    type="number"
                    value={installment.amount}
                    onChange={e => handleAmountChange(installment.id, parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2"
                  />
                </div>
                <div>
                  <label htmlFor={`dueDate-${installment.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vencimento</label>
                  <input
                    id={`dueDate-${installment.id}`}
                    type="date"
                    value={new Date(installment.dueDate).toISOString().split('T')[0]}
                    onChange={e => handleDateChange(installment.id, e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm">
                <p className="text-gray-600 dark:text-gray-300">Total Original: <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalTotal)}</span></p>
                <p className={`font-semibold ${newTotal.toFixed(2) !== originalTotal.toFixed(2) ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                    Novo Total: <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newTotal)}</span>
                </p>
            </div>
            <div className="space-x-4">
              <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150">Cancelar</button>
              <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md">Salvar Parcelas</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstallmentEditorModal;
