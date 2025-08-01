import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiGrid, FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { MdEdit } from "react-icons/md";
import { HiFilter } from "react-icons/hi";

import PrincipalBUtton from "../Components/LittleComponents/PrincipalButton";
import TextInputFilter from "../Components/LittleComponents/TextInputFilter";
import SuccessModal from "../Components/modal/SuccessModal";
import ErrorModal from "../Components/modal/ErrorModal";
const ProductView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [editedId, setEditedId] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedPriceId, setEditedPriceId] = useState("");

  const [items, setItems] = useState();
  const [itemsPerPage, setItemsPerPage] = useState(5);


  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  const fetchProducts = async (pageNumber) => {
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
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSalesData(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setItems(response.data.total)
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/category/id",
        {
          userId: user,
          id_owner: user,
        }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategoriesList(response.data.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSaveChanges = async () => {
    if (!editingProduct) return;

    try {
      await axios.put(API_URL + "/whatsapp/product/price/id", {
        productId: editedId,
        priceId: editedPriceId,
        newName: editedName,
        newPrice: editedPrice
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccessModal(true);
      setShowEditModal(false);
      fetchProducts(page);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      setErrorModal(true);
    }
  };
  return (
<div className="bg-white max-h-screen rounded-lg p-5 sm:p-6 md:p-8 lg:p-10">
      <div className="relative overflow-x-auto">
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
          <div className="w-full p-10 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col w-full gap-4">
              <div className="flex justify-end gap-4">
                <PrincipalBUtton onClick={() => navigate("/product/creation")} >                  
                  + Crear Producto
                </PrincipalBUtton>
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="relative flex items-center  w-full max-w-2xl  space-x-4">
                  <div className="relative flex-grow">
                    <TextInputFilter
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onEnter={() => fetchProducts(1)}
                      placeholder="Buscar por nombre"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                  >
                    <option value="">Todas las categorías</option>
                    {categoriesList.map((category) => (
                      <option key={category._id} value={category._id}>{category.categoryName}</option>
                    ))}
                  </select>
                  <PrincipalBUtton onClick={() => fetchProducts(1)} icon={HiFilter}>Filtrar</PrincipalBUtton>
                </div>
              </div>
            </div>
            <div className="flex mt-4 justify-end space-x-2">
              <button
                onClick={() => setViewMode("table")}
                className=" rounded-lg text-sm p-2 text-[#D3423E] w-10 h-10 flex items-center justify-center"
              >
                <FiList className="w-5 h-5 text-gray-900" />
              </button>

              <button
                onClick={() => setViewMode("cards")}
                className=" rounded-lg text-sm p-2 text-[#D3423E] w-10 h-10 flex items-center justify-center"
              >
                <FiGrid className="w-5 h-5 text-gray-900" />
              </button>
            </div>
            {viewMode === "table" ? (
            <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm text-left text-gray-500 rounded-2xl">
                  <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-3 uppercase">Producto</th>
                      <th className="px-6 py-3 uppercase">Precio</th>
                      <th className="px-6 py-3 uppercase">Oferta</th>
                      <th className="px-6 py-3 uppercase">Descuento</th>
                      <th className="px-6 py-3 uppercase">Categoría</th>
                      <th className="px-6 py-3 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>                      
                  {salesData.length > 0 ? (
                    salesData.map((item) => (
                      <tr key={item._id} className="bg-white border-b border-gray-200">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.productName || "Sin nombre"}</td>
                        <td className="px-6 py-4">{item.priceId?.price || "N/A"}</td>
                        <td className="px-6 py-4">{item.priceId?.offerPrice ? item.priceId.offerPrice : "No"}</td>
                        <td className="px-6 py-4">{item.priceId?.discount || "0%"}</td>
                        <td className="px-6 py-4">{item.categoryId?.categoryName || "Sin categoría"}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setEditingProduct(item);
                              setEditedId(item._id || "");
                              setEditedName(item.productName || "");
                              setEditedPrice(item.priceId?.price || "");
                              setEditedPriceId(item.priceId?._id || "");
                              setShowEditModal(true);
                            }}
                            className="text-[#D3423E] bg-white font-bold py-1 px-3 rounded"
                          >
                            <MdEdit size={20} />
                          </button>
                        </td>
                      </tr>
                   ))
                   ) : (
                     <tr>
                       <td colSpan="11" className="px-6 py-10 text-center">
                         <div className="flex flex-col items-center justify-center text-gray-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 114 0v2m-4 4h4m-6-4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4" />
                           </svg>
                           <p className="text-lg font-semibold">No se encontraron coincidencias</p>
                           <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros o busca otra información.</p>
                         </div>
                       </td>
                     </tr>
                   )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={6}>
                        <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-200 border-t mt-2 border-gray-300">
                          <div className="text-m font-bold">
                            Total de Ítems: <span className="font-semibold">{items}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              
                {totalPages > 1 && searchTerm === "" && (
                  <div className="flex justify-between items-center px-6 pb-4">
                    <div className="flex mb-4 justify-end items-center pt-4">
                      <label htmlFor="itemsPerPage" className="mr-2 text-m font-bold text-gray-700">
                        Ítems por página:
                      </label>
                      <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setPage(1);
                          fetchProducts(1);
                        }}
                        className="border-2 border-gray-900 rounded-2xl px-2 py-1 text-m text-gray-700"
                      >
                        {[5, 10, 20, 50, 100].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <nav className="flex items-center justify-center pt-4 space-x-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                          }`}
                      >
                        ◀
                      </button>

                      <button
                        onClick={() => setPage(1)}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"
                          }`}
                      >
                        1
                      </button>

                      {page > 3 && <span className="px-2 text-gray-900 font-bold">…</span>}

                      {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                        .filter((p) => p > 1 && p < totalPages)
                        .map((p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold "
                              }`}
                          >
                            {p}
                          </button>
                        ))}

                      {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}

                      {totalPages > 1 && (
                        <button
                          onClick={() => setPage(totalPages)}
                          className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold "
                            }`}
                        >
                          {totalPages}
                        </button>
                      )}

                      <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E]"
                          }`}
                      >
                        ▶
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5">
                  {salesData.map((item) => (
                    <div key={item._id} className="p-5 border border-gray-400 rounded-2xl shadow-lg flex flex-col">
                      <a href="/#">
                        <img className="w-40 h-40 object-cover mx-auto rounded-lg" src={item.productImage} alt={`Imagen de ${item.productName}`} />
                      </a>
                      <h3 className="mt-2 text-m text-gray-900 font-bold">{item.productName || "Sin nombre"}</h3>
                      <div className="flex-grow"></div>
                      <p className="text-gray-900">{item.categoryId?.categoryName || "Sin categoría"}</p>
                      <div className="flex-grow"></div>
                      <div>
                        <div className="flex items-center justify-start mt-3">
                          <button
                            onClick={() => {
                              setEditingProduct(item);
                              setEditedId(item._id || "");
                              setEditedName(item.productName || "");
                              setEditedPrice(item.priceId?.price || "");
                              setEditedPriceId(item.priceId?._id || "");
                              setShowEditModal(true);
                            }}
                            className="text-[#D3423E] bg-white font-bold py-1 px-3 rounded"
                          >
                            <MdEdit size={20} />

                          </button>
                        </div>
                        <div className="flex items-center justify-end mt-3">

                          <span className="text-3xl font-bold text-gray-900">{item.priceId?.price ? `Bs. ${item.priceId.price}` : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {searchTerm === "" && (

                  <nav className="flex items-center justify-center pt-4 space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                        }`}
                    >
                      ◀
                    </button>

                    <button
                      onClick={() => setPage(1)}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"
                        }`}
                    >
                      1
                    </button>

                    {page > 3 && <span className="px-2 text-gray-900 font-bold">…</span>}

                    {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                      .filter((p) => p > 1 && p < totalPages)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold "
                            }`}
                        >
                          {p}
                        </button>
                      ))}

                    {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}

                    {totalPages > 1 && (
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold "
                          }`}
                      >
                        {totalPages}
                      </button>
                    )}

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E]"
                        }`}
                    >
                      ▶
                    </button>
                  </nav>
                )}
              </div>
            )}

          </div>
        )}
      </div>
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Editar Producto</h2>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Precio</label>
              <input
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
              />
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowEditModal(false)}
                className="w-1/2 px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                className="w-1/2 px-4 py-2 bg-[#D3423E] text-white font-bold uppercase rounded-3xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>

      )}
       <SuccessModal
        show={successModal}
        onClose={() => setSuccessModal(false)}
        message="Producto actualizado correctamente"
      />
      <ErrorModal show={errorModal} onClose={() => setErrorModal(false)} message="Error al actualizar el producto" />
    </div>
  );
};

export default ProductView;
