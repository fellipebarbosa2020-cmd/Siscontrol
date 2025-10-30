import React, { useState } from 'react';
import { TrashIcon, PencilIcon, CheckCircleIcon } from './icons';

interface ManagementModalProps {
  categories: string[];
  costCenters: string[];
  jobFunctions: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateCategory: (oldName: string, newName: string) => void;
  onAddCostCenter: (costCenter: string) => void;
  onDeleteCostCenter: (costCenter: string) => void;
  onUpdateCostCenter: (oldName: string, newName: string) => void;
  onAddJobFunction: (jobFunction: string) => void;
  onDeleteJobFunction: (jobFunction: string) => void;
  onUpdateJobFunction: (oldName: string, newName: string) => void;
  onClose: () => void;
  mode?: 'all' | 'jobFunctions';
}

const ManagementList: React.FC<{
  title: string;
  items: string[];
  onAddItem: (item: string) => void;
  onDeleteItem: (item: string) => void;
  onUpdateItem: (oldName: string, newName: string) => void;
  isEditable?: boolean;
}> = ({ title, items, onAddItem, onDeleteItem, onUpdateItem, isEditable = false }) => {
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  const handleAddItem = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onAddItem(newItem.trim());
      setNewItem('');
    }
  };
  
  const handleEdit = (item: string) => {
    setEditingItem(item);
    setEditedValue(item);
  };

  const handleSaveEdit = (oldName: string) => {
    if (onUpdateItem && editedValue.trim() && editedValue.trim() !== oldName) {
      onUpdateItem(oldName, editedValue.trim());
    }
    setEditingItem(null);
    setEditedValue('');
  };


  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Nova ${title.toLowerCase().slice(0, -1)}`}
          className="flex-grow bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
        />
        <button
          type="button"
          onClick={handleAddItem}
          className="bg-indigo-500 text-white p-2 rounded-md hover:bg-indigo-600 font-semibold text-sm whitespace-nowrap"
        >
          Adicionar
        </button>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 h-64 overflow-y-auto space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item}
              className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm"
            >
              {editingItem === item ? (
                 <input
                  type="text"
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item)}
                  onBlur={() => handleSaveEdit(item)}
                  autoFocus
                  className="flex-grow bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-1"
                />
              ) : (
                 <span className="text-sm text-gray-700 dark:text-gray-200">{item}</span>
              )}
              <div className="flex items-center">
                {isEditable && editingItem !== item && (
                    <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" aria-label={`Editar ${item}`}>
                        <PencilIcon className="w-4 h-4" />
                    </button>
                )}
                 {isEditable && editingItem === item && (
                  <button onClick={() => handleSaveEdit(item)} className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors" aria-label={`Salvar ${item}`}>
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                    onClick={() => onDeleteItem(item)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label={`Excluir ${item}`}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-4">Nenhum item.</p>
        )}
      </div>
    </div>
  );
};

const ManagementModal: React.FC<ManagementModalProps> = ({
  categories,
  costCenters,
  jobFunctions,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onAddCostCenter,
  onDeleteCostCenter,
  onUpdateCostCenter,
  onAddJobFunction,
  onDeleteJobFunction,
  onUpdateJobFunction,
  onClose,
  mode = 'all',
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Gerenciar Listas</h2>
        </div>
        <div className={`p-8 pt-0 grid grid-cols-1 ${mode === 'all' ? 'md:grid-cols-2' : ''} gap-8 overflow-y-auto`}>
          {mode === 'all' && (
            <>
              <ManagementList
                title="Categorias"
                items={categories}
                onAddItem={onAddCategory}
                onDeleteItem={onDeleteCategory}
                onUpdateItem={onUpdateCategory}
                isEditable={true}
              />
              <ManagementList
                title="Centros de Custo"
                items={costCenters}
                onAddItem={onAddCostCenter}
                onDeleteItem={onDeleteCostCenter}
                onUpdateItem={onUpdateCostCenter}
                isEditable={true}
              />
            </>
          )}
           <div className={mode === 'all' ? "md:col-span-2" : ""}>
             <ManagementList
                title="Funções (Cargos)"
                items={jobFunctions}
                onAddItem={onAddJobFunction}
                onDeleteItem={onDeleteJobFunction}
                onUpdateItem={onUpdateJobFunction}
                isEditable={true}
            />
          </div>
        </div>
        <div className="flex justify-end p-8 mt-auto border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagementModal;