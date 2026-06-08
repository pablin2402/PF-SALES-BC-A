import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { getInitials, getColor, REGION_LABELS } from "../../constants/salesmenConfigs";
import { ActionsMenu } from "../../utils/Modal";

export const SalesmenCards = ({ filteredAndSorted, viewMode, onRowClick, openPasswordModal, requestToggle }) => {
  const containerClass = viewMode === "cards"
    ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "lg:hidden p-4 space-y-3";

  return (
    <div className={containerClass}>
      <AnimatePresence>
        {filteredAndSorted.map((item, idx) => (
          <motion.div key={item._id}
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: idx * 0.02 }}
            onClick={() => onRowClick(item)}
            className={`bg-white border rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] ${
              item.active ? "border-gray-200 hover:border-red-200" : "border-gray-200 opacity-75"
            }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black shadow-md ring-2 ring-white flex-shrink-0 relative ${getColor(item.fullName, item.lastName)}`}>
                {getInitials(item.fullName, item.lastName)}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${item.active ? "bg-green-500" : "bg-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{item.fullName} {item.lastName}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${item.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-green-500" : "bg-gray-400"}`} />
                  {item.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div onClick={e => e.stopPropagation()}>
                <ActionsMenu
                  onPassword={() => openPasswordModal(item)}
                  onView={() => onRowClick(item)}
                  onToggle={() => requestToggle(item)}
                  isActive={item.active}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
              {item.email && (
                <p className="flex items-center gap-2 truncate font-medium">
                  <FaEnvelope className="text-gray-400 flex-shrink-0" size={11} />
                  <span className="truncate">{item.email}</span>
                </p>
              )}
              {item.phoneNumber && (
                <p className="flex items-center gap-2 font-semibold">
                  <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
                  {item.phoneNumber}
                </p>
              )}
              {item.region && (
                <p className="flex items-center gap-2 font-semibold">
                  <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" size={11} />
                  {REGION_LABELS[item.region] || item.region}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};