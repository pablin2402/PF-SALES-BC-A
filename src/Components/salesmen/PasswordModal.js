import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaKey, FaEnvelope, FaTimes, FaEye, FaEyeSlash, FaExclamationTriangle } from "react-icons/fa";
import { API_URL } from "../../config";
import { PasswordStrength } from "../../utils/Modal";

export const PasswordModal = ({ open, salesman, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({ email: salesman?.email || "", newPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.email || !formData.newPassword) { onError("Completa todos los campos"); return; }
    if (formData.newPassword.length < 6) { onError("Mínimo 6 caracteres"); return; }
    setSubmitting(true);
    try {
      await axios.put(API_URL + "/whatsapp/password",
        { email: formData.email, newPassword: formData.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData({ email: "", newPassword: "" });
      onSuccess();
      onClose();
    } catch (e) {
      onError("No se pudo cambiar la contraseña. Verifica el correo.");
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FaKey size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black">Cambiar contraseña</h3>
                {salesman && <p className="text-xs text-red-100 font-medium">{salesman.fullName} {salesman.lastName}</p>}
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                Correo del vendedor <span className="text-[#D3423E]">*</span>
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="email" name="email" value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 font-medium"
                  placeholder="ejemplo@email.com" required />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                Nueva contraseña <span className="text-[#D3423E]">*</span>
              </label>
              <div className="relative">
                <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type={showPassword ? "text" : "password"} name="newPassword" value={formData.newPassword}
                  onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full pl-9 pr-10 py-3 text-sm border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 font-medium"
                  placeholder="Mínimo 6 caracteres" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {formData.newPassword && <div className="mt-2"><PasswordStrength password={formData.newPassword} /></div>}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
              <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={12} />
              <span><strong>Importante:</strong> El vendedor deberá iniciar sesión con esta nueva contraseña.</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} disabled={submitting}
                className="flex-1 px-4 py-3 border-2 border-gray-200 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={submitting}
                className={`flex-1 px-4 py-3 rounded-xl font-black text-sm text-white transition-all flex items-center justify-center gap-2 ${
                  submitting ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-[#D3423E] to-red-600 hover:shadow-lg"
                }`}>
                {submitting ? (
                  <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" /> Cambiando...</>
                ) : "Cambiar contraseña"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};