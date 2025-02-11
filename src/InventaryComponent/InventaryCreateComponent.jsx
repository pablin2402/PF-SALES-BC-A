import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiGrid, FiList } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Datepicker } from "flowbite-react";

const InventaryCreateComponent = () => {
    const [salesData, setSalesData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [hasExpiration, setHasExpiration] = useState(false);
    const [expirationDate, setExpirationDate] = useState(null);


    const fetchProducts = async (pageNumber) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post("http://localhost:3035/whatsapp/product/id", {
                id_user: "CL-01",
                status: false,
                page: pageNumber,
                limit: 10,
            });
            setSalesData(response.data.products || []);
            setFilteredData(response.data.products || []);
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
                item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [searchTerm, salesData]);

    if (loading) return <p className="text-center">Cargando datos...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div className="bg-white min-h-screen shadow-lg rounded-lg">
            <ol className="ml-10 mr-10 flex mb-5 items-center w-4/4 p-3 text-l font-bold text-center text-[#D3423E] bg-white border border-gray-200 rounded-lg shadow-xs sm:space-x-4">
                <li className={`flex items-center ${step === 1 ? "text-[#D3423E]" : "text-gray-500"}`}>
                    <span className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full ${step === 1 ? "border-[#D3423E]" : "border-gray-900"}`}>
                        1
                    </span>
                    Seleccionar Producto
                    <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" viewBox="0 0 12 10" fill="none">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4" />
                    </svg>
                </li>
                <li className={`flex items-center ${step === 2 ? "text-[#D3423E]" : "text-gray-900"}`}>
                    <span className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full ${step === 2 ? "border-[#D3423E]" : "border-gray-900"}`}>
                        2
                    </span>
                    Agregar al Inventario
                </li>
            </ol>

            {step === 1 && (
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
                                        <th className="px-6 py-3">Precio</th>
                                        <th className="px-6 py-3">Oferta</th>
                                        <th className="px-6 py-3">Descuento</th>
                                        <th className="px-6 py-3">Categoría</th>
                                        <th className="px-6 py-3"></th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.productName || "Sin nombre"}</td>
                                            <td className="px-6 py-4">{item.priceId?.price || "N/A"}</td>
                                            <td className="px-6 py-4">{item.priceId?.offerPrice ? item.priceId.offerPrice : "No"}</td>
                                            <td className="px-6 py-4">{item.priceId?.discount || "0%"}</td>
                                            <td className="px-6 py-4">{item.categoryId?.categoryName || "Sin categoría"}</td>
                                            <td>
                                                <button
                                                    onClick={() => setStep(2)}
                                                    className="px-4 py-2 bg-[#D3423E] text-white font-bold rounded-lg hover:bg-[#FFCECD] hover:text-[#D3423E] hover:font-bold transition duration-200"
                                                >
                                                    +
                                                </button>
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
                                    <a href="/#">
                                        <img className="w-40 h-40 object-cover mx-auto rounded-lg" src={item.productImage} alt="product image" />
                                    </a>
                                    <h3 className="mt-2 text-m text-gray-900 font-bold">{item.productName || "Sin nombre"}</h3>
                                    <div className="flex-grow"></div>
                                    <p className="text-gray-900">{item.categoryId?.categoryName || "Sin categoría"}</p>
                                    <div className="flex-grow"></div>
                                    <div className="flex items-center justify-end mt-3">
                                        <span className="text-3xl font-bold text-gray-900">{item.priceId?.price ? `Bs. ${item.priceId.price}` : "N/A"}</span>
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
            )}


            {step === 2 && (
                <div className="flex justify-center bg-gray-100 px-1 mt-10">
                <div className="flex flex-col w-full max-w-5xl gap-6">
                    <div className="w-6/6 p-6 bg-white border border-black rounded-lg shadow-lg">
                        <h2 className="mb-6 text-l text-left font-bold text-gray-900">Añadir producto al inventario</h2>
                        <form>
                            <div className="grid gap-6">
                                <div className="flex flex-col">
                                    <label className="text-left text-sm font-medium text-gray-900 mb-1">Cantidad</label>
                                    <input type="number" className="bg-gray-50 border border-gray-900 focus:ring-[#D3423E] focus:border-[#D3423E] text-gray-900 text-sm rounded-lg p-2.5" placeholder="0" required />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={hasExpiration}
                                            onChange={() => setHasExpiration(!hasExpiration)}
                                        />
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                                        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                            Tiene fecha de vencimiento
                                        </span>
                                    </label>

                                    {hasExpiration && (
                                        <div className="flex flex-col">
                                            <label className="text-left text-sm font-medium text-gray-900 mb-1">
                                                Fecha de Vencimiento
                                            </label>
                                            <Datepicker
                                                selected={expirationDate}
                                                onChange={(date) => setExpirationDate(date)}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between mt-6">
                                <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-400 text-white rounded-lg">Atrás</button>
                                <button type="submit" className="px-5 py-2.5 bg-[#D3423E] text-white rounded-lg">Guardar</button>
                            </div>
                        </form>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventaryCreateComponent;
