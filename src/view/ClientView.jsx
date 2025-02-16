import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { FaFilter } from "react-icons/fa";

const ClientView = () => {
  const [salesData, setSalesData] = useState([]); // Datos originales de la API
  const [filteredData, setFilteredData] = useState([]); // Datos filtrados por búsqueda
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Página actual
  const [totalPages, setTotalPages] = useState(1); // Total de páginas
  const [searchTerm, setSearchTerm] = useState(""); // Estado del buscador


  const navigate = useNavigate();

  const fetchProducts = async (pageNumber) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id",
        {
          id_owner: "CL-01",
          page: pageNumber,
          limit: 8,
        },
      );

      setSalesData(response.data.clients);
      setFilteredData(response.data.clients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProducts(page);
  }, [page]);
  const goToClientDetails = (client) => {
    console.log(client)
    navigate(`/client/${client._id}`, { state: { client } });
  };
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(salesData);
    } else {
      const filtered = salesData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
        || item.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        || String(item.number).includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, salesData]);

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div role="status">
            <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="ml-10 mr-10 mt-10 relative overflow-x-auto">

          <div className="flex items-center justify-between w-full">
            <div className="relative flex items-center space-x-4">
              <div className="relative flex-1">
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
                  placeholder="Buscar por Nombre, apellido, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block p-2 ps-10 text-m text-gray-900 border border-gray-400 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                />
              </div>

              <select
                id="countries"
                className="bg-gray-50 border border-gray-400 text-gray-900 text-m rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 pr-10"
              >
                <option value="default" className="text-gray-900" disabled selected>
                  Filtrar
                </option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
              </select>
            </div>

            <div className="flex justify-end items-center space-x-4">
              <button
                className="px-4 py-2 bg-white font-bold text-lg text-gray-700 rounded-lg hover:text-[#D3423E] flex items-center gap-2"
              >
                <FaFileExport color="##726E6E" />
                Exportar
              </button>
              <button
                onClick={() => navigate("/client/creation")}
                className="px-4 py-2 bg-[#D3423E] font-bold text-lg text-white rounded-lg hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
              >
                <IoPersonAdd />

                Nuevo Cliente
              </button>
            </div>

          </div>

          <div className="mt-5 border border-gray-400 rounded-xl">
            <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Dirección</th>
                  <th className="px-6 py-3">Telefono Celular</th>
                  <th className="px-6 py-3">Deuda a la fecha</th>
                  <th className="px-6 py-3">Vendedor</th>

                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name + " " + item.lastName}</td>
                      <td className="px-6 py-4 text-gray-900"></td>
                      <td className="px-6 py-4 text-gray-900"></td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.number}</td>
                      <td className="px-6 py-4 text-gray-900"></td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.sales_id.fullName}</td>

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

          {totalPages > 1 && searchTerm === "" && (
            <nav className="flex items-center justify-center pt-4 space-x-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                  }`}
              >
                ◀
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`px-3 py-1 border border-gray-400 rounded-lg ${page === num ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"
                    }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                  }`}
              >
                ▶
              </button>
            </nav>
          )}
        </div>
      )}

    </div>
  );
};

export default ClientView;
