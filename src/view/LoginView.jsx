import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from 'react-router-dom';

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
  
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("id_owner", response.data.usuarioDB.id_owner);
  
      onLogin(response.data.token);
      navigate("/");

    } catch (err) {
      const message = err.response?.data?.message || "Usuario o contraseña incorrectos";
      setErrorMessage(message);     }
  };
  
  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
     
      <form class="space-y-4 md:space-y-6 border p-5 rounded rounded-lg border-1 border-gray-400"onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold text-gray-800 text-center">Iniciar sesión</h2>

                  {errorMessage && (
                    <div className="text-red-600 text-sm font-medium text-center">{errorMessage}</div>
                  )}
                  <div>
                      <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Correo electrónico
                      </label>
                      <input 
                        type="email" 
                        name="email" 
                        id="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        placeholder="name@company.com" 
                        required=""/>
                  </div>
                  <div>
                      <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Contraseña
                      </label>
                      <input 
                        type="password" 
                        name="password" 
                        id="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                        required=""/>
                  </div>
                
                  <button type="submit" class="w-full text-white bg-[#D3423E] hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-lg px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Entrar</button>
                  
              </form>
    </div>
  );
};

export default Login;
