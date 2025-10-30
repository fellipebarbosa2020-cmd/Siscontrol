import React from 'react';
import { ListBulletIcon, Squares2x2Icon } from './icons';

interface ViewSwitcherProps {
  viewMode: 'list' | 'card';
  onViewChange: (mode: 'list' | 'card') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onViewChange }) => {
  const baseStyle = "p-2 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500";
  const activeStyle = "bg-indigo-600 text-white shadow";
  const inactiveStyle = "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
      <button
        onClick={() => onViewChange('list')}
        className={`${baseStyle} ${viewMode === 'list' ? activeStyle : inactiveStyle}`}
        aria-pressed={viewMode === 'list'}
        title="Visualização em Lista"
      >
        <ListBulletIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewChange('card')}
        className={`${baseStyle} ${viewMode === 'card' ? activeStyle : inactiveStyle}`}
        aria-pressed={viewMode === 'card'}
        title="Visualização em Grade"
      >
        <Squares2x2Icon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ViewSwitcher;
