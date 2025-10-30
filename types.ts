export enum BillType {
  Variable = 'VARIAVEL',
  Installment = 'PARCELADA',
  Monthly = 'MENSAL',
  Annual = 'ANUAL',
}

export interface PostponementRecord {
  postponedAt: Date;
  reason: string;
}

export interface HistoryEntry {
  timestamp: Date;
  event: string;
  details: string;
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  beneficiary: string;
  amount: number;
  dueDate: Date;
  category: string;
  costCenter: string;
  type: BillType;
  isPaid: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  paymentDate?: Date;
  paidAmount?: number;
  barcode?: string;
  attachments?: File[];
  isRecurring?: boolean;
  seriesId?: string;
  originalDueDate?: Date;
  postponements: PostponementRecord[];
  history: HistoryEntry[];
}

export interface FormData {
  title: string;
  description: string;
  beneficiary: string;
  amount: number;
  dueDate: string;
  category: string;
  costCenter: string;
  type: BillType;
  installments: number;
  barcode: string;
  isRecurring: boolean;
}

export interface ImportedBillData {
  title: string;
  beneficiary: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  barcode?: string;
}

export interface ImportedBillReview {
  file: File;
  id: string;
  status: 'parsing' | 'success' | 'error';
  data?: ImportedBillData;
  // User input for review
  category: string;
  costCenter: string;
  type: BillType;
  installments: number;
  isRecurring: boolean;
  errorMessage?: string;
  isDuplicate?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 encoded string
}

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

export interface BankDetail {
  id: string;
  bankName: string;
  agency: string;
  account: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  isActive: boolean;
  createdAt: Date;
  deactivatedAt?: Date;
}


export interface Company {
  id: string;
  name: string;
  cnpj: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  key: string;
  attachments: Attachment[];
  bankDetails: BankDetail[];
}

export enum UserType {
  PJ = 'PJ',
  CLT = 'CLT',
  Partner = 'PARCEIRO',
}

export interface Phone {
  id: string;
  number: string;
  phoneType: 'CELL' | 'LANDLINE';
  hasWhatsApp: boolean;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface User {
  id: string;
  type: UserType;
  startDate: string;
  endDate?: string;
  companyIds?: string[];
  
  // Common fields
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  phones: Phone[];
  personalAttachments: Attachment[];
  bankDetails: BankDetail[];

  // PJ / Partner specific
  companyName?: string;
  cnpj?: string;
  companyAddress?: Address;
  homeAddress?: Address;

  // CLT specific
  pis?: string;
  motherName?: string;
  fatherName?: string;
  jobFunction?: string;

  portalKey?: string;
  history: HistoryEntry[];
}

export interface Admin {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  endDate?: string;
}