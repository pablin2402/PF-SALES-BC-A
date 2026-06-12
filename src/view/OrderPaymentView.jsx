import React, { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaFileExport } from "react-icons/fa";
import { FiExternalLink, FiGrid, FiList, FiCopy, FiCheck, FiInbox, FiShield } from "react-icons/fi";

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


const BRAND = "#D3423E";

const POLYGON_CONFIG = {
  network: "Polygon Mainnet",
  contractShort: `${CONTRACT_ADDRESS.slice(0, 6)}…${CONTRACT_ADDRESS.slice(-4)}`,
  polygonScan: `https://polygonscan.com/address/${CONTRACT_ADDRESS}`,
};

const PAGE_SIZES = [5, 10, 20, 50, 100];


const BlockchainBar = ({ reducedMotion }) => {
  const [copied, setCopied] = useState(false);

  const copyContract = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
    }
  }, []);

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-label="Verificación en blockchain"
      className="mb-6 rounded-2xl bg-[#16181D] text-white shadow-lg ring-1 ring-black/5 overflow-hidden"
    >
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
            <FiShield className="text-emerald-400" aria-hidden="true" />
            {!reducedMotion && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide">Pagos verificables on-chain</p>
            <p className="text-xs text-white/50 truncate">
              Cada registro queda anclado públicamente en {POLYGON_CONFIG.network}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={copyContract}
            aria-label={copied ? "Dirección copiada" : "Copiar dirección del contrato"}
            className="group flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 font-mono text-xs text-white/80 ring-1 ring-white/10 transition hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {POLYGON_CONFIG.contractShort}
            {copied
              ? <FiCheck className="text-emerald-400" aria-hidden="true" />
              : <FiCopy className="text-white/40 group-hover:text-white/80 transition" aria-hidden="true" />}
          </button>
          <a
            href={POLYGON_CONFIG.polygonScan}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#16181D] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Ver en PolygonScan <FiExternalLink aria-hidden="true" />
          </a>
        </div>
      </div>
    </motion.section>
  );
};

const ViewToggle = ({ viewMode, onChange, reducedMotion }) => {
  const options = [
    { id: "table", icon: FiList, label: "Vista de tabla" },
    { id: "calendar", icon: FiGrid, label: "Vista de calendario" },
  ];
  return (
    <div role="group" aria-label="Cambiar vista" className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {options.map(({ id, icon: Icon, label }) => {
        const active = viewMode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            title={label}
            className="relative px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/60"
          >
            {active && (
              <motion.span
                layoutId="view-toggle-pill"
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                aria-hidden="true"
              />
            )}
            <Icon size={18} className={`relative transition-colors ${active ? "text-[#D3423E]" : "text-gray-500 hover:text-gray-800"}`} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Skeleton = ({ className = "", reducedMotion }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-gray-100 ${reducedMotion ? "animate-pulse" : ""} ${className}`}
    aria-hidden="true"
  >
    {!reducedMotion && (
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    )}
  </div>
);

const PageSkeleton = ({ reducedMotion }) => (
  <div className="space-y-6" role="status" aria-label="Cargando pagos">
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-24 border border-gray-200" reducedMotion={reducedMotion} />
      ))}
    </div>
    <Skeleton className="h-64 border border-gray-200" reducedMotion={reducedMotion} />
    <span className="sr-only">Cargando…</span>
  </div>
);

const EmptyState = ({ hasFilters, onClear }) => (
  <div className="py-16 px-6 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-200">
      <FiInbox size={24} className="text-gray-400" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-gray-900">
      {hasFilters ? "Sin resultados para estos filtros" : "Todavía no hay pagos registrados"}
    </h3>
    <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
      {hasFilters
        ? "Prueba con otro rango de fechas o un término de búsqueda distinto."
        : "Cuando se registre el primer pago aparecerá aquí, listo para verificarse on-chain."}
    </p>
    {hasFilters && onClear && (
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#D3423E] hover:text-[#D3423E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/60"
      >
        Limpiar filtros
      </button>
    )}
  </div>
);

const OrderPaymentView = () => {
  const payments = usePayments();
  const reducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState("table");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const hasFilters = Boolean(payments.searchTerm || payments.startDate || payments.endDate);
  const isEmpty = !payments.tableLoading && payments.salesData.length === 0;

  const handleOpenModal = useCallback((item) => {
    setSelectedItem(item);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedItem(null);
  }, []);

  const handleClearFilters = useCallback(() => {
    payments.setSearchTerm?.("");
    payments.setStartDate?.(null);
    payments.setEndDate?.(null);
    payments.setPage?.(1);
  }, [payments]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPaymentsToExcel({
        searchTerm: payments.searchTerm,
        startDate: payments.startDate,
        endDate: payments.endDate,
        items: payments.items,
        user,
        token,
      });
    } finally {
      setExporting(false);
    }
  }, [payments.searchTerm, payments.startDate, payments.endDate, payments.items, user, token]);

  const handlePageSize = useCallback((e) => {
    payments.setItemsPerPage(Number(e.target.value));
    payments.setPage(1);
  }, [payments]);

  const totalLabel = useMemo(
    () => new Intl.NumberFormat("es-BO").format(payments.items ?? 0),
    [payments.items],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>

      <div className="mx-auto max-w-[1600px]">
        <BlockchainBar reducedMotion={reducedMotion} />

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900">Pagos</h1>
            <p className="mt-0.5 text-sm font-medium text-gray-500">
              Gestión y validación de pagos con respaldo en blockchain
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} reducedMotion={reducedMotion} />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || payments.initialLoading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-[#D3423E] hover:text-[#D3423E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaFileExport aria-hidden="true" />
              {exporting ? "Exportando…" : "Exportar"}
            </button>
          </div>
        </header>

        {payments.initialLoading ? (
          <PageSkeleton reducedMotion={reducedMotion} />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "calendar" ? (
              <motion.div
                key="calendar"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <OrderCalendarView />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PaymentsStats stats={payments.stats} />

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <PaymentsFilters {...payments} />

                  {payments.tableLoading ? (
                    <div className="space-y-3 p-6" role="status" aria-label="Actualizando resultados">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" reducedMotion={reducedMotion} />
                      ))}
                    </div>
                  ) : isEmpty ? (
                    <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
                  ) : (
                    <>
                      <PaymentsTable salesData={payments.salesData} onOpenModal={handleOpenModal} />
                      <PaymentsMobileCards salesData={payments.salesData} onOpenModal={handleOpenModal} />
                    </>
                  )}

                  {!payments.tableLoading && payments.salesData.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/70 px-6 py-4 sm:flex-row">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span aria-live="polite">
                          Total: <strong className="font-semibold text-gray-900">{totalLabel}</strong> pagos
                        </span>
                        <div className="h-4 w-px bg-gray-300" aria-hidden="true" />
                        <label className="flex items-center gap-2">
                          <span className="font-semibold">Mostrar:</span>
                          <select
                            value={payments.itemsPerPage}
                            onChange={handlePageSize}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold focus:border-[#D3423E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/40"
                          >
                            {PAGE_SIZES.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </label>
                      </div>
                      {payments.totalPages > 1 && (
                        <ModernPagination
                          page={payments.page}
                          totalPages={payments.totalPages}
                          onChange={payments.setPage}
                        />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <PaymentDetailModal
        open={showModal}
        item={selectedItem}
        onClose={handleCloseModal}
        onUpdateStatus={payments.updateStatus}
        verifyOnChain={payments.verifyOnChain}
      />
    </div>
  );
};

export default OrderPaymentView;