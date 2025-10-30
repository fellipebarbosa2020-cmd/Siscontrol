import React, { useState, useRef } from 'react';
import { Bill, BillType } from '../types';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  PaperClipIcon,
  BarcodeIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  ShoppingCartIcon,
  TruckIcon,
  TicketIcon,
  HeartIcon,
  TagIcon,
} from './icons';

interface BillItemProps {
  bill: Bill;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUnpay: (id: string) => void;
  onOpenPayForm: (id: string) => void;
  onOpenPostponeForm: (id: string) => void;
  onAttachFile: (id: string, file: File) => void;
  onEdit: (bill: Bill) => void;
  onToggleRecurring: (id: string) => void;
}

const billTypeLabels: Record<BillType, string> = {
  [BillType.Variable]: 'Variável',
  [BillType.Installment]: 'Parcelada',
  [BillType.Monthly]: 'Mensal',
  [BillType.Annual]: 'Anual',
};

const BillItem: React.FC<BillItemProps> = ({ bill, isSelected, onSelect, onUnpay, onOpenPayForm, onOpenPostponeForm, onAttachFile, onEdit, onToggleRecurring }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { id, title, amount, dueDate, beneficiary, category, costCenter, isPaid, installmentNumber, totalInstallments, paymentDate, paidAmount, barcode, attachments, type, isRecurring, originalDueDate, postponements, history } = bill;

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  const formattedPaidAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidAmount || 0);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const billDueDate = new Date(dueDate);
  billDueDate.setHours(0,0,0,0);

  const isOverdue = !isPaid && billDueDate < today;
  const timeDiff = billDueDate.getTime() - today.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

  const interestAmount = isPaid && paidAmount && paidAmount > amount ? paidAmount - amount : 0;
  const discountAmount = isPaid && paidAmount && paidAmount < amount ? amount - paidAmount : 0;
  
  const postponedCount = postponements?.length || 0;

  const getBorderColor = () => {
    if (isPaid) return 'border-green-500';
    if (postponedCount > 0) return 'border-purple-500';
    if (isOverdue) return 'border-red-500';
    return 'border-blue-500';
  };
  
  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" };
    switch (category) {
      case 'Moradia':
        return <HomeIcon {...iconProps} />;
      case 'Alimentação':
        return <ShoppingCartIcon {...iconProps} />;
      case 'Transporte':
        return <TruckIcon {...iconProps} />;
      case 'Lazer':
        return <TicketIcon {...iconProps} />;
      case 'Saúde':
        return <HeartIcon {...iconProps} />;
      default:
        return <TagIcon {...iconProps} />;
    }
  };


  const renderStatus = () => {
    if (isPaid) {
      if (!paymentDate) return <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-semibold"><CheckCircleIcon className="w-4 h-4 mr-1"/> Pago</div>;
      const paidDate = new Date(paymentDate);
      paidDate.setHours(0,0,0,0);
      const paymentDiffTime = paidDate.getTime() - (new Date(originalDueDate || dueDate)).getTime();
      const paymentDiffDays = Math.ceil(paymentDiffTime / (1000 * 60 * 60 * 24));

      if (paymentDiffDays <= 0) {
        return <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-semibold"><CheckCircleIcon className="w-4 h-4 mr-1"/> Pago em dia</div>
      } else {
        return <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 font-semibold"><ExclamationTriangleIcon className="w-4 h-4 mr-1"/> Pago com {paymentDiffDays} dia{paymentDiffDays > 1 ? 's' : ''} de atraso</div>
      }
    }
    if (postponedCount > 0) {
      return (
        <div>
            <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold">
                <ClockIcon className="w-4 h-4 mr-1"/>
                Postergada ({postponedCount}x)
            </div>
            {originalDueDate && (
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                    Orig: {new Date(originalDueDate).toLocaleDateString('pt-BR')}
                </div>
            )}
        </div>
      )
    }
    if (isOverdue) {
       return <div className="flex items-center text-sm text-red-600 dark:text-red-400 font-semibold"><ExclamationTriangleIcon className="w-4 h-4 mr-1"/> Vencida há {Math.abs(daysDiff)} dia{Math.abs(daysDiff) > 1 ? 's' : ''}</div>
    }
    if (daysDiff === 0) {
      return <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold"><ClockIcon className="w-4 h-4 mr-1"/> Vence hoje</div>
    }
    return <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-semibold"><ClockIcon className="w-4 h-4 mr-1"/> Vence em {daysDiff} dia{daysDiff > 1 ? 's' : ''}</div>
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onAttachFile(id, event.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleViewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  const handleDownloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
      border-l-8 ${getBorderColor()} ${isPaid ? 'opacity-70' : ''}
    `}>
      <div className="grid grid-cols-12 gap-4 items-center p-4">
        {/* Conta */}
        <div className="col-span-12 md:col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onSelect(id); }} className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0" />
            <div className="flex-grow">
                 {(type === BillType.Monthly || type === BillType.Annual) && isRecurring && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full mb-1 w-fit">
                        <ArrowPathIcon className="w-3 h-3" />
                        <span>ATIVADA</span>
                    </div>
                )}
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                {getCategoryIcon(category)}
                <span>{title}</span>
                </h3>
                {installmentNumber && totalInstallments && <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({installmentNumber}/{totalInstallments})</span>}
            </div>
        </div>
        
        {/* Beneficiário */}
        <div className="col-span-6 md:col-span-2 text-sm text-gray-600 dark:text-gray-300">{beneficiary}</div>
        
        {/* Categoria */}
        <div className="col-span-6 md:col-span-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">{category || 'N/A'}</span>
        </div>

        {/* Centro de Custo */}
        <div className="col-span-6 md:col-span-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">{costCenter || 'N/A'}</span>
        </div>

        {/* Tipo */}
        <div className="col-span-6 md:col-span-1 text-sm text-gray-600 dark:text-gray-300">
          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">{billTypeLabels[type]}</span>
        </div>
        
        {/* Vencimento */}
        <div className="col-span-6 md:col-span-1 text-sm text-gray-600 dark:text-gray-300">
          <div>{new Date(dueDate).toLocaleDateString('pt-BR')}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">{new Date(dueDate).toLocaleDateString('pt-BR', { weekday: 'long' })}</div>
        </div>

        {/* Valor */}
        <div className="col-span-6 md:col-span-1 text-right">
          <p className={`font-bold text-lg ${isPaid ? 'text-green-600 dark:text-green-400' : isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {isPaid ? formattedPaidAmount : formattedAmount}
          </p>
           {interestAmount > 0 && (
            <span className="text-xs text-red-500 dark:text-red-400">
              (+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(interestAmount)} juros)
            </span>
          )}
          {discountAmount > 0 && (
            <span className="text-xs text-green-600 dark:text-green-400">
              (- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount)} desc.)
            </span>
          )}
        </div>

        {/* Status */}
        <div className="col-span-12 md:col-span-2">
            {renderStatus()}
        </div>

        {/* Ações */}
        <div className="col-span-12 md:col-span-1 flex justify-end items-center gap-2">
          {isPaid ? (
             <button onClick={(e) => { e.stopPropagation(); onUnpay(id); }} className="text-xs font-semibold rounded-lg transition-colors duration-200 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                Desfazer
             </button>
          ) : (
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onEdit(bill)} aria-label="Editar conta" className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"><PencilIcon className="w-5 h-5" /></button>
              <button onClick={() => onOpenPostponeForm(id)} aria-label="Postegar conta" className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"><ClockIcon className="w-5 h-5" /></button>
              <button onClick={() => onOpenPayForm(id)} className="px-3 py-1 text-sm font-semibold rounded-lg transition-colors duration-200 bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700">Pagar</button>
            </div>
          )}
           <button 
             onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
             aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
             className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors duration-200"
            >
              {isExpanded ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
            </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    {(type === BillType.Monthly || type === BillType.Annual) && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">Geração Automática</h4>
                        <button onClick={() => onToggleRecurring(id)} className={`flex items-center gap-2 text-sm p-2 rounded-lg ${isRecurring ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                          <ArrowPathIcon className={`w-4 h-4 ${isRecurring ? 'animate-spin' : ''}`}/>
                          {isRecurring ? 'Ativada' : 'Desativada'}
                        </button>
                      </div>
                    )}
                    <div className="flex items-start gap-3 pt-4">
                        <BarcodeIcon className="w-5 h-5 mt-1 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Código de Barras</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-mono break-all">{barcode || 'Não informado'}</p>
                        </div>
                    </div>
                </div>
                 <div>
                    <div className="flex items-start gap-3">
                        <PaperClipIcon className="w-5 h-5 mt-1 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Anexos</h4>
                            <div className="mt-2 space-y-2">
                              {attachments && attachments.length > 0 ? (
                                attachments.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate pr-2">{file.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button onClick={() => handleViewFile(file)} title="Abrir anexo" className="p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors">
                                        <EyeIcon className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDownloadFile(file)} title="Baixar anexo" className="p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors">
                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum anexo.</p>
                              )}
                              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                              <button onClick={handleAttachClick} className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors">
                                Adicionar Anexo +
                              </button>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
            
             <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)} 
                    className="w-full flex justify-between items-center text-left"
                    aria-expanded={isHistoryExpanded}
                >
                    <div className="flex items-start gap-3">
                        <ClipboardDocumentListIcon className="w-5 h-5 mt-1 text-gray-500 dark:text-gray-400 flex-shrink-0"/>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Histórico da Conta</h4>
                        </div>
                    </div>
                    {isHistoryExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
                </button>

                {isHistoryExpanded && (
                    <div className="mt-2 pl-8 space-y-2 text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                        {history && history.length > 0 ? (
                            [...history].reverse().map((entry, index) => (
                                <p key={index} className="border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">[{new Date(entry.timestamp).toLocaleString('pt-BR')}] - {entry.event}:</span> {entry.details}
                                </p>
                            ))
                        ) : (
                            <p>Nenhum histórico para esta conta.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default BillItem;