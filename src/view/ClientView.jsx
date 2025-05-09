import React, { useEffect,useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const ClientView = () => {
  const [salesData, setSalesData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); 

  const [selectedSaler, setSelectedSaler] = useState("");
  const [vendedores, setVendedores] = useState([]);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id", 
          {
            id_owner: user
          }, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setVendedores(response.data);
      } catch (error) {
        console.error("Error obteniendo vendedores", error);
        setVendedores([]);
      }
    };
  
    if (user && token) {
      fetchVendedores();
    }
  }, [user, token]);
  
  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    const filters = {
      id_owner: user,
      page: pageNumber,
      limit: 8,
      clientName: searchTerm
    };
    if (selectedSaler) filters.sales_id = selectedSaler;
  
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSalesData(response.data.clients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedSaler, token]);
  
  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);
  const goToClientDetails = (client) => {
    navigate(`/client/${client._id}`, { state: { client,  flag: false  } });
  };

  const exportToExcel = async () => {
    const filters = {
      id_owner: user,
      page: page,
      limit: 1000,
      clientName: searchTerm
    };
    if (selectedSaler) filters.sales_id = selectedSaler;
    const response = await axios.post(API_URL + "/whatsapp/client/list/id", filters, {
      headers: {
          Authorization: `Bearer ${token}`
        }
    });
    const allData = response.data.clients;
    const ws = XLSX.utils.json_to_sheet(
      allData.map((item) => ({
        Nombre: item.name + " " + item.lastName,
        "Categoría": item.userCategory || "",
        "Dirección": item.client_location.direction || "",
        "Teléfono Celular": item.number,
        "Vendedor": item.sales_id?.fullName+" "+item.sales_id?.lastName || "",
      }))
    );
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista_Clientes");
  
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Lista_Clientes.xlsx");
  };
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchProducts(1);
                    }
                  }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                />
              </div>

              <select
                  className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  name="vendedor" 
                  value={selectedSaler} 
                  onChange={ (e) => setSelectedSaler(e.target.value)} required>
                    <option value="">Filtrar por vendedor</option>
                    <option value="">Mostrar Todos</option>
                    {vendedores.map((vendedor) => (
                      <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                    ))}
                  </select>
            </div>

            <div className="flex justify-end items-center space-x-4">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] rounded-lg hover:text-white hover:bg-[#D3423E] flex items-center gap-2"
              >
                <FaFileExport color="##726E6E" />
                Exportar
              </button>
              <button
                onClick={() => navigate("/client/creation")}
                className="px-4 py-2 font-bold text-lg text-gray-900 rounded-lg hover:bg-gray-100 hover:bg-gray-900 hover:text-white flex items-center gap-2"
              >
                <IoPersonAdd />
                Nuevo Cliente
              </button>
            </div>

          </div>

          <div className="mt-5 border border-gray-400 rounded-xl">
            <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
            <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Dirección</th>
                  <th className="px-6 py-3">Telefono Celular</th>
                  <th className="px-6 py-3">Vendedor</th>
                </tr>
              </thead>
              <tbody>
                {salesData.length > 0 ? (
                  salesData.map((item) => (
                    <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name + " " + item.lastName}</td>
                      <td className="px-6 py-4 text-gray-900">{item.userCategory}</td>
                      <td className="px-6 py-4 text-gray-900">{item.client_location.direction}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.number}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.sales_id.fullName+ " "+item.sales_id?.lastName}</td>
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
                  className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}
                >
                  ◀
                </button>

                <button
                  onClick={() => setPage(1)}
                  className={`px-3 py-1 border rounded-lg ${page === 1 ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                >
                  1
                </button>

                {page > 3 && <span className="px-2 text-gray-900">…</span>}

                {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                  .filter((p) => p > 1 && p < totalPages)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 border rounded-lg ${page === p ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                    >
                      {p}
                    </button>
                  ))}

                {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}

                {totalPages > 1 && (
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`px-3 py-1 border rounded-lg ${page === totalPages ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}
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
