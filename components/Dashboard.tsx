import React from 'react';
import { BillStatus } from './BillListHeader';
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, WalletIcon } from './icons';

type DashboardData = {
    upcoming: { count: number; total: number; };
    overdue: { count: number; total: number; };
    paid: { count: number; total: number; };
    postponed: { count: number; total: number; };
}

interface DashboardProps {
    data: DashboardData;
    onCardClick: (tab: BillStatus) => void;
}

interface CardProps {
    title: string;
    count: number;
    total: number;
    icon: React.ReactElement<{ className?: string }>;
    colorClasses: string;
    onClick: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const StatCard: React.FC<CardProps> = ({ title, count, total, icon, colorClasses, onClick }) => (
    <button 
        onClick={onClick}
        className={`
        w-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg
        flex items-center gap-6 
        transition-all duration-300 ease-in-out
        hover:shadow-xl hover:scale-105 transform
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
      `}
    >
        <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${colorClasses}`}>
            {React.cloneElement(icon, { className: 'w-8 h-8 text-white' })}
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium text-left">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white text-left">{formatCurrency(total)}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm text-left">{count} conta(s)</p>
        </div>
    </button>
);

const Dashboard: React.FC<DashboardProps> = ({ data, onCardClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
                title="A Vencer"
                count={data.upcoming.count}
                total={data.upcoming.total}
                icon={<ClockIcon />}
                colorClasses="bg-blue-500"
                onClick={() => onCardClick('UPCOMING')}
            />
            <StatCard
                title="Vencidas"
                count={data.overdue.count}
                total={data.overdue.total}
                icon={<ExclamationTriangleIcon />}
                colorClasses="bg-red-500"
                onClick={() => onCardClick('OVERDUE')}
            />
            <StatCard
                title="Pagas (no filtro)"
                count={data.paid.count}
                total={data.paid.total}
                icon={<CheckCircleIcon />}
                colorClasses="bg-green-500"
                onClick={() => onCardClick('PAID')}
            />
            <StatCard
                title="Postergadas"
                count={data.postponed.count}
                total={data.postponed.total}
                icon={<WalletIcon />}
                colorClasses="bg-purple-500"
                onClick={() => onCardClick('POSTPONED')}
            />
        </div>
    );
}

export default Dashboard;
