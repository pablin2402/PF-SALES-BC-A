import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhone, FaMapMarkerAlt, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { getInitials, getColor, REGION_LABELS } from "../../constants/salesmenConfigs";
import { ActionsMenu } from "../../utils/Modal";

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
  return sortOrder === "asc" ? <FaSortUp className="text-[#D3423E]" size={10} /> : <FaSortDown className="text-[#D3423E]" size={10} />;
};

export const SalesmenTable = ({
  filteredAndSorted, sortBy, sortOrder, onSort,
  togglingId, requestToggle, openPasswordModal,
  onRowClick,
}) => (
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 border-b-2 border-gray-200">
        <tr>
          <th className="px-6 py-3.5"></th>
          {[
            { field: "name", label: "Nombre" },
            { field: "email", label: "Correo" },
          ].map(h => (
            <th key={h.field} onClick={() => onSort(h.field)}
              className="px-4 py-3.5 font-black tracking-wider cursor-pointer hover:text-[#D3423E] select-none transition-colors">
              <div className="flex items-center gap-1">{h.label} <SortIcon field={h.field} sortBy={sortBy} sortOrder={sortOrder} /></div>
            </th>
          ))}
          <th className="px-4 py-3.5 font-black tracking-wider">Teléfono</th>
          <th onClick={() => onSort("region")}
            className="px-4 py-3.5 font-black tracking-wider cursor-pointer hover:text-[#D3423E] select-none transition-colors">
            <div className="flex items-center gap-1">Ciudad <SortIcon field="region" sortBy={sortBy} sortOrder={sortOrder} /></div>
          </th>
          <th className="px-4 py-3.5 font-black tracking-wider text-center">Estado</th>
          <th className="px-4 py-3.5"></th>
        </tr>
      </thead>
      <tbody>
        <AnimatePresence>
          {filteredAndSorted.map((item, idx) => (
            <motion.tr key={item._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.02 }}
              onClick={() => onRowClick(item)}
              className="border-b border-gray-100 hover:bg-red-50/20 transition-colors cursor-pointer">
              <td className="px-6 py-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black shadow-md ring-2 ring-white relative ${getColor(item.fullName, item.lastName)}`}>
                  {getInitials(item.fullName, item.lastName)}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${item.active ? "bg-green-500" : "bg-gray-400"}`} />
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-bold text-gray-900">{item.fullName} {item.lastName}</p>
              </td>
              <td className="px-4 py-4">
                <a href={`mailto:${item.email}`} onClick={e => e.stopPropagation()}
                  className="text-gray-600 hover:text-[#D3423E] transition-colors text-sm font-medium">
                  {item.email || "—"}
                </a>
              </td>
              <td className="px-4 py-4 text-gray-700">
                {item.phoneNumber ? (
                  <a href={`tel:${item.phoneNumber}`} onClick={e => e.stopPropagation()}
                    className="hover:text-[#D3423E] transition-colors flex items-center gap-1 text-xs font-semibold">
                    <FaPhone size={10} className="text-gray-400" /> {item.phoneNumber}
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-4">
                {item.region ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-200">
                    <FaMapMarkerAlt size={9} /> {REGION_LABELS[item.region] || item.region}
                  </span>
                ) : <span className="text-gray-400 text-xs">—</span>}
              </td>
              <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                <label className={`relative inline-flex items-center ${togglingId === item._id ? "cursor-wait opacity-50" : "cursor-pointer"}`}>
                  <input type="checkbox" className="sr-only peer" checked={item.active}
                    disabled={togglingId === item._id} onChange={() => requestToggle(item)} />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-300 relative">
                    <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5 shadow-sm" />
                  </div>
                </label>
              </td>
              <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                <ActionsMenu
                  onPassword={() => openPasswordModal(item)}
                  onView={() => onRowClick(item)}
                  onToggle={() => requestToggle(item)}
                  isActive={item.active}
                />
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  </div>
);