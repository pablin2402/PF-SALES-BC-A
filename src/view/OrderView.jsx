import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10; 

  const fetchOrders = async (pageNumber) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL+"/whatsapp/order/id", {
        id_owner: "CL-01",
        page: pageNumber,
        limit: limit,
      });

      setSalesData(response.data.orders);
      setFilteredData(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(salesData);
    } else {
      const filtered = salesData.filter((item) =>
        item.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, salesData]);

  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
        <div className="flex items-center justify-between w-full">
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
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
        </div>
        <button
            onClick={() => console.log("Abrir modal de creación")}
            className="flex items-center gap-2 px-4 py-2 bg-[#D3423E] text-white font-medium rounded-lg hover:bg-[#FF7F7A] transition duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            Nuevo Pedido
          </button>
        </div>

        <div className="mt-5 border border-gray-400 rounded-xl">
        <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Referencia</th>
                <th className="px-6 py-3">Fecha confirmación</th>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Vendedor</th>
                <th className="px-6 py-3">Fecha de Pago</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{item.receiveNumber}</td>
                    <td className="px-6 py-4">{item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : ''}</td>

                    <td className="px-6 py-4">{item.razonSocial}</td>
                    <td className="px-6 py-4">{item.totalAmount}</td>
                    <td className="px-6 py-4">
                      {item.accountStatus === "PAID" && (
                        <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                          PAGADO
                        </span>
                      )}
                      {item.accountStatus === "DEUDA" && (
                        <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full">
                          DEUDA
                        </span>
                      )}
                      {item.accountStatus === "INPROCESS" && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                          EN PROCESO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{item.salesId.fullName+" "+item.salesId.lastName}</td>
                    <td className="px-6 py-4">{item.dueDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && searchTerm === "" && (
          <nav className="flex items-center justify-center pt-4 space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}
            >
              ◀
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 border rounded-lg ${page === num ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"}`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"}`}
            >
              ▶
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default OrderView;
