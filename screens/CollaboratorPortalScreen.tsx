import React, { useState, useRef } from 'react';
import { User, Attachment, BankDetail } from '../types';
import { DocumentDuplicateIcon, PaperClipIcon, ArrowDownTrayIcon, EyeIcon, BanknotesIcon, TrashIcon, UserIcon as UserCircleIcon } from '../components/icons';
import BankDetailsManager from '../components/BankDetailsManager';

interface CollaboratorPortalScreenProps {
  initialData: Omit<User, 'personalAttachments' | 'bankDetails'> & { personalAttachments: File[], bankDetails: BankDetail[] };
  onSave: (userData: Omit<User, 'id' | 'history' | 'portalKey' | 'personalAttachments'> & { personalAttachments: (File | Attachment)[] }) => void;
}

type FormTabs = 'bank' | 'documents';

const CollaboratorPortalScreen: React.FC<CollaboratorPortalScreenProps> = ({ initialData, onSave }) => {
    const [activeTab, setActiveTab] = useState<FormTabs>('bank');
    const [userData, setUserData] = useState(initialData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onSave(userData);
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setUserData(prev => ({ ...prev, personalAttachments: [...prev.personalAttachments, ...files] }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUserData(prev => ({ ...prev, personalAttachments: [...prev.personalAttachments, ...files] }));
        }
    };
    
    const handleRemoveFile = (fileName: string) => {
        setUserData(prev => ({
            ...prev,
            personalAttachments: prev.personalAttachments.filter(f => f.name !== fileName)
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

    const renderTabContent = () => {
        switch(activeTab) {
            case 'bank':
                return (
                     <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8">
                           <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Meus Dados Bancários</h3>
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
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Meus Documentos</h3>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                                className="relative flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-2xl transition-colors border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            >
                                <DocumentDuplicateIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4"/>
                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Arraste e solte ou selecione seus documentos</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PDF, PNG, JPG, etc.</p>
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
          <span className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg z-0"></span>
        )}
      </button>
    );
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
            <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg">
                <header className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Portal do Colaborador</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Bem-vindo(a), {initialData.fullName}!</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md">
                            Salvar Alterações
                        </button>
                    </div>
                </header>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded-xl">
                        <TabButton tab="bank" label="Dados Bancários" icon={<BanknotesIcon />} />
                        <TabButton tab="documents" label="Documentos" icon={<DocumentDuplicateIcon />} />
                    </div>
                </div>
            </div>

            <div className="p-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default CollaboratorPortalScreen;
