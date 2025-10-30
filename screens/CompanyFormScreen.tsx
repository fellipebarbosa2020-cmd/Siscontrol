import React, { useState, useRef } from 'react';
import { Company, Attachment } from '../types';
import { BuildingOffice2Icon, TrashIcon, DocumentDuplicateIcon, PaperClipIcon, ArrowDownTrayIcon, EyeIcon, BanknotesIcon, UserIcon, PlusIcon } from '../components/icons';
import BankDetailsManager from '../components/BankDetailsManager';

type FormTabs = 'data' | 'documents' | 'bank';

interface CompanyFormScreenProps {
  initialData?: (Omit<Company, 'attachments' | 'bankDetails'> & { attachments: File[], bankDetails: Company['bankDetails'] }) | null;
  onSave: (companyData: Omit<Company, 'id' | 'key' | 'attachments'> & { attachments: File[] }, id?: string) => void;
  onCancel: () => void;
}

const initialCompanyState: Omit<Company, 'id' | 'key' | 'attachments'> & { attachments: File[] } = {
    name: '',
    cnpj: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    phone: '',
    attachments: [],
    bankDetails: [],
};

const formatCNPJ = (value: string) => {
    if (!value) return value;
    const cnpj = value.replace(/[^\d]/g, '');
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
};

const formatPhone = (value: string) => {
    if (!value) return value;
    const phone = value.replace(/[^\d]/g, '');
    if (phone.length <= 2) return `(${phone}`;
    if (phone.length <= 7) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
    if (phone.length <= 11) return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
};

const CompanyFormScreen: React.FC<CompanyFormScreenProps> = ({ initialData, onSave, onCancel }) => {
    const [activeTab, setActiveTab] = useState<FormTabs>('data');
    const [companyData, setCompanyData] = useState(initialData || initialCompanyState);
    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);
    const isEditMode = !!initialData;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCepChange = async (cep: string) => {
        const numericCep = cep.replace(/\D/g, '');
        setCompanyData(prev => ({...prev, cep: numericCep}));
        setCepError(null);

        if (numericCep.length !== 8) {
             setCompanyData(prev => ({
                ...prev,
                address: '',
                neighborhood: '',
                city: '',
                state: '',
                complement: '',
            }));
            return;
        }

        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
            const data = await response.json();
            
            if (!response.ok || data.erro) {
                setCepError("CEP inválido ou não encontrado.");
                setCompanyData(prev => ({
                    ...prev,
                    address: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    complement: '',
                }));
            } else {
                setCompanyData(prev => ({
                    ...prev,
                    address: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                    complement: data.complemento || prev.complement,
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            setCepError("Erro de rede ao buscar CEP.");
        } finally {
            setCepLoading(false);
        }
    };


    const handleSaveCompany = () => {
        if (!companyData.name || !companyData.cnpj) {
            alert("Nome da Empresa e CNPJ são obrigatórios.");
            return;
        }
        onSave(companyData, isEditMode ? initialData.id : undefined);
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setCompanyData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setCompanyData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
        }
    };
    
    const handleRemoveFile = (fileName: string) => {
        setCompanyData(prev => ({
            ...prev,
            attachments: prev.attachments.filter(f => f.name !== fileName)
        }));
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
        URL.revokeObjectURL(url);
    };

    const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'cnpj') {
            formattedValue = formatCNPJ(value);
        } else if (name === 'phone') {
            formattedValue = formatPhone(value);
        }
        setCompanyData(p => ({ ...p, [name]: formattedValue }));
    };
    
    const renderTabContent = () => {
        const inputClass = "w-full mt-2 p-3 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
        const labelClass = "text-sm font-semibold text-gray-600 dark:text-gray-300";

        switch(activeTab) {
            case 'data':
                return (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Informações da Empresa</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>Nome da Empresa</label>
                                    <input name="name" type="text" value={companyData.name} onChange={handleCompanyInputChange} className={inputClass}/>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>CNPJ</label>
                                        <input name="cnpj" type="text" value={companyData.cnpj} onChange={handleCompanyInputChange} maxLength={18} className={inputClass}/>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Telefone</label>
                                        <input name="phone" type="text" value={companyData.phone} onChange={handleCompanyInputChange} maxLength={15} className={inputClass}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Endereço</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelClass}>CEP</label>
                                    <input type="text" value={companyData.cep} onChange={e => handleCepChange(e.target.value)} maxLength={8} className={inputClass}/>
                                    {cepLoading && <p className="text-xs text-blue-400 animate-pulse mt-1">Buscando...</p>}
                                    {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Endereço</label>
                                    <input name="address" type="text" value={companyData.address} onChange={handleCompanyInputChange} className={inputClass}/>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Número</label>
                                        <input name="number" type="text" value={companyData.number} onChange={handleCompanyInputChange} className={inputClass}/>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Complemento</label>
                                        <input name="complement" type="text" value={companyData.complement} onChange={handleCompanyInputChange} className={inputClass}/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div>
                                        <label className={labelClass}>Bairro</label>
                                        <input name="neighborhood" type="text" value={companyData.neighborhood} onChange={handleCompanyInputChange} className={inputClass}/>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Cidade</label>
                                        <input name="city" type="text" value={companyData.city} onChange={handleCompanyInputChange} className={inputClass}/>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Estado (UF)</label>
                                        <input name="state" type="text" value={companyData.state} onChange={handleCompanyInputChange} maxLength={2} className={inputClass}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'documents':
                 return (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Gerenciar Documentos</h3>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                                className="relative flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-2xl transition-colors border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            >
                                <DocumentDuplicateIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"/>
                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Arraste e solte ou selecione os documentos</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PDF, PNG, JPG, etc.</p>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-6 cursor-pointer px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md">
                                    Selecionar Arquivos
                                </button>
                                <input id="doc-upload" ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}/>
                            </div>
                            <div className="mt-8">
                                <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-3 mb-4">
                                    {companyData.attachments.length > 0 ? `${companyData.attachments.length} arquivo(s) anexado(s)` : 'Nenhum documento anexado'}
                                </h4>
                                {companyData.attachments.length > 0 ? (
                                    <ul className="space-y-3">
                                        {companyData.attachments.map((file, index) => (
                                            <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 p-3 rounded-lg shadow-sm animate-fade-in-down">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <PaperClipIcon className="w-5 h-5 text-gray-500 flex-shrink-0"/>
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button onClick={() => handleViewFile(file)} title="Visualizar" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><EyeIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDownloadFile(file)} title="Baixar" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => handleRemoveFile(file.name)} title="Remover" className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Os documentos que você adicionar aparecerão aqui.</p>
                                )}
                            </div>
                        </div>
                    </div>
                 );
            case 'bank':
                 return (
                     <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                           <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Dados Bancários</h3>
                           <BankDetailsManager
                             details={companyData.bankDetails}
                             onUpdate={(newDetails) => setCompanyData(prev => ({...prev, bankDetails: newDetails}))}
                           />
                        </div>
                    </div>
                 )
        }
    };

    const TabButton = ({ tab, label, icon }: { tab: FormTabs, label: string, icon: React.ReactElement<{ className?: string }> }) => (
      <button
        onClick={() => setActiveTab(tab)}
        className={`relative flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
          ${activeTab === tab ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      >
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span className="z-10">{label}</span>
        {activeTab === tab && (
          <span
            // layoutId="activeTabPill"
            className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg z-0"
          ></span>
        )}
      </button>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
            <header className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{isEditMode ? "Editar Empresa" : "Cadastrar Nova Empresa"}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{isEditMode ? companyData.name : 'Preencha os dados abaixo.'}</p>
                </div>
                 <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">
                        Cancelar
                    </button>
                    <button onClick={handleSaveCompany} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md">
                        {isEditMode ? 'Salvar Alterações' : 'Salvar Empresa'}
                    </button>
                </div>
            </header>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded-xl">
                    <TabButton tab="data" label="Dados Cadastrais" icon={<BuildingOffice2Icon />} />
                    <TabButton tab="bank" label="Dados Bancários" icon={<BanknotesIcon />} />
                    <TabButton tab="documents" label="Documentos" icon={<DocumentDuplicateIcon />} />
                </div>
            </div>

            <div className="p-6 flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default CompanyFormScreen;
