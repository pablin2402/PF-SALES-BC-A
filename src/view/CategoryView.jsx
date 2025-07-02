import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import SuccessModal from "../Components/modal/SuccessModal";
import ErrorModal from "../Components/modal/ErrorModal";
import Spinner from "../Components/LittleComponents/Spinner";

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
          <Spinner />
        ) : (
          <>
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-gray-900 font-bold text-2xl">Categorías</h1>
              </div>
              <div className="flex flex-col sm:flex-row mt-20 items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:flex-1">
                  <TextInputFilter
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre"
                  />
                </div>
                <PrincipalBUtton onClick={() => setShowModal(true)}>Crear Categoría</PrincipalBUtton>
              </div>
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
