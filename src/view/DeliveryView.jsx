import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const DeliveryView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState();
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const navigate = useNavigate();
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
  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    console.log(searchTerm)
    const filters = {
      id_owner: user,
      page: pageNumber,
      limit: 1000,
      searchTerm: searchTerm
    };
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSalesData(response.data.data);
      setTotalPages(response.data.totalPages);
      setItems(response.data.items);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, token]);
  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);
  const goToClientDetails = (client) => {
    navigate(`/client/${client._id}`, { state: { client, flag: false } });
  };
  const exportToExcel = async () => {
    const filters = {
      id_owner: user,
      page: 1,
      limit: itemsPerPage,
      searchTerm: searchTerm
    };
    const response = await axios.post(API_URL + "/whatsapp/delivery/list", filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

    const allData = response.data.data;
    const ws = XLSX.utils.json_to_sheet(
      allData.map((item) => ({
        Nombre: item.fullName + " " + item.lastName,
        "Correo Electrónico": item.email || "",
        "Dirección": item.client_location.direction || "",
        "Teléfono Celular": item.phoneNumber,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista_Clientes");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Lista_Clientes.xlsx");
  };
  return (
    <div className="bg-white min-h-screen rounded-lg p-5">
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
        <div className="ml-1 mr-1 mt-10 relative overflow-x-auto">
          <div className="flex flex-col w-full space-y-4">
            <div className="flex justify-end items-center space-x-4">
            {salesData.length > 0 && (
                <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl hover:text-white border-2 border-[#D3423E] hover:bg-[#D3423E] flex items-center gap-5"
                >
                    <FaFileExport />
                    Exportar
                </button>
                )}

              <button
                onClick={() => navigate("/delivery/creation")}
                className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] hover:bg-white hover:text-[#D3423E] flex items-center gap-2"
              >
                <IoPersonAdd />
                Nuevo Repartidor
              </button>
            </div>
            <div className="flex items-center gap-2">
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
                        placeholder="Buscar por Nombre, apellido, teléfono..."
                        value={searchTerm}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            fetchProducts(1);
                            }
                        }}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block p-2 ps-10 text-m text-gray-900 border border-gray-900 rounded-2xl w-200 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                        />
                    </div>
                    
                    <button
                        onClick={() => fetchProducts(1)}
                        className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] hover:bg-white hover:text-[#D3423E] flex items-center gap-2"
                    >
                        FILTRAR
                    </button>
                    </div>
          </div>
          {salesData.length === 0 ? (
            <div className="max-w-full max-h-full p-6 bg-white border mt-5 border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <p className="text-center text-gray-900 font-bold text-lg mt-5">No existen repartidores.</p>
              </div>
            ) : (
            <div>
                <div className="mt-5 border border-gray-400 rounded-xl">
                    <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                <thead className="text-sm text-gray-700 bg-gray-100 border-b border-gray-300">
                        <tr>
                        <th className="px-6 py-3"></th>
                        <th className="px-6 py-3 uppercase">Nombre</th>
                        <th className="px-6 py-3 uppercase">Correo Electrónico</th>
                        <th className="px-6 py-3 uppercase">Dirección</th>
                        <th className="px-6 py-3 uppercase">Telefono Celular</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesData.length > 0 ? (
                        salesData.map((item) => (
                            <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                <div
                                className={`relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full ${getColor(item.name, item.lastName)}`}
                                >
                                <span className="font-medium text-white">
                                    {getInitials(item.fullName, item.lastName)}
                                </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {item.fullName + " " + item.lastName}
                            </td>
                            <td className="px-6 py-4 text-gray-900">{item.email}</td>
                            <td className="px-6 py-4 text-gray-900">{item.client_location.direction}</td>
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
                    <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-100 border-t border-b mb-2 mt-2 border-gray-300">
                        <div className="text-m font-bold">Total de Ítems: <span className="font-semibold">{items}</span></div>
                    </div>
                    {totalPages > 1 && searchTerm === "" && (
                    <div className="flex justify-between items-center px-6 pb-4">
                    <div className="flex mb-4 justify-end items-center pt-4">
                    <label htmlFor="itemsPerPage" className="mr-2 text-m font-bold text-gray-700">
                        Ítems por página:
                    </label>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setPage(1);
                        fetchProducts(page);
                        }}
                        className="border-2 border-gray-900 rounded-2xl px-2 py-1 text-m text-gray-700"
                    >
                        {[5, 10, 20, 50, 100].map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                        ))}
                    </select>
                    </div>
                    <nav className="flex items-center justify-center pt-4 space-x-2">
                    <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"}`}
                    >
                        ◀
                    </button>

                    <button
                        onClick={() => setPage(1)}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
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
                            className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                        >
                            {p}
                        </button>
                        ))}

                    {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}

                    {totalPages > 1 && (
                        <button
                        onClick={() => setPage(totalPages)}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold "}`}
                        >
                        {totalPages}
                        </button>
                    )}

                    <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"}`}
                    >
                        ▶
                    </button>
                    </nav>
                    </div>
                    )}
                </div>
            </div>
            )}
          </div>  
      )}
    </div>
  );
};

export default DeliveryView;
