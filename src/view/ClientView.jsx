import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import Spinner from "../Components/Spinner";

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
        setVendedores(response.data.data);
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
      limit: itemsPerPage,
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
      setItems(response.data.totalItems);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedSaler, itemsPerPage, token]);
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
        "Vendedor": item.sales_id?.fullName + " " + item.sales_id?.lastName || "",
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
      <div className="relative overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : (
          <div>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between w-full mb-4">
                <div className="relative flex items-center space-x-4">
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
                        className="block p-2 ps-10 text-m text-gray-900 border border-gray-900 rounded-3xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center space-x-4">
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl border-2 border-[#D3423E] flex items-center gap-5"
                    >
                      <FaFileExport />
                      Exportar
                    </button>
                    <button
                      onClick={() => navigate("/client/creation")}
                      className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] flex items-center gap-2"
                    >
                      <IoPersonAdd />
                      Nuevo Cliente
                    </button>
                  </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <select
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      name="vendedor"
                      value={selectedSaler}
                      onChange={(e) => setSelectedSaler(e.target.value)}
                      required
                    >
                      <option value="">Filtrar por vendedor</option>
                      <option value="">Mostrar Todos</option>
                      {vendedores.map((vendedor) => (
                        <option key={vendedor._id} value={vendedor._id}>
                          {vendedor.fullName + " " + vendedor.lastName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => fetchProducts(1)}
                      className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] hover:bg-white hover:text-[#D3423E] flex items-center gap-2"
                    >
                      FILTRAR
                    </button>
                  </div>
                </div>
            </div>
            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3"></th>
                    <th className="px-6 py-3 uppercase">Nombre</th>
                    <th className="px-6 py-3 uppercase">Categoría</th>
                    <th className="px-6 py-3 uppercase">Dirección</th>
                    <th className="px-6 py-3 uppercase">Telefono Celular</th>
                    <th className="px-6 py-3 uppercase">Vendedor</th>
                    <th className="px-6 py-3 uppercase">Ciudad</th>
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
                              {getInitials(item.name, item.lastName)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.name + " " + item.lastName}
                        </td>

                        <td className="px-6 py-4 text-gray-900">{item.userCategory}</td>
                        <td className="px-6 py-4 text-gray-900">{item.client_location.direction}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.number}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.sales_id.fullName + " " + item.sales_id?.lastName}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.client_location.city}</td>
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
              <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-200 border-t lg mt-2 border-gray-300">
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
    </div>
  );
};

export default ClientView;
