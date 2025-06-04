import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";

const ClientView = () => {
  const [salesData, setSalesData] = useState([]); 
  const [filteredData, setFilteredData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); 
  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_URL+"/whatsapp/sales/list/id", 
        { id_owner: user },{
          headers: {
            Authorization: `Bearer ${token}`
          }
      }
      );
      
      setSalesData(response.data); 
      setFilteredData(response.data); 
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  const goToClientDetails = (client) => {
    navigate(`/sales/${client._id}`, { state: { client } });
  };
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(salesData); 
    } else {
      const filtered = salesData.filter((item) =>
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      || item.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, salesData]);

  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 mt-10 relative overflow-x-auto">
        <div className="flex items-center justify-between w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-red-500"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por Nombre, apellido"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block p-2 ps-10 text-lg text-gray-900 border border-gray-900 rounded-2xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
          </div>

          <button
            onClick={() => navigate("/sales/create")}
            className="px-4 py-2 font-bold text-lg rounded-3xl text-white rounded-lg bg-[#D3423E] hover:text-white flex items-center gap-2"
            >
            <IoPersonAdd />
            Nuevo Vendedor
          </button>
        </div>

        <div className="mt-5 border border-gray-400 rounded-xl">
          <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Correo Electronico</th>
                <th className="px-6 py-3">Telefono Celular</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.fullName +" "+ item.lastName}</td>
                    <td className="px-6 py-4 text-gray-900">{item.email}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.phoneNumber}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
       
      </div>
    </div>
  );
};

export default ClientView;
