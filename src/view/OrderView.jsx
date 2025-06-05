import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";
import { HiOutlineTrash } from "react-icons/hi";

import Spinner from "../Components/Spinner";
import OrderButton from "../Components/OrderButton";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");


  const [selectedStatus] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const [vendedores, setVendedores] = useState([]);


  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState();

  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const handleNewOrderClick = () => {
    navigate("/order/creation");
  };
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
          {
            id_owner: user
          }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setVendedores(response.data);
      } catch (error) {
        console.error("Error obteniendo vendedores", error);
        setVendedores([]);
      }
    };

    fetchVendedores();
  }, [user, token]);
  const fetchOrders = useCallback(async (pageNumber, customFilters = {}) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        ...customFilters,
      };

      const response = await axios.post(API_URL + "/whatsapp/order/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSalesData(response.data.orders);
      setTotalPages(response.data.totalPages);
      setItems(response.data.totalRecords);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, token,itemsPerPage]);

  const applyFilters = () => {
    const customFilters = {};
    if (searchTerm) customFilters.fullName = searchTerm;
    if (selectedStatus) customFilters.status = selectedStatus;
    if (selectedPaymentType) customFilters.paymentType = selectedPaymentType;
    if (selectedSaler) customFilters.salesId = selectedSaler;
    if (selectedPayment) customFilters.payStatus = selectedPayment;
    if (startDate && endDate) {
      customFilters.startDate = startDate;
      customFilters.endDate = endDate;
    }
    fetchOrders(1, customFilters);
    setPage(1);
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders,itemsPerPage]);
  const goToClientDetails = (item) => {
    navigate(`/client/order/${item.id_client}`, { state: { products: item.products, files: item, flag: true } });
  };
  const exportToExcel = async () => {
    const filters = {
      id_owner: user,
      page: page,
      limit: 10000,
    };
    if (searchTerm) filters.fullName = searchTerm;
    if (selectedStatus) filters.status = selectedStatus;
    if (selectedPaymentType) filters.paymentType = selectedPaymentType;
    if (selectedSaler) filters.salesId = selectedSaler;
    if (selectedPayment) filters.payStatus = selectedPayment;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    const response = await axios.post(API_URL + "/whatsapp/order/id", filters, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const allData = response.data.orders;

    const ws = XLSX.utils.json_to_sheet(
      allData.map((item) => {
        const creationDateUTC = new Date(item.creationDate);
        creationDateUTC.setHours(creationDateUTC.getHours() - 4);
        const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
      return {
        "Código de Cliente": item._id,
        "Nombre": item.id_client.name + " " + item.id_client.lastName,
        "Fecha de confirmación": formattedDate,
        "Tipo de pago": item.accountStatus,
        "Vendedor": item.salesId.fullName + " " + item.salesId.lastName || "",
        "Fecha de Pago": item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : new Date(item.creationDate).toLocaleDateString("es-ES") || "",
        "Estado de Pago": item.payStatus || "",
        "Saldo por pagar": item.restante,
        "Total": item.totalAmount,
      };
    })
  );
  

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order_List");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Order_List.xlsx");
  };
  const clearFilter = (type) => {
    if (type === "seller") setSelectedSaler(null);
    if (type === "paymentType") setSelectedPaymentType(null);
    if (type === "payment") setSelectedPayment(null);
    if (type === "date") {
      setStartDate("");
      setEndDate("");
      setDateFilterActive(false);
    }
    fetchOrders(1);
  };
  const clearAllFilters = () => {
    setSelectedFilter("");
    setSelectedSaler("");
    setSelectedPaymentType("");
    setSelectedPayment("");
  };
  const handleDelete = async (id) => {
    try {
      const response = await axios.post('/api/orders/delete', {
        _id: id,
        id_owner: user,
      },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

      if (response.status === 200 && response.data.success) {
        fetchOrders(1);
      }

      return response.data;
    } catch (error) {
    }
  };
  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
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
                      placeholder="Buscar por nombre"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setSearchTerm(inputValue);
                          fetchOrders(1);
                        }
                      }}
                      className="block p-2 ps-10 text-m text-gray-900 border border-gray-900 rounded-2xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end items-center space-x-4">
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2 bg-white font-bold text-m text-[#D3423E] uppercase rounded-3xl hover:text-white border-2 border-[#D3423E] hover:bg-[#D3423E] flex items-center gap-5"
                    >
                    <FaFileExport color="##726E6E" />
                    Exportar
                  </button>
                  <OrderButton onClick={handleNewOrderClick} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                >
                  <option value="">Filtrar por: </option>
                  <option value="payment">Filtrar por estado de pago:</option>
                  <option value="date">Filtrar por fecha:</option>
                  <option value="seller">Filtrar por vendedores: </option>
                  <option value="paymentType">Filtrar por tipo de pago:</option>
                </select>
                {selectedFilter === "seller" && (
                  <div className="flex gap-2">
                    <select
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      name="vendedor" value={selectedSaler} onChange={(e) => setSelectedSaler(e.target.value)} required>
                      <option value="">Seleccione un vendedor</option>
                      <option value="">Mostrar Todos</option>
                      {vendedores.map((vendedor) => (
                        <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        applyFilters();
                      }}
                      className="px-4 py-2 font-bold text-lg text-white bg-[#D3423E] uppercase rounded-2xl flex items-center gap-2"
                    >
                      Filtrar
                    </button>
                  </div>
                )}
                {selectedFilter === "paymentType" && (
                  <div className="flex gap-2">
                    <select
                      value={selectedPaymentType} onChange={(e) => setSelectedPaymentType(e.target.value)}
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      <option value="">Selecciona tipo de pago</option>
                      <option value="">Mostrar Todos</option>

                      <option value="Crédito">Crédito</option>
                      <option value="Contado">Contado</option>
                    </select>
                    <button
                      onClick={() => {
                        applyFilters();
                      }}
                      className="px-4 py-2 font-bold text-lg text-white bg-[#D3423E] uppercase rounded-2xl hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
                    >
                      Filtrar
                    </button>
                  </div>
                )}
                {selectedFilter === "payment" && (
                  <div className="flex gap-2">
                    <select
                      value={selectedPayment}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                    >
                      <option value="">Selecciona un estado</option>
                      <option value="">Mostrar Todos</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                    <button
                      onClick={() => {
                        applyFilters();
                      }}
                      className="px-4 py-2 font-bold text-lg text-white bg-[#D3423E] uppercase rounded-2xl flex items-center gap-2"
                    >
                      Filtrar
                    </button>
                  </div>
                )}
                {selectedFilter === "date" && (
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                        }}
                        className="h-10 px-3 py-2 border text-m text-gray-900 rounded-2xl focus:outline-none focus:ring focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                        }}
                        className="h-10 px-3 py-2 border text-m text-gray-900 rounded-2xl focus:outline-none focus:ring focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        applyFilters();
                        setDateFilterActive(true);
                      }}
                      className="px-4 py-2 font-bold text-lg text-white bg-[#D3423E] uppercase rounded-2xl hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
                    >
                      Filtrar
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {selectedSaler && (
                <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Vendedor: {vendedores.find(v => v._id === selectedSaler)?.fullName}
                  <button onClick={() => clearFilter("seller")} className="font-bold">×</button>
                </span>
              )}
              {selectedPaymentType && (
                <span className="bg-orange-400 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Tipo de Pago: {selectedPaymentType}
                  <button onClick={() => clearFilter("paymentType")} className="font-bold">×</button>
                </span>
              )}
              {selectedPayment && (
                <span className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Estado de Pago: {selectedPayment}
                  <button onClick={() => clearFilter("payment")} className="font-bold">×</button>
                </span>
              )}
              {dateFilterActive && (
                <span className="bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  Fecha: {startDate} → {endDate}
                  <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                </span>
              )}

              {(selectedSaler || selectedStatus || selectedPaymentType || selectedPayment) && (
                <button
                  onClick={clearAllFilters}
                  className="ml-2 text-sm underline font-bold text-gray-900 hover:text-[#D3423E]"
                >
                  Limpiar todos
                </button>
              )}

            </div>
            <div className="mt-5 border border-gray-400 rounded-xl">
            <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 uppercase">Fecha de creación</th>
                    <th className="px-6 py-3 uppercase">Nombre</th>
                    <th className="px-6 py-3 uppercase">Tipo de Pago</th>
                    <th className="px-6 py-3 uppercase">Vendedor</th>
                    <th className="px-6 py-3 uppercase">Estado de pago</th>
                    <th className="px-6 py-3 uppercase">Total</th>
                    <th className="px-6 py-3 uppercase">Saldo por pagar</th>
                    <th className="px-6 py-3 uppercase">Días de mora</th>
                    <th className="px-6 py-3 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length > 0 ? (
                    salesData.map((item) => (
                      <tr key={item._id} onClick={() => goToClientDetails(item)} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">
                          {item.creationDate 
                            ? new Date(item.creationDate).toLocaleString("es-ES", {
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: "2-digit", 
                                minute: "2-digit", 
                                second: "2-digit",
                                hour12: false, 
                              }).toUpperCase()
                            : ''}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {item.accountStatus === "Crédito" && (
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                              CRÉDITO
                            </span>
                          )}
                          {item.accountStatus === "Contado" && (
                            <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                              CONTADO
                            </span>
                          )}
                          {item.accountStatus === "Cheque" && (
                            <span className="bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                              CHEQUE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{item.salesId.fullName + " " + item.salesId.lastName}</td>

                        <td className="px-6 py-4 text-gray-900 font-bold">
                          {item.payStatus === "Pagado" && (
                            <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                              PAGADO
                            </span>
                          )}
                          {item.payStatus === "Pendiente" && (
                            <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                              PENDIENTE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-bold text-lg">{item.totalAmount}</td>
                        <td className="px-6 py-4 text-gray-900">
                          {item.restante}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {item.diasMora}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {item.totalAmount === item.restante && (
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          )}
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
              <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-100 border-t border-b mb-2 mt-2 border-gray-300">
                <div className="text-m">Total de Ítems: <span className="font-semibold">{items}</span></div>
              
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
                            fetchOrders(page);
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
                  className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold "}`}
                >
                  ◀
                </button>

                <button
                  onClick={() => setPage(1)}
                  className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                >
                  1
                </button>

                {page > 3 && <span className="px-2 text-gray-900 font-bold">…</span>}

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

                {page < totalPages - 2 && <span className="px-2 text-gray-900 font-bold">…</span>}

                {totalPages > 1 && (
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
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

export default OrderView;
