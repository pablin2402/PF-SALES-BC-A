import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL, CONTRACT_ABI, CONTRACT_ADDRESS } from "../config";
import { HiFilter } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";
import { ethers, Contract, id, Interface } from "ethers";
import { FaCheckCircle, FaTimesCircle, FaEllipsisV, FaSearch, FaCalendarAlt, FaReceipt, FaUser, FaDollarSign, FaCheck, FaTimes, FaImage, FaLink } from "react-icons/fa";
import { FiExternalLink, FiGrid, FiList } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import OrderCalendarView from "./OrderCalendarView";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import DateInput from "../Components/LittleComponents/DateInput";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import Spinner from "../Components/LittleComponents/Spinner";

const PAYMENT_STATUS_CONFIG = {
  "paid": {
    label: "Ingresado",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    icon: FaReceipt
  },
  "confirmado": {
    label: "Confirmado",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    icon: FaCheckCircle
  },
  "rechazado": {
    label: "Rechazado",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    icon: FaTimesCircle
  }
};

const OrderPaymentView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applyFilter, setApplyFilter] = useState(false);
  const [items, setItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const getBlockchainPayments = async () => {
    try {
      if (!window.ethereum) return [];

      const provider = new ethers.BrowserProvider(window.ethereum);
      const code = await provider.getCode(CONTRACT_ADDRESS);

      if (code === "0x") {
        console.warn("No existe contrato en esa address en esta red");
        return [];
      }

      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const count = await contract.getPaymentsCount();
      const payments = [];
      for (let i = 0; i < count; i++) {
        const payment = await contract.getPayment(i);
        payments.push({
          orderId: payment[0],
          amount: Number(payment[1]),
          payer: payment[2],
          sender: payment[3],
          timestamp: Number(payment[4]),
          transactionHash: null,
        });
      }

      const contractInterface = new Interface(CONTRACT_ABI);
      const eventTopic = id("PaymentRegistered(string,uint256,string,address,uint256)");

      const logs = await provider.getLogs({
        fromBlock: 0,
        toBlock: "latest",
        address: CONTRACT_ADDRESS,
        topics: [eventTopic],
      });

      for (const log of logs) {
        try {
          const parsed = contractInterface.parseLog(log);
          const orderId = parsed.args[0];
          const match = payments.find((p) => p.orderId === orderId);
          if (match) match.transactionHash = log.transactionHash;
        } catch (e) {
          console.warn("Error parsing log", e);
        }
      }

      return payments;
    } catch (error) {
      console.error("Error fetching payments from blockchain:", error);
      return [];
    }
  };

  const fetchProducts = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    try {
      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        clientName: searchTerm,
      };

      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
        setDateFilterActive(true);
      }

      const response = await axios.post(
        API_URL + "/whatsapp/order/pay/list/id",
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const backendData = response.data.data || [];
      const blockchainPayments = await getBlockchainPayments();
      const mergedData = backendData.map((item) => {
        const blockchainEntry = blockchainPayments.find(
          (payment) => payment.orderId === item._id
        );
        return {
          ...item,
          blockchain: blockchainEntry ? {
            amount: blockchainEntry.amount,
            payer: blockchainEntry.payer,
            sender: blockchainEntry.sender,
            orderId: blockchainEntry.orderId,
            timestamp: blockchainEntry.timestamp,
            transactionHash: blockchainEntry.transactionHash
          } : null,
        };
      });

      setSalesData(mergedData);
      setItems(response.data.pagination?.totalRecords || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, itemsPerPage, searchTerm, startDate, endDate]);

  useEffect(() => {
    fetchProducts(page);
    setApplyFilter(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyFilter, page, itemsPerPage, selectedFilter]);

  const exportToExcel = async () => {
    try {
      const filters = {
        id_owner: user,
        page: 1,
        limit: items,
        clientName: searchTerm,
      };
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }
      const response = await axios.post(API_URL + "/whatsapp/order/pay/list/id", filters, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = response.data.data || [];

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => {
          const creationDateUTC = new Date(item.creationDate);
          creationDateUTC.setHours(creationDateUTC.getHours() - 4);
          const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
          return {
            "Número de Orden": item.orderId?.receiveNumber,
            "Fecha de Pago": formattedDate,
            "Vendedor": `${item.sales_id?.fullName || ""} ${item.sales_id?.lastName || ""}`.trim(),
            "Cliente": `${item.id_client?.name || ""} ${item.id_client?.lastName || ""}`.trim(),
            "Estado": item.paymentStatus || "",
            "Pago": item.total || "",
            "Monto total": item.orderId?.totalAmount || "",
            "Deuda de la nota": item.debt?.toFixed(2) || "",
          };
        })
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pagos_Por_Cliente");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, `Pagos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    if (value === "all" || value === "none") {
      setDateFilterActive(false);
      setStartDate("");
      setEndDate("");
      setApplyFilter(true);
    }
  };

  const clearFilter = (type) => {
    if (type === 'date') {
      setStartDate('');
      setEndDate('');
      setDateFilterActive(false);
      fetchProducts(1);
    }
  };

  const uploadProducts = async (id, orderId1) => {
    setIsProcessing(true);
    try {
      const response = await axios.put(
        API_URL + "/whatsapp/order/pay/status/id",
        {
          _id: id,
          paymentStatus: selectedItem.confirmed,
          reviewer: id_user,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        await axios.post(API_URL + "/whatsapp/order/track", {
          orderId: orderId1._id,
          eventType: "Ha aprobado un pago",
          triggeredBySalesman: id_user,
          triggeredByDelivery: "",
          triggeredByUser: "",
          location: { lat: 0, lng: 0 }
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts(1);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const stats = {
    total: salesData.length,
    ingresados: salesData.filter(s => s.paymentStatus === "paid").length,
    confirmados: salesData.filter(s => s.paymentStatus === "confirmado").length,
    rechazados: salesData.filter(s => s.paymentStatus === "rechazado").length,
    enBlockchain: salesData.filter(s => s.blockchain).length
  };

  const totalAmount = salesData.reduce((sum, s) => sum + (s.total || 0), 0);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Lista de pagos</h1>
            <p className="text-sm text-gray-500">Gestión y validación de pagos con blockchain</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "table" ? 'bg-white text-[#D3423E] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                title="Vista de tabla"
              >
                <FiList size={18} />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "cards" ? 'bg-white text-[#D3423E] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                title="Vista de calendario"
              >
                <FiGrid size={18} />
              </button>
            </div>
            <button
              onClick={exportToExcel}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 text-sm"
            >
              <FaFileExport />
              Exportar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#D3423E] mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Cargando pagos...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                  <StatCard label="Total" value={stats.total} icon={<FaReceipt />} color="bg-gray-100 text-gray-700" />
                  <StatCard label="Ingresados" value={stats.ingresados} icon={<FaReceipt />} color="bg-blue-100 text-blue-700" />
                  <StatCard label="Confirmados" value={stats.confirmados} icon={<FaCheckCircle />} color="bg-green-100 text-green-700" />
                  <StatCard label="Rechazados" value={stats.rechazados} icon={<FaTimesCircle />} color="bg-red-100 text-red-700" />
                  <StatCard label="En blockchain" value={stats.enBlockchain} icon={<FaLink />} color="bg-purple-100 text-purple-700" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <TextInputFilter
                          value={searchTerm}
                          onChange={setSearchTerm}
                          onEnter={() => fetchProducts(1)}
                          placeholder="Buscar por cliente..."
                        />
                      </div>

                      <select
                        value={selectedFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 cursor-pointer"
                      >
                        <option value="none">Filtros</option>
                        <option value="all">Mostrar todos</option>
                        <option value="date">Por fecha</option>
                      </select>

                      {selectedFilter === "date" && (
                        <div className="flex gap-2 flex-wrap">
                          <DateInput value={startDate} onChange={setStartDate} label="Desde" />
                          <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Hasta" />
                          <PrincipalBUtton onClick={() => setApplyFilter(true)} icon={HiFilter}>
                            Aplicar
                          </PrincipalBUtton>
                        </div>
                      )}

                      <div className="ml-auto text-right">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Monto total</p>
                        <p className="text-lg font-bold text-gray-900">Bs. {totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    {dateFilterActive && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                          <FaCalendarAlt size={10} />
                          {startDate} → {endDate}
                          <button onClick={() => clearFilter("date")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                            <FaTimes size={10} />
                          </button>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Nota</th>
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Vendedor</th>
                          <th className="px-4 py-3 font-semibold">Cliente</th>
                          <th className="px-4 py-3 font-semibold text-right">Pago</th>
                          <th className="px-4 py-3 font-semibold text-right">Total</th>
                          <th className="px-4 py-3 font-semibold text-right">Deuda</th>
                          <th className="px-4 py-3 font-semibold text-center">Estado</th>
                          <th className="px-4 py-3 font-semibold text-center">Blockchain</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData.length > 0 ? (
                          salesData.map((item) => {
                            const statusConfig = PAYMENT_STATUS_CONFIG[item.paymentStatus];
                            const StatusIcon = statusConfig?.icon;
                            return (
                              <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <span className="font-bold text-gray-900">#{item.orderId?.receiveNumber}</span>
                                </td>
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
                                <td className="px-4 py-3 text-gray-700 text-xs">
                                  {(item.sales_id || item.delivery_id)?.fullName} {(item.sales_id || item.delivery_id)?.lastName}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {item.id_client?.name} {item.id_client?.lastName}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                  Bs. {Number(item.total).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700">
                                  Bs. {Number(item.orderId?.totalAmount || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={item.debt > 0 ? "text-[#D3423E] font-semibold" : "text-green-600"}>
                                    {item.debt !== undefined ? `Bs. ${item.debt.toFixed(2)}` : "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {statusConfig && (
                                    <div className="flex justify-center">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} text-xs font-bold`}>
                                        <StatusIcon size={10} />
                                        {statusConfig.label}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-center items-center">
                                    {item.blockchain ? (
                                      item.blockchain.transactionHash ? (
                                        <a
                                          href={`https://polygonscan.com/tx/${item.blockchain.transactionHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-xs font-bold transition-colors"
                                          title="Ver en Polygonscan"
                                        >
                                          <FaCheckCircle size={10} />
                                          Ver TX
                                          <FiExternalLink size={10} />
                                        </a>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                          <FaCheckCircle size={10} />
                                          Registrado
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                                        <FaTimesCircle size={10} />
                                        No
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowEditModal(true);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <FaEllipsisV className="text-gray-600" size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="10" className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <FaReceipt className="text-5xl mb-3 text-gray-300" />
                                <p className="text-lg font-semibold">No hay pagos</p>
                                <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden p-4 space-y-3">
                    {salesData.length > 0 ? salesData.map((item) => {
                      const statusConfig = PAYMENT_STATUS_CONFIG[item.paymentStatus];
                      const StatusIcon = statusConfig?.icon;
                      return (
                        <div
                          key={item._id}
                          onClick={() => { setSelectedItem(item); setShowEditModal(true); }}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gray-900">#{item.orderId?.receiveNumber}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.creationDate).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                            {statusConfig && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} text-xs font-bold`}>
                                <StatusIcon size={10} />
                                {statusConfig.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {item.id_client?.name} {item.id_client?.lastName}
                          </p>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                              {item.blockchain ? (
                                <span className="text-purple-700 font-bold flex items-center gap-1">
                                  <FaLink size={10} /> En blockchain
                                </span>
                              ) : "Sin blockchain"}
                            </span>
                            <span className="font-bold text-gray-900">Bs. {Number(item.total).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-12 text-gray-500">
                        <FaReceipt className="text-4xl mb-3 mx-auto text-gray-300" />
                        <p className="font-semibold">Sin pagos</p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Total: <strong className="text-gray-900">{items}</strong> pagos</span>
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
                          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#D3423E]"
                        >
                          {[5, 10, 20, 50, 100].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <nav className="flex items-center gap-1">
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
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <OrderCalendarView />
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showEditModal && selectedItem && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedItem.paymentStatus === "paid" ? "Verificación de pago" : "Detalles del pago"}
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5">Nota #{selectedItem.orderId?.receiveNumber}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoField
                    icon={<FaReceipt />}
                    label="Número de nota"
                    value={`#${selectedItem.orderId?.receiveNumber}`}
                  />
                  <InfoField
                    icon={<FaDollarSign />}
                    label="Monto pagado"
                    value={`Bs. ${Number(selectedItem.total).toFixed(2)}`}
                    highlight
                  />
                  <InfoField
                    icon={<FaUser />}
                    label="Cliente"
                    value={`${selectedItem.id_client?.name} ${selectedItem.id_client?.lastName}`}
                  />
                  <InfoField
                    icon={<FaCalendarAlt />}
                    label="Fecha de pago"
                    value={selectedItem.creationDate
                      ? new Date(selectedItem.creationDate).toLocaleDateString("es-ES", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                      : "-"}
                  />
                  <InfoField
                    icon={<FaDollarSign />}
                    label="Deuda a la fecha"
                    value={selectedItem.debt !== undefined ? `Bs. ${selectedItem.debt.toFixed(2)}` : "-"}
                    danger={selectedItem.debt > 0}
                  />
                  <InfoField
                    icon={<FaDollarSign />}
                    label="Monto total"
                    value={`Bs. ${Number(selectedItem.orderId?.totalAmount || 0).toFixed(2)}`}
                  />
                </div>

                {selectedItem.blockchain && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaLink className="text-purple-600" />
                      <p className="text-sm font-bold text-purple-900">Registrado en blockchain</p>
                    </div>
                    {selectedItem.blockchain.transactionHash && (
                      <a
                        href={`https://polygonscan.com/tx/${selectedItem.blockchain.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-700 hover:text-purple-900 font-mono break-all flex items-center gap-1"
                      >
                        {selectedItem.blockchain.transactionHash}
                        <FiExternalLink className="flex-shrink-0" size={12} />
                      </a>
                    )}
                  </div>
                )}

                {selectedItem.saleImage && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5 flex items-center gap-1">
                      <FaImage size={10} /> Comprobante
                    </label>
                    <div
                      onClick={() => setShowImageModal(true)}
                      className="relative rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-[#D3423E] transition-colors group"
                    >
                      <img
                        src={selectedItem.saleImage}
                        alt="Recibo"
                        className="w-full max-h-60 object-contain bg-gray-50"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 px-3 py-1 rounded-full text-xs font-bold">
                          Ver imagen completa
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.paymentStatus === "paid" && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                      ¿Desea confirmar este pago? <span className="text-[#D3423E]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedItem({ ...selectedItem, confirmed: "confirmado" })}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 justify-center transition-all ${selectedItem.confirmed === "confirmado" ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-400'}`}
                      >
                        <FaCheck size={14} />
                        <span className="font-bold text-gray-600 text-lg">Confirmar</span>
                      </button>
                      <button
                        onClick={() => setSelectedItem({ ...selectedItem, confirmed: "rechazado" })}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 justify-center transition-all ${selectedItem.confirmed === "rechazado" ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-400'}`}
                      >
                        <FaTimes size={14} />
                        <span className="font-bold text-gray-600 text-lg">Rechazar</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {selectedItem.paymentStatus === "paid" ? (
                    <>
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => uploadProducts(selectedItem._id, selectedItem.orderId)}
                        disabled={!selectedItem.confirmed || isProcessing}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${!selectedItem.confirmed || isProcessing ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#D3423E] hover:bg-red-700'}`}
                      >
                        {isProcessing ? 'Guardando...' : 'Guardar'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-full px-4 py-2.5 border-2 border-[#D3423E] bg-white rounded-xl text-[#D3423E] font-bold text-sm hover:bg-red-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageModal && selectedItem?.saleImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl w-full">
              <img
                src={selectedItem.saleImage}
                alt="Comprobante completo"
                className="w-full max-h-[90vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 shadow-lg"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const InfoField = ({ icon, label, value, highlight, danger }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-gray-400 text-xs">{icon}</span>
      <p className="text-[10px] text-gray-500 font-semibold uppercase">{label}</p>
    </div>
    <p className={`text-sm font-bold ${danger ? 'text-[#D3423E]' : highlight ? 'text-green-700' : 'text-gray-900'}`}>
      {value}
    </p>
  </div>
);

export default OrderPaymentView;