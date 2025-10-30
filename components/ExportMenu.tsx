import React, { useState, useRef, useEffect } from 'react';
import { Bill } from '../types';
import { ArrowDownTrayIcon } from './icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType } from 'docx';

interface ExportMenuProps {
  filteredBills: Bill[];
  selectedBillObjects: Bill[];
}

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


const exportToCSV = (billsToExport: Bill[], filename: string) => {
    const headers = ["Título", "Beneficiário", "Valor", "Vencimento", "Categoria", "Centro de Custo", "Tipo", "Status", "Data Pagamento", "Valor Pago", "Código de Barras"];
    const rows = billsToExport.map(bill => [
        `"${bill.title.replace(/"/g, '""')}"`,
        `"${bill.beneficiary.replace(/"/g, '""')}"`,
        bill.amount,
        new Date(bill.dueDate).toLocaleDateString('pt-BR'),
        bill.category,
        bill.costCenter,
        bill.type,
        bill.isPaid ? 'Pago' : 'Pendente',
        bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString('pt-BR') : '',
        bill.paidAmount || '',
        bill.barcode ? `"${bill.barcode}"` : ''
    ]);

    const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

const exportToPDF = (billsToExport: Bill[], filename: string) => {
    const doc = new jsPDF();
    const tableColumn = ["Título", "Beneficiário", "Valor", "Vencimento", "Status"];
    const tableRows: (string | number)[][] = [];

    billsToExport.forEach(bill => {
        const billData = [
            bill.title,
            bill.beneficiary,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount),
            new Date(bill.dueDate).toLocaleDateString('pt-BR'),
            bill.isPaid ? 'Pago' : 'Pendente'
        ];
        tableRows.push(billData);
    });

    doc.text("Relatório de Contas", 14, 15);
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    doc.save(filename);
}

const exportToDOCX = async (billsToExport: Bill[], filename: string) => {
    const header = new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Título", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Beneficiário", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Valor", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Vencimento", bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
        ],
    });

    const rows = billsToExport.map(bill => new TableRow({
        children: [
            new TableCell({ children: [new Paragraph(bill.title)] }),
            new TableCell({ children: [new Paragraph(bill.beneficiary)] }),
            new TableCell({ children: [new Paragraph(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount))] }),
            new TableCell({ children: [new Paragraph(new Date(bill.dueDate).toLocaleDateString('pt-BR'))] }),
            new TableCell({ children: [new Paragraph(bill.isPaid ? 'Pago' : 'Pendente')] }),
        ]
    }));

    const table = new Table({
        rows: [header, ...rows],
        width: {
            size: 100,
            type: WidthType.PERCENTAGE,
        },
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: "Relatório de Contas", heading: 'Heading1', alignment: AlignmentType.CENTER }),
                new Paragraph(" "), // spacing
                table
            ],
        }],
    });
    
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, filename);
}

const ExportMenu: React.FC<ExportMenuProps> = ({ filteredBills, selectedBillObjects }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleExport = (format: 'csv' | 'pdf' | 'docx', type: 'selected' | 'all') => {
    const billsToExport = type === 'selected' ? selectedBillObjects : filteredBills;
    const date = new Date().toISOString().split('T')[0];
    const filename = `contas_${type === 'selected' ? 'selecionadas' : 'filtradas'}_${date}.${format}`;
    
    if (billsToExport.length === 0) {
        alert('Nenhuma conta para exportar.');
        return;
    }

    if (format === 'csv') exportToCSV(billsToExport, filename);
    if (format === 'pdf') exportToPDF(billsToExport, filename);
    if (format === 'docx') exportToDOCX(billsToExport, filename);
    
    setIsOpen(false);
  };

  const hasSelection = selectedBillObjects.length > 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        Exportar
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Exportar Selecionadas ({selectedBillObjects.length})</div>
            <button
              onClick={() => handleExport('csv', 'selected')}
              disabled={!hasSelection}
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Como CSV
            </button>
            <button
              onClick={() => handleExport('pdf', 'selected')}
              disabled={!hasSelection}
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Como PDF
            </button>
            <button
              onClick={() => handleExport('docx', 'selected')}
              disabled={!hasSelection}
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Como Word (.docx)
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Exportar Todas as Filtradas ({filteredBills.length})</div>
            <button onClick={() => handleExport('csv', 'all')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              Como CSV
            </button>
            <button onClick={() => handleExport('pdf', 'all')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              Como PDF
            </button>
            <button onClick={() => handleExport('docx', 'all')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              Como Word (.docx)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;