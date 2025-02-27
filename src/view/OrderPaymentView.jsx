import React, { useEffect,useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";
import Select from 'react-select';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderPaymentView = () => {
  const [salesData, setSalesData] = useState([]); // Datos originales de la API
  const [filteredData, setFilteredData] = useState([]); // Datos filtrados por búsqueda
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // Página actual
  const [totalPages, setTotalPages] = useState(1); // Total de páginas
  const [searchTerm, setSearchTerm] = useState(""); // Estado del buscador

  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applyFilter, setApplyFilter] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);

  const navigate = useNavigate();

  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
  
    try {
      const filters = {
        id_owner: "CL-01",
        page: pageNumber,
        limit: 8,
      };
  
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedCliente) filters.id_client = selectedCliente.value;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
  
      const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", filters);
      console.log(response)
      setSalesData(response.data.data);
      setFilteredData(response.data.data);
      setTotalPages(response.data.pagination.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCliente, applyFilter]); 
  
  useEffect(() => {
    fetchProducts(page);
    setApplyFilter(false)
  }, [fetchProducts, applyFilter, page]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(salesData);
    } else {
      const filtered = salesData.filter((item) =>
        item.id_client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id_client.lastName.toLowerCase().includes(searchTerm.toLowerCase())

      );
      setFilteredData(filtered);
    }
  }, [searchTerm, salesData]);
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((item) => ({
        "Número de Orden": item.orderId.receiveNumber,
        "Cliente": item.id_client.name + " " + item.id_client.lastName || "",
        "Fecha de Pago": item.creationDate,
        "Deuda de la nota": item.debt.toFixed(2) || "",
        "Pago": item.total || "",
        "Monto total": item.orderId.totalAmount || "",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Clientes.xlsx");
  };
  const fetchClients = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/list/id",
        {
          id_owner: "CL-01",
        },
      );
      
      const clientesData = [
        { value: "all", label: "Mostrar todos" }, 
        ...response.data.clients.map(cliente => ({
          value: cliente._id,
          label: `${cliente.name} ${cliente.lastName}`,
          directionid: cliente.client_location.direction,
          direction_id: cliente.client_location._id,
          number: cliente.number
        }))
      ];
      
      setClientes(clientesData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClients();
  }, []);
  const handleSelectChange = (selectedOption) => {
    if (!selectedOption) {
      setSelectedCliente(null); 
    } else if (selectedOption.value === "all") {
      setSelectedCliente(null);
    } else {
      setSelectedCliente(selectedOption);
    }
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
                  placeholder="Buscar por cliente"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block p-2 ps-10 text-m text-gray-900 border border-gray-400 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
              >
                <option value="">Filtrar por: </option>
                <option value="">Mostrar todos </option>
                <option value="client">Filtrar por Cliente:</option>
                <option value="status">Filtrar por Estado de cobro: </option>
                <option value="date">Filtrar por Fecha:</option>
              </select>
              {selectedFilter === "client" && (
                <div>
                  <Select
                          options={clientes}
                          value={selectedCliente}
                          onChange={handleSelectChange}
                          isSearchable={true}
                          placeholder="Buscar cliente..."
                          noOptionsMessage={() => "No se encontraron clientes"}
                          className="text-gray-900 text-m rounded-2xl"
                          styles={{
                            control: (provided, state) => ({
                              ...provided,
                              borderColor: state.isFocused ? "#2E2B2B" : "#2E2B2B",
                              boxShadow: state.isFocused ? "0 0 0 2px rgba(211, 66, 62, 0.5)" : "none",
                              "&:hover": { borderColor: "#B8322F" },
                            }),
                            option: (provided, state) => ({
                              ...provided,
                              backgroundColor: state.isSelected ? "#D3423E" : "white",
                              color: state.isSelected ? "white" : "##2E2B2B",
                              "&:hover": { backgroundColor: "#F8D7DA", color: "#D3423E" }
                            }),
                            singlevalue: (provided) => ({
                              ...provided, color: "#2E2B2B",

                            }), placeholder: (provided) => ({
                              ...provided, color: "#2E2B2B",
                            }), menu: (provided) => ({
                              ...provided, color: "#2E2B2B",
                            }),
                          }}
                        ></Select>
                </div>
              )}

              {selectedFilter === "status" && (
                <select
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                >
                  <option value="">Selecciona un estado</option>
                  <option value="">Mostrar Todos</option>
                  <option value="paid">Pago Ingresado</option>
                  <option value="aproved">Pago Aprobado</option>
                </select>
              )}
            </div>
            <div className="flex justify-end items-center space-x-4">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-white font-bold text-lg text-red-700 rounded-lg hover:text-[#D3423E] flex items-center gap-2"
              >
                <FaFileExport color="##726E6E" />
                Exportar
              </button>
              
            </div>
          </div>
          <div className="relative mt-8 flex items-center space-x-4">
            {selectedFilter === "date" && (
              <div className="flex space-x-4 mb-4 items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-gray-700">De</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring focus:border-blue-500 h-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-gray-700">Hasta</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border text-gray-900 rounded-lg focus:outline-none focus:ring focus:border-blue-500 h-full"
                  />
                </div>

                <div className="flex items-center">
                  <button
                    className="px-4 py-2 border text-white bg-[#D3423E] font-bold rounded-lg hover:bg-gray-100 hover:text-[#D3423E] h-full"
                    onClick={() => setApplyFilter(true)}
                  >
                    Aplicar Filtro
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 border border-gray-400 rounded-xl">
            <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3">Número de Nota</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Pago</th>
                  <th className="px-6 py-3">Total </th>
                  <th className="px-6 py-3">Deuda a la Fecha</th>

                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{item.orderId.receiveNumber}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{new Date(item.creationDate).toLocaleDateString("es-ES")}</td>
                      <td className="px-6 py-4 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.paymentStatus === "paid" && (
                          <span className="bg-orange-400 text-m text-white px-3.5 py-0.5 rounded-full">
                            INGRESADO
                          </span>
                        )}
                        {item.paymentStatus === "pagado" && (
                          <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                            APROBADO
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{item.total}</td>
                      <td className="px-6 py-4 text-gray-900">{item.orderId.totalAmount}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {item.debt !== undefined ? `$${item.debt.toFixed(2)}` : "N/A"}
                      </td>
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

export default OrderPaymentView;
