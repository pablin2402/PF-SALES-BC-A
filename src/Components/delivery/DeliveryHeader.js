import React from "react";
import { FaMotorcycle } from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";

const DeliveryHeader = ({ onExport, canExport, onNew }) => (
  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <FaMotorcycle className="text-[#D3423E]" />
        Personal de Reparto
      </h1>
      <p className="text-sm text-gray-500">Gestiona tu equipo de repartidores</p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onExport}
        disabled={!canExport}
        className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-semibold text-sm transition-all ${canExport ? "bg-white text-gray-700 border-gray-300 hover:border-[#D3423E] hover:text-[#D3423E]" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`}
      >
        <FaFileExport size={14} />
        <span className="hidden sm:inline">Exportar</span>
      </button>
      <PrincipalBUtton onClick={onNew} disabled={!canExport} icon={IoPersonAdd}>
        Nuevo Repartidor
      </PrincipalBUtton>
    </div>
  </div>
);

export default DeliveryHeader;