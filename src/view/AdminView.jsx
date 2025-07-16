import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";

const AdminView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        id_owner: user,
      };
      const response = await axios.post(API_URL + "/whatsapp/administrator/list",
        filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      );
      console.log(response.data)
      setSalesData(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;
  const getInitials = (name, lastName) => {
    const firstInitial = name?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial;
  };
  const colorClasses = [
    'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-yellow-300',
    'bg-red-800', 'bg-red-900', 'bg-yellow-600', 'bg-yellow-800'
  ];
  const getColor = (name, lastName) => {
    const hash = (name + lastName)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % colorClasses.length;
    return colorClasses[index];
  };
  return (
    <div className="w-full p-10 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">
    <div className="flex flex-col w-full">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center w-full max-w-2xl gap-2">
              <h1 className="text-gray-900 font-bold text-2xl">Personal de Administración</h1>
          </div>
          <div className="flex justify-end items-center space-x-4">
            <PrincipalBUtton onClick={() => navigate("/admin/create")} icon={IoPersonAdd}>           
              Nuevo Administrador
            </PrincipalBUtton>
          </div>
          </div>
          <div className="relative flex items-center mt-20 w-full max-w-2xl  space-x-4">
            <div className="relative flex-grow">
              <TextInputFilter
                value={searchTerm}
                onChange={setSearchTerm}
                onEnter={() => fetchProducts(1)}
                placeholder="Buscar por nombre"
              />
            </div>
            <PrincipalBUtton onClick={() => fetchProducts(1)} icon={HiFilter}>Filtrar</PrincipalBUtton>
          </div>
        </div>
      <div className="mt-5 border border-gray-400 rounded-xl">
          <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-3xl overflow-hidden">
          <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
          <tr>
                <th className="px-6 py-3"></th>
                <th className="px-6 py-3 uppercase">Nombre</th>
                <th className="px-6 py-3 uppercase">Correo Electronico</th>
                <th className="px-6 py-3 uppercase">Telefono Celular</th>
                <th className="px-6 py-3 uppercase">Ciudad Asignada</th>
              </tr>
            </thead>
            <tbody>
              {salesData.length > 0 ? (
                salesData.map((item) => (
                  <tr  key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                     <td className="px-6 py-4 font-medium text-gray-900">
                            <div
                              className={`relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full ${getColor(item.salesId.fullName, item.salesId.lastName)}`}
                            >
                              <span className="font-medium text-white">
                                {getInitials(item.salesId.fullName, item.salesId.lastName)}
                              </span>
                            </div>
                          </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.salesId.fullName + " " + item.salesId.lastName}</td>
                    <td className="px-6 py-4 text-gray-900">{item.salesId.email}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.salesId.phoneNumber}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.salesId.region}</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 114 0v2m-4 4h4m-6-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                      </svg>
                      <p className="text-lg font-semibold">No se encontraron coincidencias</p>
                      <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros o busca otra información.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>      
      </div>

    </div>
  );
};

export default AdminView;
