import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaFileExport, FaLink } from "react-icons/fa";
import { FiExternalLink, FiGrid, FiList } from "react-icons/fi";

import { usePayments } from "../hooks/usePayments";
import { PaymentsStats } from "../Components/payments/PaymentStats";
import { PaymentsFilters } from "../Components/payments/PaymentFilters";
import { PaymentsTable } from "../Components/payments/PaymentsTable";
import { PaymentsMobileCards } from "../Components/payments/PaymentsMobileCard";
import { PaymentDetailModal } from "../Components/payments/PaymentDetailModal";
import { exportPaymentsToExcel } from "../utils/exportPayments";
import { ModernPagination } from "../utils/ModernPagination";
import { CONTRACT_ADDRESS } from "../config";
import OrderCalendarView from "./OrderCalendarView";

const POLYGON_CONFIG = {
  network: "Polygon Mainnet",
  contractShort: `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`,
  polygonScan: `https://polygonscan.com/address/${CONTRACT_ADDRESS}`,
};

const OrderPaymentView = () => {
  const payments = usePayments();
  const [viewMode, setViewMode] = useState("table");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleExport = () => exportPaymentsToExcel({
    searchTerm: payments.searchTerm,
    startDate: payments.startDate,
    endDate: payments.endDate,
    items: payments.items,
    user, token,
  });

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl"
        >
          <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <h2 className="text-xl font-black tracking-wide">POLYGON BLOCKCHAIN VERIFIED</h2>
              </div>
              <p className="text-sm text-purple-100 font-medium">
                Todos los pagos registrados pueden verificarse públicamente on-chain.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="bg-white/10 px-3 py-1.5 rounded-full font-mono font-bold">{POLYGON_CONFIG.network}</span>
                <span className="bg-white/10 px-3 py-1.5 rounded-full font-mono font-bold">{POLYGON_CONFIG.contractShort}</span>
              </div>
            </div>
            <a
              href={POLYGON_CONFIG.polygonScan}
              target="_blank" rel="noopener noreferrer"
              className="bg-white text-purple-700 hover:bg-purple-50 transition-all font-black px-5 py-3 rounded-xl flex items-center gap-2 self-start shadow-lg"
            >
              Ver contrato <FiExternalLink />
            </a>
          </div>
        </motion.div>

        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">Lista de pagos</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">Gestión y validación de pagos con blockchain</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shadow-inner">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                title="Vista de tabla"
              >
                <FiList size={18} />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "calendar" ? "bg-white text-[#D3423E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                title="Vista de calendario"
              >
                <FiGrid size={18} />
              </button>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-2 text-sm shadow-sm"
            >
              <FaFileExport /> Exportar
            </button>
          </div>
        </header>

        {payments.initialLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse h-24" />
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 animate-pulse h-64" />
          </div>
        ) : viewMode === "calendar" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <OrderCalendarView />
          </div>
        ) : (
          <>
            <PaymentsStats stats={payments.stats} />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <PaymentsFilters {...payments} />
              {payments.tableLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <PaymentsTable salesData={payments.salesData} onOpenModal={handleOpenModal} />
                  <PaymentsMobileCards salesData={payments.salesData} onOpenModal={handleOpenModal} />
                </>
              )}

              {!payments.tableLoading && payments.salesData.length > 0 && (
                <div className="px-6 py-4 bg-gradient-to-b from-gray-50/50 to-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>Total: <strong className="text-gray-900">{payments.items}</strong> pagos</span>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="flex items-center gap-2">
                      <label className="font-semibold">Mostrar:</label>
                      <select
                        value={payments.itemsPerPage}
                        onChange={(e) => { payments.setItemsPerPage(Number(e.target.value)); payments.setPage(1); }}
                        className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E]"
                      >
                        {[5, 10, 20, 50, 100].map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  {payments.totalPages > 1 && (
                    <ModernPagination page={payments.page} totalPages={payments.totalPages} onChange={payments.setPage} />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <PaymentDetailModal
        open={showModal}
        item={selectedItem}
        onClose={() => { setShowModal(false); setSelectedItem(null); }}
        onUpdateStatus={payments.updateStatus}
        verifyOnChain={payments.verifyOnChain}
      />
    </div>
  );
};

export default OrderPaymentView;