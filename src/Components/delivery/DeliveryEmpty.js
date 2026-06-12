import React from "react";
import { FaMotorcycle } from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";

const DeliveryEmpty = ({ searchTerm, onCreate }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <FaMotorcycle className="text-gray-300 text-3xl" />
    </div>
    <p className="text-gray-700 font-semibold">Sin repartidores</p>
    <p className="text-sm text-gray-500 mt-1">
      {searchTerm ? "Intenta ajustar tu búsqueda" : "Agrega tu primer repartidor"}
    </p>
    {!searchTerm && (
      <button
        onClick={onCreate}
        className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <IoPersonAdd /> Agregar repartidor
      </button>
    )}
  </div>
);

export default DeliveryEmpty;