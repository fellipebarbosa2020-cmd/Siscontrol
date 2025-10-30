import React, { useState } from 'react';
import { User, UserType, Company, Address, HistoryEntry, Attachment, BankDetail } from '../types';
import { PencilIcon, ChevronDownIcon, ChevronUpIcon, UserIcon, BriefcaseIcon, CalendarIcon, HomeIcon, PhoneIcon, WhatsAppIcon, BuildingOffice2Icon, IdIcon, DevicePhoneMobileIcon, ClipboardDocumentListIcon, BanknotesIcon, PaperClipIcon, EyeIcon, ArrowDownTrayIcon, KeyIcon } from './icons';
import { base64ToFile } from '../utils';
import PortalLinkModal from './PortalLinkModal';

interface UserItemProps {
    user: User;
    onEdit: (user: User) => void;
    companies: Company[];
    isSelected: boolean;
    onSelect: (id: string) => void;
}

// FIX: Changed component to use React.FC and a props interface to correctly handle the 'key' prop in maps.
interface DetailItemProps {
    icon: React.ReactElement<{ className?: string }>;
    label: string;
    value: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            {React.cloneElement(icon, { className: "w-5 h-5 text-gray-400 mt-1 flex-shrink-0" })}
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
        </div>
    );
};

const AddressDetails = ({ title, address }: { title: string, address?: Address }) => {
    if (!address || !address.cep) return null;
    return (
         <div className="space-y-4 bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><HomeIcon className="w-5 h-5"/> {title}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={<HomeIcon />} label="Endereço" value={`${address.street || ''}, ${address.number || ''} - ${address.neighborhood || ''}`} />
                <DetailItem icon={<HomeIcon />} label="Cidade/UF" value={`${address.city || ''} - ${address.state || ''}`} />
                <DetailItem icon={<HomeIcon />} label="CEP" value={address.cep} />
                {address.complement && <DetailItem icon={<HomeIcon />} label="Complemento" value={address.complement} />}
            </div>
        </div>
    );
};


const UserItem: React.FC<UserItemProps> = ({ user, onEdit, companies, isSelected, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPortalLinkModalOpen, setIsPortalLinkModalOpen] = useState(false);

    const isUserActive = (user: User) => {
        const today = new Date().toISOString().split('T')[0];
        if (user.endDate && user.endDate < today) {
            return false;
        }
        return true;
    };

    const userTypeLabels: Record<UserType, string> = {
        [UserType.CLT]: 'CLT',
        [UserType.PJ]: 'Pessoa Jurídica',
        [UserType.Partner]: 'Parceiro',
    };
    
    const isActive = isUserActive(user);

    const associatedCompanies = user.companyIds
        ?.map(id => companies.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        // Handle YYYY-MM-DD format correctly across timezones
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
    };
    
    const handleViewFile = (attachment: Attachment) => {
        const file = base64ToFile(attachment.data, attachment.name, attachment.type);
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    };

    const handleDownloadFile = (attachment: Attachment) => {
        const file = base64ToFile(attachment.data, attachment.name, attachment.type);
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-shadow hover:shadow-md mb-2 ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
            <div className="grid grid-cols-12 gap-4 items-center p-4">
                 {/* Checkbox */}
                 <div className="col-span-1 flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={`Selecionar ${user.fullName}`}
                    />
                </div>
                {/* Colaborador */}
                <div className="col-span-11 md:col-span-3">
                    <p className="font-bold text-gray-800 dark:text-white truncate">{user.fullName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>

                {/* Empresa */}
                <div className="col-span-12 md:col-span-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{associatedCompanies || 'N/A'}</p>
                </div>

                {/* Tipo */}
                <div className="col-span-6 md:col-span-2">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{userTypeLabels[user.type]}</span>
                </div>
                
                {/* Status */}
                <div className="col-span-6 md:col-span-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {isActive ? `Desde: ${formatDate(user.startDate)}` : `Até: ${formatDate(user.endDate)}`}
                    </p>
                </div>

                {/* Ações */}
                <div className="col-span-12 md:col-span-1 flex justify-end items-center">
                    <button onClick={(e) => { e.stopPropagation(); setIsPortalLinkModalOpen(true); }} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Link do Portal">
                        <KeyIcon className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(user); }} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Editar Usuário">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-2 text-gray-400">
                        {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-6 animate-fade-in-down">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                        {/* Personal info */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-800 dark:text-white">Dados Pessoais</h4>
                            <DetailItem icon={<IdIcon />} label="CPF" value={user.cpf} />
                            <DetailItem icon={<CalendarIcon />} label="Nascimento" value={formatDate(user.birthDate)} />
                        </div>

                        {/* Contact info */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-800 dark:text-white">Contato</h4>
                            {user.phones.map(phone => (
                                <DetailItem 
                                    key={phone.id} 
                                    icon={phone.phoneType === 'CELL' ? <DevicePhoneMobileIcon /> : <PhoneIcon />} 
                                    label={phone.phoneType === 'CELL' ? 'Celular' : 'Fixo'} 
                                    value={<span className="flex items-center gap-2">{phone.number} {phone.hasWhatsApp && <WhatsAppIcon className="w-4 h-4 text-green-500" />}</span>} 
                                />
                            ))}
                             {user.phones.length === 0 && <p className="text-sm text-gray-500">Nenhum telefone.</p>}
                        </div>

                         {/* Contract Specifics */}
                        <div className="space-y-4">
                             <h4 className="font-bold text-gray-800 dark:text-white">Dados Contratuais</h4>
                             { user.type === UserType.CLT && (
                                <>
                                 <DetailItem icon={<BriefcaseIcon />} label="Função" value={user.jobFunction} />
                                 <DetailItem icon={<UserIcon />} label="Nome da Mãe" value={user.motherName} />
                                 <DetailItem icon={<UserIcon />} label="Nome do Pai" value={user.fatherName} />
                                 <DetailItem icon={<BriefcaseIcon />} label="PIS" value={user.pis} />
                                </>
                             )}
                             { (user.type === UserType.PJ || user.type === UserType.Partner) && (
                                <>
                                 <DetailItem icon={<BuildingOffice2Icon />} label="Nome Fantasia" value={user.companyName} />
                                 <DetailItem icon={<IdIcon />} label="CNPJ" value={user.cnpj} />
                                </>
                             )}
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <AddressDetails title="Endereço Residencial" address={user.homeAddress} />
                        <AddressDetails title="Endereço da Empresa" address={user.companyAddress} />
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                            <BanknotesIcon className="w-5 h-5"/> Dados Bancários
                        </h4>
                        <div className="space-y-3">
                            {user.bankDetails && user.bankDetails.length > 0 ? (
                                user.bankDetails.map((detail: BankDetail) => (
                                    <div key={detail.id} className={`p-4 rounded-lg shadow-sm border-l-4 ${detail.isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-900/50'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className="font-bold text-lg text-gray-800 dark:text-white">{detail.bankName}</p>
                                                    {detail.isActive && <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">Ativa</span>}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Ag: {detail.agency} / Cc: {detail.account}</p>
                                                {detail.pixKey && <p className="text-sm text-gray-500 dark:text-gray-400">PIX ({detail.pixKeyType}): {detail.pixKey}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 pl-2">Nenhum dado bancário cadastrado.</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                            <PaperClipIcon className="w-5 h-5"/> Documentos Pessoais
                        </h4>
                        <ul className="space-y-3">
                            {user.personalAttachments && user.personalAttachments.length > 0 ? (
                                user.personalAttachments.map((att: Attachment, index: number) => (
                                    <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 p-3 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <PaperClipIcon className="w-5 h-5 text-gray-500 flex-shrink-0"/>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{att.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); handleViewFile(att); }} title="Visualizar" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><EyeIcon className="w-5 h-5"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDownloadFile(att); }} title="Baixar" className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><ArrowDownTrayIcon className="w-5 h-5"/></button>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 pl-2">Nenhum documento anexado.</p>
                            )}
                        </ul>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3"><ClipboardDocumentListIcon className="w-5 h-5"/> Histórico de Alterações</h4>
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto pr-2">
                            {user.history && user.history.length > 0 ? (
                                [...user.history].reverse().map((entry: HistoryEntry, index) => (
                                    <p key={index} className="border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">[{new Date(entry.timestamp).toLocaleString('pt-BR')}] - {entry.event}:</span> {entry.details}
                                    </p>
                                ))
                            ) : (
                                <p className="pl-2">Nenhum histórico para este usuário.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {isPortalLinkModalOpen && <PortalLinkModal user={user} onClose={() => setIsPortalLinkModalOpen(false)} />}
        </div>
    );
};

export default UserItem;