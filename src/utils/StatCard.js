import {FaUserFriends, FaRedo } from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";

export const StatCard = ({ icon,label, value, color,textColor, onClick, active }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center gap-3 text-left ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${active ? 'border-[#D3423E] ring-2 ring-red-100' : 'border-gray-200'}`}
  >
    <div className={`p-2.5 ${color} ${textColor} rounded-xl flex-shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </button>
);
export const EmptyState = ({ hasFilters, onClear, onCreate }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FaUserFriends className="text-gray-300 text-3xl" />
    </div>
    <p className="text-gray-700 font-bold text-base">
      {hasFilters ? "Sin resultados" : "Sin clientes registrados"}
    </p>
    <p className="text-sm text-gray-500 mt-1 max-w-md">
      {hasFilters
        ? "No encontramos clientes con los filtros actuales. Intenta ajustarlos o limpiarlos."
        : "Comienza agregando tu primer cliente para empezar a gestionarlos."}
    </p>
    <div className="flex gap-2 mt-5">
      {hasFilters ? (
        <button
          onClick={onClear}
          className="px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <FaRedo size={11} /> Limpiar filtros
        </button>
      ) : (
        <button
          onClick={onCreate}
          className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <IoPersonAdd /> Agregar cliente
        </button>
      )}
    </div>
  </div>
);