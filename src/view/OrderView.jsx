import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";
import { HiFilter, HiOutlineCheckCircle, HiOutlineDocumentAdd, HiX } from "react-icons/hi";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import DateInput from "../Components/LittleComponents/DateInput";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimesCircle, FaExclamationCircle, FaTruck, FaCheckCircle, FaBoxOpen, FaEllipsisV, FaTrash, FaCheck } from "react-icons/fa";
import { MdCancel, MdLocalShipping, MdDoneAll } from 'react-icons/md';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ModernPagination } from "../utils/ModernPagination";
import { SkeletonCards, SkeletonTable, SkeletonStats } from "../utils/SkeletonLoading"
import { StatCard, EmptyState } from "../utils/StatCard";

const ORDER_STATUS_CONFIG = {
  created: { label: "Creado", icon: FaExclamationCircle, color: "bg-yellow-100 text-yellow-700 border-yellow-300", iconColor: "text-yellow-500" },
  aproved: { label: "Aprobado", icon: FaCheckCircle, color: "bg-green-100 text-green-700 border-green-300", iconColor: "text-green-500" },
  "En Ruta": { label: "En Ruta", icon: FaTruck, color: "bg-blue-100 text-blue-700 border-blue-300", iconColor: "text-blue-500" },
  cancelled: { label: "Cancelado", icon: FaTimesCircle, color: "bg-red-100 text-red-700 border-red-300", iconColor: "text-red-500" },
  deliver: { label: "Entregado", icon: FaBoxOpen, color: "bg-emerald-100 text-emerald-700 border-emerald-300", iconColor: "text-emerald-500" }
};

const ACCOUNT_STATUS_CONFIG = {
  "Crédito": "bg-yellow-100 text-yellow-800",
  "Contado": "bg-green-500 text-white",
  "Cheque": "bg-blue-500 text-white"
};

const PAY_STATUS_CONFIG = {
  "Pagado": "bg-green-100 text-green-700",
  "Pendiente": "bg-red-100 text-red-700"
};

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("");
  const [selectedSaler, setSelectedSaler] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showPaymentWarningModal, setShowPaymentWarningModal] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCancelCheck, setShowCancelCheck] = useState(null);
  const [counts, setCounts] = useState(null);
  const [ , setError] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [page, setPage] = useState(1);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNewOrderClick = () => navigate("/order/creation");

  const fetchVendedores = async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
        { id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    setTableLoading(true);
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalesData(response.data.orders || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.totalRecords || 0);
    } catch (error) {
      console.error(error);
      setError(error);
      setSalesData([]);
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchOrdersFilters = async (customFilters) => {
    setStatsLoading(true);
    try {
      const filters = {
        id_owner: user,
        fullName: inputValue,
        ...customFilters,
      };
      const response = await axios.post(API_URL + "/whatsapp/order/filter/id", filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCounts(response.data.counts);
    } catch (error) {
      console.error(error);
    } finally {
      setStatsLoading(false);
    }
  };

  const buildCustomFilters = (statusOverride) => {
    const customFilters = {};
    if (inputValue) customFilters.fullName = inputValue;
    if (statusOverride !== undefined ? statusOverride : selectedStatus) {
      customFilters.status = statusOverride !== undefined ? statusOverride : selectedStatus;
    }
    if (selectedPaymentType) customFilters.paymentType = selectedPaymentType;
    if (selectedSaler) customFilters.salesId = selectedSaler;
    if (selectedPayment) customFilters.payStatus = selectedPayment;
    if (selectedRegion) customFilters.region = selectedRegion;
    if (startDate && endDate) {
      customFilters.startDate = startDate;
      customFilters.endDate = endDate;
    }
    return customFilters;
  };

  const filterByStatus = (status) => {
    const newStatus = selectedStatus === status ? "" : status;
    setSelectedStatus(newStatus);
    const customFilters = buildCustomFilters(newStatus);
    if (startDate && endDate) setDateFilterActive(true);
    if (page === 1) {
      fetchOrdersFilters(customFilters);
      fetchOrders(1, customFilters);
    } else {
      setPage(1);
    }
  };

  const applyFilters = () => {
    const customFilters = buildCustomFilters();
    if (startDate && endDate) setDateFilterActive(true);
    if (page === 1) {
      fetchOrdersFilters(customFilters);
      fetchOrders(1, customFilters);
    } else {
      setPage(1);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchOrders(page),
        fetchOrdersFilters()
      ]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);

  const goToClientDetails = (item) => {
    navigate(`/client/order/${item.id_client}`, {
      state: { products: item.products, files: item, flag: true }
    });
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

    try {
      const response = await axios.post(API_URL + "/whatsapp/order/id", filters, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = response.data.orders;

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => {
          const creationDateUTC = new Date(item.creationDate);
          creationDateUTC.setHours(creationDateUTC.getHours() - 4);
          const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
          return {
            "Código de Cliente": item._id,
            "Nombre": `${item.id_client.name} ${item.id_client.lastName}`,
            "Fecha de confirmación": formattedDate,
            "Tipo de pago": item.accountStatus,
            "Vendedor": `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.trim(),
            "Fecha de Pago": item.dueDate
              ? new Date(item.dueDate).toLocaleDateString("es-ES")
              : new Date(item.creationDate).toLocaleDateString("es-ES"),
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
      saveAs(data, `Pedidos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exportando", error);
    }
  };

  const clearFilter = (type) => {
    const newState = {
      seller: () => setSelectedSaler(""),
      paymentType: () => setSelectedPaymentType(""),
      payment: () => setSelectedPayment(""),
      region: () => setSelectedRegion(""),
      status: () => setSelectedStatus(""),
      date: () => {
        setStartDate("");
        setEndDate("");
        setDateFilterActive(false);
      }
    };
    newState[type]?.();

    setTimeout(() => {
      const customFilters = buildCustomFilters();
      if (type === "seller") delete customFilters.salesId;
      if (type === "paymentType") delete customFilters.paymentType;
      if (type === "payment") delete customFilters.payStatus;
      if (type === "region") delete customFilters.region;
      if (type === "status") delete customFilters.status;
      if (type === "date") {
        delete customFilters.startDate;
        delete customFilters.endDate;
      }
      fetchOrdersFilters(customFilters);
      fetchOrders(1, customFilters);
    }, 0);
  };

  const clearAllFilters = () => {
    setSelectedFilter("");
    setStartDate("");
    setEndDate("");
    setSelectedSaler("");
    setSelectedPaymentType("");
    setSelectedPayment("");
    setSelectedRegion("");
    setSelectedStatus("");
    setDateFilterActive(false);
    setInputValue("");
    if (page === 1) {
      fetchOrdersFilters({});
      fetchOrders(1, {});
    } else {
      setPage(1);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/whatsapp/order/id`, {
        data: { _id: id, id_owner: user },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200 && response.data.success) {
        fetchOrders(1);
        fetchOrdersFilters();
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (selectedItem.confirmed === "aproved") {
        setShowSuccessCheck(true);
        fetchOrders(1);
        fetchOrdersFilters();
        setTimeout(() => {
          setShowEditModal(false);
          setShowSuccessCheck(false);
        }, 2000);
      } else if (selectedItem.confirmed === "cancelled") {
        setShowCancelCheck(true);
        fetchOrders(1);
        fetchOrdersFilters();
        setTimeout(() => {
          setShowEditModal(false);
          setShowCancelCheck(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  const hasActiveFilters = selectedSaler || selectedStatus || selectedPaymentType || selectedPayment || selectedRegion || dateFilterActive || inputValue;

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto">

        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Órdenes de venta</h1>
            <p className="text-sm text-gray-500">Gestiona todos los pedidos desde un solo lugar</p>
          </div>
          {initialLoading || statsLoading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <StatCard
                icon={<HiOutlineDocumentAdd size={24} />}
                label="Sin asignar"
                value={counts?.created || 0}
                color="bg-blue-100"
                textColor="text-blue-600"
                onClick={() => filterByStatus("created")}
                active={selectedStatus === "created"}
              />
              <StatCard
                icon={<HiOutlineCheckCircle size={24} />}
                label="Aprobados"
                value={counts?.aproved || 0}
                color="bg-green-100"
                textColor="text-green-600"
                onClick={() => filterByStatus("aproved")}
                active={selectedStatus === "aproved"}
              />
              <StatCard
                icon={<MdLocalShipping size={24} />}
                label="En Ruta"
                value={counts?.["En Ruta"] || 0}
                color="bg-yellow-100"
                textColor="text-yellow-600"
                onClick={() => filterByStatus("En Ruta")}
                active={selectedStatus === "En Ruta"}
              />
              <StatCard
                icon={<MdDoneAll size={24} />}
                label="Entregados"
                value={counts?.deliver || 0}
                color="bg-purple-100"
                textColor="text-purple-600"
                onClick={() => filterByStatus("deliver")}
                active={selectedStatus === "deliver"}
              />
              <StatCard
                icon={<MdCancel size={24} />}
                label="Cancelados"
                value={counts?.cancelled || 0}
                color="bg-red-100"
                textColor="text-red-600"
                onClick={() => filterByStatus("cancelled")}
                active={selectedStatus === "cancelled"}
              />
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <TextInputFilter
                      value={inputValue}
                      onChange={setInputValue}
                      onEnter={applyFilters}
                      placeholder="Buscar por nombre..."
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="app-select"
                  >
                    <option value="">Más filtros</option>
                    <option value="payment">Estado de pago</option>
                    <option value="date">Fecha</option>
                    <option value="seller">Vendedores</option>
                    <option value="paymentType">Tipo de pago</option>
                    <option value="region">Región</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToExcel}
                    className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 font-semibold text-sm"
                  >
                    <FaFileExport />
                    Exportar
                  </button>
                  <PrincipalBUtton onClick={() => handleNewOrderClick()}>Nuevo Pedido</PrincipalBUtton>
                </div>
              </div>
              {selectedFilter && (
                <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
                  {selectedFilter === "seller" && (
                    <select
                      className="app-select"
                      value={selectedSaler}
                      onChange={(e) => setSelectedSaler(e.target.value)}
                    >
                      <option value="">Todos los vendedores</option>
                      {vendedores.map((v) => (
                        <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                      ))}
                    </select>
                  )}
                  {selectedFilter === "paymentType" && (
                    <select
                      value={selectedPaymentType}
                      onChange={(e) => setSelectedPaymentType(e.target.value)}
                      className="app-select"
                    >
                      <option value="">Todos los tipos</option>
                      <option value="Crédito">Crédito</option>
                      <option value="Contado">Contado</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  )}
                  {selectedFilter === "payment" && (
                    <select
                      value={selectedPayment}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="app-select"
                    >
                      <option value="">Todos los estados</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  )}
                  {selectedFilter === "date" && (
                    <div className="flex gap-2 flex-wrap">
                      <DateInput value={startDate} onChange={setStartDate} label="Desde" />
                      <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Hasta" />
                    </div>
                  )}
                  {selectedFilter === "region" && (
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="app-select"
                    >
                      <option value="">Todas las ciudades</option>
                      <option value="TOTAL CBB">Cochabamba</option>
                      <option value="TOTAL SC">Santa Cruz</option>
                      <option value="TOTAL LP">La Paz</option>
                      <option value="TOTAL OR">Oruro</option>
                    </select>
                  )}
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#D3423E] text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2"
                  >
                    <HiFilter /> Aplicar
                  </button>
                </div>
              )}

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedStatus && ORDER_STATUS_CONFIG[selectedStatus] && (
                    <FilterChip
                      label={ORDER_STATUS_CONFIG[selectedStatus].label}
                      onRemove={() => clearFilter("status")}
                      color="bg-gray-700"
                    />
                  )}
                  {selectedSaler && (
                    <FilterChip
                      label={`Vendedor: ${vendedores.find(v => v._id === selectedSaler)?.fullName || "?"}`}
                      onRemove={() => clearFilter("seller")}
                      color="bg-blue-600"
                    />
                  )}
                  {selectedPaymentType && (
                    <FilterChip label={`Pago: ${selectedPaymentType}`} onRemove={() => clearFilter("paymentType")} color="bg-orange-500" />
                  )}
                  {selectedPayment && (
                    <FilterChip label={`Estado: ${selectedPayment}`} onRemove={() => clearFilter("payment")} color="bg-green-600" />
                  )}
                  {dateFilterActive && (
                    <FilterChip label={`${startDate} → ${endDate}`} onRemove={() => clearFilter("date")} color="bg-purple-600" />
                  )}
                  {selectedRegion && (
                    <FilterChip label={`Región: ${selectedRegion}`} onRemove={() => clearFilter("region")} color="bg-indigo-600" />
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="ml-2 text-sm font-semibold text-gray-600 hover:text-[#D3423E] transition-colors underline"
                  >
                    Limpiar todo
                  </button>
                </div>
              )}
            </div>
            {initialLoading || tableLoading ? (
              <>
                <div className="lg:hidden">
                  <SkeletonCards />
                </div>
                <div className="hidden lg:block">
                  <SkeletonTable />
                </div>
              </>
            ) : salesData.length === 0 ? (
              <EmptyState
                hasFilters={hasActiveFilters}
                onClear={clearAllFilters}
                onCreate={() => navigate("/client/creation")}
              />

            ) : (
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-s text-gray-800 uppercase bg-gray-200 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Ciudad</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Vendedor</th>
                      <th className="px-4 py-3 font-semibold">Pago</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-right">Saldo</th>
                      <th className="px-4 py-3 font-semibold text-center">Mora</th>
                      <th className="px-4 py-3 font-semibold text-center">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      salesData.map((item) => {
                        const statusConfig = ORDER_STATUS_CONFIG[item.orderStatus];
                        const StatusIcon = statusConfig?.icon;
                        return (
                          <tr
                            key={item._id}
                            onClick={() => goToClientDetails(item)}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-700">
                              {item.creationDate ? (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {new Date(item.creationDate).toLocaleDateString("es-ES", {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(item.creationDate).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </p>
                                </div>
                              ) : "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.region}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {item.id_client.name} {item.id_client.lastName}
                            </td>
                            <td className="px-4 py-3">
                              {ACCOUNT_STATUS_CONFIG[item.accountStatus] && (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ACCOUNT_STATUS_CONFIG[item.accountStatus]}`}>
                                  {item.accountStatus.toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.salesId?.fullName} {item.salesId?.lastName}
                            </td>
                            <td className="px-4 py-3">
                              {PAY_STATUS_CONFIG[item.payStatus] && (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PAY_STATUS_CONFIG[item.payStatus]}`}>
                                  {item.payStatus.toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              Bs. {Number(item.totalAmount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              <span className={item.restante > 0 ? "text-[#D3423E] font-semibold" : "text-green-600"}>
                                Bs. {Number(item.restante).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.diasMora > 0 ? (
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                  {item.diasMora} días
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {statusConfig && (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig.color}`}>
                                  <StatusIcon className={statusConfig.iconColor} />
                                  <span>{statusConfig.label}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === item._id ? null : item._id);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Opciones"
                              >
                                <FaEllipsisV className="text-gray-600" />
                              </button>
                              {openMenuId === item._id && !["deliver", "En Ruta", "aproved"].includes(item.orderStatus) && (
                                <div
                                  ref={menuRef}
                                  className="absolute right-4 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowEditModal(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <FaCheck className="text-green-500" />
                                    Confirmar pedido
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (item.totalAmount === item.restante) {
                                        setItemToDelete(item);
                                        setShowConfirmDeleteModal(true);
                                      } else {
                                        setShowPaymentWarningModal(true);
                                      }
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                  >
                                    <FaTrash />
                                    Eliminar pedido
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
            {!initialLoading && !tableLoading && salesData.length > 0 && (
              <>
                <div className="lg:hidden p-4 space-y-3">
                  {
                    salesData.map((item) => {
                      const statusConfig = ORDER_STATUS_CONFIG[item.orderStatus];
                      const StatusIcon = statusConfig?.icon;
                      return (
                        <div
                          key={item._id}
                          onClick={() => goToClientDetails(item)}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-gray-900">{item.id_client.name} {item.id_client.lastName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.creationDate).toLocaleDateString("es-ES")} · {item.region}
                              </p>
                            </div>
                            {statusConfig && (
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${statusConfig.color}`}>
                                <StatusIcon className={statusConfig.iconColor} />
                                {statusConfig.label}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex gap-2 flex-wrap">
                              {ACCOUNT_STATUS_CONFIG[item.accountStatus] && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACCOUNT_STATUS_CONFIG[item.accountStatus]}`}>
                                  {item.accountStatus.toUpperCase()}
                                </span>
                              )}
                              {PAY_STATUS_CONFIG[item.payStatus] && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAY_STATUS_CONFIG[item.payStatus]}`}>
                                  {item.payStatus.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-end border-t border-gray-100 pt-2">
                            <div>
                              <p className="text-xs text-gray-500">Vendedor</p>
                              <p className="text-sm text-gray-700">{item.salesId?.fullName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-lg font-bold text-gray-900">Bs. {Number(item.totalAmount).toFixed(2)}</p>
                              {item.restante > 0 && (
                                <p className="text-xs text-[#D3423E] font-semibold">Saldo: Bs. {Number(item.restante).toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>Total: <strong className="text-gray-900">{items || 0}</strong> pedidos</span>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="itemsPerPage" className="font-semibold">Mostrar:</label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setPage(1);
                        }}
                        className="app-select"
                      >
                        {[5, 10, 20, 50].map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <ModernPagination
                      page={page}
                      totalPages={totalPages}
                      onChange={setPage}
                    />
                  )}
                </div>
              </>

            )}
          </div>
        </div>

      </div>

      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {showSuccessCheck ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-lg mb-4">
                    <FaCheckCircle className="text-green-500" size={60} />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600">¡Pedido Confirmado!</h2>
                </div>
              ) : showCancelCheck ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-lg mb-4">
                    <FaTimesCircle className="text-red-500" size={60} />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600">Pedido Rechazado</h2>
                </div>
              ) : (
                <>
                  {selectedItem?.orderStatus === "created" && (
                    <>
                      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Aprobar Pedido</h2>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block mb-1 text-xs font-semibold text-gray-600 uppercase">Número de Nota</label>
                          <input
                            type="text"
                            disabled
                            value={selectedItem.receiveNumber}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-xs font-semibold text-gray-600 uppercase">Monto</label>
                          <input
                            type="text"
                            disabled
                            value={`Bs. ${Number(selectedItem.totalAmount).toFixed(2)}`}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block mb-1 text-xs font-semibold text-gray-600 uppercase">Acción a realizar</label>
                          <select
                            value={selectedItem.confirmed || ""}
                            onChange={(e) => setSelectedItem({ ...selectedItem, confirmed: e.target.value })}
                            className="app-select"
                          >
                            <option value="">Seleccione una opción</option>
                            <option value="aproved">✓ Aprobar pedido</option>
                            <option value="cancelled">✗ Rechazar pedido</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowEditModal(false)}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => uploadProducts(selectedItem._id)}
                          disabled={!selectedItem.confirmed}
                          className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white ${selectedItem.confirmed ? 'bg-[#D3423E] hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                          Guardar
                        </button>
                      </div>
                    </>
                  )}
                  {selectedItem?.orderStatus === "aproved" && (
                    <StatusModal
                      title="Pedido aprobado"
                      subtitle="Este pedido ya fue aprobado"
                      icon={<FaCheckCircle className="text-green-500" size={60} />}
                      bg="bg-green-100"
                      onClose={() => setShowEditModal(false)}
                    />
                  )}
                  {selectedItem?.orderStatus === "cancelled" && (
                    <StatusModal
                      title="Pedido rechazado"
                      subtitle="Este pedido fue rechazado"
                      icon={<FaTimesCircle className="text-red-500" size={60} />}
                      bg="bg-red-100"
                      onClose={() => setShowEditModal(false)}
                    />
                  )}
                  {selectedItem?.orderStatus === "En Ruta" && (
                    <StatusModal
                      title="Pedido en ruta"
                      subtitle="En camino al destino"
                      icon={<FaTruck className="text-blue-500" size={60} />}
                      bg="bg-blue-100"
                      onClose={() => setShowEditModal(false)}
                    />
                  )}
                  {selectedItem?.orderStatus === "deliver" && (
                    <StatusModal
                      title="Pedido entregado"
                      subtitle="El pedido ha sido entregado exitosamente"
                      icon={<FaBoxOpen className="text-green-500" size={60} />}
                      bg="bg-green-100"
                      onClose={() => setShowEditModal(false)}
                    />
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentWarningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowPaymentWarningModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationCircle className="text-red-500 text-3xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No se puede eliminar</h3>
              <p className="text-sm text-gray-600 mb-6">
                Este pedido ya tiene pagos registrados y no puede ser eliminado.
              </p>
              <button
                onClick={() => setShowPaymentWarningModal(false)}
                className="w-full px-5 py-2.5 font-bold text-white bg-[#D3423E] rounded-xl hover:bg-red-700"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
            onClick={() => setShowConfirmDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-500 text-2xl" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar pedido?</h2>
              <p className="text-sm text-gray-600 mb-6">
                Esta acción no se puede deshacer. ¿Estás seguro?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDelete(itemToDelete._id);
                    setShowConfirmDeleteModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#D3423E] text-white font-bold rounded-xl hover:bg-red-700"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const FilterChip = ({ label, onRemove, color = "bg-gray-600" }) => (
  <span className={`${color} text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2`}>
    {label}
    <button onClick={onRemove} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors">
      <HiX size={14} />
    </button>
  </span>
);

const StatusModal = ({ title, subtitle, icon, bg, onClose }) => (
  <div className="flex flex-col items-center py-6">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`w-24 h-24 ${bg} rounded-full flex items-center justify-center shadow-lg mb-4`}
    >
      {icon}
    </motion.div>
    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    <p className="text-gray-600 mt-1 mb-6">{subtitle}</p>
    <button
      onClick={onClose}
      className="px-6 py-2.5 border-2 border-[#D3423E] bg-white rounded-xl text-[#D3423E] font-bold hover:bg-red-50"
    >
      Cerrar
    </button>
  </div>
);

export default OrderView;