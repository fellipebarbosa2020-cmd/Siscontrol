import React, { useMemo, useState } from 'react';
import { Bill, BillType } from '../types';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, CurrencyDollarIcon, TagIcon, ListBulletIcon, Squares2x2Icon, ArrowsPointingInIcon, CalendarDaysIcon } from './icons';
import { normalizeString } from '../utils';

interface CalendarModalProps {
  bills: Bill[];
  onClose: () => void;
  onNavigateToBill: (bill: Bill) => void;
}

const billTypeLabels: Record<BillType, string> = {
  [BillType.Variable]: 'Variável',
  [BillType.Installment]: 'Parcelada',
  [BillType.Monthly]: 'Mensal',
  [BillType.Annual]: 'Anual',
};

const RecurringBillsSchedule: React.FC<CalendarModalProps> = ({ bills, onClose, onNavigateToBill }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [isMaximized, setIsMaximized] = useState(false);

    const filteredBills = useMemo(() => {
        if (!searchTerm) {
            return bills;
        }
        const normalizedSearch = normalizeString(searchTerm);
        return bills.filter(bill =>
            normalizeString(bill.title).includes(normalizedSearch) ||
            normalizeString(bill.beneficiary).includes(normalizedSearch) ||
            normalizeString(bill.category).includes(normalizedSearch) ||
            normalizeString(bill.costCenter).includes(normalizedSearch)
        );
    }, [bills, searchTerm]);

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    }

    const { calendarGrid, billsByDate } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();
        
        const grid: (Date | null)[] = [];
        
        // Add nulls for days from the previous month
        for (let i = 0; i < startDayOfWeek; i++) {
            grid.push(null);
        }
        // Add days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            grid.push(new Date(year, month, day));
        }

        const bbd: { [key: string]: Bill[] } = {};
        filteredBills.forEach(bill => {
            const dueDate = new Date(bill.dueDate);
            if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                const day = dueDate.getDate();
                if (!bbd[day]) bbd[day] = [];
                bbd[day].push(bill);
            }
        });

        return { calendarGrid: grid, billsByDate: bbd };
    }, [currentDate, filteredBills]);
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getBillStatusBorder = (bill: Bill): string => {
        if (bill.isPaid) return 'border-green-500';
        const today = new Date();
        today.setHours(0,0,0,0);
        const billDueDate = new Date(bill.dueDate);
        billDueDate.setHours(0,0,0,0);
        if (billDueDate < today) return 'border-red-500';
        if(bill.postponements && bill.postponements.length > 0) return 'border-purple-500';
        return 'border-blue-500';
    };

    const handleBillClick = (bill: Bill) => {
        onNavigateToBill(bill);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-0 sm:p-4 animate-fade-in-down">
            <div className={`bg-gray-100 dark:bg-gray-800 shadow-2xl w-full flex flex-col transition-all duration-300 ease-in-out ${isMaximized ? 'h-screen max-w-full max-h-screen rounded-none' : 'max-w-7xl h-[95vh] rounded-2xl'}`}>
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-4 bg-white dark:bg-gray-800 ${isMaximized ? '' : 'rounded-t-2xl'}">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Mês anterior"><ChevronLeftIcon /></button>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white capitalize w-40 sm:w-48 text-center">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Próximo mês"><ChevronRightIcon /></button>
                        <button onClick={goToToday} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" title="Voltar para hoje">
                          <CalendarDaysIcon className="w-4 h-4"/>
                          <span className="hidden md:inline">Hoje</span>
                        </button>
                    </div>
                     <div className="relative w-full sm:max-w-xs">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar na agenda..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border-2 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={isMaximized ? 'Minimizar' : 'Maximizar'}>
                            {isMaximized ? <ArrowsPointingInIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" /> : <Squares2x2Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Fechar">
                            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col p-1 sm:p-2">
                    <div className="grid grid-cols-7 flex-shrink-0">
                        {weekdays.map(day => (
                            <div key={day} className="text-center font-bold text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6 h-full w-full flex-grow">
                        {calendarGrid.map((date, index) => {
                            const day = date ? date.getDate() : null;
                            const billsForDay = day ? (billsByDate[day] || []) : [];
                            const isToday = date && date.toDateString() === new Date().toDateString();
                            
                            return (
                                <div
                                    key={index}
                                    className={`relative p-1.5 flex flex-col border-r border-b border-gray-200 dark:border-gray-700/50 transition-colors ${date ? 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-900/30'}`}
                                >
                                    {date && (
                                        <>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-bold text-xs sm:text-sm ${isToday ? 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {day}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-1.5 overflow-y-auto flex-grow pr-1 simple-scrollbar">
                                                {billsForDay.map(bill => (
                                                    <button 
                                                        key={bill.id} 
                                                        onClick={() => handleBillClick(bill)}
                                                        className={`group relative w-full text-left p-1.5 rounded-md shadow-sm transition-all hover:shadow-md hover:scale-[1.02] transform border-l-4 ${getBillStatusBorder(bill)} bg-white dark:bg-gray-800`}
                                                    >
                                                      <p className="font-bold text-xs text-gray-800 dark:text-white truncate">{bill.title}</p>
                                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.isPaid ? (bill.paidAmount || bill.amount) : bill.amount)}</p>
                                                      
                                                      <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10 shadow-lg opacity-95">
                                                        <p><strong>Beneficiário:</strong> {bill.beneficiary}</p>
                                                        <p><strong>Categoria:</strong> {bill.category}</p>
                                                        <p><strong>Tipo:</strong> {billTypeLabels[bill.type]}</p>
                                                      </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                 <style>{`
                    .simple-scrollbar::-webkit-scrollbar {
                        width: 5px;
                        height: 5px;
                    }
                    .simple-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .simple-scrollbar::-webkit-scrollbar-thumb {
                        background: #ccc;
                        border-radius: 10px;
                    }
                    .dark .simple-scrollbar::-webkit-scrollbar-thumb {
                        background: #4a5568;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default RecurringBillsSchedule;
