import React, { useEffect, useState } from "react";
import {
   FaEllipsisV, FaKey, FaCheckCircle, FaTimesCircle, FaEye,
  FaToggleOn, FaToggleOff, FaExclamationTriangle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
const ActionsMenu = ({ onPassword, onView, onToggle, isActive }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
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
            className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { onView(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaEye className="text-blue-500" size={12} /> Ver detalles
            </button>
            <button
              onClick={(e) => { onPassword(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FaKey className="text-yellow-500" size={12} /> Cambiar contraseña
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={(e) => { onToggle(e); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              {isActive ? (
                <><FaToggleOff className="text-red-500" size={14} /> Desactivar</>
              ) : (
                <><FaToggleOn className="text-green-500" size={14} /> Activar</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte", "Excelente"];
  const colors = ["bg-red-500", "bg-red-400", "bg-yellow-400", "bg-yellow-500", "bg-green-400", "bg-green-500"];

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-500 font-bold w-16 text-right">
        {labels[strength]}
      </span>
    </div>
  );
};

const ConfirmModal = ({ title, message, confirmText, confirmColor = "red", loading, onCancel, onConfirm }) => {
  const colorClasses = confirmColor === "red"
    ? "bg-[#D3423E] hover:bg-red-700"
    : "bg-green-600 hover:bg-green-700";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FaExclamationTriangle className="text-[#D3423E]" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 ${loading ? "bg-gray-300 cursor-not-allowed" : colorClasses}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ResultModal = ({ type, title, message, onClose }) => {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? "bg-green-100" : "bg-red-100"}`}>
          {isSuccess ? (
            <FaCheckCircle className="text-green-500 text-5xl" />
          ) : (
            <FaTimesCircle className="text-red-500 text-5xl" />
          )}
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isSuccess ? "text-green-700" : "text-red-700"}`}>
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <button
          onClick={onClose}
          className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${isSuccess ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
        >
          Aceptar
        </button>
      </motion.div>
    </motion.div>
  );
};

export {ActionsMenu, PasswordStrength, ConfirmModal, ResultModal};