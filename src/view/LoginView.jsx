import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaExclamationCircle } from "react-icons/fa";
import icon from "../icons/LOGO.png";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await axios.post(API_URL + "/whatsapp/login", { email: email.trim().toLowerCase(), password });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("id_owner", response.data.usuarioDB.id_owner);
      localStorage.setItem("id_user", response.data.usuarioDB.salesMan);
      localStorage.setItem("role", response.data.usuarioDB.role);
      localStorage.setItem("region", response.data.usuarioDB.region);

      onLogin(response.data.token);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Credenciales incorrectas";
      setErrorMessage(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#D3423E] via-[#C13430] to-[#991B1B]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <motion.div
          animate={shake ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="pt-10 pb-6 px-8 text-center bg-gradient-to-b from-gray-50 to-white">
              <motion.img
                src={icon}
                alt="IMCABEZ"
                className="h-20 mx-auto mb-5 object-contain drop-shadow-sm"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              />
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bienvenido</h1>
              <p className="text-sm text-gray-500 mt-1 font-medium">Inicia sesión para continuar</p>
            </div>

            <div className="px-8 pb-8 pt-2 space-y-5">
              <div>
                <label htmlFor="email" className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="email"
                    id="email"
                    placeholder="nombre@correo.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
                    required
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-[#D3423E] focus:bg-white focus:ring-4 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-sm font-medium placeholder-gray-400 focus:outline-none focus:border-[#D3423E] focus:bg-white focus:ring-4 focus:ring-red-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <FaExclamationCircle className="text-[#D3423E] flex-shrink-0" size={14} />
                    <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading || !email || !password}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                  loading || !email || !password
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#D3423E] to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "INICIAR SESIÓN"
                )}
              </motion.button>
            </div>
          </form>

          <p className="text-center text-white/50 text-xs mt-6 font-medium">
            IMCABEZ S.R.L. · Camacho Hnos. · {new Date().getFullYear()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;