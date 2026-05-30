import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL, CONTRACT_ADDRESS } from "../config";
import { HiFilter } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";
import { JsonRpcProvider } from "ethers";
import {
  FaCheckCircle, FaTimesCircle, FaEllipsisV, FaCalendarAlt, FaReceipt,
  FaUser, FaDollarSign, FaCheck, FaTimes, FaImage, FaLink, FaShieldAlt
} from "react-icons/fa";
import { FiExternalLink, FiGrid, FiList } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import OrderCalendarView from "./OrderCalendarView";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import DateInput from "../Components/LittleComponents/DateInput";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";

const POLYGON_RPC_URLS = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
  "https://polygon.drpc.org",
];

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
const SHIMMER_STYLE = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite"
};

const SkeletonBox = ({ className = "", style = {} }) => (
  <div
    className={`rounded-lg ${className}`}
    style={{ ...SHIMMER_STYLE, ...style }}
  />
);

const SkeletonStatsRow = () => (
  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
        <SkeletonBox className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-6 w-12" />
        </div>
      </div>
    ))}
    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-4 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-white/20" />
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 bg-white/20 rounded" />
        <div className="h-8 w-10 bg-white/30 rounded" />
        <div className="h-3 w-24 bg-white/20 rounded" />
      </div>
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="border-b border-gray-100">
    <td className="px-4 py-4"><SkeletonBox className="h-4 w-16" /></td>
    <td className="px-4 py-4">
      <div className="space-y-1.5">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="h-3 w-16" />
      </div>
    </td>
    <td className="px-4 py-4"><SkeletonBox className="h-4 w-28" /></td>
    <td className="px-4 py-4"><SkeletonBox className="h-4 w-32" /></td>
    <td className="px-4 py-4"><SkeletonBox className="h-4 w-20 ml-auto" /></td>
    <td className="px-4 py-4"><SkeletonBox className="h-4 w-20 ml-auto" /></td>
    <td className="px-4 py-4"><SkeletonBox className="h-4 w-20 ml-auto" /></td>
    <td className="px-4 py-4"><SkeletonBox className="h-6 w-24 mx-auto rounded-full" /></td>
    <td className="px-4 py-4">
      <div className="flex flex-col items-center gap-1">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-2.5 w-16" />
      </div>
    </td>
    <td className="px-4 py-4"><SkeletonBox className="h-6 w-6 mx-auto rounded" /></td>
  </tr>
);

const SkeletonMobileCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
    <div className="flex justify-between items-start">
      <div className="space-y-1.5">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-3 w-24" />
      </div>
      <SkeletonBox className="h-6 w-24 rounded-full" />
    </div>
    <SkeletonBox className="h-4 w-40" />
    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
      <SkeletonBox className="h-3 w-28" />
      <SkeletonBox className="h-5 w-20" />
    </div>
  </div>
);

const SkeletonTableContainer = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <SkeletonBox className="h-10 w-full max-w-md rounded-xl" />
        <SkeletonBox className="h-10 w-28 rounded-xl" />
        <div className="ml-auto text-right space-y-1.5">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-5 w-24" />
        </div>
      </div>
    </div>

    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-200 border-b border-gray-200">
          <tr>
            {["Nota", "Fecha", "Vendedor", "Cliente", "Pago", "Total", "Deuda", "Estado", "Blockchain", ""].map((header, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <SkeletonBox className="h-3 w-16" style={{ background: "#d1d5db" }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => <SkeletonTableRow key={i} />)}
        </tbody>
      </table>
    </div>

    <div className="lg:hidden p-4 space-y-3">
      {[...Array(4)].map((_, i) => <SkeletonMobileCard key={i} />)}
    </div>

    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
      <SkeletonBox className="h-4 w-40" />
      <SkeletonBox className="h-8 w-64 rounded-lg" />
    </div>
  </div>
);

const PaymentSkeletons = () => (
  <>
    <SkeletonStatsRow />
    <SkeletonTableContainer />
  </>
);
const extractTxHash = (item) => {
  return (
    item?.txHash ||
    item?.tx_hash ||
    item?.transactionHash ||
    item?.transaction_hash ||
    item?.hash ||
    item?.blockchain?.txHash ||
    item?.blockchain?.transactionHash ||
    item?.blockchain?.hash ||
    item?.chain?.txHash ||
    item?.chain?.hash ||
    item?.onChain?.txHash ||
    null
  );
};

const extractBlockNumber = (item) => {
  return (
    item?.blockNumber ||
    item?.block_number ||
    item?.block ||
    item?.blockchain?.blockNumber ||
    item?.blockchain?.block ||
    null
  );
};

const extractContractAddress = (item) => {
  return (
    item?.contractAddress ||
    item?.contract_address ||
    item?.blockchain?.contractAddress ||
    null
  );
};

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("RPC timeout")), ms)),
  ]);
};

const verifyOnChain = async (txHash) => {
  for (const url of POLYGON_RPC_URLS) {
    try {
      const provider = new JsonRpcProvider(url, { chainId: 137, name: "polygon" });
      const receipt = await withTimeout(provider.getTransactionReceipt(txHash), 5000);
      if (receipt) {
        return {
          exists: true,
          blockNumber: receipt.blockNumber,
          status: receipt.status,
          from: receipt.from,
          to: receipt.to,
        };
      }
    } catch (e) {
      continue;
    }
  }
  return { exists: false };
};

const OrderPaymentView = () => {
  const [salesData, setSalesData] = useState([]);
const [initialLoading, setInitialLoading] = useState(true);
const [tableLoading, setTableLoading] = useState(false);
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
  const [copiedHash, setCopiedHash] = useState(null);
  const [verifyingTx, setVerifyingTx] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

const fetchProducts = useCallback(async (pageNumber = 1) => {
    setTableLoading(true);
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

      const rawData = response.data.data || [];

      const normalizedData = rawData.map((item) => ({
        ...item,
        txHash: extractTxHash(item),
        blockNumber: extractBlockNumber(item),
        contractAddress: extractContractAddress(item),
      }));

      if (rawData.length > 0 && !normalizedData.some(i => i.txHash)) {
        console.warn(
          "[OrderPaymentView] Ningún registro tiene txHash. " +
          "Verifica que el backend devuelve el campo en la respuesta de /whatsapp/order/pay/list/id. " +
          "Estructura del primer item:", rawData[0]
        );
      }

      setSalesData(normalizedData);
      setItems(response.data.pagination?.totalRecords || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching products:", error);
      setSalesData([]);
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
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
            "TX Hash": extractTxHash(item) || "",
            "Bloque": extractBlockNumber(item) || "",
            "Contrato": extractContractAddress(item) || "",
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

  const uploadProducts = async (id, orderRef) => {
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
        const trackingOrderId =
          typeof orderRef === "object" && orderRef !== null ? orderRef._id : orderRef;

        await axios.post(API_URL + "/whatsapp/order/track", {
          orderId: trackingOrderId,
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

  const handleVerifyOnChain = async (txHash) => {
    setVerifyingTx(true);
    setVerifyResult(null);
    try {
      const result = await verifyOnChain(txHash);
      setVerifyResult(result);
    } catch (e) {
      setVerifyResult({ exists: false, error: e.message });
    } finally {
      setVerifyingTx(false);
    }
  };

  const stats = {
    total: salesData.length,
    ingresados: salesData.filter(s => s.paymentStatus === "paid").length,
    confirmados: salesData.filter(s => s.paymentStatus === "confirmado").length,
    rechazados: salesData.filter(s => s.paymentStatus === "rechazado").length,
    enBlockchain: salesData.filter(s => s.txHash).length
  };

  const totalAmount = salesData.reduce((sum, s) => sum + (s.total || 0), 0);
  const POLYGON_CONFIG = {
    color: "#8247E5",
    network: "Polygon Mainnet",
    contractShort: `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`,
    polygonScan: `https://polygonscan.com/address/${CONTRACT_ADDRESS}`
  };

  const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return "";
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error("Error copying:", err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl"
        >
          <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-black tracking-wide">POLYGON BLOCKCHAIN VERIFIED</h2>
              </div>

              <p className="text-sm text-purple-100">
                Todos los pagos registrados pueden verificarse públicamente on-chain.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="bg-white/10 px-3 py-1 rounded-full font-mono">{POLYGON_CONFIG.network}</span>
                <span className="bg-white/10 px-3 py-1 rounded-full font-mono">{POLYGON_CONFIG.contractShort}</span>
              </div>
            </div>

            <a
              href={POLYGON_CONFIG.polygonScan}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-purple-700 hover:bg-purple-50 transition-all font-bold px-5 py-3 rounded-xl flex items-center gap-2 self-start"
            >
              Ver contrato
              <FiExternalLink />
            </a>
          </div>
        </motion.div>

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

       {initialLoading ? (
          <PaymentSkeletons />
        ) : (
          <>
            {viewMode === "table" ? (
              <>
                {tableLoading ? (
                  <>
                    <SkeletonStatsRow />
                    <SkeletonTableContainer />
                  </>
                ) : (
                  <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                  <StatCard label="Total" value={stats.total} icon={<FaReceipt />} color="bg-gray-100 text-gray-700" />
                  <StatCard label="Ingresados" value={stats.ingresados} icon={<FaReceipt />} color="bg-blue-100 text-blue-700" />
                  <StatCard label="Confirmados" value={stats.confirmados} icon={<FaCheckCircle />} color="bg-green-100 text-green-700" />
                  <StatCard label="Rechazados" value={stats.rechazados} icon={<FaTimesCircle />} color="bg-red-100 text-red-700" />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-700 p-4 rounded-2xl shadow-xl text-white"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                          <FaLink />
                        </div>
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      </div>

                      <p className="text-xs uppercase text-purple-100 font-bold tracking-wider">On-chain</p>

                      <h3 className="text-3xl font-black mt-1">{stats.enBlockchain}</h3>

                      <p className="text-sm text-purple-100 mt-1">
                        {stats.total > 0
                          ? `${Math.round((stats.enBlockchain / stats.total) * 100)}% verificados`
                          : "0%"}
                      </p>
                    </div>
                  </motion.div>
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
                            const itemTxHash = item.txHash;
                            const hasChain = !!itemTxHash;

                            return (
                              <tr
                                key={item._id}
                                className={`border-b border-gray-100 transition-all hover:bg-gray-50 ${
                                  hasChain
                                    ? "border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-500/10 to-indigo-500/5"
                                    : ""
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <span className="font-bold text-gray-900">#{item.orderId?.receiveNumber}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {item.creationDate ? (
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {new Date(item.creationDate).toLocaleDateString("es-ES", {
                                          day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(item.creationDate).toLocaleTimeString("es-ES", {
                                          hour: "2-digit", minute: "2-digit"
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
                                  <div className="flex justify-center">
                                    {hasChain ? (
                                      <a
                                        href={`https://polygonscan.com/tx/${itemTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex flex-col items-center"
                                      >
                                        <span className="text-[11px] font-mono text-purple-700 font-bold">
                                          {truncateHash(itemTxHash, 8, 6)}
                                        </span>
                                        <span className="text-[10px] text-purple-500 flex items-center gap-1 opacity-70 group-hover:opacity-100">
                                          Polygon
                                          <FiExternalLink size={9} />
                                        </span>
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setVerifyResult(null);
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
                      const hasChain = !!item.txHash;
                      return (
                        <div
                          key={item._id}
                          onClick={() => {
                            setSelectedItem(item);
                            setVerifyResult(null);
                            setShowEditModal(true);
                          }}
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
                              {hasChain ? (
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
                )}
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
                  <InfoField icon={<FaReceipt />} label="Número de nota" value={`#${selectedItem.orderId?.receiveNumber}`} />
                  <InfoField icon={<FaDollarSign />} label="Monto pagado" value={`Bs. ${Number(selectedItem.total).toFixed(2)}`} highlight />
                  <InfoField icon={<FaUser />} label="Cliente" value={`${selectedItem.id_client?.name} ${selectedItem.id_client?.lastName}`} />
                  <InfoField
                    icon={<FaCalendarAlt />}
                    label="Fecha de pago"
                    value={selectedItem.creationDate
                      ? new Date(selectedItem.creationDate).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })
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

                {selectedItem.txHash && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-5 text-white shadow-xl"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                            <h3 className="font-black tracking-wide text-lg">VERIFICADO EN POLYGON</h3>
                          </div>
                          <p className="text-sm text-purple-100">Pago registrado públicamente on-chain</p>
                        </div>
                        <FaCheckCircle className="text-3xl text-green-300" />
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white/10 rounded-xl p-3">
                          <p className="text-[11px] uppercase text-purple-200 font-bold mb-1">Transaction Hash</p>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm break-all">{selectedItem.txHash}</p>
                            <button
                              onClick={() => copyToClipboard(selectedItem.txHash)}
                              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold whitespace-nowrap"
                            >
                              {copiedHash === selectedItem.txHash ? "✓ Copiado" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {selectedItem.blockNumber && (
                            <div className="bg-white/10 rounded-xl p-3">
                              <p className="text-[11px] uppercase text-purple-200 font-bold mb-1">Bloque</p>
                              <p className="font-mono text-sm">#{Number(selectedItem.blockNumber).toLocaleString()}</p>
                            </div>
                          )}

                          {selectedItem.contractAddress && (
                            <div className="bg-white/10 rounded-xl p-3">
                              <p className="text-[11px] uppercase text-purple-200 font-bold mb-1">Contrato</p>
                              <p className="font-mono text-xs break-all">{truncateHash(selectedItem.contractAddress, 6, 4)}</p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleVerifyOnChain(selectedItem.txHash)}
                          disabled={verifyingTx}
                          className="w-full bg-white/20 hover:bg-white/30 transition-all rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {verifyingTx ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                              Verificando on-chain...
                            </>
                          ) : (
                            <>
                              <FaShieldAlt size={12} />
                              Verificar autenticidad en Polygon
                            </>
                          )}
                        </button>

                        {verifyResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl p-3 text-sm ${
                              verifyResult.exists ? "bg-green-500/20 border border-green-400/30" : "bg-red-500/20 border border-red-400/30"
                            }`}
                          >
                            {verifyResult.exists ? (
                              <>
                                <p className="font-bold flex items-center gap-2 mb-1">
                                  <FaCheckCircle className="text-green-300" />
                                  TX confirmada on-chain
                                </p>
                                <p className="text-xs text-purple-100">
                                  Status: <span className="font-mono">{verifyResult.status === 1 ? "Exitosa" : "Fallida"}</span>
                                </p>
                                <p className="text-xs text-purple-100">
                                  Bloque: <span className="font-mono">#{verifyResult.blockNumber?.toLocaleString()}</span>
                                </p>
                              </>
                            ) : (
                              <p className="font-bold flex items-center gap-2">
                                <FaTimesCircle className="text-red-300" />
                                No se pudo confirmar (RPCs ocupados, intenta de nuevo)
                              </p>
                            )}
                          </motion.div>
                        )}

                        <a
                          href={`https://polygonscan.com/tx/${selectedItem.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-2 bg-white text-purple-700 hover:bg-purple-50 transition-all rounded-xl py-3 font-black flex items-center justify-center gap-2"
                        >
                          Ver transacción en PolygonScan
                          <FiExternalLink />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedItem.saleImage && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <FaImage size={10} className="text-gray-600" />
                      <label className="text-xs font-semibold text-gray-600 uppercase">Comprobante</label>
                    </div>
                    <div
                      onClick={() => setShowImageModal(true)}
                      className="relative rounded-xl border-2 border-gray-200 overflow-hidden cursor-pointer hover:border-[#D3423E] transition-colors group"
                    >
                      <img src={selectedItem.saleImage} alt="Recibo" className="w-full max-h-60 object-contain bg-gray-50" />
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