import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaPlus, FaFileExport } from "react-icons/fa";

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
import SuccessModal from "../Components/modal/SuccessModal";
import ErrorModal from "../Components/modal/ErrorModal";

const ProductView = () => {
  const navigate = useNavigate();
  const products = useProducts();

  const [viewMode, setViewMode] = useState("cards");
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const handleEdit = (item) => { setEditingItem(item); setShowEditModal(true); };

  const handleExport = () => exportProductsToExcel({
    searchTerm: products.searchTerm,
    selectedCategory: products.selectedCategory,
    items: products.items,
    user, token,
  });

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-red-100">
              <FaBox className="text-[#D3423E]" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">Productos</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">Gestiona tu catálogo de productos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!products.salesData.length}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-semibold text-sm transition-all shadow-sm ${
                products.salesData.length
                  ? "bg-white text-gray-700 border-gray-200 hover:border-[#D3423E] hover:text-[#D3423E]"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              <FaFileExport size={14} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <PrincipalBUtton onClick={() => navigate("/product/creation")} icon={FaPlus}>
              Nuevo Producto
            </PrincipalBUtton>
          </div>
        </header>
        <ProductsStats stats={products.stats} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ProductFilters
            {...products}
            viewMode={viewMode} setViewMode={setViewMode}
          />

          {products.loading ? (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" style={{ opacity: 1 - i * 0.07 }} />
              ))}
            </div>
          ) : products.salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <FaBox className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-bold text-lg">Sin productos</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {products.searchTerm || products.selectedCategory
                  ? "Ajusta los filtros para ver resultados"
                  : "Agrega tu primer producto"}
              </p>
              {!products.searchTerm && !products.selectedCategory && (
                <button
                  onClick={() => navigate("/product/creation")}
                  className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#D3423E] to-red-600 text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <FaPlus /> Agregar producto
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
            <div className="px-6 py-4 bg-gradient-to-b from-gray-50/50 to-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                  Mostrando <strong className="text-gray-900">{products.salesData.length}</strong> de{" "}
                  <strong className="text-gray-900">{products.items}</strong> productos
                </span>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <label className="font-semibold">Mostrar:</label>
                  <select
                    value={products.itemsPerPage}
                    onChange={(e) => { products.setItemsPerPage(Number(e.target.value)); products.setPage(1); }}
                    className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#D3423E]"
                  >
                    {[5, 12, 20, 50, 100].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {products.totalPages > 1 && products.searchTerm === "" && (
                <ModernPagination page={products.page} totalPages={products.totalPages} onChange={products.setPage} />
              )}
            </div>
          )}
        </div>
      </div>

      <ProductEditModal
        open={showEditModal}
        item={editingItem}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => { setSuccessModal(true); products.fetchProducts(products.page); }}
        onError={() => setErrorModal(true)}
      />
      <ProductImageModal item={showImageModal} onClose={() => setShowImageModal(null)} />
      <SuccessModal show={successModal} onClose={() => setSuccessModal(false)} message="Producto actualizado correctamente" />
      <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al actualizar el producto" />
    </div>
  );
};

export default ProductView;