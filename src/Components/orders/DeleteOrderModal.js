import React from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrash, FaExclamationCircle } from "react-icons/fa";
import { API_URL } from "../../config";

export const DeleteOrderModal = ({ item, onClose, onSuccess }) => {
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/whatsapp/order/id`, {
        data: { _id: item._id, id_owner: user },
        headers: { Authorization: `Bearer ${token}` },
      });
      onSuccess?.();
      onClose();
    } catch (e) { console.error(e); }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-50">
            <FaTrash className="text-[#D3423E] text-2xl" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">¿Eliminar pedido?</h2>
          <p className="text-sm text-gray-600 mb-6">Esta acción no se puede deshacer. ¿Estás seguro?</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
              Cancelar
            </button>
            <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D3423E] to-red-600 text-white font-bold rounded-xl hover:shadow-lg">
              Sí, eliminar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PaymentWarningModal = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-amber-50">
            <FaExclamationCircle className="text-amber-600 text-3xl" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">No se puede eliminar</h3>
          <p className="text-sm text-gray-600 mb-6">Este pedido ya tiene pagos registrados y no puede ser eliminado.</p>
          <button onClick={onClose} className="w-full px-5 py-3 font-bold text-white bg-gradient-to-r from-[#D3423E] to-red-600 rounded-xl hover:shadow-lg">
            Entendido
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};