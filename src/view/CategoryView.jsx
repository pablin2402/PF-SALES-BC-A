import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import SuccessModal from "../Components/modal/SuccessModal";
import ErrorModal from "../Components/modal/ErrorModal";
import { FaTag, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const CategorySkeleton = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-200 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3">
            <SBox className="h-3 w-40" style={{ background: "#d1d5db" }} />
          </th>
        </tr>
      </thead>
      <tbody>
        {[...Array(8)].map((_, i) => (
          <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.1 }}>
            <td className="px-6 py-4">
              <SBox className="h-4 w-48" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CategoryView = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const handleCreateCategory = async () => {
    try {
      await axios.post(API_URL + "/whatsapp/category", {
        categoryName: newCategory,
        categoryId: "",
        categoryImage: "",
        userId: user,
        id_owner: user,
        categoryColor: "",
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessModal(true);
      setShowModal(false);
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      setErrorModal(true);
    }
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id",
        { userId: user, page, id_owner: user, limit: 10 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.data);
      setFilteredData(response.data.data);
      setTotalPages(response.data.totalPages);
      setItems(response.data.total || response.data.data?.length || 0);
    } catch (error) {
      setErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, [page, user, token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(salesData);
    } else {
      setFilteredData(salesData.filter((item) =>
        item.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  }, [searchTerm, salesData]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <FaTag className="text-[#D3423E]" size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gestiona las líneas de producto</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-[#D3423E] text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 self-start"
          >
            <FaPlus size={12} /> Nueva categoría
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          <div className="p-5 border-b border-gray-200">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoría por nombre..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 rounded-xl outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 focus:bg-white transition-all placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <CategorySkeleton />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nombre de categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map((item, idx) => (
                        <motion.tr
                          key={item._id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: idx * 0.02 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FaTag className="text-[#D3423E]" size={11} />
                              </div>
                              <span className="font-medium text-gray-900">{item.categoryName}</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaTag size={32} className="mb-3 text-gray-300" />
                            <p className="text-base font-semibold text-gray-700">Sin resultados</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {searchTerm ? "Intenta con otro término de búsqueda" : "No hay categorías creadas"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && searchTerm === "" && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Total: <strong className="text-gray-900">{items}</strong> categorías
                  </p>
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className={`p-2 rounded-lg transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                    >
                      <FiChevronLeft size={16} />
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
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaTag className="text-[#D3423E]" size={16} />
                  <h2 className="text-lg font-bold text-gray-900">Nueva categoría</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 transition">
                  <FaTimes />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase">Nombre de la categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Ron, Cerveza, Vino..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && newCategory.trim() && handleCreateCategory()}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => { setShowModal(false); setNewCategory(""); }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={newCategory.trim() === ""}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition ${newCategory.trim() === "" ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#D3423E] text-white hover:bg-red-700"}`}
                >
                  Crear categoría
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessModal show={successModal} onClose={() => setSuccessModal(false)} message="Categoría creada exitosamente" />
      <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al crear una categoría" />
    </div>
  );
};

export default CategoryView;