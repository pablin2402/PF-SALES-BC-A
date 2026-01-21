import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import Spinner from "../Components/LittleComponents/Spinner";

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
  const fetchDeliveryList = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/delivery/list", {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        searchTerm: searchTerm
      }, {
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
  }, [user, searchTerm, token, itemsPerPage]);
  useEffect(() => {
    fetchDeliveryList(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);
  const goToClientDetails = (client) => {
    navigate(`/deliver/${client._id}`, { state: { client, flag: false } });
  };
  const handleToggle = async (newStatus, id) => {
    try {
      await axios.put(API_URL + "/whatsapp/delivery/status", {
        _id: id,
        active: newStatus,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchDeliveryList(1);
    } catch (error) {
      console.error("Error al cambiar estado", error);
    }
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
<div className="bg-white max-h-screen rounded-lg p-5 sm:p-6 md:p-8 lg:p-10">
      {loading ? (
        <Spinner />
      ) : (
        <div className="w-full p-10 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row flex-wrap items-start lg:items-center gap-4 mt-10 mb-4">
              <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center w-full max-w-2xl gap-2">
                    <h1 className="text-gray-900 font-bold text-2xl">Personal de Reparto</h1>
                  </div>
                  <div className="flex justify-end items-center space-x-4">
                    {salesData.length > 0 && (
                      <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl  border-2 border-[#D3423E] flex items-center gap-5"
                      >
                        <FaFileExport color="##726E6E" />
                      </button>
                    )}
                    <PrincipalBUtton onClick={() => navigate("/delivery/creation")} icon={IoPersonAdd}>
                      Nuevo Repartidor
                    </PrincipalBUtton>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-20 mb-4">
                  <div className="relative flex items-center  w-full max-w-2xl  space-x-4">
                    <div className="relative flex-grow">
                      <TextInputFilter
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onEnter={() => fetchDeliveryList(1)}
                        placeholder="Buscar por Nombre, apellidos"
                      />
                    </div>
                  </div>
                  <PrincipalBUtton onClick={() => fetchDeliveryList(1)} icon={HiFilter}>Filtrar</PrincipalBUtton>
                </div>
            </div>
            <div>
            <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm text-left text-gray-500 rounded-2xl">
                <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-3"></th>
                      <th className="px-6 py-3 uppercase">Nombre</th>
                      <th className="px-6 py-3 uppercase">Correo Electrónico</th>
                      <th className="px-6 py-3 uppercase">Dirección</th>
                      <th className="px-6 py-3 uppercase">Telefono Celular</th>
                      <th className="px-6 py-3 uppercase">Ciudad Asignada</th>
                      <th className="px-6 py-3 uppercase">Estado</th>

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
                          <td className="px-6 py-4 font-medium text-gray-900">{item.region}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <label onClick={(e) => e.stopPropagation()} className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={item.active}
                                onChange={() => handleToggle(!item.active, item._id)}

                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-400 rounded-full peer peer-checked:bg-green-500 transition-colors duration-300">
                                <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                              </div>                    </label>
                          </td>
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
                  <tfoot>
                    <tr>
                      <td colSpan={7}>
                        <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-200 border-t mt-2 border-gray-300">
                          <div className="text-m font-bold">
                            Total de Ítems: <span className="font-semibold">{items}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              
                {searchTerm === "" && (
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
                          fetchDeliveryList(1);
                        }}
                        className="border-2 border-gray-900 rounded-2xl px-2 py-1 text-m text-gray-700 focus:outline-none focus:ring-0 focus:border-red-500"
                      >
                        {[5, 10, 20].map((option) => (
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
        </div>
      )}
    </div>
  );
};

export default DeliveryView;
