import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FiGrid, FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { MdEdit } from "react-icons/md";
import { FaBox, FaTimes, FaPlus, FaTags, FaPercent, FaDollarSign, FaFire, FaCheckCircle, FaImage, FaFileExport, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import SuccessModal from "../Components/modal/SuccessModal";
import ErrorModal from "../Components/modal/ErrorModal";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FALLBACK_IMAGE = "https://via.placeholder.com/200?text=Sin+imagen";

const ProductView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedId, setEditedId] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedPriceId, setEditedPriceId] = useState("");
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showImageModal, setShowImageModal] = useState(null);

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/product/id", {
        id_user: user,
        status: false,
        page: pageNumber,
        limit: itemsPerPage,
        search: searchTerm,
        category: selectedCategory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.total || response.data.products?.length || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [user, token, itemsPerPage, searchTerm, selectedCategory]);

  useEffect(() => {
    const delay = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, itemsPerPage, selectedCategory, fetchProducts]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id",
        { userId: user, id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategoriesList(response.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [user, token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openEditModal = (item) => {
    setEditingProduct(item);
    setEditedId(item._id || "");
    setEditedName(item.productName || "");
    setEditedPrice(item.priceId?.price || "");
    setEditedPriceId(item.priceId?._id || "");
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    if (!editingProduct || !editedName.trim() || !editedPrice) return;
    setSubmitting(true);
    try {
      await axios.put(API_URL + "/whatsapp/product/price/id", {
        productId: editedId,
        priceId: editedPriceId,
        newName: editedName,
        newPrice: editedPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessModal(true);
      setShowEditModal(false);
      fetchProducts(page);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      setErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const exportToExcel = async () => {
    if (!salesData.length) return;
    try {
      const response = await axios.post(API_URL + "/whatsapp/product/id", {
        id_user: user,
        status: false,
        page: 1,
        limit: items || 1000,
        search: searchTerm,
        category: selectedCategory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allData = response.data.products || [];

      const ws = XLSX.utils.json_to_sheet(
        allData.map((item) => ({
          "Producto": item.productName || "",
          "Categoría": item.categoryId?.categoryName || "",
          "Precio": item.priceId?.price || 0,
          "Oferta": item.priceId?.offerPrice || "",
          "Descuento": item.priceId?.discount || ""
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Productos");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer], { type: "application/octet-stream" }),
        `Productos_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
    return sortOrder === "asc" ? <FaSortUp className="text-[#D3423E]" size={10} /> : <FaSortDown className="text-[#D3423E]" size={10} />;
  };

  const filteredAndSorted = [...salesData].sort((a, b) => {
    let valA, valB;
    switch (sortBy) {
      case "name":
        valA = (a.productName || "").toLowerCase();
        valB = (b.productName || "").toLowerCase();
        break;
      case "price":
        valA = Number(a.priceId?.price || 0);
        valB = Number(b.priceId?.price || 0);
        break;
      case "category":
        valA = (a.categoryId?.categoryName || "").toLowerCase();
        valB = (b.categoryId?.categoryName || "").toLowerCase();
        break;
      default: return 0;
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const stats = {
    total: items,
    onOffer: salesData.filter(p => p.priceId?.offerPrice).length,
    withDiscount: salesData.filter(p => p.priceId?.discount && p.priceId?.discount !== "0%").length,
    categories: new Set(salesData.map(p => p.categoryId?._id).filter(Boolean)).size
  };

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <FaBox className="text-[#D3423E]" />
              Productos
            </h1>
            <p className="text-sm text-gray-500">Gestiona tu catálogo de productos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              disabled={!salesData.length}
              className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 font-semibold text-sm transition-all ${salesData.length ? 'bg-white text-gray-700 border-gray-300 hover:border-[#D3423E] hover:text-[#D3423E]' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
            >
              <FaFileExport size={14} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <PrincipalBUtton onClick={() => navigate("/product/creation")} icon={FaPlus}>
              Nuevo Producto
            </PrincipalBUtton>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total productos"
            value={stats.total}
            icon={<FaBox />}
            color="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="En oferta"
            value={stats.onOffer}
            icon={<FaFire />}
            color="bg-orange-100 text-orange-700"
          />
          <StatCard
            label="Con descuento"
            value={stats.withDiscount}
            icon={<FaPercent />}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            label="Categorías"
            value={categoriesList.length}
            icon={<FaTags />}
            color="bg-purple-100 text-purple-700"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <TextInputFilter
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onEnter={() => fetchProducts(1)}
                  placeholder="Buscar producto..."
                />
              </div>
              <div className="relative">
                <FaTags className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="app-select"
                >
                  <option value="">Todas las categorías</option>
                  {categoriesList.map((category) => (
                    <option key={category._id} value={category._id}>{category.categoryName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCategory && (
                <span className="bg-[#D3423E] text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-2">
                  {categoriesList.find(c => c._id === selectedCategory)?.categoryName || "Categoría"}
                  <button onClick={() => setSelectedCategory("")} className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5">
                    <FaTimes size={10} />
                  </button>
                </span>
              )}

              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "table" ? 'bg-white text-[#D3423E] shadow-sm' : 'text-gray-600'}`}
                  title="Tabla"
                >
                  <FiList size={16} />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "cards" ? 'bg-white text-[#D3423E] shadow-sm' : 'text-gray-600'}`}
                  title="Tarjetas"
                >
                  <FiGrid size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#D3423E] mb-3"></div>
              <p className="text-sm">Cargando productos...</p>
            </div>
          ) : salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaBox className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-semibold">Sin productos</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || selectedCategory ? "Ajusta los filtros para ver resultados" : "Agrega tu primer producto"}
              </p>
              {!searchTerm && !selectedCategory && (
                <button
                  onClick={() => navigate("/product/creation")}
                  className="mt-4 px-4 py-2 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Agregar producto
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3"></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">Producto {getSortIcon("name")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("price")}>
                      <div className="flex items-center gap-1">Precio {getSortIcon("price")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold text-center">Oferta</th>
                    <th className="px-4 py-3 font-semibold text-center">Descuento</th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("category")}>
                      <div className="flex items-center gap-1">Categoría {getSortIcon("category")}</div>
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((item) => (
                    <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-12 h-12 object-contain rounded-lg bg-gray-50 cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => setShowImageModal(item)}
                            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaImage className="text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900">{item.productName || "Sin nombre"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">
                          {item.priceId?.price ? `Bs. ${Number(item.priceId.price).toFixed(2)}` : "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.priceId?.offerPrice ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                            <FaFire size={9} />
                            Bs. {item.priceId.offerPrice}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.priceId?.discount && item.priceId.discount !== "0%" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                            <FaPercent size={9} />
                            {item.priceId.discount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.categoryId?.categoryName ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                            <FaTags size={9} />
                            {item.categoryId.categoryName}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin categoría</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredAndSorted.map((item) => {
                const hasOffer = item.priceId?.offerPrice;
                const hasDiscount = item.priceId?.discount && item.priceId?.discount !== "0%";
                return (
                  <motion.div
                    key={item._id}
                    whileHover={{ y: -2 }}
                    className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative bg-gray-50 p-3 group">
                      {hasOffer && (
                        <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FaFire size={9} />
                          OFERTA
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{item.priceId.discount}
                        </span>
                      )}
                      {item.productImage ? (
                        <img
                          className="w-full h-32 object-contain cursor-pointer"
                          src={item.productImage}
                          alt={item.productName}
                          onClick={() => setShowImageModal(item)}
                          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center">
                          <FaImage className="text-gray-300 text-4xl" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[40px]">
                        {item.productName || "Sin nombre"}
                      </h3>
                      {item.categoryId?.categoryName && (
                        <p className="text-[10px] text-purple-600 font-semibold mt-1 truncate">
                          {item.categoryId.categoryName}
                        </p>
                      )}
                      <div className="flex-1"></div>
                      <div className="flex items-end justify-between gap-2 mt-2">
                        <div>
                          {hasOffer && (
                            <p className="text-[10px] text-gray-400 line-through">
                              Bs. {item.priceId.price}
                            </p>
                          )}
                          <p className={`text-lg font-bold ${hasOffer ? 'text-orange-600' : 'text-gray-900'}`}>
                            Bs. {hasOffer ? item.priceId.offerPrice : (item.priceId?.price || "0")}
                          </p>
                        </div>
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-9 h-9 bg-red-50 hover:bg-red-100 text-[#D3423E] rounded-lg flex items-center justify-center transition-colors"
                          title="Editar"
                        >
                          <MdEdit size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && salesData.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                  Mostrando <strong className="text-gray-900">{salesData.length}</strong> de <strong className="text-gray-900">{items}</strong> productos
                </span>
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
                    {[5, 12, 20, 50, 100].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {totalPages > 1 && searchTerm === "" && (
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
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
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
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === p ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                      >
                        {p}
                      </button>
                    ))}
                  {page < totalPages - 2 && <span className="px-1 text-gray-400">…</span>}
                  {totalPages > 1 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-[#D3423E] text-white" : "text-gray-700 hover:bg-gray-200"}`}
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
          )}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-gradient-to-br from-[#D3423E] to-red-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <MdEdit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Editar producto</h3>
                    <p className="text-xs text-red-100">Actualiza nombre y precio</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {editingProduct?.productImage && (
                  <div className="flex justify-center">
                    <img
                      src={editingProduct.productImage}
                      alt={editingProduct.productName}
                      className="w-24 h-24 object-contain rounded-xl bg-gray-50 border border-gray-200"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                    Nombre del producto <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <FaBox className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      placeholder="Nombre del producto"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase block mb-1.5">
                    Precio (Bs.) <span className="text-[#D3423E]">*</span>
                  </label>
                  <div className="relative">
                    <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="number"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 text-gray-900 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {editingProduct?.priceId?.price && Number(editedPrice) !== Number(editingProduct.priceId.price) && (
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <FaCheckCircle className="text-green-500" size={10} />
                      Precio anterior: <strong className="text-gray-700">Bs. {editingProduct.priceId.price}</strong>
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!editedName.trim() || !editedPrice || submitting}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${!editedName.trim() || !editedPrice || submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#D3423E] hover:bg-red-700'}`}
                  >
                    {submitting ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(null)}
          >
            <div className="relative max-w-2xl w-full">
              <img
                src={showImageModal.productImage}
                alt={showImageModal.productName}
                className="w-full max-h-[80vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
                <p className="font-bold">{showImageModal.productName}</p>
                {showImageModal.priceId?.price && (
                  <p className="text-sm">Bs. {showImageModal.priceId.price}</p>
                )}
              </div>
              <button
                onClick={() => setShowImageModal(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 shadow-lg"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Producto actualizado correctamente"
      />
      <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al actualizar el producto" />
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-semibold uppercase truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default ProductView;