import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Bill, BillType, FormData, HistoryEntry, ImportedBillReview, ImportedBillData, Company, Attachment, User, UserType, Admin } from './types';
import BillForm from './components/BillForm';
import PayBillForm from './components/PayBillForm';
import PostponeBillForm from './components/PostponeBillForm';
import ManagementModal from './components/ManagementModal';
import ImportBillsModal from './components/ImportBillsModal';
import ConfirmationModal from './components/ConfirmationModal';
import Toast, { ToastType } from './components/Toast';
import { GoogleGenAI, Type } from "@google/genai";
import { isFuzzyMatch } from './utils';
import InstallmentEditorModal from './components/InstallmentEditorModal';
import RecurringBillsSchedule from './components/RecurringBillsSchedule';
import Sidebar from './components/Sidebar';
import DashboardScreen from './screens/DashboardScreen';
import CompanyListScreen from './screens/CompanyListScreen';
import CompanyFormScreen from './screens/CompanyFormScreen';
import UserListScreen from './screens/UserListScreen';
import UserFormScreen from './screens/UserFormScreen';
import PublicUserFormScreen from './screens/PublicUserFormScreen';
// FIX: Import BillStatus to resolve type errors.
import { BillStatus } from './components/BillListHeader';
import CollaboratorPortalScreen from './screens/CollaboratorPortalScreen';
import AdminListScreen from './screens/AdminListScreen';
import AdminFormScreen from './screens/AdminFormScreen';

type ConfirmationState = {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

type ActiveScreen = 'dashboard' | 'companies' | 'companyForm' | 'users' | 'userForm' | 'publicUserForm' | 'admins' | 'adminForm';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
};


const App: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const savedBills = localStorage.getItem('bills');
      if (savedBills) {
        const parsedBills = JSON.parse(savedBills);
        // Revive date objects
        return parsedBills.map((b: any) => ({
          ...b,
          dueDate: new Date(b.dueDate),
          paymentDate: b.paymentDate ? new Date(b.paymentDate) : undefined,
          originalDueDate: b.originalDueDate ? new Date(b.originalDueDate) : undefined,
          postponements: b.postponements ? b.postponements.map((p:any) => ({...p, postponedAt: new Date(p.postponedAt)})) : [],
          history: b.history ? b.history.map((h:any) => ({...h, timestamp: new Date(h.timestamp)})) : [],
        }));
      }
    } catch (error) {
      console.error("Failed to parse bills from localStorage", error);
    }
    return [];
  });
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedBills, setImportedBills] = useState<ImportedBillReview[]>([]);
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde'];
  });
  const [costCenters, setCostCenters] = useState<string[]>(() => {
    const saved = localStorage.getItem('costCenters');
    return saved ? JSON.parse(saved) : ['Pessoal', 'Trabalho'];
  });
    const [jobFunctions, setJobFunctions] = useState<string[]>(() => {
    const saved = localStorage.getItem('jobFunctions');
    return saved ? JSON.parse(saved) : ['Desenvolvedor', 'Designer', 'Gerente de Projetos', 'Analista de RH'];
  });
  const [activeTab, setActiveTab] = useState<BillStatus>('ALL');
  const [billToPay, setBillToPay] = useState<Bill | null>(null);
  const [billToPostpone, setBillToPostpone] = useState<Bill | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);
  const [pendingBillData, setPendingBillData] = useState<FormData | ImportedBillReview[] | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });
  const [installmentsToEdit, setInstallmentsToEdit] = useState<Bill[] | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
        const savedCompanies = localStorage.getItem('companies');
        return savedCompanies ? JSON.parse(savedCompanies) : [];
    } catch (error) {
        console.error("Failed to parse companies from localStorage", error);
        return [];
    }
  });
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);
          return parsedUsers.map((u: any) => ({
              ...u,
              history: u.history || [], // Ensure history array exists
          }));
      }
      return [];
    } catch (error) {
      console.error("Failed to parse users from localStorage", error);
      return [];
    }
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [publicFormData, setPublicFormData] = useState<{ userType: UserType; companyIds: string[] } | null>(null);
  const [userCodeToImport, setUserCodeToImport] = useState<string>('');
  const [isUserImportModalOpen, setIsUserImportModalOpen] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState<'ALL' | UserType>('ALL');
  const [portalUser, setPortalUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<Admin[]>(() => {
    try {
        const savedAdmins = localStorage.getItem('admins');
        return savedAdmins ? JSON.parse(savedAdmins) : [];
    } catch (error) {
        console.error("Failed to parse admins from localStorage", error);
        return [];
    }
  });
  const [adminToEdit, setAdminToEdit] = useState<Admin | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Routing for public forms (collaborator portal, etc.)
  useEffect(() => {
    const handleRouting = () => {
        const hash = window.location.hash;
        
        const params = new URLSearchParams(hash.substring(1));
        const portalKey = params.get('portalKey');
        const form = params.get('form');

        if (portalKey) {
            const userForPortal = users.find(u => u.portalKey === portalKey);
            setPortalUser(userForPortal || null);
            setPublicFormData(null);
            return;
        }
        if (form === 'user') {
            const type = params.get('type') as UserType;
            const companyIds = params.get('companyIds')?.split(',').filter(id => id) || [];
            if (Object.values(UserType).includes(type)) {
                setPublicFormData({ userType: type, companyIds });
            }
            setPortalUser(null);
            return;
        }
        
        // If not a public route, clear public states
        setPortalUser(null);
        setPublicFormData(null);
    };

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    return () => window.removeEventListener('hashchange', handleRouting, false);
  }, [users]);


  const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Data Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('bills', JSON.stringify(bills));
    } catch (error) {
      console.error("Failed to save bills to localStorage", error);
    }
  }, [bills]);
  
  useEffect(() => {
      localStorage.setItem('companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('costCenters', JSON.stringify(costCenters));
  }, [costCenters]);

  useEffect(() => {
    localStorage.setItem('jobFunctions', JSON.stringify(jobFunctions));
  }, [jobFunctions]);


  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const addHistoryEntry = (bill: Bill, event: string, details: string): Bill => {
    const newHistoryEntry: HistoryEntry = {
      timestamp: new Date(),
      event,
      details,
    };
    return {
      ...bill,
      history: [...(bill.history || []), newHistoryEntry],
    };
  };
  
  const runRecurringBillGeneration = useCallback((currentBills: Bill[]): Bill[] => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      let allGeneratedBills: Bill[] = [];
      const billsBySeries: Record<string, Bill[]> = {};
  
      for (const bill of currentBills) {
        if (bill.seriesId && bill.isRecurring) {
          if (!billsBySeries[bill.seriesId]) billsBySeries[bill.seriesId] = [];
          billsBySeries[bill.seriesId].push(bill);
        }
      }
  
      for (const seriesId in billsBySeries) {
        const seriesBills = billsBySeries[seriesId].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        const latestBill = seriesBills[0];
        let latestDueDate = new Date(latestBill.dueDate);
  
        while (latestDueDate < now) {
          const nextDueDate = new Date(latestDueDate);
          if (latestBill.type === BillType.Monthly) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          } else if (latestBill.type === BillType.Annual) {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          }
  
          const alreadyExists = currentBills.some((b) => b.seriesId === seriesId && new Date(b.dueDate).getTime() === nextDueDate.getTime()) ||
                                allGeneratedBills.some((b) => b.seriesId === seriesId && b.dueDate.getTime() === nextDueDate.getTime());
          
          if (alreadyExists) {
            latestDueDate = nextDueDate;
            continue;
          }
  
          let nextBill: Bill = {
            ...latestBill,
            id: crypto.randomUUID(),
            dueDate: nextDueDate,
            isPaid: false,
            paymentDate: undefined,
            paidAmount: undefined,
            postponements: [],
            attachments: [],
            history: [],
          };
          nextBill = addHistoryEntry(nextBill, 'Criação Automática', `Conta gerada automaticamente como parte da série recorrente.`);
          allGeneratedBills.push(nextBill);
          latestDueDate = nextDueDate;
        }
      }
      return allGeneratedBills;
  }, []);

  const updateBillsWithRecurring = useCallback((updateFn: (prevBills: Bill[]) => Bill[]) => {
    setBills(prevBills => {
      const updatedBills = updateFn(prevBills);
      const newlyGenerated = runRecurringBillGeneration(updatedBills);
      if (newlyGenerated.length > 0) {
        showToast(`${newlyGenerated.length} nova(s) conta(s) recorrente(s) foi/foram gerada(s).`, 'info');
      }
      return [...updatedBills, ...newlyGenerated].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });
  }, [runRecurringBillGeneration]);

  // Effect to generate recurring bills on load and visibility change
  useEffect(() => {
      const checkAndGenerate = () => {
          updateBillsWithRecurring(bills => bills); // Trigger check with current bills
      };

      checkAndGenerate(); // Run on initial load

      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              checkAndGenerate();
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [updateBillsWithRecurring]);


  const { filteredBills, counts, dashboardData } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Step 1: Calculate counts for the tabs. These are always based on the full, unfiltered list.
    const tabCounts = { all: bills.length, upcoming: 0, overdue: 0, paid: 0, postponed: 0 };
    bills.forEach(bill => {
      if (bill.isPaid) tabCounts.paid++;
      else if (bill.postponements?.length > 0) tabCounts.postponed++;
      else if (new Date(bill.dueDate) < today) tabCounts.overdue++;
      else tabCounts.upcoming++;
    });

    // Step 2: Create a base list filtered by search and date. This will be used for both the dashboard and the final list.
    const generallyFilteredBills = bills.filter(bill => {
        // Search filter logic
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const searchMatch = bill.title.toLowerCase().includes(query) ||
                                bill.beneficiary.toLowerCase().includes(query) ||
                                bill.category.toLowerCase().includes(query) ||
                                bill.costCenter.toLowerCase().includes(query);
            if (!searchMatch) return false;
        }

        // Date range filter logic
        const start = dateRange.startDate ? new Date(`${dateRange.startDate}T00:00:00`) : null;
        const end = dateRange.endDate ? new Date(`${dateRange.endDate}T23:59:59`) : null;
        if (start && end) {
            const dateToCheck = bill.isPaid ? bill.paymentDate : bill.dueDate;
            if (!dateToCheck) return false;
            const checkDate = new Date(dateToCheck);
            if (checkDate < start || checkDate > end) return false;
        }
        
        return true; // Pass if no filters failed
    });

    // Step 3: Calculate the data for the dashboard cards based on the generally filtered list.
    const dashboardStats = {
      upcoming: { count: 0, total: 0 },
      overdue: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      postponed: { count: 0, total: 0 },
    };
    generallyFilteredBills.forEach(bill => {
      if (bill.isPaid) {
        dashboardStats.paid.count++;
        dashboardStats.paid.total += bill.paidAmount || 0;
      } else if (bill.postponements?.length > 0) {
        dashboardStats.postponed.count++;
        dashboardStats.postponed.total += bill.amount;
      } else if (new Date(bill.dueDate) < today) {
        dashboardStats.overdue.count++;
        dashboardStats.overdue.total += bill.amount;
      } else {
        dashboardStats.upcoming.count++;
        dashboardStats.upcoming.total += bill.amount;
      }
    });

    // Step 4: Apply the active tab filter to the generally filtered list to get the final list for display.
    const billsToShow = generallyFilteredBills.filter(bill => {
        switch (activeTab) {
            case 'UPCOMING':
                return !bill.isPaid && (!bill.postponements || bill.postponements.length === 0) && new Date(bill.dueDate) >= today;
            case 'OVERDUE':
                return !bill.isPaid && (!bill.postponements || bill.postponements.length === 0) && new Date(bill.dueDate) < today;
            case 'PAID':
                return bill.isPaid;
            case 'POSTPONED':
                return !bill.isPaid && bill.postponements && bill.postponements.length > 0;
            default: // 'ALL'
                return true;
        }
    });

    // Step 5: Sort and return.
    billsToShow.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return { filteredBills: billsToShow, counts: tabCounts, dashboardData: dashboardStats };
  }, [bills, activeTab, searchQuery, dateRange]);
  
  const selectedBillObjects = useMemo(() => {
    return bills.filter(bill => selectedBills.has(bill.id));
  }, [selectedBills, bills]);

  const { filteredUsers, userCounts } = useMemo(() => {
    const counts = {
        ALL: users.length,
        [UserType.CLT]: 0,
        [UserType.PJ]: 0,
        [UserType.Partner]: 0,
    };

    users.forEach(user => {
        counts[user.type]++;
    });

    let filtered = users;
    if (activeUserTab !== 'ALL') {
        filtered = users.filter(user => user.type === activeUserTab);
    }

    return { filteredUsers: filtered, userCounts: counts };
  }, [users, activeUserTab]);

  const handleSelectBill = (id: string) => {
    setSelectedBills(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const isAllSelected = useMemo(() => {
    if (filteredBills.length === 0) return false;
    return filteredBills.every(bill => selectedBills.has(bill.id));
  }, [filteredBills, selectedBills]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(filteredBills.map(bill => bill.id)));
    }
  };

  const createNewBillsFromData = (billsData: (FormData | ImportedBillReview)[]) => {
    const newBills: Bill[] = [];
  
    const normalizeBillData = (item: FormData | ImportedBillReview) => {
      if ('status' in item) { // ImportedBillReview
        return {
          title: item.data!.title,
          description: `Importado do arquivo: ${item.file.name}`,
          beneficiary: item.data!.beneficiary,
          amount: item.data!.amount,
          dueDate: new Date(`${item.data!.dueDate}T00:00:00`),
          category: item.category,
          costCenter: item.costCenter,
          type: item.type,
          installments: item.installments,
          barcode: item.data!.barcode || '',
          isRecurring: item.isRecurring,
          file: item.file,
        };
      }
      return { ...item, dueDate: new Date(`${item.dueDate}T00:00:00`), file: undefined };
    };
  
    billsData.forEach(item => {
      const unifiedData = normalizeBillData(item);
      const baseId = crypto.randomUUID();
      const seriesId = (unifiedData.type === BillType.Monthly || unifiedData.type === BillType.Annual) && unifiedData.isRecurring ? crypto.randomUUID() : undefined;
      const fileAttachment = unifiedData.file;
  
      const createBill = (specificDueDate: Date, installmentNum?: number, totalInstallments?: number, customAmount?: number): Bill => {
        let bill: Bill = {
          id: installmentNum ? `${baseId}-${installmentNum}` : crypto.randomUUID(),
          title: unifiedData.title,
          description: unifiedData.description,
          beneficiary: unifiedData.beneficiary,
          amount: customAmount ?? (unifiedData.type === BillType.Installment && unifiedData.installments > 0 ? unifiedData.amount / unifiedData.installments : unifiedData.amount),
          dueDate: specificDueDate,
          category: unifiedData.category,
          costCenter: unifiedData.costCenter,
          type: unifiedData.type,
          barcode: unifiedData.barcode,
          isPaid: false,
          installmentNumber: installmentNum,
          totalInstallments: totalInstallments,
          attachments: fileAttachment ? [fileAttachment] : [],
          isRecurring: (unifiedData.type === BillType.Monthly || unifiedData.type === BillType.Annual) ? unifiedData.isRecurring : undefined,
          seriesId: seriesId,
          postponements: [],
          history: [],
        };
        let billWithHistory = addHistoryEntry(bill, 'Criação', `Conta criada com valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}.`);
        if (fileAttachment) {
          billWithHistory = addHistoryEntry(billWithHistory, 'Anexo', `Arquivo "${fileAttachment.name}" anexado.`);
        }
        return billWithHistory;
      };
  
      if (unifiedData.type === BillType.Installment && unifiedData.installments > 0) {
        for (let i = 1; i <= unifiedData.installments; i++) {
          const nextDueDate = new Date(unifiedData.dueDate);
          nextDueDate.setMonth(unifiedData.dueDate.getMonth() + (i - 1));
          newBills.push(createBill(nextDueDate, i, unifiedData.installments));
        }
      } else {
        newBills.push(createBill(unifiedData.dueDate));
      }
    });
  
    return newBills;
  }

  const handleSaveBill = (data: FormData) => {
    if (billToEdit) {
      const originalBill = bills.find(b => b.id === billToEdit.id);
      if (!originalBill) return;

      const changes = [];
      if (originalBill.title !== data.title) changes.push(`Título: de "${originalBill.title}" para "${data.title}".`);
      // ... more change tracking
      
      updateBillsWithRecurring(prev => prev.map(b => 
        b.id === billToEdit.id 
          ? addHistoryEntry({ 
              ...b,
              title: data.title,
              description: data.description,
              beneficiary: data.beneficiary,
              amount: data.amount,
              dueDate: new Date(data.dueDate + 'T00:00:00'),
              category: data.category,
              costCenter: data.costCenter,
              barcode: data.barcode,
            }, 'Edição', changes.length > 0 ? changes.join(' ') : 'Nenhuma alteração de dados.') 
          : b
      ));
      showToast(`Conta "${data.title}" atualizada com sucesso!`);
      setIsFormOpen(false);
      setBillToEdit(null);
    } else {
        const exactDuplicate = bills.find(b => 
            isFuzzyMatch(b.title, data.title) &&
            isFuzzyMatch(b.beneficiary, data.beneficiary) &&
            new Date(b.dueDate).toISOString().split('T')[0] === data.dueDate
        );

        if (exactDuplicate) {
            setPendingBillData(data);
            setConfirmation({
                isOpen: true,
                message: "Uma conta com o mesmo título, beneficiário e vencimento já existe. Deseja salvar mesmo assim?",
                onConfirm: () => {
                    const billsToAdd = createNewBillsFromData([data]);
                    updateBillsWithRecurring(prev => [...prev, ...billsToAdd]);
                    setConfirmation({ ...confirmation, isOpen: false });
                    setPendingBillData(null);
                    setIsFormOpen(false);
                },
                onCancel: () => {
                    setConfirmation({ ...confirmation, isOpen: false });
                    setPendingBillData(null);
                    setIsFormOpen(false);
                }
            });
            return;
        }

        if (data.type === BillType.Installment) {
            const preliminaryInstallments = createNewBillsFromData([data]);
            setConfirmation({
                isOpen: true,
                message: "Deseja revisar ou editar os valores e vencimentos de cada parcela individualmente? Se não, todas as parcelas serão salvas com valores iguais.",
                confirmText: "Sim, Revisar Parcelas",
                cancelText: "Não, Salvar Direto",
                onConfirm: () => {
                    setInstallmentsToEdit(preliminaryInstallments);
                    setConfirmation({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
                    setIsFormOpen(false);
                },
                onCancel: () => {
                    updateBillsWithRecurring(prev => [...prev, ...preliminaryInstallments]);
                    showToast(`${preliminaryInstallments.length} parcelas salvas com sucesso!`);
                    setConfirmation({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
                    setIsFormOpen(false);
                }
            });
        } else {
          const billsToAdd = createNewBillsFromData([data]);
          updateBillsWithRecurring(prev => [...prev, ...billsToAdd]);
          setIsFormOpen(false);
        }
    }
  };

  const handleSaveEditedInstallments = (editedInstallments: Bill[]) => {
    updateBillsWithRecurring(prev => [...prev, ...editedInstallments]);
    setInstallmentsToEdit(null);
    showToast(`${editedInstallments.length} parcelas salvas com sucesso!`);
  };
  
  const handleSaveCompany = async (companyData: Omit<Company, 'id' | 'key' | 'attachments'> & { attachments: File[] }, id?: string) => {
    const attachmentPromises = companyData.attachments.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await fileToBase64(file),
    }));
    
    const attachments = await Promise.all(attachmentPromises);
    const finalData = { ...companyData, attachments };

    if (id) { // Editing
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...finalData } : c));
        showToast(`Empresa "${companyData.name}" atualizada.`, 'success');
    } else { // Creating
        const newCompany: Company = {
            ...finalData,
            id: crypto.randomUUID(),
            key: crypto.randomUUID(),
        };
        setCompanies(prev => [...prev, newCompany]);
        showToast(`Empresa "${companyData.name}" salva com sucesso.`, 'success');
    }
    setCompanyToEdit(null);
    setActiveScreen('companies');
  };

  const addUserHistoryEntry = (user: User, event: string, details: string): User => {
    const newHistoryEntry: HistoryEntry = {
      timestamp: new Date(),
      event,
      details,
    };
    return {
      ...user,
      history: [...(user.history || []), newHistoryEntry],
    };
  };

  const handleSaveUser = async (userData: Omit<User, 'id' | 'personalAttachments' | 'history'> & { personalAttachments: File[] }, id?: string) => {
    const attachmentPromises = userData.personalAttachments.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await fileToBase64(file),
    }));
    
    const attachments = await Promise.all(attachmentPromises);
    const finalUserData = { ...userData, personalAttachments: attachments };

    if (id) { // Editing
        const originalUser = users.find(u => u.id === id);
        if (!originalUser) return;
        
        const changes: string[] = [];
        (['fullName', 'cpf', 'birthDate', 'email', 'startDate', 'endDate', 'companyName', 'cnpj', 'pis', 'motherName', 'fatherName', 'jobFunction'] as const).forEach(key => {
            if (originalUser[key] !== finalUserData[key]) {
                changes.push(`${key} de "${originalUser[key] || ''}" para "${finalUserData[key] || ''}"`);
            }
        });

        if (JSON.stringify(originalUser.phones) !== JSON.stringify(finalUserData.phones)) changes.push('Telefones foram alterados.');
        if (JSON.stringify(originalUser.companyIds?.sort()) !== JSON.stringify(finalUserData.companyIds?.sort())) changes.push('Vínculo com empresas foi alterado.');
        if (JSON.stringify(originalUser.companyAddress) !== JSON.stringify(finalUserData.companyAddress)) changes.push('Endereço da empresa foi alterado.');
        if (JSON.stringify(originalUser.homeAddress) !== JSON.stringify(finalUserData.homeAddress)) changes.push('Endereço residencial foi alterado.');

        setUsers(prev => prev.map(u => {
            if (u.id === id) {
                let updatedUser = { ...u, ...finalUserData };
                const todayStr = new Date().toISOString().split('T')[0];
                const wasActive = !originalUser.endDate || originalUser.endDate >= todayStr;
                const isNowInactive = updatedUser.endDate && updatedUser.endDate < todayStr;

                let historyDetails = changes.length > 0 ? changes.join('; ') : 'Nenhuma alteração de dados detectada.';
                
                if (wasActive && isNowInactive) {
                    const activeBankDetailsCount = updatedUser.bankDetails.filter(bd => bd.isActive).length;
                    if (activeBankDetailsCount > 0) {
                        updatedUser.bankDetails = updatedUser.bankDetails.map(bd => 
                            bd.isActive ? { ...bd, isActive: false, deactivatedAt: new Date() } : bd
                        );
                        historyDetails += ` Status alterado para inativo, ${activeBankDetailsCount} conta(s) bancária(s) foi/foram desativada(s).`;
                    } else {
                         historyDetails += ` Status alterado para inativo.`;
                    }
                }
                
                return addUserHistoryEntry(updatedUser, 'Edição', historyDetails);
            }
            return u;
        }));
        showToast(`Usuário "${userData.fullName}" atualizado.`, 'success');
    } else { // Creating
        let newUser: User = {
            ...finalUserData,
            id: crypto.randomUUID(),
            portalKey: crypto.randomUUID(),
            history: [],
        };
        newUser = addUserHistoryEntry(newUser, 'Criação', `Usuário ${newUser.fullName} criado.`);
        setUsers(prev => [...prev, newUser]);
        showToast(`Usuário "${userData.fullName}" salvo com sucesso.`, 'success');
    }
    setUserToEdit(null);
    setActiveScreen('users');
  };
  
  const handleEditCompany = (company: Company) => {
    setCompanyToEdit(company);
    setActiveScreen('companyForm');
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setActiveScreen('userForm');
  };

  const handleDeleteBills = () => {
    if (selectedBills.size === 0) return;
    updateBillsWithRecurring(prev => prev.filter(bill => !selectedBills.has(bill.id)));
    setSelectedBills(new Set());
    showToast(`${selectedBills.size} conta(s) removida(s).`, 'info');
  };
  
  const handlePayBills = (ids: string[]) => {
    if (ids.length === 0) return;
    updateBillsWithRecurring(prevBills => prevBills.map(b => ids.includes(b.id) ? addHistoryEntry({ ...b, isPaid: true, paymentDate: new Date(), paidAmount: b.amount }, 'Pagamento', `Pagamento rápido de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.amount)}.`) : b));
    setSelectedBills(new Set());
    showToast(`${ids.length} conta(s) marcada(s) como paga(s).`);
  };

  const handleConfirmPayment = (id: string, paymentDate: Date, paidAmount: number) => {
    const billJustPaid = bills.find(b => b.id === id);
    if (!billJustPaid) return;

    let nextBill: Bill | null = null;
    if (billJustPaid.isRecurring && (billJustPaid.type === BillType.Monthly || billJustPaid.type === BillType.Annual)) {
      const nextDueDate = new Date(billJustPaid.dueDate);
      if (billJustPaid.type === BillType.Monthly) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else { // Annual
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }

      const nextBillExists = bills.some(b => 
        b.seriesId === billJustPaid.seriesId &&
        b.dueDate && new Date(b.dueDate).getTime() === nextDueDate.getTime()
      );

      if (!nextBillExists) {
        nextBill = {
          ...billJustPaid,
          id: crypto.randomUUID(),
          dueDate: nextDueDate,
          isPaid: false,
          paymentDate: undefined,
          paidAmount: undefined,
          originalDueDate: undefined,
          postponements: [],
          amount: billJustPaid.amount,
          history: [],
          attachments: [],
        };
        nextBill = addHistoryEntry(nextBill, 'Criação Automática', `Conta gerada automaticamente após pagamento da fatura anterior de ${new Date(billJustPaid.dueDate).toLocaleDateString('pt-BR')}.`);
      }
    }

    const details = `Pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidAmount)} registrado em ${paymentDate.toLocaleDateString()}.`;
    
    updateBillsWithRecurring(prevBills => {
      const updatedBills = prevBills.map(bill => 
        bill.id === id 
          ? addHistoryEntry({ ...bill, isPaid: true, paymentDate, paidAmount }, 'Pagamento', details) 
          : bill
      );
      if (nextBill) {
        updatedBills.push(nextBill);
      }
      return updatedBills;
    });

    setBillToPay(null);
    showToast(`Pagamento da conta "${billJustPaid.title}" registrado.`);
    if (nextBill) {
        showToast(`Próxima conta "${nextBill.title}" para ${nextBill.dueDate.toLocaleDateString('pt-BR')} foi gerada.`, 'info');
    }
  };

  const handleUnpayBill = (id: string) => {
    updateBillsWithRecurring(prev => prev.map(bill => bill.id === id ? addHistoryEntry({ ...bill, isPaid: false, paymentDate: undefined, paidAmount: undefined }, 'Pagamento Desfeito', 'Registro de pagamento removido.') : bill));
    showToast('Pagamento desfeito.', 'info');
  };

  const handlePostponeBills = (ids: string[]) => {
    if (ids.length === 0) return;
    updateBillsWithRecurring(prev =>
      prev.map(bill => {
        if (ids.includes(bill.id)) {
          const newDueDate = new Date(bill.dueDate);
          newDueDate.setDate(newDueDate.getDate() + 7);
          const postponedBill = { ...bill, dueDate: newDueDate, postponements: [...(bill.postponements || []), { postponedAt: new Date(), reason: 'Postergado em massa.' }], originalDueDate: bill.originalDueDate || bill.dueDate };
          return addHistoryEntry(postponedBill, 'Postergado', `Vencimento adiado para ${newDueDate.toLocaleDateString()}. Motivo: Postergado em massa.`);
        }
        return bill;
      })
    );
    setSelectedBills(new Set());
    showToast(`${ids.length} conta(s) postergada(s).`);
  };

  const handleConfirmPostpone = (id: string, newDueDate: Date, reason: string) => {
    updateBillsWithRecurring(prev =>
        prev.map(bill => {
            if (bill.id === id) {
                const postponedBill = { ...bill, dueDate: newDueDate, postponements: [...(bill.postponements || []), { postponedAt: new Date(), reason }], originalDueDate: bill.originalDueDate || bill.dueDate };
                return addHistoryEntry(postponedBill, 'Postergado', `Vencimento adiado para ${newDueDate.toLocaleDateString()}. Motivo: ${reason}`);
            }
            return bill;
        })
    );
    setBillToPostpone(null);
    showToast(`Conta "${bills.find(b=>b.id===id)?.title}" postergada.`);
  };
  
  const handleAttachFile = (billId: string, file: File) => {
    updateBillsWithRecurring(prev => prev.map(bill => {
      if (bill.id === billId) {
        const newAttachments = [...(bill.attachments || []), file];
        return addHistoryEntry({ ...bill, attachments: newAttachments }, 'Anexo', `Arquivo "${file.name}" anexado.`);
      }
      return bill;
    }));
    showToast('Anexo adicionado.', 'info');
  };

  const handleAddCategory = (category: string) => {
    setCategories(prev => [...prev, category]);
    showToast(`Categoria "${category}" adicionada.`, 'info');
  };
  const handleAddCostCenter = (costCenter: string) => {
    setCostCenters(prev => [...prev, costCenter]);
    showToast(`Centro de Custo "${costCenter}" adicionado.`, 'info');
  };
   const handleAddJobFunction = (jobFunction: string) => {
    setJobFunctions(prev => [...prev, jobFunction]);
    showToast(`Função "${jobFunction}" adicionada.`, 'info');
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
    showToast(`Categoria "${categoryToDelete}" removida.`, 'info');
  };

  const handleDeleteCostCenter = (costCenterToDelete: string) => {
    setCostCenters(prev => prev.filter(cc => cc !== costCenterToDelete));
    showToast(`Centro de Custo "${costCenterToDelete}" removida.`, 'info');
  };
    const handleDeleteJobFunction = (jobFunctionToDelete: string) => {
    setJobFunctions(prev => prev.filter(jf => jf !== jobFunctionToDelete));
    showToast(`Função "${jobFunctionToDelete}" removida.`, 'info');
  };

  const handleUpdateCategory = (oldName: string, newName: string) => {
    setCategories(prev => prev.map(c => c === oldName ? newName : c));
    setBills(prevBills => prevBills.map(bill => bill.category === oldName ? { ...bill, category: newName } : bill));
    showToast(`Categoria "${oldName}" atualizada para "${newName}".`, 'info');
  };

  const handleUpdateCostCenter = (oldName: string, newName: string) => {
    setCostCenters(prev => prev.map(cc => cc === oldName ? newName : cc));
    setBills(prevBills => prevBills.map(bill => bill.costCenter === oldName ? { ...bill, costCenter: newName } : bill));
    showToast(`Centro de Custo "${oldName}" atualizado para "${newName}".`, 'info');
  };

  const handleUpdateJobFunction = (oldName: string, newName:string) => {
    // Update the master list of job functions
    setJobFunctions(prev => prev.map(jf => jf === oldName ? newName : jf));
    // Update any users that have the old job function
    setUsers(prevUsers => prevUsers.map(user => {
        if (user.jobFunction === oldName) {
            const updatedUser = { ...user, jobFunction: newName };
            return addUserHistoryEntry(updatedUser, 'Atualização em Massa', `Função alterada de "${oldName}" para "${newName}"`);
        }
        return user;
    }));
    showToast(`Função "${oldName}" atualizada para "${newName}".`, 'info');
  };

  const handleOpenPayForm = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (bill) setBillToPay(bill);
  };

  const handleOpenPostponeForm = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (bill) setBillToPostpone(bill);
  };
  
  const handleOpenEditForm = (bill: Bill) => {
    setBillToEdit(bill);
    setIsFormOpen(true);
  }

  const handleToggleRecurring = (billId: string) => {
    updateBillsWithRecurring(prev => prev.map(b => {
        if (b.id === billId) {
            const isNowRecurring = !b.isRecurring;
            return addHistoryEntry({ ...b, isRecurring: isNowRecurring }, 'Recorrência', `Geração automática ${isNowRecurring ? 'ativada' : 'desativada'}.`);
        }
        return b;
    }));
    const bill = bills.find(b => b.id === billId);
    if (bill) {
        showToast(`Recorrência ${!bill.isRecurring ? 'ativada' : 'desativada'} para "${bill.title}".`, 'info');
    }
  };
  
  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleFileImport = async (files: File[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'O título ou nome principal da conta (ex: Fatura de Cartão, Conta de Luz).' },
        beneficiary: { type: Type.STRING, description: 'O nome da empresa ou pessoa que receberá o pagamento.' },
        amount: { type: Type.NUMBER, description: 'O valor total a ser pago.' },
        dueDate: { type: Type.STRING, description: 'A data de vencimento no formato AAAA-MM-DD.' },
        barcode: { type: Type.STRING, description: 'O número do código de barras completo, se encontrado. Apenas os números, sem espaços ou pontuação.' },
      },
      required: ['title', 'beneficiary', 'amount', 'dueDate'],
    };

    const initialPreviews: ImportedBillReview[] = files.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: 'parsing',
      category: '',
      costCenter: '',
      type: BillType.Variable,
      installments: 2,
      isRecurring: false,
    }));
    setImportedBills(initialPreviews);

    let allParsedBills: ImportedBillReview[] = [];
    let shouldStopProcessing = false;

    for (const preview of initialPreviews) {
      if (shouldStopProcessing) {
          setImportedBills(prev => prev.map(p => p.id === preview.id ? { ...p, status: 'error', errorMessage: 'Importação cancelada.' } : p));
          continue;
      }

      await delay(4000); // Proactive delay
      let retries = 0;
      const maxRetries = 4;
      let success = false;
      let parsedData: ImportedBillData | null = null;

      while (retries < maxRetries && !success) {
        try {
          const imagePart = await fileToGenerativePart(preview.file);
          const textPart = { text: "Analise a imagem ou PDF da conta e extraia as seguintes informações no formato JSON: título, beneficiário, valor, data de vencimento e o número do código de barras (se disponível)." };
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts: [imagePart, textPart] },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: schema,
              }
          });
          parsedData = JSON.parse(response.text) as ImportedBillData;
          success = true;

        } catch (error: any) {
            console.error("Error parsing file with Gemini:", error);
            const errorMessage = (error.message || error.toString()).toLowerCase();
            const isRateLimitError = errorMessage.includes('resource_exhausted') || errorMessage.includes('quota') || errorMessage.includes('429');
            
            if (isRateLimitError) {
                retries++;
                if (retries < maxRetries) {
                    const waitTime = Math.pow(2, retries) * 1000;
                    setImportedBills(prev => prev.map(p => 
                        p.id === preview.id ? { ...p, status: 'parsing', errorMessage: `Limite de requisições atingido. Tentando novamente em ${waitTime / 1000}s...` } : p
                    ));
                    await delay(waitTime);
                } else {
                    const finalErrorMsg = 'Cota de uso da API excedida. Por favor, tente novamente mais tarde.';
                    setImportedBills(prev => prev.map(p => 
                        p.id === preview.id ? { ...p, status: 'error', errorMessage: finalErrorMsg } : p
                    ));
                    showToast(`Falha ao chamar a API Gemini: ${finalErrorMsg}`, 'error');
                    shouldStopProcessing = true;
                }
            } else {
                const finalErrorMsg = 'Não foi possível ler os dados do arquivo.';
                setImportedBills(prev => prev.map(p => 
                    p.id === preview.id ? { ...p, status: 'error', errorMessage: finalErrorMsg } : p
                ));
                showToast(`Erro ao processar arquivo: ${finalErrorMsg}`, 'error');
                shouldStopProcessing = true;
                break;
            }
        }
      }

      if (success && parsedData) {
        // For auto-filling, we look for the most recent similar bill already saved.
        const similarSavedBills = bills.filter(b => 
          isFuzzyMatch(b.title, parsedData!.title) && 
          isFuzzyMatch(b.beneficiary, parsedData!.beneficiary)
        );

        let autoFilledCategory = '';
        let autoFilledCostCenter = '';
        let autoFilledType: BillType | '' = '';
        let wasAutoFilled = false;

        if (similarSavedBills.length > 0) {
          similarSavedBills.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
          const latestSimilar = similarSavedBills[0];
          autoFilledCategory = latestSimilar.category;
          autoFilledCostCenter = latestSimilar.costCenter;
          autoFilledType = latestSimilar.type;
          wasAutoFilled = true;
        }

        // For duplicate detection, we check against saved bills AND bills in the current import batch.
        const isDuplicateInSaved = bills.some(b => 
          isFuzzyMatch(b.title, parsedData!.title) &&
          isFuzzyMatch(b.beneficiary, parsedData!.beneficiary) &&
          new Date(b.dueDate).toISOString().split('T')[0] === parsedData!.dueDate
        );

        const isDuplicateInBatch = allParsedBills.some(p =>
          p.status === 'success' && p.data &&
          isFuzzyMatch(p.data.title, parsedData!.title) &&
          isFuzzyMatch(p.data.beneficiary, parsedData!.beneficiary) &&
          p.data.dueDate === parsedData!.dueDate
        );
        
        const isDuplicate = isDuplicateInSaved || isDuplicateInBatch;

        const finalParsedBill = {
          ...preview,
          status: 'success' as const,
          data: parsedData,
          category: autoFilledCategory,
          costCenter: autoFilledCostCenter,
          type: autoFilledType || BillType.Variable,
          isDuplicate,
        };

        allParsedBills.push(finalParsedBill);
        
        if (wasAutoFilled) {
          showToast(`Dados preenchidos para "${parsedData.title}" com base em conta similar.`, 'info');
        }
        if (isDuplicate) {
          showToast(`Conta "${parsedData.title}" parece ser uma duplicata.`, 'warning');
        }
      } else if (!shouldStopProcessing) {
         allParsedBills.push({ ...preview, status: 'error', errorMessage: preview.errorMessage || 'Falha ao processar.' });
      }
    }

    if (shouldStopProcessing) return;

    const duplicates = allParsedBills.filter(b => b.isDuplicate);
    const nonDuplicates = allParsedBills.filter(b => !b.isDuplicate);

    if (duplicates.length > 0) {
      setConfirmation({
        isOpen: true,
        message: `${duplicates.length} conta(s) importada(s) parecem ser duplicadas. Deseja salvá-las mesmo assim?`,
        onConfirm: () => {
          setImportedBills(allParsedBills);
          setConfirmation({ isOpen: false, message: '', onConfirm: ()=>{} });
        },
        onCancel: () => {
          setImportedBills(nonDuplicates);
          showToast(`${duplicates.length} duplicada(s) foram descartadas.`, 'warning');
          setConfirmation({ isOpen: false, message: '', onConfirm: ()=>{} });
        }
      });
    } else {
      setImportedBills(allParsedBills);
    }
  };

  const handleUpdateImportedBill = (id: string, updatedData: Partial<ImportedBillReview>) => {
    setImportedBills(prev => prev.map(bill => bill.id === id ? { ...bill, ...updatedData } : bill));
  };
  
  const handleSaveImportedBills = (billsToSave: ImportedBillReview[]) => {
    const validBillsToSave = billsToSave.filter(b => b.status === 'success' && b.data);
    const billsToAdd = createNewBillsFromData(validBillsToSave);
    updateBillsWithRecurring(prev => [...prev, ...billsToAdd]);
    setImportedBills([]);
  };

  const handleCardClick = (tab: BillStatus) => {
    setActiveTab(tab);
  };
  
  useEffect(() => {
    setSelectedBills(new Set());
  }, [activeTab]);
  
  const handleNavigateToBill = (bill: Bill) => {
    setIsScheduleModalOpen(false);
    setActiveTab('ALL');
    setDateRange({ startDate: '', endDate: '' });
    setSearchQuery(bill.title);
  };
  
  const handleImportUserFromCode = () => {
    if (!userCodeToImport) {
        showToast('Por favor, insira o código.', 'warning');
        return;
    }
    try {
        const decodedString = atob(userCodeToImport);
        const userData = JSON.parse(decodedString);
        
        // Basic validation
        if (!userData.type || !userData.fullName || !userData.cpf) {
            throw new Error('Código inválido ou dados incompletos.');
        }

        let newUser: User = {
            ...userData,
            id: crypto.randomUUID(),
            portalKey: crypto.randomUUID(),
            personalAttachments: [], // Attachments are not transfered via code
            history: [],
        };
        newUser = addUserHistoryEntry(newUser, 'Criação', 'Usuário importado via código.');
        
        setUsers(prev => [...prev, newUser]);
        showToast(`Usuário "${newUser.fullName}" importado com sucesso!`, 'success');
        setIsUserImportModalOpen(false);
        setUserCodeToImport('');

    } catch (error) {
        console.error("Failed to import user from code:", error);
        showToast('Código inválido. Não foi possível importar o usuário.', 'error');
    }
  };
// FIX: Update function signature to correctly handle a mix of File and Attachment objects.
  const handleUpdateUserFromPortal = async (updatedData: Omit<User, 'id' | 'history' | 'portalKey' | 'personalAttachments'> & { personalAttachments: (File | Attachment)[] }) => {
    const attachmentPromises = updatedData.personalAttachments.map(async (fileOrAttachment) => {
        if ('data' in fileOrAttachment) { // It's already an Attachment
            return fileOrAttachment as Attachment;
        }
        const file = fileOrAttachment as File;
        const data = await fileToBase64(file);
        return { name: file.name, type: file.type, data };
    });
    
    const attachments = await Promise.all(attachmentPromises);

    setUsers(prev => prev.map(u => 
        u.portalKey === portalUser?.portalKey 
            ? { ...u, ...updatedData, personalAttachments: attachments } 
            : u
    ));
    
    showToast('Suas informações foram atualizadas!', 'success');
  };

  // Company selection and deletion logic
  const isAllCompaniesSelected = useMemo(() => {
      if (companies.length === 0) return false;
      return companies.every(c => selectedCompanies.has(c.id));
  }, [companies, selectedCompanies]);

  const handleSelectCompany = (id: string) => {
      setSelectedCompanies(prev => {
          const newSelection = new Set(prev);
          if (newSelection.has(id)) {
              newSelection.delete(id);
          } else {
              newSelection.add(id);
          }
          return newSelection;
      });
  };

  const handleSelectAllCompanies = () => {
      if (isAllCompaniesSelected) {
          setSelectedCompanies(new Set());
      } else {
          setSelectedCompanies(new Set(companies.map(c => c.id)));
      }
  };

  const handleDeleteCompanies = () => {
      if (selectedCompanies.size === 0) return;

      const linkedUsersByCompany: { [companyName: string]: string[] } = {};
      let hasLinks = false;

      selectedCompanies.forEach(companyId => {
          const company = companies.find(c => c.id === companyId);
          if (!company) return;

          const companyUsers = users
              .filter(u => u.companyIds?.includes(companyId))
              .map(u => u.fullName);

          if (companyUsers.length > 0) {
              hasLinks = true;
              linkedUsersByCompany[company.name] = companyUsers;
          }
      });

      let message = `Você tem certeza que deseja excluir ${selectedCompanies.size} empresa(s) selecionada(s)?`;
      if (hasLinks) {
          message += "\n\nAtenção: As seguintes empresas estão vinculadas a usuários. A exclusão removerá o vínculo, mas não o usuário:\n";
          for (const companyName in linkedUsersByCompany) {
              message += `\n- ${companyName} (vinculada a: ${linkedUsersByCompany[companyName].join(', ')})`;
          }
      }

      setConfirmation({
          isOpen: true,
          message,
          confirmText: 'Sim, Excluir',
          cancelText: 'Cancelar',
          onConfirm: () => {
              setUsers(prevUsers =>
                  prevUsers.map(user => {
                      const newCompanyIds = user.companyIds?.filter(id => !selectedCompanies.has(id));
                      if (newCompanyIds?.length !== user.companyIds?.length) {
                          return addUserHistoryEntry({ ...user, companyIds: newCompanyIds }, 'Vínculo Removido', 'Vínculo com empresa removido devido à exclusão da empresa.');
                      }
                      return user;
                  })
              );

              setCompanies(prev => prev.filter(c => !selectedCompanies.has(c.id)));
              
              showToast(`${selectedCompanies.size} empresa(s) removida(s).`, 'info');
              setSelectedCompanies(new Set());
              setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
          },
          onCancel: () => {
              setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
          }
      });
  };

  // User selection and deletion logic
  const isAllUsersSelected = useMemo(() => {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every(u => selectedUsers.has(u.id));
  }, [filteredUsers, selectedUsers]);

  const handleSelectUser = (id: string) => {
    setSelectedUsers(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        return newSelection;
    });
  };

  const handleSelectAllUsers = () => {
      if (isAllUsersSelected) {
          setSelectedUsers(new Set());
      } else {
          setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
      }
  };

  const handleDeleteUsers = () => {
    if (selectedUsers.size === 0) return;
    setConfirmation({
        isOpen: true,
        message: `Você tem certeza que deseja excluir ${selectedUsers.size} usuário(s) selecionado(s)? Esta ação não pode ser desfeita.`,
        confirmText: 'Sim, Excluir',
        onConfirm: () => {
            setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
            showToast(`${selectedUsers.size} usuário(s) removido(s).`, 'info');
            setSelectedUsers(new Set());
            setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
        },
        onCancel: () => {
            setConfirmation({ isOpen: false, message: '', onConfirm: () => {} });
        }
    });
  };

  const handleSaveAdmin = (adminData: Omit<Admin, 'id'>, id?: string) => {
    if (id) {
      setAdmins(prev => prev.map(a => (a.id === id ? { ...a, ...adminData } : a)));
      showToast(`Administrador "${adminData.fullName}" atualizado.`, 'success');
    } else {
      const newAdmin: Admin = {
        ...adminData,
        id: crypto.randomUUID(),
      };
      setAdmins(prev => [...prev, newAdmin]);
      showToast(`Administrador "${newAdmin.fullName}" adicionado com sucesso.`, 'success');
    }
    setAdminToEdit(null);
    setActiveScreen('admins');
  };
  
  const handleEditAdmin = (admin: Admin) => {
    setAdminToEdit(admin);
    setActiveScreen('adminForm');
  };

  const handleDeleteAdmins = (ids: Set<string>) => {
      setAdmins(prev => prev.filter(a => !ids.has(a.id)));
      showToast(`${ids.size} administrador(es) removido(s).`, 'info');
  };
  
  const handleNavigateToCompanyForm = () => {
    setCompanyToEdit(null);
    setActiveScreen('companyForm');
  };

  const handleNavigateToUserForm = () => {
    setUserToEdit(null);
    setActiveScreen('userForm');
  };

  const renderActiveScreen = () => {
      switch(activeScreen) {
        case 'dashboard':
          return (
            <DashboardScreen 
              bills={bills}
              filteredBills={filteredBills}
              selectedBills={selectedBills}
              selectedBillObjects={selectedBillObjects}
              onSelectBill={handleSelectBill}
              onUnpayBill={handleUnpayBill}
              onOpenPayForm={handleOpenPayForm}
              onOpenPostponeForm={handleOpenPostponeForm}
              onAttachFile={handleAttachFile}
              onEditBill={handleOpenEditForm}
              onToggleRecurring={handleToggleRecurring}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSelectAll={handleSelectAll}
              isAllSelected={isAllSelected}
              counts={counts}
              viewMode={viewMode}
              onViewChange={setViewMode}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              isFilterVisible={isFilterVisible}
              onToggleFilter={() => setIsFilterVisible(!isFilterVisible)}
              isDashboardVisible={isDashboardVisible}
              onToggleDashboard={() => setIsDashboardVisible(!isDashboardVisible)}
              dashboardData={dashboardData}
              onCardClick={handleCardClick}
              onOpenNewBillForm={() => { setBillToEdit(null); setIsFormOpen(true); }}
              onOpenImportModal={() => { setImportedBills([]); setIsImportModalOpen(true); }}
              onOpenManagementModal={() => setIsManagementModalOpen(true)}
              onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
              handleDeleteBills={handleDeleteBills}
              handlePayBills={handlePayBills}
              handlePostponeBills={handlePostponeBills}
            />
          );
        case 'companies':
            return (
                <CompanyListScreen
                    companies={companies}
                    onAddCompany={() => { setCompanyToEdit(null); setActiveScreen('companyForm'); }}
                    onEditCompany={handleEditCompany}
                    selectedCompanies={selectedCompanies}
                    onSelectCompany={handleSelectCompany}
                    onSelectAll={handleSelectAllCompanies}
                    isAllSelected={isAllCompaniesSelected}
                    onDelete={handleDeleteCompanies}
                />
            );
        case 'companyForm':
            const companyWithFiles = companyToEdit
                ? {
                    ...companyToEdit,
                    attachments: (companyToEdit.attachments || []).map(att => base64ToFile(att.data, att.name, att.type)),
                    bankDetails: companyToEdit.bankDetails || [],
                  }
                : null;

            return (
                <CompanyFormScreen 
                    initialData={companyWithFiles}
                    onSave={handleSaveCompany}
                    onCancel={() => { setCompanyToEdit(null); setActiveScreen('companies'); }}
                />
            );
        case 'users':
            return (
                <UserListScreen
                    users={filteredUsers}
                    onAddUser={() => { setUserToEdit(null); setActiveScreen('userForm'); }}
                    onEditUser={handleEditUser}
                    onOpenImportModal={() => setIsUserImportModalOpen(true)}
                    companies={companies}
                    activeTab={activeUserTab}
                    onTabChange={setActiveUserTab}
                    counts={userCounts}
                    jobFunctions={jobFunctions}
                    onAddJobFunction={handleAddJobFunction}
                    onDeleteJobFunction={handleDeleteJobFunction}
                    onUpdateJobFunction={handleUpdateJobFunction}
                    selectedUsers={selectedUsers}
                    onSelectUser={handleSelectUser}
                    onSelectAllUsers={handleSelectAllUsers}
                    isAllUsersSelected={isAllUsersSelected}
                    onDeleteUsers={handleDeleteUsers}
                />
            );
        case 'userForm':
            const userWithFiles = userToEdit
                ? {
                    ...userToEdit,
                    personalAttachments: (userToEdit.personalAttachments || []).map(att => base64ToFile(att.data, att.name, att.type)),
                    bankDetails: userToEdit.bankDetails || [],
                    }
                : null;

            return (
                <UserFormScreen 
                    initialData={userWithFiles}
                    onSave={handleSaveUser}
                    onCancel={() => { setUserToEdit(null); setActiveScreen('users'); }}
                    companies={companies}
                    jobFunctions={jobFunctions}
                />
            );
        case 'admins':
            return (
                <AdminListScreen
                    admins={admins}
                    onAddAdmin={() => { setAdminToEdit(null); setActiveScreen('adminForm'); }}
                    onEditAdmin={handleEditAdmin}
                    onDeleteAdmins={handleDeleteAdmins}
                />
            );
        case 'adminForm':
            return (
                <AdminFormScreen
                    initialData={adminToEdit}
                    onSave={handleSaveAdmin}
                    onCancel={() => { setAdminToEdit(null); setActiveScreen('admins'); }}
                />
            );
        default:
          return null;
      }
  };
  
    if (portalUser) {
        const userWithFiles = {
            ...portalUser,
            personalAttachments: (portalUser.personalAttachments || []).map(att => base64ToFile(att.data, att.name, att.type)),
            bankDetails: portalUser.bankDetails || [],
        };
        return <CollaboratorPortalScreen 
                    initialData={userWithFiles} 
                    onSave={handleUpdateUserFromPortal} 
                />;
    }

  if (publicFormData) {
    return <PublicUserFormScreen userType={publicFormData.userType} companyIds={publicFormData.companyIds} />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmation.isOpen && (
        <ConfirmationModal
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={confirmation.onCancel}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
        />
      )}
      
      <div className="flex">
        <Sidebar 
          activeScreen={activeScreen} 
          onNavigate={setActiveScreen} 
          onNavigateToCompanyForm={handleNavigateToCompanyForm}
          onNavigateToUserForm={handleNavigateToUserForm}
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
        <main className="flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8">
            {renderActiveScreen()}
        </main>
      </div>

      {isFormOpen && (
        <BillForm
          onSave={handleSaveBill}
          onClose={() => {
            setIsFormOpen(false);
            setBillToEdit(null);
          }}
          categories={categories}
          costCenters={costCenters}
          onAddCategory={handleAddCategory}
          onAddCostCenter={handleAddCostCenter}
          initialData={billToEdit}
          bills={bills}
        />
      )}
      
      {isImportModalOpen && (
          <ImportBillsModal
              categories={categories}
              costCenters={costCenters}
              onClose={() => setIsImportModalOpen(false)}
              onSave={handleSaveImportedBills}
              onParseFiles={handleFileImport}
              importedBills={importedBills}
              onUpdateBill={handleUpdateImportedBill}
          />
      )}
      
      {installmentsToEdit && (
          <InstallmentEditorModal
              installments={installmentsToEdit}
              onClose={() => setInstallmentsToEdit(null)}
              onSave={handleSaveEditedInstallments}
          />
      )}
      
      {isManagementModalOpen && (
        <ManagementModal
          categories={categories}
          costCenters={costCenters}
          jobFunctions={jobFunctions}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onUpdateCategory={handleUpdateCategory}
          onAddCostCenter={handleAddCostCenter}
          onDeleteCostCenter={handleDeleteCostCenter}
          onUpdateCostCenter={handleUpdateCostCenter}
          onAddJobFunction={handleAddJobFunction}
          onDeleteJobFunction={handleDeleteJobFunction}
          onUpdateJobFunction={handleUpdateJobFunction}
          onClose={() => setIsManagementModalOpen(false)}
        />
      )}

      {isScheduleModalOpen && (
        <RecurringBillsSchedule
          bills={bills}
          onClose={() => setIsScheduleModalOpen(false)}
          onNavigateToBill={handleNavigateToBill}
        />
      )}
      
      {isUserImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Importar Usuário por Código</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cole o código fornecido pelo novo colaborador para adicioná-lo ao sistema.</p>
                    <textarea 
                        value={userCodeToImport}
                        onChange={(e) => setUserCodeToImport(e.target.value)}
                        rows={6}
                        className="w-full mt-1 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600 font-mono text-xs"
                        placeholder="Cole o código aqui..."
                    />
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
                    <button type="button" onClick={() => setIsUserImportModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold">Cancelar</button>
                    <button onClick={handleImportUserFromCode} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold">Importar</button>
                </div>
            </div>
        </div>
      )}

      {billToPay && (
          <PayBillForm 
              bill={billToPay}
              onClose={() => setBillToPay(null)}
              onConfirm={handleConfirmPayment}
          />
      )}

      {billToPostpone && (
          <PostponeBillForm
              bill={billToPostpone}
              onClose={() => setBillToPostpone(null)}
              onConfirm={handleConfirmPostpone}
          />
      )}
       <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
        .collapsible-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease-in-out;
        }
        .collapsible-content.expanded {
          max-height: 500px; /* Adjust as needed */
        }
      `}</style>
    </div>
  );
};

export default App;
