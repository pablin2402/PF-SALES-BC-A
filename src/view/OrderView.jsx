import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";

import Spinner from "../Components/Spinner";
import OrderButton from "../Components/OrderButton";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("");


  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");

  const [vendedores, setVendedores] = useState([]);

  const limit = 8;
  const navigate = useNavigate();
  const handleNewOrderClick = () => {
    navigate("/order/creation");
  };
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
          {
            id_owner: "CL-01"
          });
        setVendedores(response.data);
      } catch (error) {
        console.error(" obteniendo vendedores", error);
        setVendedores([]);
      }
    };

    fetchVendedores();
  }, []);

  const fetchOrders = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: "CL-01",
        page: pageNumber,
        limit: limit,
      };
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedPaymentType) filters.paymentType = selectedPaymentType;
      if (selectedSaler) filters.salesMan = selectedSaler;
  
      const response = await axios.post(API_URL + "/whatsapp/order/id", filters);
      setSalesData(response.data.orders);
      setFilteredData(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPaymentType, selectedSaler, limit]);
  
  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  const goToClientDetails = (item) => {
    console.log(item);
    navigate(`/client/order/${item.id_client}`, { state: { products: item.products, files: item } });
  };
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(salesData);
    } else {
      const filtered = salesData.filter((item) =>
        item.id_client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, salesData]);
  const calculateDaysRemaining = (dueDate, creationDate) => {
    if (!dueDate) return '0';

    const due = new Date(dueDate);
    const today = new Date();

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays}`;

  };
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      salesData.map((item) => ({
        "Código de Cliente": item._id,
        "Nombre": item.id_client.name + " " + item.id_client.lastName,
        "Fecha de confirmación": new Date(item.creationDate).toLocaleDateString("es-ES") || "",
        "Tipo de pago": item.accountStatus,
        "Vendedor": item.salesId.fullName + " " + item.salesId.lastName || "",
        "Fecha de Pago": item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : new Date(item.creationDate).toLocaleDateString("es-ES") || "",
        "Estado de Pago": item.payStatus || "",
        "Total": item.totalAmount,
      }))
    );
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "ORDER.xlsx");
  };
  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : (
          <div>
            <div className="flex items-center justify-between w-full">
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
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  />
                </div>

                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                >
                  <option value="">Filtrar por: </option>
                  <option value="seller">Filtrar por vendedores: </option>
                  <option value="status">Filtrar por estado:</option>
                  <option value="paymentType">Filtrar por tipo de pago:</option>
                </select>
                {selectedFilter === "seller" && (

                  <select
                  className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  name="vendedor" value={selectedSaler} onChange={ (e) => setSelectedSaler(e.target.value)} required>
                    <option value="">Seleccione un vendedor</option>
                    <option value="">Mostrar Todos</option>
                    {vendedores.map((vendedor) => (
                      <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                    ))}
                  </select>
                )}

                {selectedFilter === "status" && (
                  <select
                    value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                    className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  >
                    <option value="">Selecciona un estado</option>
                    <option value="">Mostrar Todos</option>
                    <option value="delivered">Entregar</option>
                    <option value="deliver">Entregado</option>
                  </select>
                )}

                {selectedFilter === "paymentType" && (
                  <select
                    value={selectedPaymentType} onChange={(e) => setSelectedPaymentType(e.target.value)}
                    className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-lg bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  >
                    <option value="">Selecciona tipo de pago</option>
                    <option value="">Mostrar Todos</option>

                    <option value="credito">Crédito</option>
                    <option value="pending">Contado</option>
                  </select>
                )}
              </div>
              <div className="flex justify-end items-center space-x-4">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-white font-bold text-lg text-red-700 rounded-lg hover:text-white hover:bg-[#D3423E] flex items-center gap-2"
              >
                <FaFileExport color="##726E6E" />
                Exportar
              </button>
                <OrderButton onClick={handleNewOrderClick} />
              </div>
            </div>

            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Fecha confirmación</th>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Tipo de Pago</th>
                    <th className="px-6 py-3">Vendedor</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Fecha de Pago</th>
                    <th className="px-6 py-3">Estado de pago</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Días de mora</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item._id} onClick={() => goToClientDetails(item)} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : ''}</td>
                        <td className="px-6 py-4 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {item.accountStatus === "credito" && (
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                              CRÉDITO
                            </span>
                          )}
                          {item.accountStatus === "pending" && (
                            <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                              CONTADO
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{item.salesId.fullName + " " + item.salesId.lastName}</td>
                        <td className="px-6 py-4 text-m text-gray-900 font-bold">
                          {item.orderStatus === "deliver" && (
                            <span className="bg-orange-400 text-m text-white px-3.5 py-0.5 rounded-full">
                              ENTREGAR
                            </span>
                          )}
                          {item.accountStatus === "delivered" && (
                            <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                              ENTREGADO
                            </span>
                          )}
                          {item.accountStatus === "delivering" && (
                            <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                              EN CAMINO
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : new Date(item.creationDate).toLocaleDateString("es-ES")}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {item.payStatus === "totallypay" && (
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                              PAGADO
                            </span>
                          )}
                          {item.payStatus === "needpay" && (
                            <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                              DEUDA
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-bold text-lg">{item.totalAmount}</td>
                        <td className="px-6 py-4 text-gray-900">
                          {calculateDaysRemaining(item.dueDate, item.creationDate)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No se encontraron productos.
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`px-3 py-1 border rounded-lg ${page === num ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
                  >
                    {num}
                  </button>
                ))}

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

    </div>
  );
};

export default OrderView;
