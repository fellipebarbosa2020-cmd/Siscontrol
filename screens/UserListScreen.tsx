import React, { useState } from 'react';
import { User, UserType, Company } from '../types';
import { Cog6ToothIcon, LinkIcon, PlusIcon, UsersIcon, TrashIcon } from '../components/icons';
import UserItem from '../components/UserItem';
import GenerateLinkFormModal from '../components/GenerateLinkFormModal';
import UserListHeader from '../components/UserListHeader';
import ManagementModal from '../components/ManagementModal';

interface UserListScreenProps {
  users: User[];
  companies: Company[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onOpenImportModal: () => void;
  activeTab: 'ALL' | UserType;
  onTabChange: (tab: 'ALL' | UserType) => void;
  counts: {
      ALL: number;
      [UserType.CLT]: number;
      [UserType.PJ]: number;
      [UserType.Partner]: number;
  };
  jobFunctions: string[];
  onAddJobFunction: (jobFunction: string) => void;
  onDeleteJobFunction: (jobFunction: string) => void;
  onUpdateJobFunction: (oldName: string, newName: string) => void;
  selectedUsers: Set<string>;
  onSelectUser: (id: string) => void;
  onSelectAllUsers: () => void;
  isAllUsersSelected: boolean;
  onDeleteUsers: () => void;
}

const UserListScreen: React.FC<UserListScreenProps> = ({ 
    users, 
    companies, 
    onAddUser, 
    onEditUser, 
    onOpenImportModal, 
    activeTab, 
    onTabChange, 
    counts,
    jobFunctions,
    onAddJobFunction,
    onDeleteJobFunction,
    onUpdateJobFunction,
    selectedUsers,
    onSelectUser,
    onSelectAllUsers,
    isAllUsersSelected,
    onDeleteUsers,
}) => {
    const [isLinkFormModalOpen, setIsLinkFormModalOpen] = useState(false);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const hasSelection = selectedUsers.size > 0;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Usuários</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os usuários e colaboradores do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={() => setIsManagementModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Gerenciar Funções"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
           <button
            onClick={() => setIsLinkFormModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Gerar link de cadastro"
          >
            <LinkIcon className="w-5 h-5" />
          </button>
           <button
            onClick={onOpenImportModal}
            className="flex items-center gap-2 px-4 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-600 transition-colors"
            title="Importar usuário por código"
          >
            <span className="hidden sm:inline">Importar por Código</span>
          </button>
          <button
            onClick={onAddUser}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </header>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <UserListHeader
            activeTab={activeTab}
            onTabChange={onTabChange}
            counts={counts}
        />
        {hasSelection && (
          <div className="bg-indigo-50 dark:bg-indigo-900/50 mt-4 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in-down">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {selectedUsers.size} usuário(s) selecionado(s)
            </p>
            <button
              onClick={onDeleteUsers}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
            >
              <TrashIcon className="w-4 h-4" /> Excluir Selecionados
            </button>
          </div>
        )}
        <div className="mt-6">
            {users.length > 0 ? (
                <div className="space-y-3">
                    {/* List Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-700">
                        <div className="col-span-1 flex items-center">
                            <input
                                type="checkbox"
                                checked={isAllUsersSelected}
                                onChange={onSelectAllUsers}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                aria-label="Selecionar todos os usuários"
                            />
                        </div>
                        <div className="col-span-3">Colaborador</div>
                        <div className="col-span-3">Empresa(s)</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Ações</div>
                    </div>
                    <div className="max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                      {users.map(user => (
                          <UserItem 
                            key={user.id} 
                            user={user} 
                            onEdit={onEditUser} 
                            companies={companies} 
                            isSelected={selectedUsers.has(user.id)}
                            onSelect={onSelectUser}
                          />
                      ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20">
                    <UsersIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h2 className="mt-6 text-2xl font-semibold text-gray-600 dark:text-gray-300">Nenhum usuário encontrado.</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Clique em "Novo Usuário" para começar a cadastrar ou altere os filtros.</p>
                </div>
            )}
        </div>
      </div>

      {isLinkFormModalOpen && <GenerateLinkFormModal companies={companies} onClose={() => setIsLinkFormModalOpen(false)} />}
      {isManagementModalOpen && (
        <ManagementModal
            categories={[]}
            costCenters={[]}
            jobFunctions={jobFunctions}
            onAddCategory={()=>{}}
            onDeleteCategory={()=>{}}
            onUpdateCategory={()=>{}}
            onAddCostCenter={()=>{}}
            onDeleteCostCenter={()=>{}}
            onUpdateCostCenter={()=>{}}
            onAddJobFunction={onAddJobFunction}
            onDeleteJobFunction={onDeleteJobFunction}
            onUpdateJobFunction={onUpdateJobFunction}
            onClose={() => setIsManagementModalOpen(false)}
            mode="jobFunctions"
        />
      )}
    </div>
  );
};

export default UserListScreen;