import React, { useState, useMemo } from 'react';
import { Admin } from '../types';
import { PlusIcon, ShieldCheckIcon, TrashIcon, PencilIcon } from '../components/icons';

interface AdminListScreenProps {
  admins: Admin[];
  onAddAdmin: () => void;
  onEditAdmin: (admin: Admin) => void;
  onDeleteAdmins: (ids: Set<string>) => void;
}

const AdminListScreen: React.FC<AdminListScreenProps> = ({ admins, onAddAdmin, onEditAdmin, onDeleteAdmins }) => {
    const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
    const isAllSelected = useMemo(() => admins.length > 0 && selectedAdmins.size === admins.length, [admins, selectedAdmins]);
    
    const handleSelectAdmin = (id: string) => {
        setSelectedAdmins(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            return newSelection;
        });
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedAdmins(new Set());
        } else {
            setSelectedAdmins(new Set(admins.map(a => a.id)));
        }
    };

    const handleDelete = () => {
        if (selectedAdmins.size > 0) {
            onDeleteAdmins(selectedAdmins);
            setSelectedAdmins(new Set());
        }
    };

    const isUserActive = (admin: Admin) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (admin.endDate) {
            const endDate = new Date(admin.endDate + 'T00:00:00');
            if (endDate < today) {
                return false;
            }
        }
        return true;
    };

    const getStatus = (admin: Admin) => {
        if (isUserActive(admin)) {
            return { text: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
        }
        return { text: 'Inativo', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    };

    return (
        <div className="max-w-screen-2xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Administradores</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os usuários com acesso ao sistema.</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onAddAdmin} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                  <PlusIcon className="w-5 h-5" />
                  <span>Novo Administrador</span>
                </button>
            </div>
          </header>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            {selectedAdmins.size > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in-down">
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {selectedAdmins.size} administrador(es) selecionado(s)
                    </p>
                    <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700">
                        <TrashIcon className="w-4 h-4" /> Excluir Selecionado(s)
                    </button>
                </div>
            )}
            
            {admins.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                         <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-8"/>
                         <div className="grid grid-cols-12 gap-4 flex-grow items-center">
                            <div className="col-span-4">Nome</div>
                            <div className="col-span-4">E-mail</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Ações</div>
                         </div>
                    </div>
                    {admins.map(admin => {
                        const status = getStatus(admin);
                        return (
                            <div key={admin.id} className={`p-4 rounded-lg flex items-center gap-4 transition-colors ${selectedAdmins.has(admin.id) ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                <input type="checkbox" checked={selectedAdmins.has(admin.id)} onChange={() => handleSelectAdmin(admin.id)} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"/>
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                                    <ShieldCheckIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="flex-grow grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-4">
                                        <p className="font-bold text-gray-800 dark:text-white">{admin.fullName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{admin.cpf}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 col-span-4 truncate">{admin.email}</p>
                                    <div className="col-span-2">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${status.className}`}>
                                            {status.text}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <button onClick={() => onEditAdmin(admin)} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                            <PencilIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <ShieldCheckIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h2 className="mt-6 text-2xl font-semibold text-gray-600 dark:text-gray-300">Nenhum administrador encontrado.</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Clique em "Novo Administrador" para começar.</p>
                </div>
            )}
          </div>
        </div>
    );
};
export default AdminListScreen;