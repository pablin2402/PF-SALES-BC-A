import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEllipsisV, FaEye, FaToggleOn, FaToggleOff } from "react-icons/fa";

const ActionsMenu = ({ onView, onToggle, isActive }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FaEllipsisV className="text-gray-600" size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { onView(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaEye className="text-blue-500" size={12} /> Ver detalles
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={(e) => { onToggle(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              {isActive
                ? <><FaToggleOff className="text-red-500" size={14} /> Desactivar</>
                : <><FaToggleOn className="text-green-500" size={14} /> Activar</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActionsMenu;