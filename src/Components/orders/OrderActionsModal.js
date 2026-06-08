import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaTruck, FaBoxOpen } from "react-icons/fa";
import { API_URL } from "../../config";

const StatusView = ({ title, subtitle, icon, bg, onClose }) => (
  <div className="flex flex-col items-center py-6">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-24 h-24 ${bg} rounded-full flex items-center justify-center shadow-lg mb-4`}
    >
      {icon}
    </motion.div>
    <h2 className="text-2xl font-black text-gray-800">{title}</h2>
    <p className="text-gray-600 mt-1 mb-6">{subtitle}</p>
    <button onClick={onClose} className="px-6 py-2.5 border-2 border-[#D3423E] bg-white rounded-xl text-[#D3423E] font-bold hover:bg-red-50">
      Cerrar
    </button>
  </div>
);

export const OrderActionsModal = ({ open, item, onClose, onSuccess }) => {
  const [confirmed, setConfirmed] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleSubmit = async () => {
    try {
      await axios.put(API_URL + "/whatsapp/order/status/confirm/id",
        { _id: item._id, id_owner: user, orderStatus: confirmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (confirmed === "aproved") setShowSuccess(true);
      else setShowCancel(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
        setShowCancel(false);
        setConfirmed("");
      }, 1800);
    } catch (e) { console.error(e); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {showSuccess ? (
            <StatusView title="¡Pedido Aprobado!" subtitle="El pedido fue aprobado correctamente" icon={<FaCheckCircle className="text-green-500" size={60} />} bg="bg-green-100" onClose={onClose} />
          ) : showCancel ? (
            <StatusView title="Pedido Rechazado" subtitle="El pedido fue rechazado" icon={<FaTimesCircle className="text-red-500" size={60} />} bg="bg-red-100" onClose={onClose} />
          ) : item?.orderStatus === "created" ? (
            <>
              <h2 className="text-2xl font-black mb-2 text-center text-gray-800">Aprobar Pedido</h2>
              <p className="text-center text-sm text-gray-500 mb-6">Confirma la acción a realizar</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Nota</label>
                  <input type="text" disabled value={item.receiveNumber} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Monto</label>
                  <input type="text" disabled value={`Bs. ${Number(item.totalAmount).toFixed(2)}`} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-semibold" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-1.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Acción</label>
                  <select value={confirmed} onChange={(e) => setConfirmed(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 font-semibold">
                    <option value="">Seleccione una opción</option>
                    <option value="aproved">✓ Aprobar pedido</option>
                    <option value="cancelled">✗ Rechazar pedido</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSubmit} disabled={!confirmed} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all ${confirmed ? "bg-gradient-to-r from-[#D3423E] to-red-600 hover:shadow-lg" : "bg-gray-300 cursor-not-allowed"}`}>Guardar</button>
              </div>
            </>
          ) : item?.orderStatus === "aproved" ? (
            <StatusView title="Pedido aprobado" subtitle="Este pedido ya fue aprobado" icon={<FaCheckCircle className="text-green-500" size={60} />} bg="bg-green-100" onClose={onClose} />
          ) : item?.orderStatus === "cancelled" ? (
            <StatusView title="Pedido rechazado" subtitle="Este pedido fue rechazado" icon={<FaTimesCircle className="text-red-500" size={60} />} bg="bg-red-100" onClose={onClose} />
          ) : item?.orderStatus === "En Ruta" ? (
            <StatusView title="Pedido en ruta" subtitle="En camino al destino" icon={<FaTruck className="text-blue-500" size={60} />} bg="bg-blue-100" onClose={onClose} />
          ) : item?.orderStatus === "deliver" ? (
            <StatusView title="Pedido entregado" subtitle="El pedido fue entregado" icon={<FaBoxOpen className="text-green-500" size={60} />} bg="bg-green-100" onClose={onClose} />
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};