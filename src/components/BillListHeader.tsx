import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from './icons';

export type BillStatus = 'ALL' | 'UPCOMING' | 'OVERDUE' | 'PAID' | 'POSTPONED';

interface BillListHeaderProps {
  activeTab: BillStatus;
  onTabChange: (tab: BillStatus) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  counts: {
    all: number;
    upcoming: number;
    overdue: number;
    paid: number;
    postponed: number;
  };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  dateRange: { startDate: string, endDate: string };
  onDateRangeChange: (range: { startDate: string, endDate: string }) => void;
  isFilterVisible: boolean;
  onToggleFilter: () => void;
}

const BillListHeader: React.FC<BillListHeaderProps> = ({ 
    activeTab, 
    onTabChange, 
    onSelectAll, 
    isAllSelected,
    counts,
    searchQuery,
    onSearchQueryChange,
    dateRange,
    onDateRangeChange,
    isFilterVisible,
    onToggleFilter
}) => {
  const tabs: { key: BillStatus; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todas', count: counts.all },
    { key: 'UPCOMING', label: 'A Vencer', count: counts.upcoming },
    { key: 'OVERDUE', label: 'Vencidas', count: counts.overdue },
    { key: 'PAID', label: 'Pagas', count: counts.paid },
    { key: 'POSTPONED', label: 'Postergadas', count: counts.postponed },
  ];
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onDateRangeChange({ ...dateRange, [name]: value });
  };

  const clearFilters = () => {
    onSearchQueryChange('');
    onDateRangeChange({ startDate: '', endDate: '' });
  };

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-full" aria-label="Tabs">
            {tabs.map(tab => (
                <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
                    ${activeTab === tab.key
                    ? `bg-white text-indigo-600 dark:bg-gray-900 dark:text-white shadow-sm`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                `}
                >
                <span>{tab.label}</span>
                <span className={`
                    py-0.5 px-2.5 rounded-full text-xs font-bold
                    ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100'}
                `}>
                    {tab.count}
                </span>
                </button>
            ))}
            </div>

            {/* Select All */}
            <div className="flex items-center flex-shrink-0">
                <label htmlFor="select-all" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                        id="select-all"
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={onSelectAll}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mr-2"
                    />
                    Selecionar Todas
                </label>
            </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-end">
                <button 
                    onClick={onToggleFilter}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    <FunnelIcon className="w-4 h-4"/>
                    Filtrar
                </button>
            </div>

            <div className={`collapsible-content ${isFilterVisible ? 'expanded' : ''}`}>
                <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex flex-col md:flex-row items-center gap-4 mt-4">
                    <div className="relative flex-grow w-full md:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Pesquisar por título, beneficiário, categoria..."
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 w-full md:w-auto">
                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">De:</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={dateRange.startDate}
                            onChange={handleDateChange}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2 w-full md:w-auto">
                        <label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Até:</label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={dateRange.endDate}
                            onChange={handleDateChange}
                            min={dateRange.startDate}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BillListHeader;