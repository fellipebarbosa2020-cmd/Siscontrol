import React, { useState, useMemo } from 'react';
import { Bill } from '../types';

interface PayBillFormProps {
  bill: Bill;
  onClose: () => void;
  onConfirm: (id: string, paymentDate: Date, paidAmount: number) => void;
}

const PayBillForm: React.FC<PayBillFormProps> = ({ bill, onClose, onConfirm }) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState(bill.amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paidAmount <= 0) {
      alert("O valor pago deve ser maior que zero.");
      return;
    }
    onConfirm(bill.id, new Date(paymentDate + 'T00:00:00'), paidAmount);
  };

  const { difference, percentage, isDiscount } = useMemo(() => {
    const diff = paidAmount - bill.amount;
    const perc = bill.amount === 0 ? 0 : (diff / bill.amount) * 100;
    return {
      difference: diff,
      percentage: perc.toFixed(2),
      isDiscount: diff < 0,
    };
  }, [paidAmount, bill.amount]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Registrar Pagamento: {bill.title}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Original</label>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}</p>
          </div>

          <div>
            <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Pago (R$)</label>
            <input
              type="number"
              name="paidAmount"
              id="paidAmount"
              required
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"
              step="0.01"
              min="0.01"
            />
          </div>

          {difference !== 0 && (
            <div className={`p-3 rounded-md text-sm ${isDiscount ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
              <strong>{isDiscount ? 'Desconto' : 'Juros'}: </strong> 
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(difference))} ({Math.abs(Number(percentage))}%)
            </div>
          )}
          
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data do Pagamento</label>
            <input
              type="date"
              name="paymentDate"
              id="paymentDate"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"
            />
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-150">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition duration-150 shadow-md">Confirmar Pagamento</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayBillForm;