import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileExport } from "react-icons/fa6";
import { FaUserFriends } from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";
import { useClients } from "../hooks/useClients";
import { ClientsStats } from "../Components/clients/ClientsStats";
import { ClientsFilters } from "../Components/clients/ClientsFilters";
import { ClientsTable } from "../Components/clients/ClientsTable";
import { ClientsCards } from "../Components/clients/ClientsCards";
import { EditClientModal } from "../Components/clients/EditClientModal";
import { ResultModal } from "../Components/clients/ResultModal";
import { exportClientsToExcel } from "../utils/exportClientsExcel";
import { SkeletonCards, SkeletonTable } from "../utils/SkeletonLoading";
import { EmptyState } from "../utils/StatCard";
import { ModernPagination } from "../utils/ModernPagination";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";

const ClientView = () => {
  const navigate = useNavigate();
  const clients = useClients();

  const [viewMode, setViewMode] = useState("table");
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleEdit = (item) => { setSelectedItem(item); setOpenDialog(true); };
  const handleRowClick = (client) => navigate(`/client/${client._id}`, { state: { client, flag: false } });

  const handleExport = () => exportClientsToExcel({
    searchTerm: clients.searchInput,
    selectedSaler: clients.selectedSaler,
    selectedRegion: clients.selectedRegion,
    user, token,
    onError: (msg) => { setErrorMessage(msg); setShowError(true); },
  });

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D3423E] to-red-700 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-red-200">
              <FaUserFriends className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">Clientes</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">Gestiona todos los clientes desde un solo lugar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!clients.salesData.length}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-semibold text-sm transition-all shadow-sm ${
                clients.salesData.length
                  ? 'bg-white text-gray-700 border-gray-200 hover:border-[#D3423E] hover:text-[#D3423E]'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              <FaFileExport size={14} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <PrincipalBUtton onClick={() => navigate("/client/creation")} icon={IoPersonAdd}>
              Nuevo Cliente
            </PrincipalBUtton>
          </div>
        </header>

        <ClientsStats stats={clients.stats} salesData={clients.salesData} loading={clients.loading} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ClientsFilters
            {...clients}
            viewMode={viewMode} setViewMode={setViewMode}
          />

          {clients.loading ? (
            <>
              <div className="lg:hidden"><SkeletonCards /></div>
              <div className="hidden lg:block">
                {viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />}
              </div>
            </>
          ) : clients.sortedData.length === 0 ? (
            <EmptyState
              hasFilters={clients.hasActiveFilters}
              onClear={clients.clearAllFilters}
              onCreate={() => navigate("/client/creation")}
            />
          ) : (
            <>
              {viewMode === "table" && (
                <ClientsTable
                  sortedData={clients.sortedData}
                  sortBy={clients.sortBy} 
                  sortOrder={clients.sortOrder}
                  onSort={clients.handleSort}
                  onRowClick={handleRowClick} 
                  onEditClick={handleEdit}
                />
              )}
              {(viewMode === "cards" || viewMode === "table") && (
                <ClientsCards
                  sortedData={clients.sortedData} viewMode={viewMode}
                  onRowClick={handleRowClick} onEditClick={handleEdit}
                />
              )}
            </>
          )}

          {!clients.loading && clients.sortedData.length > 0 && (
            <div className="px-6 py-4 bg-gradient-to-b from-gray-50/50 to-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Total: <strong className="text-gray-900">{clients.items}</strong> clientes</span>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Mostrar:</label>
                  <select
                    value={clients.itemsPerPage}
                    onChange={(e) => { clients.setItemsPerPage(Number(e.target.value)); clients.setPage(1); }}
                    className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E]"
                  >
                    {[5, 10, 20, 50, 100].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {clients.totalPages > 1 && (
                <ModernPagination page={clients.page} totalPages={clients.totalPages} onChange={clients.setPage} />
              )}
            </div>
          )}
        </div>
      </div>

      <EditClientModal
        open={openDialog} item={selectedItem} vendedores={clients.vendedores}
        onClose={() => setOpenDialog(false)}
        onSuccess={() => { setShowSuccess(true); clients.fetchClients(clients.page); }}
        onError={(msg) => { setErrorMessage(msg); setShowError(true); }}
      />
      <ResultModal
        open={showSuccess} type="success"
        title="¡Cliente actualizado!"
        message="Los datos del cliente se actualizaron correctamente."
        onClose={() => setShowSuccess(false)}
      />
      <ResultModal
        open={showError} type="error"
        title="Ocurrió un error"
        message={errorMessage || "No se pudo completar la operación."}
        onClose={() => { setShowError(false); setErrorMessage(""); }}
      />
    </div>
  );
};

export default ClientView;