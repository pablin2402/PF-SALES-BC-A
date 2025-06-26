import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import SuccessModal from "../Components/modal/SuccessModal";
import ErrorModal from "../Components/modal/ErrorModal";

const CategoryView = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
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
        {
          userId: user,
          page: page,
          id_owner: user,
          limit: 8,
        }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSalesData(response.data.data);
      setFilteredData(response.data.data);
      setTotalPages(response.data.totalPages);

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
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-4 sm:p-6">
    <div className="mx-auto w-full max-w-full sm:max-w-5xl">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div role="status">
            <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin fill-red-500" viewBox="0 0 100 101">
              <path d="M100 50.59C100 78.2 77.6 100.59 50 100.59 22.39 100.59 0 78.2 0 50.59 0 22.98 22.39 0.59 50 0.59 77.61 0.59 100 22.98 100 50.59ZM9.08 50.59C9.08 73.19 27.4 91.51 50 91.51 72.6 91.51 90.92 73.19 90.92 50.59 90.92 27.99 72.6 9.67 50 9.67 27.4 9.67 9.08 27.99 9.08 50.59Z" fill="currentColor" />
              <path d="M93.97 39.04C96.39 38.4 97.86 35.91 97.01 33.55 95.29 28.82 92.87 24.37 89.82 20.35 85.85 15.12 80.88 10.72 75.21 7.41 69.54 4.1 63.28 1.94 56.77 1.05 51.77 0.37 46.7 0.45 41.73 1.28 39.26 1.69 37.81 4.2 38.45 6.62 39.09 9.05 41.57 10.47 44.05 10.11 47.85 9.55 51.72 9.53 55.54 10.05 60.86 10.78 65.99 12.55 70.63 15.26 75.27 17.96 79.33 21.56 82.58 25.84 84.92 28.91 86.8 32.29 88.18 35.88 89.08 38.22 91.54 39.68 93.97 39.04Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:flex-1">
              <TextInputFilter
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre"
              />
            </div>
            <PrincipalBUtton onClick={() => setShowModal(true)}>Crear Categoría</PrincipalBUtton>
          </div>
  
          <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Categoría del producto</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.categoryName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {totalPages > 1 && searchTerm === "" && (
            <nav className="flex items-center justify-center pt-6 space-x-2 flex-wrap">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"}`}
              >
                ◀
              </button>
  
              <button
                onClick={() => setPage(1)}
                className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
              >
                1
              </button>
  
              {page > 3 && <span className="px-2 text-gray-900">…</span>}
  
              {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                .filter((p) => p > 1 && p < totalPages)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold hover:bg-red-200"}`}
                  >
                    {p}
                  </button>
                ))}
  
              {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}
  
              <button
                onClick={() => setPage(totalPages)}
                className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
              >
                {totalPages}
              </button>
  
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"}`}
              >
                ▶
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  
    {showModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 px-4">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl sm:text-2xl text-left text-gray-900 font-bold mb-4">Crear Nueva Categoría</h2>
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="block p-2 text-sm text-gray-900 border border-gray-900 rounded-2xl w-full bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
          />
  
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setShowModal(false)}
              className="w-1/2 px-4 py-2 font-bold border-2 border-[#D3423E] bg-white text-red-500 uppercase rounded-2xl"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateCategory}
              disabled={newCategory.trim() === ""}
              className={`w-1/2 px-4 py-2 font-bold text-white uppercase rounded-2xl ${newCategory.trim() === "" ? "bg-gray-300 cursor-not-allowed" : "bg-[#D3423E] hover:bg-[#FF9C99]"}`}
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    )}
  
    <SuccessModal
      show={successModal}
      onClose={() => setSuccessModal(false)}
      message="Categoría creada exitosamente"
    />
    <ErrorModal
      show={errorModal}
      onClose={() => setErrorModal(false)}
      message="Error al crear una categoría"
    />
  </div>
  
  );
};

export default CategoryView;
