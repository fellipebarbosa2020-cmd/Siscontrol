// FIX: Import useMemo to resolve error when calculating showPaymentActions.
import React, { useMemo } from 'react';
import { Bill } from '../types';
import Dashboard from '../components/Dashboard';
import BillList from '../components/BillList';
import { BillStatus } from '../components/BillListHeader';
import { PlusIcon, TrashIcon, CheckCircleIcon, ClockIcon, Cog6ToothIcon, DocumentArrowUpIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon } from '../components/icons';

interface DashboardScreenProps {
    bills: Bill[];
    filteredBills: Bill[];
    selectedBills: Set<string>;
    selectedBillObjects: Bill[];
    onSelectBill: (id: string) => void;
    onUnpayBill: (id:string) => void;
    onOpenPayForm: (id: string) => void;
    onOpenPostponeForm: (id: string) => void;
    onAttachFile: (id: string, file: File) => void;
    onEditBill: (bill: Bill) => void;
    onToggleRecurring: (id: string) => void;
    activeTab: BillStatus;
    onTabChange: (tab: BillStatus) => void;
    onSelectAll: () => void;
    isAllSelected: boolean;
    counts: { all: number; upcoming: number; overdue: number; paid: number; postponed: number };
    viewMode: 'list' | 'card';
    onViewChange: (mode: 'list' | 'card') => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    dateRange: { startDate: string, endDate: string };
    onDateRangeChange: (range: { startDate: string, endDate: string }) => void;
    isFilterVisible: boolean;
    onToggleFilter: () => void;
    isDashboardVisible: boolean;
    onToggleDashboard: () => void;
    dashboardData: any; // Replace with specific type
    onCardClick: (tab: BillStatus) => void;
    onOpenNewBillForm: () => void;
    onOpenImportModal: () => void;
    onOpenManagementModal: () => void;
    onOpenScheduleModal: () => void;
    handleDeleteBills: () => void;
    handlePayBills: (ids: string[]) => void;
    handlePostponeBills: (ids: string[]) => void;
}


const DashboardScreen: React.FC<DashboardScreenProps> = (props) => {
    const showPaymentActions = useMemo(() => {
        return ![...props.selectedBills].some(id => {
          const bill = props.bills.find(b => b.id === id);
          return bill?.isPaid;
        });
    }, [props.selectedBills, props.bills]);

    return (
        <div className="max-w-screen-2xl mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Controle de Contas</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas finanças com facilidade e precisão.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={props.onToggleDashboard}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label={props.isDashboardVisible ? "Recolher painel" : "Expandir painel"}
                    >
                        {props.isDashboardVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </button>
                </div>
            </header>

            <div className={`collapsible-content ${props.isDashboardVisible ? 'expanded' : ''} mb-6`}>
                <Dashboard data={props.dashboardData} onCardClick={props.onCardClick} />
            </div>

            <div className="flex items-center justify-end gap-2 my-6">
                <button
                    onClick={props.onOpenManagementModal}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Gerenciar Categorias e Centros de Custo"
                >
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Gerenciar</span>
                </button>
                <button
                    onClick={props.onOpenScheduleModal}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Ver calendário de contas"
                >
                    <CalendarIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Calendário</span>
                </button>
                <button
                    onClick={props.onOpenImportModal}
                    className="flex items-center gap-2 px-4 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-600 transition-colors"
                    title="Importar contas de arquivos"
                >
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Importar</span>
                </button>
                <button
                    onClick={props.onOpenNewBillForm}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Nova Conta</span>
                </button>
            </div>

            {props.selectedBills.size > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in-down">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {props.selectedBills.size} conta(s) selecionada(s)
                </p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {showPaymentActions && (
                    <>
                      <button onClick={() => props.handlePayBills([...props.selectedBills])} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700 transition-colors">
                        <CheckCircleIcon className="w-4 h-4" /> Pagar
                      </button>
                      <button onClick={() => props.handlePostponeBills([...props.selectedBills])} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700 transition-colors">
                        <ClockIcon className="w-4 h-4" /> Postegar
                      </button>
                    </>
                  )}
                  <button onClick={props.handleDeleteBills} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 transition-colors">
                    <TrashIcon className="w-4 h-4" /> Excluir
                  </button>
                </div>
              </div>
            )}

            <BillList {...props} bills={props.filteredBills} />
        </div>
    );
};

export default DashboardScreen;