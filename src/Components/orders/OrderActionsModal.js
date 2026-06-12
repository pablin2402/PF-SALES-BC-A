import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaTruck, FaBoxOpen, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { API_URL } from "../../config";

const money = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusView = ({ title, subtitle, icon, bg, onClose, reducedMotion }) => (
  <div className="flex flex-col items-center py-6">
    <motion.div
      initial={reducedMotion ? false : { scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-24 h-24 ${bg} rounded-full flex items-center justify-center mb-4`}
    >
      {icon}
    </motion.div>
    <h2 className="text-2xl font-black text-gray-900">{title}</h2>
    <p className="text-base text-gray-500 mt-1 mb-6 text-center">{subtitle}</p>
    <button
      type="button"
      onClick={onClose}
      className="px-8 py-2.5 bg-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
    >
      Cerrar
    </button>
  </div>
);

const ActionOption = ({ selected, onSelect, icon: Icon, title, subtitle, tone }) => {
  const palette = tone === "approve"
    ? { ring: "ring-emerald-500", border: "border-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600", iconBg: "bg-emerald-100" }
    : { ring: "ring-red-500", border: "border-red-500", bg: "bg-red-50", icon: "text-red-600", iconBg: "bg-red-100" };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 ${palette.ring} ${
        selected ? `${palette.border} ${palette.bg} shadow-sm` : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <span className={`w-12 h-12 rounded-full flex items-center justify-center ${selected ? palette.iconBg : "bg-gray-100"}`}>
        <Icon className={selected ? palette.icon : "text-gray-400"} size={20} aria-hidden="true" />
      </span>
      <span className={`text-base font-extrabold ${selected ? "text-gray-900" : "text-gray-600"}`}>{title}</span>
      <span className="text-xs text-gray-500 text-center leading-snug">{subtitle}</span>
    </button>
  );
};

export const OrderActionsModal = ({ open, item, onClose, onSuccess }) => {
  const reducedMotion = useReducedMotion();
  const [confirmed, setConfirmed] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!open) return;
    setConfirmed("");
    setError(false);
    setShowSuccess(false);
    setShowCancel(false);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!confirmed || saving) return;
    setSaving(true);
    setError(false);
    try {
      await axios.put(
        `${API_URL}/whatsapp/order/status/confirm/id`,
        { _id: item._id, id_owner: user, orderStatus: confirmed },
        { headers: { Authorization: `Bearer ${token}` } },
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
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setSaving(false);
    }
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
          role="dialog"
          aria-modal="true"
          aria-label="Acciones del pedido"
          initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reducedMotion ? undefined : { scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {showSuccess ? (
            <StatusView reducedMotion={reducedMotion} title="¡Pedido aprobado!" subtitle="El pedido fue aprobado correctamente" icon={<FaCheckCircle className="text-emerald-500" size={56} aria-hidden="true" />} bg="bg-emerald-100" onClose={onClose} />
          ) : showCancel ? (
            <StatusView reducedMotion={reducedMotion} title="Pedido rechazado" subtitle="El pedido fue rechazado" icon={<FaTimesCircle className="text-red-500" size={56} aria-hidden="true" />} bg="bg-red-100" onClose={onClose} />
          ) : item?.orderStatus === "created" ? (
            <>
              <h2 className="text-2xl font-black mb-1 text-center text-gray-900">Revisar pedido</h2>
              <p className="text-center text-sm text-gray-500 mb-6">Elige qué hacer con este pedido</p>

              <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-5 py-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nota</p>
                  <p className="text-base font-extrabold text-gray-900">#{item.receiveNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto</p>
                  <p className="text-base font-extrabold text-gray-900 tabular-nums">Bs. {money.format(Number(item.totalAmount) || 0)}</p>
                </div>
              </div>

              <div role="radiogroup" aria-label="Acción a realizar" className="flex gap-3 mb-6">
                <ActionOption
                  tone="approve"
                  selected={confirmed === "aproved"}
                  onSelect={() => setConfirmed("aproved")}
                  icon={FaCheck}
                  title="Aprobar"
                  subtitle="El pedido pasa a reparto"
                />
                <ActionOption
                  tone="reject"
                  selected={confirmed === "cancelled"}
                  onSelect={() => setConfirmed("cancelled")}
                  icon={FaTimes}
                  title="Rechazar"
                  subtitle="El pedido se cancela"
                />
              </div>

              {error && (
                <p role="alert" className="flex items-center justify-center gap-2 text-sm font-semibold text-red-600 mb-4">
                  <FaExclamationTriangle size={12} aria-hidden="true" />
                  No se pudo guardar. Revisa tu conexión e intenta de nuevo.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!confirmed || saving}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 ${
                    confirmed && !saving
                      ? confirmed === "aproved"
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                        : "bg-[#D3423E] hover:bg-[#bb3330] shadow-lg shadow-red-200"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {saving ? "Guardando…" : confirmed === "aproved" ? "Confirmar aprobación" : confirmed === "cancelled" ? "Confirmar rechazo" : "Selecciona una acción"}
                </button>
              </div>
            </>
          ) : item?.orderStatus === "aproved" ? (
            <StatusView reducedMotion={reducedMotion} title="Pedido aprobado" subtitle="Este pedido ya fue aprobado" icon={<FaCheckCircle className="text-emerald-500" size={56} aria-hidden="true" />} bg="bg-emerald-100" onClose={onClose} />
          ) : item?.orderStatus === "cancelled" ? (
            <StatusView reducedMotion={reducedMotion} title="Pedido rechazado" subtitle="Este pedido fue rechazado" icon={<FaTimesCircle className="text-red-500" size={56} aria-hidden="true" />} bg="bg-red-100" onClose={onClose} />
          ) : item?.orderStatus === "En Ruta" ? (
            <StatusView reducedMotion={reducedMotion} title="Pedido en ruta" subtitle="En camino al destino" icon={<FaTruck className="text-blue-500" size={56} aria-hidden="true" />} bg="bg-blue-100" onClose={onClose} />
          ) : item?.orderStatus === "deliver" ? (
            <StatusView reducedMotion={reducedMotion} title="Pedido entregado" subtitle="El pedido fue entregado" icon={<FaBoxOpen className="text-emerald-500" size={56} aria-hidden="true" />} bg="bg-emerald-100" onClose={onClose} />
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};