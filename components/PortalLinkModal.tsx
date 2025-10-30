import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { XMarkIcon, ClipboardDocumentListIcon, CheckCircleIcon } from './icons';

interface PortalLinkModalProps {
    onClose: () => void;
    user: User;
}

const PortalLinkModal: React.FC<PortalLinkModalProps> = ({ onClose, user }) => {
    const [isCopied, setIsCopied] = useState(false);

    const generatedLink = useMemo(() => {
        if (!user.portalKey) return '';
        
        try {
            // Use window.location.origin to get the public base URL of the app.
            // This avoids including temporary/internal paths from the dev environment.
            const baseUrl = window.location.origin;
            const hash = `#portalKey=${user.portalKey}`;
            return baseUrl + hash;
        } catch(error) {
            console.error("Error generating portal link:", error);
            return 'Erro ao gerar o link.';
        }
    }, [user.portalKey]);

    const handleCopyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Link de Acesso ao Portal</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="p-8 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Envie este link para <strong>{user.fullName}</strong>. Através dele, o colaborador poderá visualizar seus dados e gerenciar suas informações bancárias e documentos.
                    </p>
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

                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PortalLinkModal;