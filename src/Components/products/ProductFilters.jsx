import React from "react";
import { FaTags, FaTimes } from "react-icons/fa";
import { FiList, FiGrid } from "react-icons/fi";
import TextInputFilter from "../LittleComponents/TextInputFilter";

export const ProductFilters = ({
  searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
  categoriesList, viewMode, setViewMode, setPage, fetchProducts,
}) => (
  <div className="p-5 border-b border-gray-200 bg-gradient-to-b from-gray-50/50 to-white flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
    <div className="flex flex-col sm:flex-row gap-2 flex-1">
      <div className="flex-1 max-w-md">
        <TextInputFilter
          value={searchTerm}
          onChange={setSearchTerm}
          onEnter={() => fetchProducts(1)}
          placeholder="Buscar producto..."
        />
      </div>
      <div className="relative">
        <FaTags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="pl-9 pr-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm hover:border-gray-300"
        >
          <option value="">Todas las categorías</option>
          {categoriesList.map((c) => (
            <option key={c._id} value={c._id}>{c.categoryName}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {selectedCategory && (
        <span className="bg-gradient-to-r from-[#D3423E] to-red-600 text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm">
          {categoriesList.find((c) => c._id === selectedCategory)?.categoryName || "Categoría"}
          <button onClick={() => setSelectedCategory("")} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
            <FaTimes size={10} />
          </button>
        </span>
      )}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shadow-inner">
        <button
          onClick={() => setViewMode("table")}
          className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          title="Tabla"
        >
          <FiList size={16} />
        </button>
        <button
          onClick={() => setViewMode("cards")}
          className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "cards" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          title="Tarjetas"
        >
          <FiGrid size={16} />
        </button>
      </div>
    </div>
  </div>
);