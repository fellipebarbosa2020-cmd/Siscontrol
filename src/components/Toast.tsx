import React, { useEffect } from 'react';
import { CheckCircleIcon, InformationCircleIcon, XMarkIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from './icons';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    style: 'bg-green-100 dark:bg-green-900 border-green-500 dark:border-green-700 text-green-800 dark:text-green-200',
  },
  info: {
    icon: InformationCircleIcon,
    style: 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    style: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
  },
  error: {
    icon: ExclamationCircleIcon,
    style: 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div className={`fixed top-5 right-5 z-[100] max-w-sm rounded-lg shadow-lg border-l-4 p-4 flex items-center gap-4 animate-fade-in-down ${config.style}`}>
      <div className="flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-grow font-semibold">
        {message}
      </div>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        <XMarkIcon className="w-5 h-5" />
      </button>
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;