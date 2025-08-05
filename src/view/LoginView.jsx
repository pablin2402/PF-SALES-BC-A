import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from 'react-router-dom';
import icon from "../icons/LOGO.png";
import AlertModalChrome from "../Components/modal/AlertModalChrome";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showBrowserAlert, setShowBrowserAlert] = useState(false);
  const [blocked, setBlocked] = useState(false); 
  const isChrome = () => {
    const userAgent = window.navigator.userAgent;
    const isChromium = window.chrome !== null && window.chrome !== undefined;
    const isEdge = userAgent.includes("Edg");
    const isOpera = userAgent.includes("OPR");
    const isBrave = false; // Brave puede ser considerado Chromium, pero es complicado detectar

    return (
      isChromium &&
      !isEdge &&
      !isOpera &&
      !isBrave &&
      /Chrome/.test(userAgent) &&
      !/Chromium/.test(userAgent)
    );
  };
  useEffect(() => {
    if (!isChrome()) {
      setShowBrowserAlert(true);
      setBlocked(true);
    }
  }, []);
  const handleCloseModal = () => {
    setShowBrowserAlert(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await axios.post(API_URL + "/whatsapp/login", {
        email,
        password,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("id_owner", response.data.usuarioDB.id_owner);
      localStorage.setItem("id_user", response.data.usuarioDB.salesMan);
      localStorage.setItem("role", response.data.usuarioDB.role);
      localStorage.setItem("region", response.data.usuarioDB.region);

      onLogin(response.data.token);
      navigate("/");

    } catch (err) {
      const message = err.response?.data?.message || "Usuario o contraseña incorrectos";
      setErrorMessage(message);
    }
  };

  return (
    <>
          <AlertModalChrome show={showBrowserAlert} onClose={handleCloseModal} />

     <div className="min-h-screen flex items-center justify-center bg-[#D3423E] px-4">
     <form
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="flex justify-center">
            <img src={icon} alt="Logo" className="h-24 sm:h-32 object-contain" />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 text-gray-700 text-sm font-medium">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              placeholder="nombre@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={blocked}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-gray-700 text-sm font-medium">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={blocked}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500"
            />
          </div>
          {errorMessage && (
            <div className="text-red-600 text-sm font-semibold text-center">{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={blocked}
            className="w-full py-2 bg-[#D3423E] text-white font-semibold rounded-xl hover:bg-[#bb2c29] transition-colors disabled:opacity-50"
          >
            INICIAR SESIÓN
          </button>
        </form>
  </div>
    </>
   
  );
};

export default Login;
