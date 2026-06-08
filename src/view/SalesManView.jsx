import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoPersonAdd } from "react-icons/io5";
import { FaUserTie, FaFileExport } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";

import { useSalesmen } from "../hooks/useSalesMen";
import { SalesmenStats } from "../Components/salesmen/SalesmenStats";
import { SalesmenFilters } from "../Components/salesmen/SalesmenFilters";
import { SalesmenTable } from "../Components/salesmen/SalesmenTable";
import { SalesmenCards } from "../Components/salesmen/SalesmenCards";
import { PasswordModal } from "../Components/salesmen/PasswordModal";
import { ConfirmModal, ResultModal } from "../utils/Modal";
import { SkeletonTable, SkeletonCards } from "../utils/SkeletonLoading";
import { ModernPagination } from "../utils/ModernPagination";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";

const EmptyState = ({ hasFilters, onClear, onCreate }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
      <FaUserTie className="text-gray-300 text-3xl" />
    </div>
    <p className="text-gray-700 font-bold text-lg">{hasFilters ? "Sin resultados" : "Sin vendedores"}</p>
    <p className="text-sm text-gray-500 mt-1 max-w-md font-medium">
      {hasFilters ? "No encontramos vendedores con los filtros actuales." : "Comienza agregando tu primer vendedor."}
    </p>
    <div className="flex gap-2 mt-5">
      {hasFilters ? (
        <button onClick={onClear} className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">
          ↺ Limpiar filtros
        </button>
      ) : (
        <button onClick={onCreate} className="px-4 py-2.5 bg-gradient-to-r from-[#D3423E] to-red-600 text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
          <IoPersonAdd /> Agregar vendedor
        </button>
      )}
    </div>
  </div>
);

const SalesManView = () => {
  const navigate = useNavigate();
  const sm = useSalesmen();

  const [viewMode, setViewMode] = useState("table");
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openPasswordModal = (salesman) => { setSelectedSalesman(salesman); setShowPasswordModal(true); };
  const handleRowClick = (s) => navigate(`/sales/${s._id}`, { state: { client: s } });

  const handleError = (msg) => { setErrorMessage(msg); setShowError(true); };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">

        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-red-100">
              <FaUserTie className="text-[#D3423E]" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">Personal de Ventas</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">Gestiona tu equipo de vendedores</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => sm.exportToExcel(handleError)} disabled={!sm.salesData.length}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-semibold text-sm transition-all shadow-sm ${
                sm.salesData.length ? "bg-white text-gray-700 border-gray-200 hover:border-[#D3423E] hover:text-[#D3423E]" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}>
              <FaFileExport size={14} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <PrincipalBUtton onClick={() => navigate("/sales/create")} icon={IoPersonAdd}>
              Nuevo Vendedor
            </PrincipalBUtton>
          </div>
        </header>

        <SalesmenStats
          stats={sm.stats} loading={sm.loading} salesData={sm.salesData}
          statusFilter={sm.statusFilter} setStatusFilter={sm.setStatusFilter}
        />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <SalesmenFilters
            searchInput={sm.searchInput} setSearchInput={sm.setSearchInput}
            regionFilter={sm.regionFilter} setRegionFilter={sm.setRegionFilter}
            statusFilter={sm.statusFilter} setStatusFilter={sm.setStatusFilter}
            availableRegions={sm.availableRegions}
            viewMode={viewMode} setViewMode={setViewMode}
            hasActiveFilters={sm.hasActiveFilters}
            clearAllFilters={sm.clearAllFilters}
            setPage={sm.setPage}
          />

          {sm.loading ? (
            viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />
          ) : sm.filteredAndSorted.length === 0 ? (
            <EmptyState hasFilters={sm.hasActiveFilters} onClear={sm.clearAllFilters} onCreate={() => navigate("/sales/create")} />
          ) : (
            <>
              {viewMode === "table" && (
                <SalesmenTable
                  filteredAndSorted={sm.filteredAndSorted}
                  sortBy={sm.sortBy} sortOrder={sm.sortOrder} onSort={sm.handleSort}
                  togglingId={sm.togglingId} requestToggle={sm.requestToggle}
                  openPasswordModal={openPasswordModal} onRowClick={handleRowClick}
                />
              )}
              {(viewMode === "cards" || viewMode === "table") && (
                <SalesmenCards
                  filteredAndSorted={sm.filteredAndSorted} viewMode={viewMode}
                  onRowClick={handleRowClick} openPasswordModal={openPasswordModal}
                  requestToggle={sm.requestToggle}
                />
              )}
            </>
          )}

          {!sm.loading && sm.filteredAndSorted.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-b from-gray-50/50 to-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Mostrando <strong className="text-gray-900">{sm.filteredAndSorted.length}</strong> de <strong className="text-gray-900">{sm.items}</strong> vendedores</span>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Mostrar:</label>
                  <select value={sm.itemsPerPage} onChange={e => { sm.setItemsPerPage(Number(e.target.value)); sm.setPage(1); }}
                    className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E]">
                    {[5, 10, 20, 50, 100].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {sm.totalPages > 1 && <ModernPagination page={sm.page} totalPages={sm.totalPages} onChange={sm.setPage} />}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sm.confirmToggle && (
          <ConfirmModal
            title="¿Desactivar vendedor?"
            message={`¿Seguro que quieres desactivar a ${sm.confirmToggle.fullName} ${sm.confirmToggle.lastName}? No podrá acceder al sistema.`}
            confirmText="Desactivar" confirmColor="red"
            loading={sm.togglingId === sm.confirmToggle._id}
            onCancel={() => sm.setConfirmToggle(null)}
            onConfirm={() => sm.handleToggleConfirmed(false, sm.confirmToggle._id, handleError)}
          />
        )}
      </AnimatePresence>

      <PasswordModal
        open={showPasswordModal} salesman={selectedSalesman}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => setShowSuccess(true)}
        onError={handleError}
      />
{showSuccess && (
        <ResultModal open={showSuccess} type="success"
          title="¡Contraseña cambiada!" message="La contraseña se actualizó correctamente."
          onClose={() => setShowSuccess(false)} />
      )}

      {showError && (
        <ResultModal open={showError} type="error"
          title="Ocurrió un error" message={errorMessage || "No se pudo completar la operación."}
          onClose={() => { setShowError(false); setErrorMessage(""); }} />
      )}
    </div>
  );
};

export default SalesManView; 