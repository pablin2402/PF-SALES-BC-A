import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserEdit, FaPhone, FaMapMarkerAlt, FaUserTie } from "react-icons/fa";
import { getInitials, getColor } from "../../constants/clientConfig";

export const ClientsCards = ({ sortedData, viewMode, onRowClick, onEditClick }) => {
  const containerClass = viewMode === "cards"
    ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "lg:hidden p-4 space-y-3";

  return (
    <div className={containerClass}>
      <AnimatePresence>
        {sortedData.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: idx * 0.02 }}
            onClick={() => onRowClick(item)}
            className="bg-white border border-gray-200 hover:border-red-200 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black shadow-md ring-2 ring-white flex-shrink-0 ${getColor(item.name, item.lastName)}`}>
                {getInitials(item.name, item.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {item.name} {item.lastName}
                </p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {item.userCategory && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-200">
                      {item.userCategory}
                    </span>
                  )}
                  {item.region && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                      {item.region}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onEditClick(item); }}
                className="p-2 text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <FaUserEdit size={14} />
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              {item.number && (
                <p className="flex items-center gap-2 font-semibold">
                  <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
                  {item.number}
                </p>
              )}
              {item.client_location?.direction && (
                <p className="flex items-start gap-2">
                  <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" size={11} />
                  <span className="line-clamp-2">{item.client_location.direction}</span>
                </p>
              )}
              {item.sales_id ? (
                <p className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                  <FaUserTie className="text-gray-400 flex-shrink-0" size={11} />
                  <span className="truncate font-bold text-gray-700">
                    {item.sales_id.fullName} {item.sales_id.lastName}
                  </span>
                </p>
              ) : (
                <p className="pt-2 mt-2 border-t border-gray-100">
                  <span className="text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full font-black">
                    SIN VENDEDOR ASIGNADO
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};