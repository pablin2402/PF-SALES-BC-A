import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import DateInput from "../Components/LittleComponents/DateInput";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import { motion } from "framer-motion";
import { FaTimesCircle, FaExclamationCircle, FaTruck } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import { MdCancel, MdLocalShipping, MdDoneAll } from 'react-icons/md';
import { HiOutlineCheckCircle, HiOutlineDocumentAdd } from 'react-icons/hi';

import Spinner from "../Components/LittleComponents/Spinner";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStatus] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [vendedores, setVendedores] = useState([]);


  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState();

  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCancelCheck, setShowCancelCheck] = useState(null);
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(null);

  const handleNewOrderClick = () => {
    navigate("/order/creation");
  };
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
      setVendedores(response.data.data);
    } catch (error) {
      console.error("Error obteniendo vendedores", error);
      setVendedores([]);
    }
  };
  useEffect(() => {
    fetchVendedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);
  const fetchOrders = async (pageNumber, customFilters) => {
    setLoading1(true);
    setError(null);
    try {
      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        fullName: inputValue,
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
      setLoading1(false);
    }
  };
  const fetchOrdersFilters = async (customFilters) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user,
        fullName: inputValue,
        ...customFilters,
      };

      const response = await axios.post(API_URL + "/whatsapp/order/filter/id", filters, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCounts(response.data.counts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    const customFilters = {};
    if (inputValue) customFilters.fullName = inputValue;
    if (selectedStatus) customFilters.status = selectedStatus;
    if (selectedPaymentType) customFilters.paymentType = selectedPaymentType;
    if (selectedSaler) customFilters.salesId = selectedSaler;
    if (selectedPayment) customFilters.payStatus = selectedPayment;
    if (selectedRegion) customFilters.region = selectedRegion;
    if (startDate && endDate) {
      customFilters.startDate = startDate;
      customFilters.endDate = endDate;
      setDateFilterActive(true);
    }
    fetchOrdersFilters(customFilters);
    fetchOrders(1, customFilters);
    setPage(1);
  };
  useEffect(() => {
    fetchOrders(page);
    fetchOrdersFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);
  const goToClientDetails = (item) => {
    navigate(`/client/order/${item.id_client}`, { state: { products: item.products, files: item, flag: true } });
  };
  const exportToExcel = async () => {
    const filters = {
      id_owner: user,
      page: page,
      limit: items,
    };
    if (inputValue) filters.fullName = inputValue;
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
    if (type === "seller") setSelectedSaler("");
    if (type === "paymentType") setSelectedPaymentType("");
    if (type === "payment") setSelectedPayment("");
    if (type === "region") setSelectedRegion("");
    if (type === "date") {
      setStartDate("");
      setEndDate("");
      setDateFilterActive(false);
    }
    fetchOrders(1);
  };
  const clearAllFilters = () => {
    setSelectedFilter("");
    setStartDate("");
    setEndDate("");
    setSelectedSaler("");
    setSelectedPaymentType("");
    setSelectedPayment("");
    setSelectedRegion("");
    setDateFilterActive(false);

  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/whatsapp/order/id`, {
        data: {
          _id: id,
          id_owner: user,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 && response.data.success) {
        fetchOrders(1);
      }

      return response.data;
    } catch (error) {
      console.error("Error al eliminar:", error.response?.data || error.message);
    }
  };

  const uploadProducts = async (id) => {
    try {
      await axios.put(
        API_URL + "/whatsapp/order/status/confirm/id",
        {
          _id: id,
          id_owner: user,
          orderStatus: selectedItem.confirmed,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (selectedItem.confirmed === "aproved") {
        setShowSuccessCheck(true);
        fetchOrders(1);
        setTimeout(() => {
          setShowEditModal(false);
          setShowSuccessCheck(false);
        }, 2000);
      } else if (selectedItem.confirmed === "cancelled") {
        setShowCancelCheck(true);
        fetchOrders(1);
        setTimeout(() => {
          setShowEditModal(false);
          setShowCancelCheck(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };


  return (
    <div className="bg-white min-h-screen p-5">
      <div className="relative overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : (
          <div>
            <div className="grid grid-cols-1 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
              <Card
                icon={<HiOutlineDocumentAdd size={28} />}
                label="Pedidos sin asignar"
                value={counts.created}
                bgColor="bg-blue-100"
                textColor="text-blue-500"
              />

              <Card
                icon={<HiOutlineCheckCircle size={28} />}
                label="Pedidos Aprobados"
                value={counts.aproved}
                bgColor="bg-green-100"
                textColor="text-green-500"
              />

              <Card
                icon={<MdLocalShipping size={28} />}
                label="En Ruta"
                value={counts['En Ruta']}
                bgColor="bg-yellow-100"
                textColor="text-yellow-500"
              />

              <Card
                icon={<MdDoneAll size={28} />}
                label="Entregados"
                value={counts.delivered}
                bgColor="bg-purple-100"
                textColor="text-purple-500"
              />

              <Card
                icon={<MdCancel size={28} />}
                label="Cancelados"
                value={counts.cancelled}
                bgColor="bg-red-100"
                textColor="text-red-500"
              />

            </div>

            <div className="w-full p-10 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between w-full mb-4">
                  <h1 className="text-gray-900 font-bold text-2xl">Órdenes de venta</h1>

                  <div className="flex justify-end items-center space-x-4">
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 bg-white font-bold text-lg text-[#D3423E] uppercase rounded-3xl  border-2 border-[#D3423E] flex items-center gap-5"
                    >
                      <FaFileExport color="##726E6E" />
                    </button>
                    <PrincipalBUtton onClick={() => handleNewOrderClick()}>Nuevo Pedido</PrincipalBUtton>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-20 mb-4">
                  <div className="relative flex items-center  w-full max-w-2xl  space-x-4">
                    <div className="relative flex-grow">
                      <TextInputFilter
                        value={inputValue}
                        onChange={setInputValue}
                        onEnter={applyFilters}
                        placeholder="Buscar por nombre"
                      />
                    </div>
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
                      <option value="region">Filtrar por region:</option>
                    </select>
                  </div>

                  {selectedFilter === "seller" && (
                    <div className="flex gap-2">
                      <select
                        className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                        name="vendedor" value={selectedSaler} onChange={(e) => setSelectedSaler(e.target.value)} required>
                        <option value="">Vendedor</option>
                        <option value="">Mostrar Todos</option>
                        {vendedores.map((vendedor) => (
                          <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedFilter === "paymentType" && (
                    <div className="flex gap-2">
                      <select
                        value={selectedPaymentType} onChange={(e) => setSelectedPaymentType(e.target.value)}
                        className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      >
                        <option value="">Tipo de pago</option>
                        <option value="">Mostrar Todos</option>

                        <option value="Crédito">Crédito</option>
                        <option value="Contado">Contado</option>
                      </select>
                    </div>
                  )}
                  {selectedFilter === "payment" && (
                    <div className="flex gap-2">
                      <select
                        value={selectedPayment}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                      >
                        <option value="">Estado de pago</option>
                        <option value="">Mostrar Todos</option>
                        <option value="Pagado">Pagado</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </div>
                  )}
                  {selectedFilter === "date" && (
                    <div className="flex gap-2">
                      <div className="flex items-center space-x-2">
                        <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />
                      </div>
                    </div>
                  )}
                  {selectedFilter === "region" && (
                    <div className="flex gap-2">
                      <select
                        className="text-gray-900 rounded-2xl p-2 focus:outline-none focus:ring-0 focus:border-red-500"
                        name="ciudad"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        required
                      >
                        <option value="">Ciudad</option>
                        <option value="TOTAL CBB">Cochabamba</option>
                        <option value="TOTAL SC">Santa Cruz</option>
                        <option value="TOTAL LP">La Paz</option>
                        <option value="TOTAL OR">Oruro</option>
                      </select>

                    </div>
                  )}
                  <PrincipalBUtton onClick={() => applyFilters()} icon={HiFilter}>Filtrar</PrincipalBUtton>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {selectedSaler && (
                  <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Vendedor: {
                      vendedores.find(v => v._id === selectedSaler)
                        ? `${vendedores.find(v => v._id === selectedSaler).fullName} ${vendedores.find(v => v._id === selectedSaler).lastName}`
                        : "Sin vendedor"
                    }
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
                {selectedRegion && (
                  <span className="bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Region: {selectedRegion}
                    <button onClick={() => clearFilter("region")} className="font-bold">×</button>
                  </span>
                )}
                {(selectedSaler || selectedStatus || selectedPaymentType || selectedPayment || selectedRegion) && (
                  <button
                    onClick={clearAllFilters}
                    className="ml-2 text-sm underline font-bold text-gray-900 hover:text-[#D3423E]"
                  >
                    Limpiar todos
                  </button>
                )}
              </div>
              <div className="mt-5 border border-gray-400 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                    <thead className="text-xs text-gray-700 bg-gray-200 border-b border-gray-300">
                      <tr>
                        <th className="px-4 py-3 uppercase">Fecha de creación</th>
                        <th className="px-4 py-3 uppercase">Ciudad</th>
                        <th className="px-4 py-3 uppercase">Nombre</th>
                        <th className="px-4 py-3 uppercase">Tipo de Pago</th>
                        <th className="px-4 py-3 uppercase">Vendedor</th>
                        <th className="px-4 py-3 uppercase">Estado de pago</th>
                        <th className="px-4 py-3 uppercase">Total</th>
                        <th className="px-4 py-3 uppercase">Saldo por pagar</th>
                        <th className="px-4 py-3 uppercase">Días de mora</th>
                        <th className="px-4 py-3 uppercase"></th>
                        <th className="px-4 py-3 uppercase"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading1 ? (
                        <tr>
                          <td colSpan="11" className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Spinner size="lg" />
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="11" className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center justify-center text-red-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414 1.414A8 8 0 115.636 5.636L4.222 4.222A10 10 0 1020 10a9.95 9.95 0 00-1.636-4.364z" />
                              </svg>
                              <p className="text-lg font-bold">Ocurrió un error al cargar los datos</p>
                              <p className="text-sm text-gray-400 mt-1">Revisa tu conexión o intenta nuevamente.</p>
                            </div>
                          </td>
                        </tr>
                      ) : salesData.length === 0 ? (
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
                      ) : (
                        salesData.map((item) => (
                          <tr key={item._id} onClick={() => goToClientDetails(item)} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">
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
                            <td className="px-4 py-3 text-gray-900">{item.region}</td>
                            <td className="px-4 py-3 text-gray-900">{item.id_client.name + " " + item.id_client.lastName}</td>
                            <td className="px-4 py-3 text-gray-900 font-bold">
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
                            <td className="px-4 py-3 text-gray-900">{item.salesId.fullName + " " + item.salesId.lastName}</td>
                            <td className="px-4 py-3 text-gray-900 font-bold">
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
                            <td className="px-4 py-3 text-gray-900 font-bold text-lg">{item.totalAmount}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {item.restante}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {item.diasMora}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {item.orderStatus === "aproved" && (
                                <FaCheckCircle className="text-green-500 text-lg" />
                              )}
                              {item.orderStatus === "En Ruta" && (
                                <FaTruck className="text-blue-500 text-lg" />
                              )}

                              {item.orderStatus === "cancelled" && (
                                <FaTimesCircle className="text-red-500 text-lg" />
                              )}

                              {item.orderStatus === "created" && (
                                <FaExclamationCircle className="text-yellow-400 text-lg" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => {

                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === item._id ? null : item._id);
                                }}
                                className="text-gray-900 bg-white font-bold py-1 px-3 rounded"
                                aria-label="Opciones"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <circle cx="10" cy="4" r="2" />
                                  <circle cx="10" cy="10" r="2" />
                                  <circle cx="10" cy="16" r="2" />
                                </svg>
                              </button>
                              {openMenuId === item._id && (
                                <div
                                  className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowEditModal(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Confirmar pedido
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDelete(item._id);
                                      setOpenMenuId(null);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                  >
                                    Eliminar pedido
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-100 border-t mb-2 mt-2 border-gray-300">
                    <div className="text-m">Total de Ítems: <span className="font-semibold">{items}</span></div>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 pb-4">
                      <div className="flex mb-4 justify-end items-center pt-4">
                        <label htmlFor="itemsPerPage" className="mr-2 text-m font-bold text-gray-700">
                          Ítems por página:
                        </label>
                        <select
                          id="itemsPerPage"
                          value={itemsPerPage}
                          onChange={(e) => {
                            const selectedValue = Number(e.target.value);
                            setItemsPerPage(selectedValue);
                            setPage(1);
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
            </div>
          </div>
        )}
      </div>
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-[700px]">

            {showSuccessCheck ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg mb-4">
                  <FaCheckCircle className="text-green-500" size={80} />
                </div>
                <h2 className="text-2xl font-bold text-green-600">Pedido Confirmado</h2>
              </motion.div>
            ) : showCancelCheck ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-4">
                  <FaTimesCircle className="text-red-500" size={80} />
                </div>
                <h2 className="text-2xl font-bold text-red-600">Pedido Rechazado</h2>
              </motion.div>
            ) : (
              <>
                {selectedItem.orderStatus === "created" && (
                  <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Aprobar Pedido</h2>
                )}

                {selectedItem.orderStatus === "aproved" && (
                  <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Pedido aprobado</h2>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex justify-center mb-4"
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                        <FaCheckCircle className="text-green-500" size={60} />
                      </div>
                    </motion.div>
                  </>
                )}
                {selectedItem.orderStatus === "cancelled" && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex flex-col items-center justify-center"
                    >
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-4">
                        <FaTimesCircle className="text-red-500" size={80} />
                      </div>
                      <h2 className="text-2xl font-bold text-red-600">Pedido Denegado</h2>
                    </motion.div>
                  </>
                )}
                {selectedItem.orderStatus === "created" && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Número de Nota:</label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.receiveNumber}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Monto a Pagar:</label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.totalAmount}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-1 text-sm font-medium text-gray-700">¿Quiere aprobar el pedido?</label>
                      <select
                        value={selectedItem.confirmed || ""}
                        onChange={(e) => setSelectedItem({ ...selectedItem, confirmed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="aproved">Confirmado</option>
                        <option value="cancelled">Rechazado</option>
                      </select>
                    </div>

                  </div>
                )}
                {selectedItem.orderStatus === "created" && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-1/2 px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={() => uploadProducts(selectedItem._id)}
                      className="w-1/2 px-4 py-2 bg-[#D3423E] text-white font-bold uppercase rounded-3xl"
                    >
                      Guardar
                    </button>
                  </div>
                )}

                {selectedItem.orderStatus === "aproved" && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-full px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
                {selectedItem.orderStatus === "cancelled" && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-full px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
                {selectedItem.orderStatus === "En Ruta" && (
                  <>
                    <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Pedido en ruta</h2>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex justify-center mb-4"
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
                        <FaTruck className="text-blue-500" size={60} />
                      </div>
                    </motion.div>
                    <p className="text-center text-blue-600 font-semibold text-lg mb-4">En camino al destino</p>

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="w-full px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                )}

              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
const Card = ({ icon, label, value, bgColor, textColor }) => (
  <div className="bg-white p-4 border border-gray-300 rounded-2xl shadow-md flex items-center gap-4">
    <div className={`p-3 ${bgColor} ${textColor} rounded-full`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-800 text-sm">{label}</p>
      <h2 className="text-2xl font-bold text-gray-800 mt-1">{value}</h2>
    </div>
  </div>
);
export default OrderView;
