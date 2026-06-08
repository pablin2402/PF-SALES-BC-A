import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export const ResultModal = ({ open, type, title, message, onClose }) => {
  if (!open) return null;
  const isSuccess = type === "success";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ${
            isSuccess ? "bg-gradient-to-br from-green-100 to-emerald-200 ring-green-50" : "bg-gradient-to-br from-red-100 to-red-200 ring-red-50"
          }`}>
            {isSuccess
              ? <FaCheckCircle className="text-green-500 text-5xl" />
              : <FaTimesCircle className="text-red-500 text-5xl" />}
          </div>
          <h2 className={`text-xl font-black mb-2 ${isSuccess ? "text-green-700" : "text-red-700"}`}>
            {title}
          </h2>
          <p className="text-sm text-gray-600 mb-5 font-medium">{message}</p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-3 rounded-xl font-bold text-sm text-white transition-all ${
              isSuccess
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg"
            }`}
          >
            Aceptar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};