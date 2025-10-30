import React, { useState } from 'react';
import { BuildingOffice2Icon, ChevronLeftIcon, ChevronRightIcon, WalletIcon, UsersIcon, ChevronDownIcon, SparklesIcon, Cog6ToothIcon, ShieldCheckIcon, ListBulletIcon, PlusCircleIcon } from './icons';
import ThemeSwitcher from './ThemeSwitcher';

type ActiveScreen = 'dashboard' | 'companies' | 'companyForm' | 'users' | 'userForm' | 'publicUserForm' | 'admins' | 'adminForm';

interface SidebarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onNavigateToCompanyForm: () => void;
  onNavigateToUserForm: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NavItem = ({ icon, label, isActive, onClick, isCollapsed, hasSubmenu, isSubmenuOpen }: { icon: React.ReactElement<{ className?: string }>, label: string, isActive: boolean, onClick: () => void, isCollapsed: boolean, hasSubmenu?: boolean, isSubmenuOpen?: boolean }) => (
    <li>
        <button
            onClick={onClick}
            title={isCollapsed ? label : undefined}
            className={`
                relative flex items-center w-full h-12 px-4 rounded-lg transition-colors duration-200 group
                ${isCollapsed ? 'justify-center' : 'justify-start'}
                ${isActive
                    ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }
            `}
        >
            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full"></span>}
            {React.cloneElement(icon, { className: 'w-6 h-6 flex-shrink-0' })}
            {!isCollapsed && <span className="ml-4 whitespace-nowrap flex-1 text-left">{label}</span>}
            {!isCollapsed && hasSubmenu && <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180' : ''}`} />}
        </button>        
    </li>
);
// FIX: Corrected the type of the `icon` prop to allow `className`.
const SubMenuItem = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactElement<{ className?: string }>, isActive: boolean, onClick: () => void }) => (
    <li>
        <button
            onClick={onClick}
            className={`relative w-full text-left flex items-center h-10 px-2 rounded-md text-sm transition-colors duration-200 group
            ${isActive
                ? 'text-indigo-600 dark:text-indigo-300 font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-full w-1 rounded-r-full bg-transparent group-hover:bg-indigo-200 dark:group-hover:bg-gray-700 transition-all duration-200 ${isActive ? 'scale-y-100' : 'scale-y-0'} group-hover:scale-y-100`}></span>
            {React.cloneElement(icon, { className: "w-5 h-5 mr-3 ml-2 flex-shrink-0" })}
            <span>{label}</span>
        </button>
    </li>
);


const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate, onNavigateToCompanyForm, onNavigateToUserForm, theme, toggleTheme }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openMenus, setOpenMenus] = useState({
        companies: activeScreen === 'companies' || activeScreen === 'companyForm',
        users: activeScreen === 'users' || activeScreen === 'userForm',
        settings: activeScreen === 'admins' || activeScreen === 'adminForm',
    });

    const toggleMenu = (menu: keyof typeof openMenus) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };
    
    return (
        <aside className={`
            flex flex-col h-screen bg-white dark:bg-gray-800 shadow-xl z-20
            transition-all duration-300 ease-in-out
            ${isCollapsed ? 'w-24' : 'w-64'}
        `}>
            {/* Logo and App Name */}
            <div className={`flex items-center h-20 px-4 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                    <div className={`overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                        <span className="text-2xl font-extrabold whitespace-nowrap bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                            FINANÇAS
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-4">
                <ul className="space-y-2">
                    <NavItem
                        label="Contas"
                        icon={<WalletIcon />}
                        isActive={activeScreen === 'dashboard'}
                        onClick={() => onNavigate('dashboard')}
                        isCollapsed={isCollapsed}
                    />
                     <NavItem
                        label="Empresas"
                        icon={<BuildingOffice2Icon />}
                        isActive={activeScreen === 'companies' || activeScreen === 'companyForm'}
                        onClick={() => toggleMenu('companies')}
                        isCollapsed={isCollapsed}
                        hasSubmenu
                        isSubmenuOpen={openMenus.companies}
                    />
                     <div className={`overflow-hidden transition-all duration-300 ${openMenus.companies && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}>
                        <ul className="space-y-1 pt-1 pl-8">
                            <SubMenuItem
                                label="Cadastrar"
                                icon={<PlusCircleIcon />}
                                isActive={activeScreen === 'companies' && !isCollapsed}
                                onClick={() => onNavigate('companies')}
                            />
                        </ul>
                    </div>
                    <NavItem
                        label="Usuários"
                        icon={<UsersIcon />}
                        isActive={activeScreen === 'users' || activeScreen === 'userForm'}
                        onClick={() => toggleMenu('users')}
                        isCollapsed={isCollapsed}
                        hasSubmenu
                        isSubmenuOpen={openMenus.users}
                    />
                     <div className={`overflow-hidden transition-all duration-300 ${openMenus.users && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}>
                        <ul className="space-y-1 pt-1 pl-8">
                            <SubMenuItem
                                label="Cadastrar"
                                icon={<PlusCircleIcon />}
                                isActive={activeScreen === 'users' && !isCollapsed}
                                onClick={() => onNavigate('users')}
                            />
                        </ul>
                    </div>
                </ul>
            </nav>

            {/* Footer Actions */}
            <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 space-y-2">
                 <ul className="pb-2 mb-2">
                    <NavItem
                        label="Configurações"
                        icon={<Cog6ToothIcon />}
                        isActive={activeScreen === 'admins' || activeScreen === 'adminForm'}
                        onClick={() => toggleMenu('settings')}
                        isCollapsed={isCollapsed}
                        hasSubmenu={true}
                        isSubmenuOpen={openMenus.settings}
                    />
                    <div className={`overflow-hidden transition-all duration-300 ${openMenus.settings && !isCollapsed ? 'max-h-40' : 'max-h-0'}`}>
                        <ul className={`space-y-1 pt-1 ${isCollapsed ? 'hidden' : 'pl-8'}`}>
                           <SubMenuItem
                                label="Administradores"
                                icon={<ShieldCheckIcon />}
                                isActive={activeScreen === 'admins' || activeScreen === 'adminForm'}
                                onClick={() => onNavigate('admins')}
                            />
                        </ul>
                    </div>
                </ul>
                 <ThemeSwitcher
                    theme={theme}
                    toggleTheme={toggleTheme}
                    isCollapsed={isCollapsed}
                />
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`flex items-center w-full h-12 px-4 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                    `}
                    title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                >
                    {isCollapsed ? <ChevronRightIcon className="w-6 h-6"/> : <ChevronLeftIcon className="w-6 h-6"/>}
                    {!isCollapsed && <span className="ml-4 font-semibold whitespace-nowrap">Recolher</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;