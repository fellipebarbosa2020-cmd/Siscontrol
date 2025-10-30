import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface ThemeSwitcherProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isCollapsed: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, toggleTheme, isCollapsed }) => {
  const isDark = theme === 'dark';
  const label = isDark ? 'Modo Escuro' : 'Modo Claro';
  const Icon = isDark ? MoonIcon : SunIcon;

  return (
    <button
      onClick={toggleTheme}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center w-full h-12 px-4 rounded-lg transition-colors duration-200 group
        text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50
        ${isCollapsed ? 'justify-center' : 'justify-start'}
      `}
      aria-label={label}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      {!isCollapsed && <span className="ml-4 whitespace-nowrap flex-1 text-left">{label}</span>}
    </button>
  );
};

export default ThemeSwitcher;
