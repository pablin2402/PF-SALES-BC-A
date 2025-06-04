import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

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

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      alert("Por favor, ingresa un nombre de categoría.");
      return;
    }
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
      alert("Categoría creada exitosamente.");
      setShowModal(false);
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      alert("Hubo un problema al crear la categoría.");
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
      console.error("Error fetching categories:", error);
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
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div role="status">
              <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
                  <svg className="w-5 h-5 text-red-500 fill-red-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por categoría"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block p-2 ps-10 text-lg text-gray-900 border border-gray-900 rounded-2xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] hover:bg-gray-100 hover:bg-white hover:text-[#D3423E] flex items-center gap-2"
                  >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path>
                  </svg>
                  Crear Categoría
                </button>
              </div>
            </div>
            <div className="mt-5 border border-gray-400 rounded-xl">
              <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3">Categoría del producto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.categoryName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
            </div>
            {totalPages > 1 && searchTerm === "" && (
          <nav className="flex items-center justify-center pt-4 space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${
                page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"
              }`}
            >
              ◀
            </button>

            <button
              onClick={() => setPage(1)}
              className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${
                page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"
              }`}
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
                  className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${
                    page === p ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"
                  }`}
                >
                  {p}
                </button>
              ))}

            {page < totalPages - 2 && <span className="px-2 text-gray-900 font-bold">…</span>}

            {totalPages > 1 && (
              <button
                onClick={() => setPage(totalPages)}
                className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${
                  page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"
                }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${
                page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"
              }`}
            >
              ▶
            </button>
          </nav>
        )}
          </div>
        )}
       
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl text-left text-gray-900 font-bold mb-4">Crear Nueva Categoría</h2>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-2xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 font-bold border-2 border-[#D3423E] bg-white text-red-500 uppercase text-bold rounded-2xl">Cancelar</button>
              <button onClick={handleCreateCategory} className="px-4 py-2 bg-[#D3423E] rounded-2xl font-bold text-white gap-4 uppercase">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryView;
