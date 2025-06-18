import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";
import { HiFilter } from "react-icons/hi";

const ClientView = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [items, setItems] = useState();

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = async (pageNumber) => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        id_owner: user,
        page: pageNumber,
        limit: itemsPerPage,
        searchTerm: searchTerm
      };
      const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
        filters, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      );
      setSalesData(response.data.data);
      setTotalPages(response.data.totalPages);
      setItems(response.data.items);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  const goToClientDetails = (client) => {
    navigate(`/sales/${client._id}`, { state: { client } });
  };
  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 mt-10 relative overflow-x-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-red-500"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por Nombre, apellido"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchProducts(1);
                  }
                }}
                className="block p-2 ps-10 text-m text-gray-900 border border-gray-900 rounded-3xl w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500 h-[42px]"
              />
            </div>

            <button
              onClick={() => fetchProducts(1)}
              className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] hover:bg-white hover:text-[#D3423E] flex items-center gap-2 h-[42px]"
            >
                                  <HiFilter className="text-white text-lg" />

              FILTRAR
            </button>
          </div>



          <button
            onClick={() => navigate("/sales/create")}
            className="px-4 py-2 font-bold text-lg rounded-3xl text-white bg-[#D3423E] flex items-center gap-2"
          >
            <IoPersonAdd />
            Nuevo Vendedor
          </button>
        </div>

        <div className="mt-5 border border-gray-400 rounded-xl">
          <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-3xl overflow-hidden">
            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 uppercase">Nombre</th>
                <th className="px-6 py-3 uppercase">Correo Electronico</th>
                <th className="px-6 py-3 uppercase">Telefono Celular</th>
              </tr>
            </thead>
            <tbody>
              {salesData.length > 0 ? (
                salesData.map((item) => (
                  <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.fullName + " " + item.lastName}</td>
                    <td className="px-6 py-4 text-gray-900">{item.email}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.phoneNumber}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-between px-6 py-4 text-sm text-gray-700 bg-gray-100 border-t border-b mb-2 mt-2 border-gray-300">
            <div className="text-m font-bold">Total de Ítems: <span className="font-semibold">{items}</span></div>
          </div>
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
                    fetchProducts(page);
                  }}
                  className="border-2 border-gray-900 rounded-3xl px-2 py-1 text-m text-gray-700"
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
                      className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                    >
                      {p}
                    </button>
                  ))}

                {page < totalPages - 2 && <span className="px-2 text-gray-900">…</span>}

                {totalPages > 1 && (
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold "}`}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold"}`}
                >
                  ▶
                </button>
              </nav>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ClientView;
