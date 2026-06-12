import React from "react";
import { useNavigate } from "react-router-dom";
import { useDeliveryList } from "../hooks/useDeliveryList";
import { useDeliveryFilters } from "../hooks/useDeliveryFilters";
import { fetchDeliveryListAll } from "../hooks/deliveryApi";
import { exportDeliveryToExcel } from "../utils/exportToExcel";
import DeliveryHeader from "../Components/delivery/DeliveryHeader";
import DeliveryStats from "../Components/delivery/DeliveryStats";
import DeliveryToolbar from "../Components/delivery/DeliveryToolBar";
import DeliveryTable from "../Components/delivery/DeliveryTable";
import DeliveryCardsGrid from "../Components/delivery/DeliveryCardsGrid";
import DeliveryEmpty from "../Components/delivery/DeliveryEmpty";
import DeliveryFooter from "../Components/delivery/DeliveryFooter";
import { SkeletonCards, SkeletonTable, SkeletonStats } from "../utils/SkeletonLoading";

const DeliveryView = () => {
  const navigate = useNavigate();

  const {
    salesData, loading,
    page, setPage, totalPages,
    items, itemsPerPage, setItemsPerPage,
    searchTerm, setSearchTerm,
    handleToggle, refetch,
  } = useDeliveryList();

  const {
    statusFilter, setStatusFilter,
    viewMode, setViewMode,
    sortBy, sortOrder, handleSort,
    filteredAndSorted, stats,
  } = useDeliveryFilters(salesData);

  const goToClientDetails = (client) =>
    navigate(`/deliver/${client._id}`, { state: { client, flag: false } });

  const handleExport = async () => {
    const all = await fetchDeliveryListAll({ searchTerm, items });
    exportDeliveryToExcel(all);
  };

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      <div className="max-w-[1600px] mx-auto">
        <DeliveryHeader
          onExport={handleExport}
          canExport={salesData.length > 0}
          onNew={() => navigate("/delivery/creation")}
        />

        {loading && salesData.length === 0
          ? <SkeletonStats />
          : <DeliveryStats stats={stats} statusFilter={statusFilter} onFilterChange={setStatusFilter} />}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <DeliveryToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchEnter={() => refetch(1)}
            statusFilter={statusFilter}
            onClearStatus={() => setStatusFilter("all")}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {loading ? (
            viewMode === "table" ? <SkeletonTable /> : <SkeletonCards />
          ) : filteredAndSorted.length === 0 ? (
            <DeliveryEmpty searchTerm={searchTerm} onCreate={() => navigate("/delivery/creation")} />
          ) : (
            <>
              {viewMode === "table" && (
                <DeliveryTable
                  data={filteredAndSorted}
                  sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}
                  onSelect={goToClientDetails} onToggle={handleToggle}
                />
              )}
              <DeliveryCardsGrid
                data={filteredAndSorted}
                viewMode={viewMode}
                onSelect={goToClientDetails}
                onToggle={handleToggle}
              />
            </>
          )}

          {!loading && filteredAndSorted.length > 0 && (
            <DeliveryFooter
              shown={filteredAndSorted.length}
              total={items}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showPagination={totalPages > 1 && searchTerm === ""}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryView;