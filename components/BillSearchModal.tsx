import React, { useState, useMemo } from 'react';
import { Bill } from '../types';
import { MagnifyingGlassIcon } from './icons';
import { isFuzzyMatch } from '../utils';

interface BillSearchModalProps {
  bills: Bill[];
  onClose: () => void;
  onSelect: (bill: Bill) => void;
}

const BillSearchModal: React.FC<BillSearchModalProps> = ({ bills, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const uniqueBills = useMemo(() => {
    const unique: { [key: string]: Bill } = {};
    const sortedBills = [...bills].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    sortedBills.forEach(bill => {
      const key = `${bill.title.toLowerCase()}|${bill.beneficiary.toLowerCase()}`;
      if (!unique[key]) {
        unique[key] = bill;
      }
    });
    return Object.values(unique);
  }, [bills]);

  const filteredBills = useMemo(() => {
    if (!searchTerm.trim()) {
      return uniqueBills;
    }
    return uniqueBills.filter(bill =>
      isFuzzyMatch(bill.title, searchTerm) ||
      isFuzzyMatch(bill.beneficiary, searchTerm)
    );
  }, [searchTerm, uniqueBills]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Buscar Conta Existente</h2>
          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar por título ou beneficiário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {filteredBills.length > 0 ? (
            <ul className="space-y-2">
              {filteredBills.map(bill => (
                <li key={bill.id}>
                  <button
                    onClick={() => onSelect(bill)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-semibold text-gray-800 dark:text-white">{bill.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{bill.beneficiary}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma conta encontrada.</p>
          )}
        </div>
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillSearchModal;