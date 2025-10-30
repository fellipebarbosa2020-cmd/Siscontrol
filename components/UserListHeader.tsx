
import React from 'react';
import { UserType } from '../types';

interface UserListHeaderProps {
  activeTab: 'ALL' | UserType;
  onTabChange: (tab: 'ALL' | UserType) => void;
  counts: {
      ALL: number;
      [UserType.CLT]: number;
      [UserType.PJ]: number;
      [UserType.Partner]: number;
  };
}

const UserListHeader: React.FC<UserListHeaderProps> = ({ 
    activeTab, 
    onTabChange, 
    counts,
}) => {
  const tabs: { key: 'ALL' | UserType; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todos', count: counts.ALL },
    { key: UserType.CLT, label: 'CLT', count: counts[UserType.CLT] },
    { key: UserType.PJ, label: 'PJ', count: counts[UserType.PJ] },
    { key: UserType.Partner, label: 'Parceiros', count: counts[UserType.Partner] },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center -mb-px space-x-4" aria-label="Tabs de Tipo de Usuário">
        {tabs.map(tab => (
            <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
                flex items-center gap-2 px-1 py-3 border-b-2 font-semibold text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
                ${activeTab === tab.key
                ? `border-indigo-500 text-indigo-600 dark:text-indigo-400`
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                }
            `}
            >
            <span>{tab.label}</span>
            <span className={`
                py-0.5 px-2.5 rounded-full text-xs font-bold
                ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100'}
            `}>
                {tab.count}
            </span>
            </button>
        ))}
        </div>
    </div>
  );
};

export default UserListHeader;