import React from 'react';
import { Bill } from '../types';
import BillItem from './BillItem';
import BillListHeader, { BillStatus } from './BillListHeader';
import ViewSwitcher from './ViewSwitcher';
import BillCard from './BillCard';
import ExportMenu from './ExportMenu';
import { ArrowPathIcon } from './icons';

interface BillListProps {
  bills: Bill[];
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
}

const BillList: React.FC<BillListProps> = ({ 
    bills, 
    selectedBills, 
    selectedBillObjects,
    onSelectBill, 
    onUnpayBill,
    onOpenPayForm,
    onOpenPostponeForm,
    onAttachFile,
    onEditBill,
    onToggleRecurring,
    activeTab,
    onTabChange,
    onSelectAll,
    isAllSelected,
    counts,
    viewMode,
    onViewChange,
    searchQuery,
    onSearchQueryChange,
    dateRange,
    onDateRangeChange,
    isFilterVisible,
    onToggleFilter,
}) => {
  
  const sharedItemProps = (bill: Bill) => ({
    key: bill.id,
    bill,
    isSelected: selectedBills.has(bill.id),
    onSelect: onSelectBill,
    onUnpay: onUnpayBill,
    onOpenPayForm: onOpenPayForm,
    onOpenPostponeForm: onOpenPostponeForm,
    onAttachFile,
    onEdit: onEditBill,
    onToggleRecurring,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <BillListHeader 
            activeTab={activeTab}
            onTabChange={onTabChange}
            onSelectAll={onSelectAll}
            isAllSelected={isAllSelected}
            counts={counts}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            isFilterVisible={isFilterVisible}
            onToggleFilter={onToggleFilter}
        />

        <div className="flex justify-between items-center my-4">
          <ExportMenu filteredBills={bills} selectedBillObjects={selectedBillObjects} />
          <ViewSwitcher viewMode={viewMode} onViewChange={onViewChange} />
        </div>

        <div className="mt-4">
            {bills.length === 0 ? (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300">Nenhuma conta encontrada.</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Tente ajustar seus filtros ou adicione uma nova conta!</p>
                </div>
            ) : viewMode === 'list' ? (
                <>
                <div className="hidden md:grid grid-cols-12 gap-4 items-center px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-700 mb-2">
                    <div className="col-span-2 pl-[36px]">Conta</div>
                    <div className="col-span-2">Beneficiário</div>
                    <div className="col-span-1">Categoria</div>
                    <div className="col-span-1">Centro de Custo</div>
                    <div className="col-span-1">Tipo</div>
                    <div className="col-span-1">Vencimento</div>
                    <div className="col-span-1 text-right">Valor</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Ações</div>
                </div>
                <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto pr-2">
                {bills.map(bill => (
                    <BillItem {...sharedItemProps(bill)} />
                ))}
                </div>
                </>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 max-h-[calc(100vh-500px)] overflow-y-auto pr-2">
                {bills.map(bill => (
                  <BillCard {...sharedItemProps(bill)} />
                ))}
              </div>
            )}
        </div>
    </div>
  );
};

export default BillList;