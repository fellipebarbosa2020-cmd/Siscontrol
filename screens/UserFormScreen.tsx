import React, { useState, useEffect, useRef } from 'react';
import { User, UserType, Phone, Address, Company, BankDetail, Attachment } from '../types';
// FIX: Import HomeIcon to be used in the tab button.
import { BuildingOffice2Icon, TrashIcon, DocumentDuplicateIcon, PaperClipIcon, ArrowDownTrayIcon, EyeIcon, HomeIcon, PlusIcon, WhatsAppIcon, BriefcaseIcon, UserPlusIcon, IdIcon, CheckCircleIcon, DevicePhoneMobileIcon, PhoneIcon, BanknotesIcon, UserIcon as UserCircleIcon } from '../components/icons';
import BankDetailsManager from '../components/BankDetailsManager';

interface UserFormScreenProps {
  initialData?: (Omit<User, 'personalAttachments' | 'bankDetails'> & { personalAttachments: File[], bankDetails: BankDetail[] }) | null;
  onSave: (userData: Omit<User, 'id' | 'personalAttachments' | 'history'> & { personalAttachments: File[] }, id?: string) => void;
  onCancel: () => void;
  companies?: Company[];
  jobFunctions?: string[];
  onAddJobFunction?: (jobFunction: string) => void;
  isPublic?: boolean;
  publicUserType?: UserType;
  publicCompanyIds?: string[];
  onGenerateCode?: (code: string) => void;
}

type FormTabs = 'personal' | 'address' | 'bank' | 'documents';

const today = new Date().toISOString().split('T')[0];

const initialUserState: Omit<User, 'id' | 'personalAttachments' | 'history'> & { personalAttachments: File[] } = {
    type: UserType.CLT,
    startDate: today,
    fullName: '',
    cpf: '',
    birthDate: '',
    email: '',
    phones: [],
    personalAttachments: [],
    companyIds: [],
    bankDetails: [],
};

// Formatting functions
const formatCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const formatCNPJ = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
const formatPIS = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{5})(\d)/, '$1.$2').replace(/(\d{2})(\d)/, '$1-$2');

const formatDynamicPhone = (value: string, phoneType: 'CELL' | 'LANDLINE') => {
    if (!value) return '';
    const onlyNums = value.replace(/\D/g, '');

    if (phoneType === 'CELL') {
        const clipped = onlyNums.slice(0, 11);
        if (clipped.length > 6) return `(${clipped.slice(0, 2)}) ${clipped.slice(2, 7)}-${clipped.slice(7)}`;
        if (clipped.length > 2) return `(${clipped.slice(0, 2)}) ${clipped.slice(2)}`;
        if (clipped.length > 0) return `(${clipped}`;
    } else { // LANDLINE
        const clipped = onlyNums.slice(0, 10);
        if (clipped.length > 6) return `(${clipped.slice(0, 2)}) ${clipped.slice(2, 6)}-${clipped.slice(6)}`;
        if (clipped.length > 2) return `(${clipped.slice(0, 2)}) ${clipped.slice(2)}`;
        if (clipped.length > 0) return `(${clipped}`;
    }
    return '';
};

const userTypeLabels: Record<UserType, string> = {
    [UserType.CLT]: 'Colaborador CLT',
    [UserType.PJ]: 'Pessoa Jurídica (PJ)',
    [UserType.Partner]: 'Parceiro',
};


// Component
const UserFormScreen: React.FC<UserFormScreenProps> = ({ initialData, onSave, onCancel, companies = [], jobFunctions = [], onAddJobFunction, isPublic = false, publicUserType, publicCompanyIds, onGenerateCode }) => {
    const isEditMode = !!initialData && !isPublic;
    
    const [activeTab, setActiveTab] = useState<FormTabs>('personal');

    const [userData, setUserData] = useState(() => {
        if (isPublic) {
            return {
                ...initialUserState,
                type: publicUserType!,
                companyIds: publicCompanyIds!,
            };
        }
        return initialData || initialUserState;
    });
    const [age, setAge] = useState<number | null>(null);
    const [cepError, setCepError] = useState<{ type: 'companyAddress' | 'homeAddress', message: string } | null>(null);
    const [cepLoading, setCepLoading] = useState<{ type: 'companyAddress' | 'homeAddress' } | null>(null);
    const [useSameAddress, setUseSameAddress] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userData.birthDate) {
            const birthDate = new Date(userData.birthDate);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            setAge(calculatedAge);
        } else {
            setAge(null);
        }
    }, [userData.birthDate]);

     useEffect(() => {
        if (useSameAddress) {
            setUserData(prev => ({ ...prev, homeAddress: prev.companyAddress }));
        }
    }, [useSameAddress, userData.companyAddress]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formattedValue: string | number | undefined = value;
        
        if (name === 'cpf') formattedValue = formatCPF(value);
        else if (name === 'cnpj') formattedValue = formatCNPJ(value);
        else if (name === 'pis') formattedValue = formatPIS(value);
        
        setUserData(p => ({ ...p, [name]: formattedValue }));
    };

    const handleCompanySelection = (companyId: string) => {
        setUserData(prev => {
            const newCompanyIds = prev.companyIds?.includes(companyId)
                ? prev.companyIds.filter(id => id !== companyId)
                : [...(prev.companyIds || []), companyId];
            return { ...prev, companyIds: newCompanyIds };
        });
    };

    const handleAddressChange = (addressType: 'companyAddress' | 'homeAddress', field: keyof Address, value: string) => {
        setUserData(prev => ({
            ...prev,
            [addressType]: {
                ...prev[addressType],
                [field]: value,
            },
        }));
    };

    const handleCepLookup = async (cep: string, addressType: 'companyAddress' | 'homeAddress') => {
        const numericCep = cep.replace(/\D/g, '');
        handleAddressChange(addressType, 'cep', numericCep);
        setCepError(null);
    
        if (numericCep.length !== 8) {
             setUserData(prev => ({
                ...prev,
                [addressType]: {
                    ...prev[addressType],
                    cep: numericCep,
                    street: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                }
            }));
            return;
        }
    
        setCepLoading({ type: addressType });
        try {
            const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
            const data = await response.json();
    
            if (!response.ok || data.erro) {
                setCepError({ type: addressType, message: 'CEP inválido ou não encontrado.' });
                setUserData(prev => ({
                    ...prev,
                    [addressType]: {
                        ...prev[addressType],
                        cep: numericCep,
                        street: '',
                        complement: '',
                        neighborhood: '',
                        city: '',
                        state: '',
                    }
                }));
            } else {
                setUserData(prev => ({
                    ...prev,
                    [addressType]: {
                        ...prev[addressType],
                        cep: numericCep,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        complement: data.complemento || prev[addressType]?.complement || '',
                    }
                }));
            }
        } catch (error) {
            console.error("CEP lookup failed:", error);
            setCepError({ type: addressType, message: 'Erro de rede ao buscar CEP.' });
        } finally {
            setCepLoading(null);
        }
    };
    
    // Phone management
    const addPhone = () => setUserData(p => ({ ...p, phones: [...p.phones, { id: crypto.randomUUID(), number: '', phoneType: 'CELL', hasWhatsApp: false }] }));
    const updatePhone = (id: string, field: keyof Phone, value: string | boolean) => {
        setUserData(p => ({
            ...p,
            phones: p.phones.map(ph => {
                if (ph.id === id) {
                    const updatedPhone = { ...ph, [field]: value };
                    
                    if (field === 'number' && typeof value === 'string') {
                        updatedPhone.number = formatDynamicPhone(value, updatedPhone.phoneType);
                        const onlyNums = updatedPhone.number.replace(/\D/g, '');
                        if (updatedPhone.phoneType === 'CELL' && onlyNums.length === 11) {
                            updatedPhone.hasWhatsApp = true;
                        } else if (updatedPhone.phoneType === 'CELL' && onlyNums.length < 11) {
                            updatedPhone.hasWhatsApp = false;
                        }
                    } else if (field === 'phoneType') {
                        updatedPhone.number = formatDynamicPhone(updatedPhone.number, value as 'CELL' | 'LANDLINE');
                        if (value === 'LANDLINE') {
                            updatedPhone.hasWhatsApp = false;
                        } else {
                            const onlyNums = updatedPhone.number.replace(/\D/g, '');
                            updatedPhone.hasWhatsApp = onlyNums.length === 11;
                        }
                    }
                    
                    return updatedPhone;
                }
                return ph;
            })
        }));
    };
    const removePhone = (id: string) => setUserData(p => ({ ...p, phones: p.phones.filter(ph => ph.id !== id) }));
    

    // Attachment management
    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setUserData(p => ({ ...p, personalAttachments: [...p.personalAttachments, ...Array.from(e.dataTransfer.files)] }));
    };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setUserData(p => ({ ...p, personalAttachments: [...p.personalAttachments, ...Array.from(e.target.files)] }));
    };
    const handleRemoveFile = (fileName: string) => setUserData(p => ({ ...p, personalAttachments: p.personalAttachments.filter(f => f.name !== fileName) }));
    const handleViewFile = (file: File) => window.open(URL.createObjectURL(file), '_blank');
    const handleDownloadFile = (file: File) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSave = () => {
        if (isPublic) {
            if (onGenerateCode) {
                 const dataToEncode = { ...userData, personalAttachments: [] }; // Don't encode files
                const code = btoa(JSON.stringify(dataToEncode));
                onGenerateCode(code);
            }
            return;
        }
        onSave(userData, isEditMode ? initialData!.id : undefined);
    };
    
    const inputClass = "w-full mt-2 p-3 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
    const labelClass = "text-sm font-semibold text-gray-600 dark:text-gray-300";
    
    const renderStepContent = () => {
        switch(activeTab) {
            case 'personal':
                return (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                             <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Dados Pessoais e Contrato</h3>
                            <div className="space-y-6">
                                <div className="flex justify-center items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-full">
                                {(Object.values(UserType) as UserType[]).map(type => {
                                    const isActive = userData.type === type;
                                    const icons = { [UserType.CLT]: <BriefcaseIcon/>, [UserType.PJ]: <BuildingOffice2Icon/>, [UserType.Partner]: <UserPlusIcon/> };
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => setUserData(p => ({...p, type}))}
                                            disabled={isEditMode || isPublic}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${isActive ? 'bg-white text-indigo-600 dark:bg-gray-700 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                          {React.cloneElement(icons[type], {className: 'w-5 h-5'})}
                                          {type}
                                        </button>
                                    );
                                })}
                                </div>

                                <div>
                                    <label className={labelClass}>Vínculo com a(s) Empresa(s)</label>
                                    <div className="mt-2 max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                                        {companies.length > 0 ? companies.map(company => (
                                            <label key={company.id} className={`flex items-center p-3 bg-white dark:bg-gray-800 rounded-md ${isPublic ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/50'}`}>
                                                <input type="checkbox" checked={userData.companyIds?.includes(company.id)} onChange={() => handleCompanySelection(company.id)} disabled={isPublic} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                                                <span className="ml-3 font-semibold text-gray-700 dark:text-gray-200">{company.name}</span>
                                            </label>
                                        )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">Nenhuma empresa cadastrada.</p>}
                                    </div>
                                </div>
                                {!isPublic && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Data de Início</label><input name="startDate" type="date" value={userData.startDate} onChange={handleInputChange} className={inputClass} /></div>
                                    <div><label className={labelClass}>Data de Término (Opcional)</label><input name="endDate" type="date" value={userData.endDate || ''} onChange={handleInputChange} className={inputClass} /></div>
                                </div>
                                )}
                                
                                <div className="pt-6 border-t dark:border-gray-700 space-y-6">
                                    <div>
                                        <label className={labelClass}>Nome Completo</label>
                                        <input name="fullName" type="text" value={userData.fullName} onChange={handleInputChange} className={inputClass}/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelClass}>CPF</label>
                                            <input name="cpf" type="text" value={userData.cpf} onChange={handleInputChange} maxLength={14} className={inputClass}/>
                                        </div>
                                        <div className="flex items-end gap-4">
                                            <div className="flex-grow">
                                                <label className={labelClass}>Data de Nascimento</label>
                                                <input name="birthDate" type="date" value={userData.birthDate} onChange={handleInputChange} className={inputClass}/>
                                            </div>
                                            <div className="flex-shrink-0 text-center">
                                                <p className={labelClass}>Idade</p>
                                                <div className="mt-2 w-20 h-11 flex items-center justify-center bg-gray-200 dark:bg-gray-900 rounded-lg text-lg font-bold text-indigo-500 dark:text-indigo-400">{age ?? '--'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>E-mail</label>
                                        <input name="email" type="email" value={userData.email} onChange={handleInputChange} className={inputClass}/>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                                       {userData.phones.map(phone => (
                                         <div key={phone.id} className="grid grid-cols-1 sm:grid-cols-[auto,1fr,auto] gap-4 items-center">
                                             <select value={phone.phoneType} onChange={(e) => updatePhone(phone.id, 'phoneType', e.target.value)} className={`${inputClass} mt-0`}>
                                                <option value="CELL">Celular</option>
                                                <option value="LANDLINE">Fixo</option>
                                             </select>
                                             <div className="relative">
                                                 <div className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center pointer-events-none">
                                                    {phone.hasWhatsApp && <WhatsAppIcon className="w-5 h-5 text-green-500" />}
                                                 </div>
                                                 <input
                                                    type="text"
                                                    placeholder={phone.phoneType === 'CELL' ? '(XX) XXXXX-XXXX' : '(XX) XXXX-XXXX'}
                                                    value={phone.number}
                                                    onChange={e => updatePhone(phone.id, 'number', e.target.value)}
                                                    maxLength={15}
                                                    className={`${inputClass} mt-0 ${phone.hasWhatsApp ? 'pl-10' : ''}`}
                                                 />
                                             </div>
                                             <button onClick={() => removePhone(phone.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                         </div>
                                       ))}
                                       <button onClick={addPhone} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"><PlusIcon className="w-4 h-4"/> Adicionar Telefone</button>
                                     </div>
                                </div>

                                <div className="pt-6 border-t dark:border-gray-700 space-y-6">
                                    { (userData.type === UserType.PJ || userData.type === UserType.Partner) && (
                                      <>
                                        <div><label className={labelClass}>Nome Fantasia</label><input name="companyName" type="text" value={userData.companyName || ''} onChange={handleInputChange} className={inputClass}/></div>
                                        <div><label className={labelClass}>CNPJ</label><input name="cnpj" type="text" value={userData.cnpj || ''} onChange={handleInputChange} maxLength={18} className={inputClass}/></div>
                                      </>
                                    )}
                                    { userData.type === UserType.CLT && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className={labelClass}>Função</label>
                                                <select name="jobFunction" value={userData.jobFunction || ''} onChange={handleInputChange} className={`${inputClass} mt-0 flex-grow`}>
                                                    <option value="">Selecione a função</option>
                                                    {jobFunctions.map(jf => <option key={jf} value={jf}>{jf}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div><label className={labelClass}>Nome da Mãe</label><input name="motherName" type="text" value={userData.motherName || ''} onChange={handleInputChange} className={inputClass}/></div>
                                                <div><label className={labelClass}>Nome do Pai</label><input name="fatherName" type="text" value={userData.fatherName || ''} onChange={handleInputChange} className={inputClass}/></div>
                                                <div><label className={labelClass}>Número do PIS</label><input name="pis" type="text" value={userData.pis || ''} onChange={handleInputChange} maxLength={14} className={inputClass}/></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                );
            case 'address':
                 return (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Endereço</h3>
                            { (userData.type === UserType.PJ || userData.type === UserType.Partner) && 
                                <>
                                    <AddressBlock title="Endereço da Empresa" address={userData.companyAddress || {}} onCepLookup={(cep) => handleCepLookup(cep, 'companyAddress')} onChange={(f, v) => handleAddressChange('companyAddress', f, v)} cepError={cepError?.type === 'companyAddress' ? cepError.message : null} cepLoading={cepLoading?.type === 'companyAddress'} />
                                    <div className="flex items-center gap-2 my-4">
                                        <input
                                            type="checkbox"
                                            id="sameAddress"
                                            checked={useSameAddress}
                                            onChange={(e) => setUseSameAddress(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="sameAddress" className="text-sm text-gray-600 dark:text-gray-300">
                                            O endereço residencial é o mesmo da empresa.
                                        </label>
                                    </div>
                                </>
                            }
                            <AddressBlock title="Endereço Residencial" address={userData.homeAddress || {}} onCepLookup={(cep) => handleCepLookup(cep, 'homeAddress')} onChange={(f, v) => handleAddressChange('homeAddress', f, v)} cepError={cepError?.type === 'homeAddress' ? cepError.message : null} cepLoading={cepLoading?.type === 'homeAddress'} disabled={useSameAddress} />
                        </div>
                    </div>
                 );
            case 'bank':
                 return (
                     <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                           <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Dados Bancários</h3>
                           <BankDetailsManager
                             details={userData.bankDetails}
                             onUpdate={(newDetails) => setUserData(prev => ({...prev, bankDetails: newDetails}))}
                           />
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
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-6 cursor-pointer px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md">
                                    Selecionar Arquivos
                                </button>
                                <input id="doc-upload" ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}/>
                            </div>
                            <div className="mt-8">
                                <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-3 mb-4">
                                    {userData.personalAttachments.length > 0 ? `${userData.personalAttachments.length} arquivo(s) anexado(s)` : 'Nenhum documento anexado'}
                                </h4>
                                {userData.personalAttachments.length > 0 ? (
                                    <ul className="space-y-3">
                                        {userData.personalAttachments.map((file, index) => (
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
            className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg z-0"
          ></span>
        )}
      </button>
    );
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
            <header className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div><h1 className="text-3xl font-bold text-gray-800 dark:text-white">{isEditMode ? "Editar Usuário" : isPublic ? `Formulário de Cadastro: ${userTypeLabels[publicUserType!]}` : "Cadastrar Novo Usuário"}</h1></div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    {!isPublic && <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>}
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md">{isEditMode ? 'Salvar Alterações' : isPublic ? 'Gerar Código de Cadastro' : 'Salvar Usuário'}</button>
                </div>
            </header>

             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded-xl">
                    <TabButton tab="personal" label="Pessoal e Contrato" icon={<UserCircleIcon />} />
                    <TabButton tab="address" label="Endereços" icon={<HomeIcon />} />
                    <TabButton tab="bank" label="Dados Bancários" icon={<BanknotesIcon />} />
                    <TabButton tab="documents" label="Documentos" icon={<DocumentDuplicateIcon />} />
                </div>
            </div>

            <div className="p-6 flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                {renderStepContent()}
            </div>
        </div>
    );
};


const AddressBlock = ({ title, address, onCepLookup, onChange, cepError, cepLoading, disabled = false }: { title: string, address: Partial<Address>, onCepLookup: (cep: string) => void, onChange: (field: keyof Address, value: string) => void, cepError?: string | null, cepLoading?: boolean, disabled?: boolean }) => {
    const inputClass = "w-full mt-2 p-3 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed";
    const labelClass = "text-sm font-semibold text-gray-600 dark:text-gray-300";
    return (
        <div className={`space-y-6 ${disabled ? 'opacity-50' : ''}`}>
            <h3 className="text-xl font-bold">{title}</h3>
            <div>
                <label className={labelClass}>CEP</label>
                <input type="text" value={address.cep || ''} onChange={e => onCepLookup(e.target.value)} maxLength={8} className={inputClass} disabled={disabled}/>
                {cepLoading && <p className="text-xs text-blue-400 animate-pulse mt-1">Buscando...</p>}
                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
            </div>
            <div><label className={labelClass}>Endereço</label><input type="text" value={address.street || ''} onChange={e => onChange('street', e.target.value)} className={inputClass} disabled={disabled}/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div><label className={labelClass}>Número</label><input type="text" value={address.number || ''} onChange={e => onChange('number', e.target.value)} className={inputClass} disabled={disabled}/></div>
                <div><label className={labelClass}>Complemento</label><input type="text" value={address.complement || ''} onChange={e => onChange('complement', e.target.value)} className={inputClass} disabled={disabled}/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div><label className={labelClass}>Bairro</label><input type="text" value={address.neighborhood || ''} onChange={e => onChange('neighborhood', e.target.value)} className={inputClass} disabled={disabled}/></div>
                <div><label className={labelClass}>Cidade</label><input type="text" value={address.city || ''} onChange={e => onChange('city', e.target.value)} className={inputClass} disabled={disabled}/></div>
                <div><label className={labelClass}>Estado (UF)</label><input type="text" value={address.state || ''} onChange={e => onChange('state', e.target.value)} maxLength={2} className={inputClass} disabled={disabled}/></div>
            </div>
        </div>
    )
}

export default UserFormScreen;
