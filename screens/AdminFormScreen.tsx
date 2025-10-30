import React, { useState, useEffect } from 'react';
import { Admin } from '../types';

interface AdminFormScreenProps {
  initialData?: Admin | null;
  onSave: (adminData: Omit<Admin, 'id'>, id?: string) => void;
  onCancel: () => void;
}

const formatCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

const AdminFormScreen: React.FC<AdminFormScreenProps> = ({ initialData, onSave, onCancel }) => {
    const isEditMode = !!initialData;
    const [formData, setFormData] = useState<Omit<Admin, 'id'>>({
        fullName: initialData?.fullName || '',
        cpf: initialData?.cpf || '',
        birthDate: initialData?.birthDate || '',
        email: initialData?.email || '',
        endDate: initialData?.endDate || '',
    });
    const [age, setAge] = useState<number | null>(null);

    useEffect(() => {
        if (formData.birthDate) {
            // Adjust for timezone issues where new Date('YYYY-MM-DD') can be off by a day
            const parts = formData.birthDate.split('-').map(Number);
            const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            setAge(calculatedAge >= 0 ? calculatedAge : null);
        } else {
            setAge(null);
        }
    }, [formData.birthDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'cpf' ? formatCPF(value) : value,
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, initialData?.id);
    };

    const inputClass = "w-full mt-2 p-3 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors";
    const labelClass = "text-sm font-semibold text-gray-600 dark:text-gray-300";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
            <header className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{isEditMode ? "Editar Administrador" : "Novo Administrador"}</h1>
            </header>
            <form onSubmit={handleSubmit} className="p-8 flex-grow overflow-y-auto">
                <div className="space-y-6 max-w-2xl mx-auto">
                    <div>
                        <label className={labelClass}>Nome Completo</label>
                        <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className={inputClass} required/>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>CPF</label>
                            <input name="cpf" type="text" value={formData.cpf} onChange={handleChange} maxLength={14} className={inputClass} required/>
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label className={labelClass}>Data de Nascimento</label>
                                <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className={inputClass} required/>
                            </div>
                            <div className="flex-shrink-0 text-center">
                                <p className={labelClass}>Idade</p>
                                <div className="mt-2 w-20 h-11 flex items-center justify-center bg-gray-200 dark:bg-gray-900 rounded-lg text-lg font-bold text-indigo-500 dark:text-indigo-400">{age ?? '--'}</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>E-mail</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass} required/>
                    </div>
                     <div>
                        <label className={labelClass}>Data de Término de Acesso (Opcional)</label>
                        <p className="text-xs text-gray-400 mt-1">Após esta data, o status do administrador será "Inativo".</p>
                        <input name="endDate" type="date" value={formData.endDate || ''} onChange={handleChange} className={inputClass} />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
                    <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition-colors">{isEditMode ? 'Salvar Alterações' : 'Salvar'}</button>
                </div>
            </form>
        </div>
    );
};
export default AdminFormScreen;