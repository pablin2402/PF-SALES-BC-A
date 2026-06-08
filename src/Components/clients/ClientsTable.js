import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserEdit, FaTag, FaPhone, FaMapMarkerAlt, FaSort, FaSortUp, FaSortDown,
} from "react-icons/fa";
import { getInitials, getColor } from "../../constants/clientConfig";

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
  return sortOrder === "asc"
    ? <FaSortUp className="text-[#D3423E]" size={10} />
    : <FaSortDown className="text-[#D3423E]" size={10} />;
};

const SortableTh = ({ field, label, sortBy, sortOrder, onSort }) => (
  <th
    className="px-4 py-3.5 font-black tracking-wider cursor-pointer hover:text-[#D3423E] select-none transition-colors"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">{label} <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} /></div>
  </th>
);

export const ClientsTable = ({
  sortedData, sortBy, sortOrder, onSort, onRowClick, onEditClick,
}) => (
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 border-b-2 border-gray-200">
        <tr>
          <th className="px-6 py-3.5"></th>
          <SortableTh field="name" label="Nombre" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <SortableTh field="category" label="Categoría" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <th className="px-4 py-3.5 font-black tracking-wider">Dirección</th>
          <th className="px-4 py-3.5 font-black tracking-wider">Teléfono</th>
          <SortableTh field="salesman" label="Vendedor" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <SortableTh field="region" label="Ciudad" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <th className="px-4 py-3.5"></th>
        </tr>
      </thead>
      <tbody>
        <AnimatePresence>
          {sortedData.map((item, idx) => (
            <motion.tr
              key={item._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.02 }}
              onClick={() => onRowClick(item)}
              className="border-b border-gray-100 hover:bg-red-50/30 transition-colors cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black shadow-md ring-2 ring-white ${getColor(item.name, item.lastName)}`}>
                  {getInitials(item.name, item.lastName)}
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-gray-900">{item.name} {item.lastName}</p>
              </td>
              <td className="px-4 py-4">
                {item.userCategory ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-200">
                    <FaTag size={9} /> {item.userCategory}
                  </span>
                ) : <span className="text-gray-400 text-xs">—</span>}
              </td>
              <td className="px-4 py-4 text-gray-700 max-w-[200px]">
                <p className="truncate text-xs" title={item.client_location?.direction}>
                  {item.client_location?.direction || "—"}
                </p>
              </td>
              <td className="px-4 py-4 text-gray-700">
                {item.number ? (
                  <a
                    href={`tel:${item.number}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-[#D3423E] transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <FaPhone size={10} className="text-gray-400" /> {item.number}
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-4">
                {item.sales_id ? (
                  <span className="inline-flex items-center gap-2 text-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-black ring-2 ring-white shadow-sm ${getColor(item.sales_id.fullName, item.sales_id.lastName)}`}>
                      {getInitials(item.sales_id.fullName, item.sales_id.lastName)}
                    </div>
                    <span className="text-gray-700 font-semibold truncate max-w-[120px]">
                      {item.sales_id.fullName} {item.sales_id.lastName}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full font-black">
                    SIN ASIGNAR
                  </span>
                )}
              </td>
              <td className="px-4 py-4">
                {item.region ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-200">
                    <FaMapMarkerAlt size={9} /> {item.region}
                  </span>
                ) : <span className="text-gray-400 text-xs">—</span>}
              </td>
              <td className="px-4 py-4">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditClick(item); }}
                  className="p-2.5 text-[#D3423E] hover:bg-red-50 rounded-xl transition-colors"
                  title="Editar cliente"
                >
                  <FaUserEdit size={16} />
                </button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  </div>
);