import React from 'react';
import { Company } from '../types';
import { BuildingOffice2Icon, PencilIcon, PlusIcon, TrashIcon } from '../components/icons';

interface CompanyListScreenProps {
  companies: Company[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  selectedCompanies: Set<string>;
  onSelectCompany: (id: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onDelete: () => void;
}

const CompanyListScreen: React.FC<CompanyListScreenProps> = ({
  companies,
  onAddCompany,
  onEditCompany,
  selectedCompanies,
  onSelectCompany,
  onSelectAll,
  isAllSelected,
  onDelete
}) => {
  const hasSelection = selectedCompanies.size > 0;

  return (
    <div className="max-w-screen-2xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Empresas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie as empresas e fornecedores.</p>
        </div>
        <button
          onClick={onAddCompany}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nova Empresa</span>
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        <div className={`transition-all duration-300 overflow-hidden ${hasSelection ? 'max-h-28 mb-6' : 'max-h-0'}`}>
          <div className={`bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 transition-opacity duration-300 ${hasSelection ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-4">
              <label htmlFor="select-all-companies" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  id="select-all-companies"
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mr-2"
                />
                Selecionar Todas
              </label>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {selectedCompanies.size} empresa(s) selecionada(s)
              </p>
            </div>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 transition-colors"
            >
              <TrashIcon className="w-4 h-4" /> Excluir Selecionadas
            </button>
          </div>
        </div>

        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => {
              const isSelected = selectedCompanies.has(company.id);
              return (
                <div
                  key={company.id}
                  className={`bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg shadow-sm transition-all duration-200 relative ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md'}`}
                >
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectCompany(company.id)}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${company.name}`}
                    />
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4 ml-8">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                        <BuildingOffice2Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white">{company.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{company.cnpj}</p>
                      </div>
                    </div>
                    <button onClick={() => onEditCompany(company)} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Editar Empresa">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{company.address}, {company.number}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{company.city} - {company.state}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{company.phone}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <BuildingOffice2Icon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
            <h2 className="mt-6 text-2xl font-semibold text-gray-600 dark:text-gray-300">Nenhuma empresa encontrada.</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Clique em "Nova Empresa" para começar a cadastrar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyListScreen;