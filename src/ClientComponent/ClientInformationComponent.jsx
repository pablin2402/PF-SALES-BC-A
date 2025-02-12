import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FaBuilding, FaMapMarkerAlt, FaEnvelope, FaPhone } from "react-icons/fa";

export default function ClientInformationComponent() {
  const { state } = useLocation();
  const { id } = useParams();
  const [client, setClient] = useState(state?.client || null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [idClient, setClientId] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchClientData = async () => {
    console.log(id);
    try {
      const response = await axios.post(API_URL + "/whatsapp/client/info/id", {
        _id: id,
      });
      setClientId(response.data[0].id_user);
      console.log(response.data[0].id_user)
      setClient(response.data);
    } catch (error) {
      console.error("Error al obtener los datos del cliente", error);
    }
  };
  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    console.log(idClient)
    try {
      const response = await axios.post(API_URL + "/whatsapp/order/id/user", {
        id_owner: "CL-01",
        userId: idClient
      });
      console.log(response.data)
      setSalesData(response.data || []);
      setFilteredData(response.data || []);
    } catch (error) {
      console.error("❌ Error al cargar los productos:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [idClient]);

  const filterData = () => {
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
  };

  useEffect(() => {
    filterData();
  }, [searchTerm, startDate, endDate, salesData]);

  const navigate = useNavigate();

  const handleRowClick = (item) => {
    console.log(item.products)
    navigate(`/client/order/${item._id}`, { state: { products: item.products, files: item } });
  };

  if (!client) {
    return <p className="text-center mt-10 text-xl">Cargando datos...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6">
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
              alt={client.name}
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
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-900">
              <tr>
                <th className="px-6 py-3">Número de recibo</th>
                <th className="px-6 py-3">Fecha de creación</th>
                <th className="px-6 py-3">Fecha de envío</th>
                <th className="px-6 py-3">Fecha de pago</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item._id} onClick={() => handleRowClick(item)}
                className="bg-white border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.receiveNumber || "Sin nombre"}</td>
                  <td className="px-6 py-4">{item.creationDate ? new Date(item.creationDate).toLocaleDateString("es-ES") : "Fecha no disponible"}</td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("es-ES") : "Fecha no disponible"}</td>
                  <td className="px-6 py-4 flex items-center">

                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full 
                      ${item.accountStatus === "DEUDA"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                    >
                      {item.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.totalAmount}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
}
