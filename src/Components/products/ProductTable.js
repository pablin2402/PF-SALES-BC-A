import React from "react";
import { FaImage, FaFire, FaPercent, FaTags, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { FALLBACK_IMAGE } from "../../constants/productConfig";

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
  return sortOrder === "asc"
    ? <FaSortUp className="text-[#D3423E]" size={10} />
    : <FaSortDown className="text-[#D3423E]" size={10} />;
};

export const ProductTable = ({ sortedData, sortBy, sortOrder, onSort, onEdit, onImageClick }) => (
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 border-b-2 border-gray-200">
        <tr>
          <th className="px-4 py-3.5"></th>
          {[
            { field: "name", label: "Producto" },
            { field: "price", label: "Precio" },
          ].map((h) => (
            <th
              key={h.field}
              className="px-4 py-3.5 font-black tracking-wider cursor-pointer hover:text-[#D3423E] select-none transition-colors"
              onClick={() => onSort(h.field)}
            >
              <div className="flex items-center gap-1">{h.label} <SortIcon field={h.field} sortBy={sortBy} sortOrder={sortOrder} /></div>
            </th>
          ))}
          <th className="px-4 py-3.5 font-black tracking-wider text-center">Oferta</th>
          <th className="px-4 py-3.5 font-black tracking-wider text-center">Descuento</th>
          <th
            className="px-4 py-3.5 font-black tracking-wider cursor-pointer hover:text-[#D3423E] select-none transition-colors"
            onClick={() => onSort("category")}
          >
            <div className="flex items-center gap-1">Categoría <SortIcon field="category" sortBy={sortBy} sortOrder={sortOrder} /></div>
          </th>
          <th className="px-4 py-3.5"></th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item) => (
          <tr key={item._id} className="border-b border-gray-100 hover:bg-red-50/20 transition-colors">
            <td className="px-4 py-3.5">
              {item.productImage ? (
                <img
                  src={item.productImage} alt={item.productName}
                  className="w-12 h-12 object-contain rounded-xl bg-gray-50 cursor-pointer hover:scale-110 transition-transform shadow-sm border border-gray-100"
                  onClick={() => onImageClick(item)}
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FaImage className="text-gray-300" size={16} />
                </div>
              )}
            </td>
            <td className="px-4 py-3.5">
              <p className="font-bold text-gray-900">{item.productName || "Sin nombre"}</p>
            </td>
            <td className="px-4 py-3.5">
              <span className="font-black text-gray-900">
                {item.priceId?.price ? `Bs. ${Number(item.priceId.price).toFixed(2)}` : "N/A"}
              </span>
            </td>
            <td className="px-4 py-3.5 text-center">
              {item.priceId?.offerPrice ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black border border-orange-200">
                  <FaFire size={9} /> Bs. {item.priceId.offerPrice}
                </span>
              ) : <span className="text-gray-300">—</span>}
            </td>
            <td className="px-4 py-3.5 text-center">
              {item.priceId?.discount && item.priceId.discount !== "0%" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black border border-green-200">
                  <FaPercent size={9} /> {item.priceId.discount}
                </span>
              ) : <span className="text-gray-300">—</span>}
            </td>
            <td className="px-4 py-3.5">
              {item.categoryId?.categoryName ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-200">
                  <FaTags size={9} /> {item.categoryId.categoryName}
                </span>
              ) : <span className="text-gray-400 text-xs">Sin categoría</span>}
            </td>
            <td className="px-4 py-3.5">
              <button
                onClick={() => onEdit(item)}
                className="p-2.5 text-[#D3423E] hover:bg-red-50 rounded-xl transition-colors"
                title="Editar"
              >
                <MdEdit size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);