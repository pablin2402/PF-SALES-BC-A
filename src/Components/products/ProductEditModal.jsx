import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaTimes, FaBox, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { API_URL } from "../../config";

const money = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ProductEditModal = ({ open, editingProduct, onClose, onSaved }) => {
  const reducedMotion = useReducedMotion();
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!open || !editingProduct) return;
    setEditedName(editingProduct.productName ?? "");
    setEditedPrice(editingProduct.priceId?.price ?? "");
    setError(false);
    setSuccess(false);
    const onKey = (e) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, editingProduct, onClose, submitting]);

  const previousPrice = Number(editingProduct?.priceId?.price);
  const currentPrice = Number(editedPrice);
  const nameChanged = editedName.trim() !== (editingProduct?.productName ?? "").trim();
  const priceChanged = Number.isFinite(currentPrice) && currentPrice !== previousPrice;
  const isValid = editedName.trim().length > 0 && editedPrice !== "" && currentPrice > 0;
  const hasChanges = nameChanged || priceChanged;

  const handleSave = async () => {
    if (!isValid || !hasChanges || submitting || !editingProduct) return;
    setSubmitting(true);
    setError(false);
    try {
      await axios.put(
        `${API_URL}/whatsapp/product/price/id`,
        {
          productId: editingProduct._id,
          priceId: editingProduct.priceId?._id,
          newName: editedName.trim(),
          newPrice: currentPrice,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(true);
      onSaved?.();
      setTimeout(() => { onClose(); }, 1200);
    } catch (e) {
      console.error("Error al actualizar producto:", e);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && editingProduct && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !submitting && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
            initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? undefined : { scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <MdEdit size={20} className="text-[#D3423E]" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="edit-product-title" className="text-lg font-extrabold text-gray-900">Editar producto</h3>
                  <p className="text-xs text-gray-500">Actualiza nombre y precio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Cerrar"
                className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-40"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-10 px-6">
                <motion.div
                  initial={reducedMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3"
                >
                  <FaCheckCircle className="text-emerald-500" size={44} aria-hidden="true" />
                </motion.div>
                <p className="text-lg font-extrabold text-gray-900">Producto actualizado</p>
                <p className="text-sm text-gray-500 mt-1 text-center">Los cambios se guardaron correctamente.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {editingProduct.productImage && (
                  <div className="flex justify-center">
                    <img
                      src={editingProduct.productImage}
                      alt={editingProduct.productName}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="w-24 h-24 object-contain rounded-xl bg-gray-50 border border-gray-200"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="ep-name" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Nombre del producto <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
                    <input
                      id="ep-name"
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={submitting}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                      placeholder="Nombre del producto"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ep-price" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Precio (Bs.) <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold" aria-hidden="true">Bs.</span>
                    <input
                      id="ep-price"
                      type="number"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      disabled={submitting}
                      className="w-full pl-11 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl tabular-nums focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {priceChanged && Number.isFinite(previousPrice) && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Precio anterior: <strong className="text-gray-700 tabular-nums">Bs. {money.format(previousPrice)}</strong>
                    </p>
                  )}
                </div>

                {error && (
                  <p role="alert" className="flex items-center gap-2 text-sm font-semibold text-red-600">
                    <FaExclamationTriangle size={12} aria-hidden="true" />
                    No se pudo guardar. Revisa tu conexión e intenta de nuevo.
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isValid || !hasChanges || submitting}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 ${
                      !isValid || !hasChanges || submitting
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-[#D3423E] hover:bg-[#bb3330] shadow-lg shadow-red-200"
                    }`}
                  >
                    {submitting ? "Guardando…" : !hasChanges ? "Sin cambios" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};