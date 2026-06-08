import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheckCircle, FaTimesCircle, FaReceipt, FaUser, FaDollarSign,
  FaCalendarAlt, FaImage, FaShieldAlt, FaCheck, FaTimes, FaLink,
} from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import { truncateHash } from "../../constants/paymentConfig";

const InfoField = ({ icon, label, value, highlight, danger }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-gray-400 text-xs">{icon}</span>
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{label}</p>
    </div>
    <p className={`text-sm font-bold ${danger ? "text-[#D3423E]" : highlight ? "text-green-700" : "text-gray-900"}`}>
      {value}
    </p>
  </div>
);

export const PaymentDetailModal = ({ open, item, onClose, onUpdateStatus, verifyOnChain }) => {
  const [confirmed, setConfirmed] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);
  const [verifyingTx, setVerifyingTx] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (e) {}
  };

  const handleVerify = async () => {
    setVerifyingTx(true);
    setVerifyResult(null);
    try {
      const result = await verifyOnChain(item.txHash);
      setVerifyResult(result);
    } catch (e) {
      setVerifyResult({ exists: false, error: e.message });
    } finally { setVerifyingTx(false); }
  };

  const handleSave = async () => {
    if (!confirmed) return;
    setIsProcessing(true);
    try {
      await onUpdateStatus(item._id, item.orderId, confirmed);
      onClose();
      setConfirmed(null);
    } catch (e) {} finally { setIsProcessing(false); }
  };

  if (!open || !item) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between sticky top-0 z-10 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-black">
                  {item.paymentStatus === "paid" ? "Verificación de pago" : "Detalles del pago"}
                </h3>
                <p className="text-xs text-red-100 mt-0.5 font-medium">Nota #{item.orderId?.receiveNumber}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoField icon={<FaReceipt />} label="Número de nota" value={`#${item.orderId?.receiveNumber}`} />
                <InfoField icon={<FaDollarSign />} label="Monto pagado" value={`Bs. ${Number(item.total).toFixed(2)}`} highlight />
                <InfoField icon={<FaUser />} label="Cliente" value={`${item.id_client?.name} ${item.id_client?.lastName}`} />
                <InfoField
                  icon={<FaCalendarAlt />} label="Fecha de pago"
                  value={item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                />
                <InfoField icon={<FaDollarSign />} label="Deuda a la fecha" value={item.debt !== undefined ? `Bs. ${item.debt.toFixed(2)}` : "—"} danger={item.debt > 0} />
                <InfoField icon={<FaDollarSign />} label="Monto total" value={`Bs. ${Number(item.orderId?.totalAmount || 0).toFixed(2)}`} />
              </div>

              {item.txHash && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-5 text-white shadow-xl"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                          <h3 className="font-black tracking-wide">VERIFICADO EN POLYGON</h3>
                        </div>
                        <p className="text-sm text-purple-100">Pago registrado públicamente on-chain</p>
                      </div>
                      <FaCheckCircle className="text-3xl text-green-300" />
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-[11px] uppercase text-purple-200 font-black mb-1">Transaction Hash</p>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm break-all">{item.txHash}</p>
                          <button
                            onClick={() => copyToClipboard(item.txHash)}
                            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black whitespace-nowrap transition-colors"
                          >
                            {copiedHash === item.txHash ? "✓ Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {item.blockNumber && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[11px] uppercase text-purple-200 font-black mb-1">Bloque</p>
                            <p className="font-mono text-sm">#{Number(item.blockNumber).toLocaleString()}</p>
                          </div>
                        )}
                        {item.contractAddress && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[11px] uppercase text-purple-200 font-black mb-1">Contrato</p>
                            <p className="font-mono text-xs break-all">{truncateHash(item.contractAddress, 6, 4)}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleVerify} disabled={verifyingTx}
                        className="w-full bg-white/20 hover:bg-white/30 transition-all rounded-xl py-2.5 font-black flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {verifyingTx ? (
                          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Verificando...</>
                        ) : (
                          <><FaShieldAlt size={12} /> Verificar autenticidad en Polygon</>
                        )}
                      </button>
                      {verifyResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className={`rounded-xl p-3 text-sm ${verifyResult.exists ? "bg-green-500/20 border border-green-400/30" : "bg-red-500/20 border border-red-400/30"}`}
                        >
                          {verifyResult.exists ? (
                            <>
                              <p className="font-black flex items-center gap-2 mb-1"><FaCheckCircle className="text-green-300" /> TX confirmada on-chain</p>
                              <p className="text-xs text-purple-100">Status: <span className="font-mono">{verifyResult.status === 1 ? "Exitosa" : "Fallida"}</span></p>
                              <p className="text-xs text-purple-100">Bloque: <span className="font-mono">#{verifyResult.blockNumber?.toLocaleString()}</span></p>
                            </>
                          ) : (
                            <p className="font-black flex items-center gap-2"><FaTimesCircle className="text-red-300" /> No se pudo confirmar (intenta de nuevo)</p>
                          )}
                        </motion.div>
                      )}
                      <a
                        href={`https://polygonscan.com/tx/${item.txHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="w-full mt-1 bg-white text-purple-700 hover:bg-purple-50 transition-all rounded-xl py-3 font-black flex items-center justify-center gap-2"
                      >
                        Ver en PolygonScan <FiExternalLink />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {item.saleImage && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FaImage size={11} className="text-gray-500" />
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Comprobante</label>
                  </div>
                  <div
                    onClick={() => setShowImageModal(true)}
                    className="relative rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-[#D3423E] transition-colors group"
                  >
                    <img src={item.saleImage} alt="Recibo" className="w-full max-h-60 object-contain bg-gray-50" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 bg-black/50 px-3 py-1 rounded-full text-xs font-black">
                        Ver imagen completa
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {item.paymentStatus === "paid" && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#D3423E] to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-black">?</span>
                    </div>
                    <p className="text-sm font-black text-gray-800">¿Validar este pago?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: "confirmado", icon: FaCheck, label: "Confirmar", sub: "Aprobar el pago", active: "border-green-500 bg-green-500 text-white", icon_active: "bg-white/20", icon_inactive: "bg-green-100 text-green-600" },
                      { val: "rechazado", icon: FaTimes, label: "Rechazar", sub: "Denegar el pago", active: "border-[#D3423E] bg-[#D3423E] text-white", icon_active: "bg-white/20", icon_inactive: "bg-red-100 text-[#D3423E]" },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = confirmed === opt.val;
                      return (
                        <button
                          key={opt.val}
                          onClick={() => setConfirmed(opt.val)}
                          className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            isSelected ? opt.active + " shadow-lg" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <FaCheck size={8} className={opt.val === "confirmado" ? "text-green-500" : "text-[#D3423E]"} />
                            </div>
                          )}
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isSelected ? opt.icon_active : opt.icon_inactive}`}>
                            <Icon size={18} />
                          </div>
                          <span className="text-sm font-black">{opt.label}</span>
                          <span className={`text-[10px] ${isSelected ? "opacity-80" : "text-gray-400"}`}>{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                  {confirmed && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 text-xs font-bold text-center px-3 py-2 rounded-lg ${
                        confirmed === "confirmado" ? "bg-green-100 text-green-700" : "bg-red-100 text-[#D3423E]"
                      }`}
                    >
                      {confirmed === "confirmado" ? "✓ El pago será marcado como confirmado" : "✗ El pago será marcado como rechazado"}
                    </motion.p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {item.paymentStatus === "paid" ? (
                  <>
                    <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-200 bg-white rounded-xl text-gray-700 font-black text-sm hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave} disabled={!confirmed || isProcessing}
                      className={`flex-1 px-4 py-3 rounded-xl font-black text-sm text-white transition-all ${
                        !confirmed || isProcessing ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-[#D3423E] to-red-600 hover:shadow-lg"
                      }`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...
                        </span>
                      ) : "Guardar"}
                    </button>
                  </>
                ) : (
                  <button onClick={onClose} className="w-full px-4 py-3 border-2 border-[#D3423E] bg-white rounded-xl text-[#D3423E] font-black text-sm hover:bg-red-50">
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showImageModal && item?.saleImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl w-full">
              <img src={item.saleImage} alt="Comprobante" className="w-full max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
              <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 shadow-xl">
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};