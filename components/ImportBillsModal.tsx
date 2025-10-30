import React, { useState, useCallback, useMemo } from 'react';
import { ImportedBillReview, BillType } from '../types';
import { DocumentArrowUpIcon, TrashIcon, ExclamationTriangleIcon } from './icons';

interface ImportBillsModalProps {
  onClose: () => void;
  onSave: (billsToSave: ImportedBillReview[]) => void;
  onParseFiles: (files: File[]) => void;
  importedBills: ImportedBillReview[];
  onUpdateBill: (id: string, updatedData: Partial<ImportedBillReview>) => void;
  categories: string[];
  costCenters: string[];
}

const ImportBillsModal: React.FC<ImportBillsModalProps> = ({ onClose, onSave, onParseFiles, importedBills, onUpdateBill, categories, costCenters }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const acceptedFiles = Array.from(files).filter(
        file => file.type.startsWith('image/') || file.type === 'application/pdf'
      );
      if (acceptedFiles.length > 0) {
        onParseFiles(acceptedFiles);
      }
    }
  }, [onParseFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);
  
  const handleRemoveBill = (id: string) => {
    onUpdateBill(id, { status: 'error', errorMessage: 'Removido pelo usuário.' });
  };
  
  const successfulBills = useMemo(() => importedBills.filter(b => b.status === 'success'), [importedBills]);

  const isSaveDisabled = useMemo(() => {
    if (successfulBills.length === 0) return true;
    return successfulBills.some(b => 
        !b.category || 
        !b.costCenter || 
        !b.type || 
        !b.data?.title || 
        !b.data?.beneficiary || 
        b.data?.amount === undefined || b.data?.amount <= 0 ||
        !b.data?.dueDate ||
        (b.type === BillType.Installment && (!b.installments || b.installments < 2))
    );
  }, [successfulBills]);

  const renderContent = () => {
    if (importedBills.length === 0) {
      return (
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-2xl transition-colors
            ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600'}`}
        >
          <DocumentArrowUpIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"/>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Arraste e solte seus arquivos aqui</p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">PDFs ou Imagens</p>
          <label htmlFor="file-upload" className="mt-6 cursor-pointer px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md">
            Ou selecione os arquivos
          </label>
          <input id="file-upload" type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileSelect(e.target.files)}/>
        </div>
      );
    }
    
    // Review Screen
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Revise as contas importadas</h3>
        {importedBills.map((bill) => (
          <div key={bill.id} className={`p-4 rounded-lg shadow-sm ${bill.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
            <div className="flex justify-between items-start">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate pr-4">{bill.file.name}</p>
              {bill.status === 'parsing' && <div className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">Analisando...</div>}
              {bill.status === 'error' && (
                  <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4"/> 
                    {bill.errorMessage}
                </div>
              )}
               {bill.status !== 'parsing' && bill.status !== 'error' && (
                 <button onClick={() => handleRemoveBill(bill.id)} className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 -mt-1"><TrashIcon className="w-5 h-5"/></button>
               )}
            </div>
            
            {bill.status === 'success' && bill.isDuplicate && (
                <div className="mt-2 p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Atenção: Esta conta parece ser uma duplicata de uma já existente.</span>
                </div>
            )}
            
            {bill.status === 'success' && bill.data && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input type="text" placeholder="Título" value={bill.data.title} onChange={(e) => onUpdateBill(bill.id, { data: {...bill.data!, title: e.target.value}})} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2"/>
                  <input type="text" placeholder="Beneficiário" value={bill.data.beneficiary} onChange={(e) => onUpdateBill(bill.id, { data: {...bill.data!, beneficiary: e.target.value}})} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2"/>
                  <input type="number" placeholder="Valor" value={bill.data.amount} onChange={(e) => onUpdateBill(bill.id, { data: {...bill.data!, amount: parseFloat(e.target.value) || 0}})} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2" step="0.01"/>
                  <input type="date" value={bill.data.dueDate} onChange={(e) => onUpdateBill(bill.id, { data: {...bill.data!, dueDate: e.target.value}})} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2"/>
                  <select value={bill.category} onChange={e => onUpdateBill(bill.id, { category: e.target.value })} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2">
                    <option value="">Categoria...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={bill.costCenter} onChange={e => onUpdateBill(bill.id, { costCenter: e.target.value })} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2">
                    <option value="">Centro de Custo...</option>
                    {costCenters.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={bill.type} onChange={e => onUpdateBill(bill.id, { type: e.target.value as BillType })} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2">
                    <option value={BillType.Variable}>Variável</option>
                    <option value={BillType.Installment}>Parcelada</option>
                    <option value={BillType.Monthly}>Mensal</option>
                    <option value={BillType.Annual}>Anual</option>
                  </select>
                  {bill.type === BillType.Installment && (
                    <input type="number" placeholder="Parcelas" value={bill.installments} onChange={e => onUpdateBill(bill.id, { installments: parseInt(e.target.value) || 2 })} className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2" min="2"/>
                  )}
                </div>
                <input
                    type="text"
                    placeholder="Código de Barras (opcional)"
                    value={bill.data.barcode || ''}
                    onChange={(e) => onUpdateBill(bill.id, { data: {...bill.data!, barcode: e.target.value}})}
                    className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm p-2 font-mono"
                />
                {(bill.type === BillType.Monthly || bill.type === BillType.Annual) && (
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-300 dark:border-gray-600">
                    <input
                      type="checkbox"
                      id={`recurring-${bill.id}`}
                      checked={!!bill.isRecurring}
                      onChange={(e) => onUpdateBill(bill.id, { isRecurring: e.target.checked })}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={`recurring-${bill.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Ativar geração automática para os próximos vencimentos.
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Importar Contas</h2>
        </div>
        <div className="p-8 flex-grow overflow-y-auto">
          {renderContent()}
        </div>
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
          <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150">Cancelar</button>
          {successfulBills.length > 0 && (
            <button
              onClick={() => onSave(successfulBills)}
              disabled={isSaveDisabled}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Salvar {successfulBills.length} Conta{successfulBills.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportBillsModal;