import React, { useState } from 'react';
import { User, UserType } from '../types';
import UserFormScreen from './UserFormScreen';
import { ClipboardDocumentListIcon, CheckCircleIcon } from '../components/icons';

interface PublicUserFormScreenProps {
  userType: UserType;
  companyIds: string[];
}

const PublicUserFormScreen: React.FC<PublicUserFormScreenProps> = ({ userType, companyIds }) => {
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerateCode = (code: string) => {
        setGeneratedCode(code);
    };
    
    const handleCopyToClipboard = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    const userTypeLabels: Record<UserType, string> = {
        [UserType.CLT]: 'Colaborador CLT',
        [UserType.PJ]: 'Pessoa Jurídica (PJ)',
        [UserType.Partner]: 'Parceiro',
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <div className="w-full max-w-5xl">
                {!generatedCode ? (
                    <UserFormScreen
                        isPublic={true}
                        publicUserType={userType}
                        publicCompanyIds={companyIds}
                        onSave={() => {}}
                        onCancel={() => {}}
                        onGenerateCode={handleGenerateCode}
                    />
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center animate-fade-in-down">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4"/>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cadastro Concluído!</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Copie o código abaixo e envie ao administrador para finalizar seu cadastro no sistema.
                        </p>
                        <div className="my-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
                            <textarea
                                readOnly
                                value={generatedCode}
                                rows={5}
                                className="w-full bg-transparent border-none text-xs font-mono text-gray-600 dark:text-gray-400 focus:ring-0"
                            />
                        </div>
                        <button
                            onClick={handleCopyToClipboard}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
                        >
                            <ClipboardDocumentListIcon className="w-5 h-5"/>
                            {isCopied ? 'Copiado com Sucesso!' : 'Copiar Código'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicUserFormScreen;