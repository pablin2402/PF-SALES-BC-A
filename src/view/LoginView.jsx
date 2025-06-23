import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from 'react-router-dom';
import icon from "../icons/LOGO.png";
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const response = await axios.post(API_URL + "/whatsapp/login", {
        email,
        password,
      });
      console.log(response)
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("id_owner", response.data.usuarioDB.id_owner);
      localStorage.setItem("id_user", response.data.usuarioDB.salesMan);

      onLogin(response.data.token);
      navigate("/");

    } catch (err) {
      const message = err.response?.data?.message || "Usuario o contraseña incorrectos";
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D3423E] px-4">
    <form
      className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center">
        <img
          src={icon}
          alt="Logo"
          className="h-24 sm:h-32 object-contain"
        />
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
          className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500"
        />
      </div>
      {errorMessage && (
        <div className="text-red-600 text-sm font-semibold text-center">{errorMessage}</div>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-[#D3423E] text-white font-semibold rounded-xl hover:bg-[#bb2c29] transition-colors"
      >
        INICIAR SESIÓN
      </button>
    </form>
  </div>
  );
};

export default Login;
