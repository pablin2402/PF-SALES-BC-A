import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { HiFilter } from "react-icons/hi";
import { FaUserEdit } from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import Spinner from "../Components/LittleComponents/Spinner";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ClientView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const [selectedSaler, setSelectedSaler] = useState("");
  const [vendedores, setVendedores] = useState([]);
  const [selectedSaler1, setSelectedSaler1] = useState("");

  const [items, setItems] = useState();
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [openDialog, setOpenDialog] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setSelectedSaler1(item.sales_id?._id || "");
    setOpenDialog(true);
  };
  const navigate = useNavigate();
  const getInitials = (name, lastName) => {
    const firstInitial = name?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const getColor = useCallback((name, lastName) => {
    const colorClasses = [
      'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-yellow-300',
      'bg-red-800', 'bg-red-900', 'bg-yellow-600', 'bg-yellow-800'
    ];
    const hash = (name + lastName)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colorClasses[hash % colorClasses.length];
  }, []);
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);
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
    if (selectedRegion) filters.region = selectedRegion;
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response.data.clients)
      setSalesData(response.data.clients);
      setTotalPages(response.data.totalPages);
      setItems(response.data.totalItems);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedSaler, selectedRegion, itemsPerPage, token]);
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
    if (selectedRegion) filters.region = selectedRegion;

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
        "Vendedor": item.sales_id
          ? `${item.sales_id.fullName} ${item.sales_id.lastName}`
          : "",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista_Clientes");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Lista_Clientes.xlsx");
  };
  const clearFilter = (type) => {
    if (type === "seller") setSelectedSaler("");
    if (type === "region") setSelectedRegion("");
    fetchProducts(1);
  };
  const clearAllFilters = () => {
    setSelectedFilter("");
    setSelectedSaler("");
    setSelectedRegion("");
  };
  const handleUpdateClient = async (client) => {
    try {
      await axios.put(API_URL + "/whatsapp/client/user/id", {
        _id: client._id,
        id_owner: user,
        name: client.name,
        lastName: client.lastName,
        sales_id: selectedSaler1,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShowSuccessModal(true);
      setOpenDialog(false);
      fetchProducts(1);
    } catch (error) {
      console.error(error);
      setShowErrorModal(true);
    }
  };
  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        {loading ? (
          <Spinner />
        ) : (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Clientes</h1>
                <p className="text-sm text-gray-500">Gestiona todos los clientes desde un solo lugar</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 font-semibold text-sm"
                >
                  <FaFileExport color="##726E6E" />
                  Exportar
                </button>
                <PrincipalBUtton onClick={() => navigate("/client/creation")}>
                  Nuevo Cliente
                </PrincipalBUtton>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <TextInputFilter
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onEnter={() => fetchProducts(1)}
                        placeholder="Buscar por nombre ..."
                      />
                    </div>
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all"
                    >
                      <option value="">Filtrar por: </option>
                      <option value="seller">Filtrar por vendedores: </option>
                      <option value="region">Filtrar por region:</option>
                    </select>
                  </div>

                </div>
                {selectedFilter === "region" && (
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E]"
                      name="ciudad"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      required
                    >
                      <option value="">Ciudad</option>
                      <option value="Cochabamba">Cochabamba</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                      <option value="La Paz">La Paz</option>
                      <option value="Oruro">Oruro</option>
                    </select>
                    <PrincipalBUtton onClick={() => fetchProducts(1)} icon={HiFilter}>Aplicar</PrincipalBUtton>

                  </div>
                )}
                {selectedFilter === "seller" && (
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E]"
                      name="vendedor"
                      value={selectedSaler}
                      onChange={(e) => setSelectedSaler(e.target.value)}
                      required
                    >
                      <option value="">Vendedor</option>
                      <option value="">Mostrar Todos</option>
                      {vendedores.map((vendedor) => (
                        <option key={vendedor._id} value={vendedor._id}>
                          {vendedor.fullName + " " + vendedor.lastName}
                        </option>
                      ))}
                    </select>
                    <PrincipalBUtton onClick={() => fetchProducts(1)} icon={HiFilter}>Aplicar</PrincipalBUtton>

                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {selectedSaler && (
                  <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Vendedor: {vendedores.find(v => v._id === selectedSaler)?.fullName} {vendedores.find(v => v._id === selectedSaler)?.lastName}
                    <button onClick={() => clearFilter("seller")} className="font-bold">×</button>
                  </span>
                )}
                {selectedRegion && (
                  <span className="bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Region: {selectedRegion}
                    <button onClick={() => clearFilter("region")} className="font-bold">×</button>
                  </span>
                )}
                {(selectedSaler || selectedRegion) && (
                  <button
                    onClick={clearAllFilters}
                    className="ml-2 text-sm underline font-bold text-gray-900 hover:text-[#D3423E]"
                  >
                    Limpiar todos
                  </button>
                )}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-s text-gray-700 uppercase bg-gray-200 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3"></th>
                      <th className="px-6 py-3 uppercase">Nombre</th>
                      <th className="px-6 py-3 uppercase">Categoría</th>
                      <th className="px-6 py-3 uppercase">Dirección</th>
                      <th className="px-6 py-3 uppercase">Telefono Celular</th>
                      <th className="px-6 py-3 uppercase">Vendedor</th>
                      <th className="px-6 py-3 uppercase">Ciudad asignada</th>
                      <th className="px-6 py-3 uppercase"></th>
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
                          <td className="px-6 py-4 text-gray-900">
                            {item.sales_id
                              ? `${item.sales_id.fullName} ${item.sales_id.lastName}`
                              : "Sin asignar"}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.region}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(item);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaUserEdit size={22} />

                            </button>
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
                </table>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>Total: <strong className="text-gray-900">{items || 0}</strong> clientes</span>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="itemsPerPage" className="font-semibold">Mostrar:</label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setPage(1);
                          fetchProducts(page);
                        }}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#D3423E]"
                      >
                        {[5, 10, 20, 50, 100].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {totalPages > 1 && searchTerm === "" && (

                    <nav className="flex items-center justify-center pt-4 space-x-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        ← Anterior
                      </button>

                      <button
                        onClick={() => setPage(1)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        1
                      </button>

                      {page > 3 && <span className="px-1 text-gray-400">…</span>}

                      {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                        .filter((p) => p > 1 && p < totalPages)
                        .map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === p ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                          >
                            {p}
                          </button>
                        ))}

                      {page < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}

                      {totalPages > 1 && (
                        <button
                          onClick={() => setPage(totalPages)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                        >
                          {totalPages}
                        </button>
                      )}

                      <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        Siguiente →
                      </button>
                    </nav>

                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {openDialog && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50 px-4 sm:px-6">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
              Editar Datos del Cliente
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Nombre:
                </label>
                <input
                  type="text"
                  value={selectedItem?.name || ""}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Apellido:
                </label>
                <input
                  type="text"
                  value={selectedItem?.lastName || ""}
                  onChange={(e) =>
                    setSelectedItem({ ...selectedItem, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Seleccione un vendedor:
                </label>
                <select
                  value={selectedSaler1}
                  onChange={(e) => setSelectedSaler1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-300"
                >
                  <option value="">Vendedor</option>
                  <option value="">Mostrar Todos</option>
                  {vendedores.map((vendedor) => (
                    <option key={vendedor._id} value={vendedor._id}>
                      {vendedor.fullName + " " + vendedor.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setOpenDialog(false)}
                className="w-1/2 px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateClient(selectedItem)}
                className="w-1/2 px-4 py-2 bg-[#D3423E] text-white font-bold uppercase rounded-3xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-xl max-w-sm w-full"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg mb-4">
              <FaCheckCircle className="text-green-500" size={80} />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Cliente Actualizado</h2>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
            >
              Aceptar
            </button>
          </motion.div>
        </div>
      )}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-xl max-w-sm w-full"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-4">
              <FaTimesCircle className="text-red-500" size={80} />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error al actualizar</h2>
            <p className="text-center text-gray-700 text-sm">
              Ocurrió un problema al actualizar el cliente.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClientView;
