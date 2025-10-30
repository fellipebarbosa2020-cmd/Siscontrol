import React, { useState } from 'react';
import { Bill } from '../types';

interface PostponeBillFormProps {
  bill: Bill;
  onClose: () => void;
  onConfirm: (id: string, newDueDate: Date, reason: string) => void;
}

const PostponeBillForm: React.FC<PostponeBillFormProps> = ({ bill, onClose, onConfirm }) => {
  const tomorrow = new Date();
  tomorrow.setDate(new Date(bill.dueDate).getDate() + 1);
  const [newDueDate, setNewDueDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(bill.id, new Date(newDueDate + 'T00:00:00'), reason || 'Nenhum motivo informado.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Postegar Conta: {bill.title}</h2>
          <div>
            <label htmlFor="newDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova Data de Vencimento</label>
            <input
              type="date"
              name="newDueDate"
              id="newDueDate"
              required
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={tomorrow.toISOString().split('T')[0]}
              className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo (Opcional)</label>
            <textarea
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ex: Aguardando pagamento do cliente..."
              className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"
            />
          </div>
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition duration-150 shadow-md">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostponeBillForm;