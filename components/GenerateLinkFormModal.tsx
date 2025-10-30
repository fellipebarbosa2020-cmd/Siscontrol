import React, { useState } from 'react';
import { UserType, Company } from '../types';
import { XMarkIcon, ClipboardDocumentListIcon, CheckCircleIcon, BriefcaseIcon, BuildingOffice2Icon, UserPlusIcon, ChevronRightIcon } from './icons';

interface GenerateLinkFormModalProps {
    onClose: () => void;
    companies: Company[];
}

const GenerateLinkFormModal: React.FC<GenerateLinkFormModalProps> = ({ onClose, companies }) => {
    const [step, setStep] = useState(1);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<UserType>(UserType.CLT);
    const [generatedLink, setGeneratedLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleCompanySelection = (companyId: string) => {
        setSelectedCompanyIds(prev =>
            prev.includes(companyId)
                ? prev.filter(id => id !== companyId)
                : [...prev, companyId]
        );
    };

    const generateLink = () => {
        if (selectedCompanyIds.length === 0) {
            alert("Selecione pelo menos uma empresa.");
            return;
        }
        
        try {
            // Use window.location.origin to get the public base URL of the app.
            // This avoids including temporary/internal paths from the dev environment.
            const baseUrl = window.location.origin;
            const hash = `#form=user&type=${selectedType}&companyIds=${selectedCompanyIds.join(',')}`;
            const link = baseUrl + hash;

            setGeneratedLink(link);
            setStep(3);
        } catch (error) {
            console.error("Error generating link:", error);
            alert("Não foi possível gerar o link. O endereço da página atual parece ser inválido.");
        }
    };
    
    const handleCopyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };
    
    const renderStepContent = () => {
        switch(step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            1. Vincule o novo usuário a uma ou mais empresas:
                        </label>
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                           {companies.length > 0 ? companies.map(company => (
                                <label key={company.id} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-md cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/50">
                                    <input
                                        type="checkbox"
                                        checked={selectedCompanyIds.includes(company.id)}
                                        onChange={() => handleCompanySelection(company.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 font-semibold text-gray-700 dark:text-gray-200">{company.name}</span>
                                </label>
                           )) : (
                               <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">Nenhuma empresa cadastrada.</p>
                           )}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={selectedCompanyIds.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Próximo <ChevronRightIcon className="w-5 h-5"/>
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           2. Selecione o tipo de colaborador:
                        </label>
                        <div className="flex justify-center items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-full">
                            {(Object.values(UserType) as UserType[]).map(type => {
                                const isActive = selectedType === type;
                                const icons = { [UserType.CLT]: <BriefcaseIcon/>, [UserType.PJ]: <BuildingOffice2Icon/>, [UserType.Partner]: <UserPlusIcon/> };
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${isActive ? 'bg-white text-indigo-600 dark:bg-gray-700 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    >
                                      {React.cloneElement(icons[type], {className: 'w-5 h-5'})}
                                      {type}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={generateLink}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 shadow-md"
                        >
                            Gerar Link
                        </button>
                    </div>
                );
            case 3:
                 return (
                    <div className="space-y-4 animate-fade-in-down text-center">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto"/>
                         <h3 className="text-lg font-bold text-gray-800 dark:text-white">Link Gerado com Sucesso!</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Envie este link para o novo colaborador preencher o formulário.</p>
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 font-mono text-sm"
                            />
                            <button onClick={handleCopyToClipboard} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                                {isCopied ? <CheckCircleIcon className="w-5 h-5 text-green-500"/> : <ClipboardDocumentListIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gerar Link de Cadastro</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="p-8">
                    {renderStepContent()}
                </div>

                <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
                     <button type="button" onClick={() => setStep(p => Math.max(1, p - 1))} disabled={step === 1 || step === 3} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold disabled:opacity-50">
                        Voltar
                    </button>
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateLinkFormModal;