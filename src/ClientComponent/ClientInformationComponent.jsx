import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

import { FaBuilding, FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";

export default function ClientInformationComponent() {
  const { id } = useParams();
  
  const [client, setClient] = useState();

  const [loading, setLoading] = useState(true);

  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [idClient, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const fetchClientData = useCallback(async () => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/info/id", {
        _id: id,
      });
      setClientId(response.data[0]._id);
      setClient(response.data);
    } catch (error) {
      console.error("Error al obtener los datos del cliente", error);
    }
  }, [id]);

  useEffect(() => {
      fetchClientData();
  }, [fetchClientData]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/order/id/user", {
        id_owner: "CL-01",
        id_client: idClient,
      });
      setSalesData(response.data || []);
      setFilteredData(response.data || []);
    } catch (error) {
      console.error("Error al obtener los productos", error);
    } finally {
      setLoading(false);
    }
  }, [idClient]); 
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

 const filterData = useCallback(() => {
  let filtered = salesData;

  if (searchTerm.trim() !== "") {
    filtered = filtered.filter((item) =>
      item.receiveNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (startDate && endDate) {
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.creationDate);
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
  }

  setFilteredData(filtered);
}, [searchTerm, startDate, endDate, salesData]); 

useEffect(() => {
  filterData();
}, [filterData]);
  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return '0';

    const due = new Date(dueDate);
    const today = new Date();

    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays}`;

  };

  const navigate = useNavigate();

  const handleRowClick = (item) => {
    console.log(item.products);
    navigate(`/client/order/${item._id}`, { state: { products: item.products, files: item } });
  };
  if (!client) {
    return <p className="text-center mt-10 text-xl">Cargando datos...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
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
      <div className="flex w-full max-w-5xl gap-6">
        <div className="w-4/6 p-6 bg-white border border-black rounded-lg shadow-lg">
          <div className="flex space-x-4">
            <div className="justify-center items-center"></div>
          </div>
        </div>
        <div className="w-2/6 relative bg-white shadow-lg rounded-lg p-6 flex border-2 border-gray-300 flex-col items-center">
          <div className="absolute -top-20 w-40 h-40 rounded-full overflow-hidden">
            <img
              src={client[0].profilePicture || "https://via.placeholder.com/150"}
              alt={client[0].name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {client[0].name} {client[0].lastName}
            </h2>
            <div className="flex items-center gap-2 text-gray-900">
              <FaBuilding color="#D3423E" />
              <p>{client[0]?.company || "No disponible"}</p>
            </div>

            <div className="flex items-center gap-2 text-gray-900">
              <FaMapMarkerAlt color="#D3423E" />
              <p>{client[0]?.client_location?.direction || "No disponible"}</p>
            </div>

            <div className="flex items-center gap-2 text-gray-900">
              <FaEnvelope color="#D3423E" />
              <p>{client[0]?.email || "No disponible"}</p>
            </div>

            <div className="flex items-center gap-2 text-gray-900">
              <FaPhone color="#D3423E" />
              <p>{client[0]?.number || "No disponible"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 w-full max-w-5xl">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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
              placeholder="Buscar venta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
            />
          </div>
          <div className="flex gap-2">
            
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border text-sm border-gray-900 rounded-lg text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border text-sm border-gray-900 rounded-lg text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500"
            />
          </div>
        </div>

        <div className="mt-5 border border-black rounded-xl">
          <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
          <tr>
                    <th className="px-6 py-3">Referencia</th>
                    <th className="px-6 py-3">Fecha confirmación</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Tipo de Pago</th>
                    <th className="px-6 py-3">Vendedor</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Fecha de Pago</th>
                    <th className="px-6 py-3">Días de mora</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
              <tr key={item._id} onClick={() => handleRowClick(item)} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-gray-900">{item.receiveNumber}</td>
              <td className="px-6 py-4 text-gray-900">{item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : ''}</td>
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
              <td className="px-6 py-4 text-gray-900">{item.salesId.fullName + " " + item.salesId.lastName}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
)}
    </div>

  );
}
