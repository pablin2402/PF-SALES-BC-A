import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserEdit, FaTimes, FaUser, FaUserTie, FaSave } from "react-icons/fa";
import { API_URL } from "../../config";

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between items-baseline gap-2">
    <span className="text-gray-500 flex-shrink-0">{label}:</span>
    <span className="font-bold text-gray-900 text-right truncate" title={value}>{value || "—"}</span>
  </div>
);

export const EditClientModal = ({ open, item, vendedores, onClose, onSuccess, onError }) => {
  const [data, setData] = useState(null);
  const [salesId, setSalesId] = useState("");
  const [saving, setSaving] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (item) {
      setData(item);
      setSalesId(item.sales_id?._id || "");
    }
  }, [item]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await axios.put(API_URL + "/whatsapp/client/user/id",
        {
          _id: data._id, id_owner: user,
          name: data.name, lastName: data.lastName, sales_id: salesId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess?.();
      onClose();
    } catch (e) {
      onError?.("No se pudo actualizar el cliente. Verifica los datos.");
    } finally { setSaving(false); }
  };

  if (!open || !data) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => !saving && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaUserEdit size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black">Editar cliente</h3>
                <p className="text-xs text-red-100 font-medium">{data.name} {data.lastName}</p>
              </div>
            </div>
            <button
              onClick={() => !saving && onClose()}
              className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-700 uppercase mb-1.5 flex items-center gap-1 tracking-wider">
                  <FaUser size={10} className="text-gray-400" />
                  Nombre <span className="text-[#D3423E]">*</span>
                </label>
                <input
                  type="text" value={data.name || ""}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="bg-white border border-gray-200 text-sm text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] font-medium"
                  placeholder="Nombre"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-700 uppercase mb-1.5 flex items-center gap-1 tracking-wider">
                  <FaUser size={10} className="text-gray-400" />
                  Apellido <span className="text-[#D3423E]">*</span>
                </label>
                <input
                  type="text" value={data.lastName || ""}
                  onChange={(e) => setData({ ...data, lastName: e.target.value })}
                  className="bg-white border border-gray-200 text-sm text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] font-medium"
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-700 uppercase mb-1.5 flex items-center gap-1 tracking-wider">
                <FaUserTie size={10} className="text-gray-400" />
                Vendedor asignado
              </label>
              <select
                value={salesId} onChange={(e) => setSalesId(e.target.value)}
                className="bg-white border border-gray-200 text-sm text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] font-medium"
              >
                <option value="">Sin vendedor asignado</option>
                {vendedores.map((v) => (
                  <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                ))}
              </select>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Información (solo lectura)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <SummaryRow label="Teléfono" value={data.number || "—"} />
                <SummaryRow label="Categoría" value={data.userCategory || "—"} />
                <SummaryRow label="Ciudad" value={data.region || "—"} />
                <SummaryRow label="Dirección" value={data.client_location?.direction || "—"} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onClose()} disabled={saving}
                className="flex-1 px-4 py-3 border-2 border-gray-200 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !data.name || !data.lastName}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                  saving || !data.name || !data.lastName
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#D3423E] to-red-600 hover:shadow-lg hover:scale-[1.01]"
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                    Guardando...
                  </>
                ) : (
                  <><FaSave size={12} /> Guardar cambios</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};