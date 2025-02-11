import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FiGrid, FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const InventaryListComponent = () => {
    const [salesData, setSalesData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const navigate = useNavigate();


    const fetchProducts = async (pageNumber) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(API_URL+"/whatsapp/inventory/id", {
                id_user: "CL-01",
                page: pageNumber,
                limit: 10,
            });
            setSalesData(response.data.data || []);
            setFilteredData(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            console.error("❌ Error al cargar los productos:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(page);
    }, [page]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredData(salesData);
        } else {
            const filtered = salesData.filter((item) =>
                item.productId?.toLowerCase().includes(searchTerm.toLowerCase())
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
                            placeholder="Buscar venta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block p-2 ps-10 text-sm text-gray-900 border border-gray-900 rounded-lg w-80 bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                        />
                    </div>
                    <div className="justify-end">
                        
                        <button
                            onClick={() => navigate("/product/creation")}
                            className="px-4 py-2 bg-[#D3423E] text-white font-bold rounded-lg hover:bg-[#FFCECD] hover:text-[#D3423E] hover:font-bold transition duration-200"
                        >
                            + Crear Producto
                        </button>
                    </div>

                </div>
                
                <div className="flex mt-4 justify-end space-x-2">
                    <button
                        onClick={() => setViewMode("table")}
                        className=" rounded-lg text-sm p-2 text-[#D3423E] hover:bg-[#FFCECD] w-10 h-10 flex items-center justify-center"
                    >
                        <FiList className="w-5 h-5 text-[#D3423E]" />
                    </button>

                    <button
                        onClick={() => setViewMode("cards")}
                        className=" rounded-lg text-sm p-2 text-[#D3423E] hover:bg-[#FFCECD] w-10 h-10 flex items-center justify-center"
                    >
                        <FiGrid className="w-5 h-5 text-[#D3423E]" />
                    </button>
                </div>
                {filteredData.length === 0 ? (
                    <p className="text-center text-gray-500 mt-5">No hay productos disponibles.</p>
                ) : viewMode === "table" ? (
                    <div className="mt-5 border border-gray-400 rounded-xl">
                        <table className="w-full text-sm text-left text-gray-500 border border-gray-900 shadow-xl rounded-2xl overflow-hidden">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-300">
                                <tr>
                                    <th className="px-6 py-3">Producto</th>
                                    <th className="px-6 py-3">Fecha de entrada</th>
                                    <th className="px-6 py-3">Lote</th>
                                    <th className="px-6 py-3">Almacen</th>
                                    <th className="px-6 py-3">Cantidad</th>
                                    <th className="px-6 py-3">Fecha de vencimient</th>

                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item) => (
                                    <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.productId || "Sin nombre"}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                             {item.date ? new Date(item.date).toLocaleDateString("es-ES") : "Fecha no disponible"}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.lote}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.store}</td>
                                        <td className="px-6 py-4">{item.quantity}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.due_date ? new Date(item.due_date).toLocaleDateString("es-ES") : "Fecha no disponible"}  
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-5">
                        {filteredData.map((item) => (
                            <div key={item._id} className="p-5 border border-gray-400 rounded-2xl shadow-lg bg-gray-100 flex flex-col">
                                
                                <h3 className="mt-2 text-m text-gray-900 font-bold">{item.productId || "Sin nombre"}</h3>
                                <div className="flex-grow"></div>
                                <div className="flex items-center justify-end mt-3">
                                    <div className="flex-grow font-bold text-lg text-gray-900">Cantidad: {item.quantity}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                )}

                {totalPages > 1 && searchTerm === "" && (
                    <nav className="flex items-center justify-center pt-4 space-x-2">
                        <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className={`px-3 py-1 border rounded-lg ${page === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                                }`}
                        >
                            ◀
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                onClick={() => setPage(num)}
                                className={`px-3 py-1 border border-gray-400 rounded-lg ${page === num ? "bg-red-500 text-white font-bold" : "text-gray-900 hover:bg-red-200"
                                    }`}
                            >
                                {num}
                            </button>
                        ))}

                        <button
                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={page === totalPages}
                            className={`px-3 py-1 border rounded-lg ${page === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-900 hover:bg-gray-200"
                                }`}
                        >
                            ▶
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default InventaryListComponent;
