import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";

const OrderView = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 8; 
  const navigate = useNavigate();

  const fetchOrders = async (pageNumber) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_URL+"/whatsapp/order/id", {
        id_owner: "CL-01",
        page: pageNumber,
        limit: limit,
      });
      console.log(response.data.orders)
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
        item.id_client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, salesData]);
 
  const calculateDaysRemaining = (dueDate, creationDate) => {
    if (!dueDate) return '0';

    const due = new Date(dueDate);
    const today = new Date();
  
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    return `${diffDays}`;
  
  };

  return (
    <div className="bg-white min-h-screen shadow-lg rounded-lg p-5">
      <div className="ml-10 mr-10 relative overflow-x-auto">
      {loading ? (
          <div className="flex justify-center items-center h-64">
            <div role="status">
            <svg aria-hidden="true" class="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-red-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
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
           onClick={() => navigate("/order/creation")}
          
            className="flex items-center gap-2 px-4 py-2 bg-[#D3423E] text-lg text-white font-bold rounded-lg hover:bg-[#FF7F7A] transition duration-200"
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
                <th className="px-6 py-3">Tipo de Pago</th>
                <th className="px-6 py-3">Vendedor</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Fecha de Pago</th>
                <th className="px-6 py-3">Días de mora</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{item.receiveNumber}</td>
                    <td className="px-6 py-4 text-gray-900">{item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : ''}</td>

                    <td className="px-6 py-4 text-gray-900">{item.id_client.name +" "+item.id_client.lastName}</td>
                    <td className="px-6 py-4 text-gray-900">{item.totalAmount}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">
                      {item.accountStatus === "credito" && (
                        <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full">
                          CRÉDITO
                        </span>
                      )}
                      {item.accountStatus === "pending" && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                          CONTADO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{item.salesId.fullName+" "+item.salesId.lastName}</td>
                    <td className="px-6 py-4 text-m text-gray-900 font-bold">
                      {item.orderStatus === "deliver" && (
                        <span className="bg-orange-400 text-m text-white px-3.5 py-0.5 rounded-full">
                          ENTREGAR
                        </span>
                      )}
                      {item.accountStatus === "delivered" && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                          ENTREGADO
                        </span>
                      )}
                      {item.accountStatus === "delivering" && (
                        <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full">
                          EN CAMINO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : new Date(item.creationDate).toLocaleDateString("es-ES")}</td>
                    <td className="px-6 py-4 text-gray-900">      
                      {calculateDaysRemaining(item.dueDate, item.creationDate)}
                    </td>
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
         )}
      </div>
      
    </div>
  );
};

export default OrderView;
