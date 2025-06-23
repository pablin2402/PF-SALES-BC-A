import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { IoPersonAdd } from "react-icons/io5";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../Components/PrincipalButton";
import TextInputFilter from "../Components/TextInputFilter";

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
  const getInitials = (name, lastName) => {
    const firstInitial = name?.charAt(0).toUpperCase() || '';
    const lastInitial = lastName?.charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial;
  };
  const colorClasses = [
    'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-yellow-300',
    'bg-red-800', 'bg-red-900', 'bg-yellow-600', 'bg-yellow-800'
  ];
  const getColor = (name, lastName) => {
    const hash = (name + lastName)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % colorClasses.length;
    return colorClasses[index];
  };
  return (
    <div>
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="relative flex items-center  w-full max-w-2xl  space-x-4">
            <div className="relative flex-grow">
              <TextInputFilter
                value={searchTerm}
                onChange={setSearchTerm}
                onEnter={() => fetchProducts(1)}
                placeholder="Buscar por nombre"
              />
            </div>

            <PrincipalBUtton onClick={() => fetchProducts(1)} icon={HiFilter}>Filtrar</PrincipalBUtton>

          </div>
          <div className="flex justify-end items-center space-x-4">

            <PrincipalBUtton onClick={() => navigate("/sales/create")} icon={IoPersonAdd}>            Nuevo Vendedor
            </PrincipalBUtton>
          </div>
        </div>


        <div className="mt-5 border border-gray-400 rounded-xl">
          <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-3xl overflow-hidden">
          <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
          <tr>
                <th className="px-6 py-3"></th>
                <th className="px-6 py-3 uppercase">Nombre</th>
                <th className="px-6 py-3 uppercase">Correo Electronico</th>
                <th className="px-6 py-3 uppercase">Telefono Celular</th>
                <th className="px-6 py-3 uppercase">Ciudad</th>

              </tr>
            </thead>
            <tbody>
              {salesData.length > 0 ? (
                salesData.map((item) => (
                  <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                     <td className="px-6 py-4 font-medium text-gray-900">
                            <div
                              className={`relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full ${getColor(item.name, item.lastName)}`}
                            >
                              <span className="font-medium text-white">
                                {getInitials(item.fullName, item.lastName)}
                              </span>
                            </div>
                          </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.fullName + " " + item.lastName}</td>
                    <td className="px-6 py-4 text-gray-900">{item.email}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.phoneNumber}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.region}</td>

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
          <div className="flex justify-between px-6 py-4 text-sm text-gray-700 rounded-b-2xl bg-gray-200 border-t lg mt-2 border-gray-300">
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
