import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaPlus, FaFileExport, FaExclamationTriangle } from "react-icons/fa";
import { useProducts } from "../hooks/useProducts";
import { ProductsStats } from "../Components/products/ProductsStats";
import { ProductFilters } from "../Components/products/ProductFilters";
import { ProductTable } from "../Components/products/ProductTable";
import { ProductCard } from "../Components/products/ProductCard";
import { ProductEditModal } from "../Components/products/ProductEditModal";
import { ProductImageModal } from "../Components/products/ProductImageModal";
import { exportProductsToExcel } from "../utils/exportProduct";
import { ModernPagination } from "../utils/ModernPagination";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";

const PAGE_SIZES = [5, 12, 20, 50, 100];

const ProductView = () => {
  const navigate = useNavigate();
  const products = useProducts();
  const [viewMode, setViewMode] = useState("cards");
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [exporting, setExporting] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleEdit = (item) => { setEditingItem(item); setShowEditModal(true); };

  const handleCloseEdit = () => { setShowEditModal(false); setEditingItem(null); };

  const handleSaved = () => products.fetchProducts(products.page);

  const handleExport = async () => {
    if (exporting || !products.salesData.length) return;
    setExporting(true);
    try {
      await exportProductsToExcel({
        searchTerm: products.searchTerm,
        selectedCategory: products.selectedCategory,
        items: products.items,
        user, token,
      });
    } finally {
      setExporting(false);
    }
  };

  const handlePageSize = (e) => {
    products.setItemsPerPage(Number(e.target.value));
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <FaBox className="text-[#D3423E]" size={20} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">Productos</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">Gestiona tu catálogo de productos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={!products.salesData.length || exporting}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl flex items-center gap-2 font-semibold text-sm shadow-sm transition hover:border-[#D3423E] hover:text-[#D3423E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700"
            >
              <FaFileExport size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{exporting ? "Exportando…" : "Exportar"}</span>
            </button>
            <PrincipalBUtton onClick={() => navigate("/product/creation")} icon={FaPlus}>
              Nuevo producto
            </PrincipalBUtton>
          </div>
        </header>

        {products.error && (
          <div role="alert" className="mb-4 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
            <FaExclamationTriangle aria-hidden="true" />
            <span className="flex-1">{products.error}</span>
            <button
              type="button"
              onClick={() => products.fetchProducts(products.page)}
              className="px-3 py-1.5 rounded-lg bg-white text-red-700 font-bold hover:bg-red-100 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        <ProductsStats stats={products.stats} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ProductFilters {...products} viewMode={viewMode} setViewMode={setViewMode} />

          {products.loading ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" role="status" aria-label="Cargando productos">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" style={{ opacity: 1 - i * 0.07 }} />
              ))}
              <span className="sr-only">Cargando…</span>
            </div>
          ) : products.salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-20 h-20 rounded-full bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center mb-4">
                <FaBox className="text-gray-300" size={28} aria-hidden="true" />
              </div>
              <p className="text-gray-900 font-bold text-lg">
                {products.searchTerm || products.selectedCategory ? "Sin resultados" : "Sin productos"}
              </p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                {products.searchTerm || products.selectedCategory
                  ? "Ajusta los filtros para ver más productos."
                  : "Empieza agregando tu primer producto al catálogo."}
              </p>
              {!products.searchTerm && !products.selectedCategory && (
                <button
                  type="button"
                  onClick={() => navigate("/product/creation")}
                  className="mt-5 px-5 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-[#bb3330] transition flex items-center gap-2 shadow-lg shadow-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50"
                >
                  <FaPlus aria-hidden="true" /> Agregar producto
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <ProductTable
              sortedData={products.sortedData}
              sortBy={products.sortBy} sortOrder={products.sortOrder}
              onSort={products.handleSort}
              onEdit={handleEdit}
              onImageClick={setShowImageModal}
            />
          ) : (
            <ProductCard
              sortedData={products.sortedData}
              onEdit={handleEdit}
              onImageClick={setShowImageModal}
            />
          )}

          {!products.loading && products.salesData.length > 0 && (
            <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span aria-live="polite">
                  Mostrando <strong className="font-semibold text-gray-900">{products.salesData.length}</strong> de{" "}
                  <strong className="font-semibold text-gray-900">{products.items}</strong> productos
                </span>
                <div className="h-4 w-px bg-gray-300" aria-hidden="true" />
                <label className="flex items-center gap-2">
                  <span className="font-semibold">Mostrar:</span>
                  <select
                    value={products.itemsPerPage}
                    onChange={handlePageSize}
                    className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E] focus-visible:ring-2 focus-visible:ring-[#D3423E]/40"
                  >
                    {PAGE_SIZES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              {products.totalPages > 1 && (
                <ModernPagination page={products.page} totalPages={products.totalPages} onChange={products.setPage} />
              )}
            </div>
          )}
        </div>
      </div>

      <ProductEditModal
        open={showEditModal}
        editingProduct={editingItem}
        onClose={handleCloseEdit}
        onSaved={handleSaved}
      />
      <ProductImageModal item={showImageModal} onClose={() => setShowImageModal(null)} />
    </div>
  );
};

export default ProductView;