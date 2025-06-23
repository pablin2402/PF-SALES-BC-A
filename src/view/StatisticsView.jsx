import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";

import Spinner from "../Components/Spinner";
import PrincipalBUtton from "../Components/PrincipalButton";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import VentasChart from "../charts/VentasChart";



const StatisticsView = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(null);


    const [selectedStatus] = useState("");

    const [items, setItems] = useState();
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]);
    const [labels, setLabels] = useState([]);
    const [values, setValues] = useState([]);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [products, setProducts] = useState([]);


    useEffect(() => {
        const startYear = 2010;
        const endYear = new Date().getFullYear();
        const yearsList = [];
        for (let y = endYear; y >= startYear; y--) {
            yearsList.push(y);
        }
        setYears(yearsList);
    }, []);

    useEffect(() => {
        axios.post(API_URL + "/whatsapp/order/products/analysis")
            .then((res) => {
                setProducts(res.data);
                console.log(res.data)
            })
            .catch((err) => console.error('Error al obtener predicciones:', err));
    }, []);

    const fetchOrders = async (pages) => {
        setLoading(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/products/stadistics",
                {
                    year: selectedYear,
                    month: selectedMonth,
                    page: pages,
                    itemsPerPage: itemsPerPage
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const fetchedData = response.data.data || [];
                const chartLabels = fetchedData.map((item) => item._id?.slice(0, 12) || "Sin nombre");
                const chartValues = fetchedData.map((item) => item.totalCantidad || 0);
          
                setSalesData(fetchedData);
                setLabels(chartLabels);
                setValues(chartValues);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchOrders(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, selectedYear, selectedMonth, itemsPerPage]);
    const exportToExcel = async () => {
        const filters = {
            id_owner: user,
            page: page,
            limit: 10000,
        };
        if (searchTerm) filters.fullName = searchTerm;
        if (selectedStatus) filters.status = selectedStatus;

        const response = await axios.post(API_URL + "/whatsapp/order/products/stadistics",
            {
                year: selectedYear,
                month: selectedMonth,
                page: 1,
                itemsPerPage: 10000
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        const allData = response.data.data;

        const ws = XLSX.utils.json_to_sheet(
            allData.map((item) => {
                return {
                    "Cantidad": item._id,
                    "Producto": item.totalCantidad,

                };
            })
        );


        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Lista_Productos_Vendidos");

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "Order_List.xlsx");
    };
    return (
        <div className="bg-white max-h-screen p-5">
            <div className="relative overflow-x-auto">
                {loading ? (
                    <Spinner />
                ) : (
                    <div>
                        <div>
                            <div className="flex flex-col w-full">
                                <div className="flex items-center justify-between w-full mb-4">
                                    <div className="relative flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="flex inset-y-0 left-0 flex items-center ps-3 ">
                                                <select
                                                    className="block p-2 mr-2 text-m text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                >
                                                    {years.map((year) => (
                                                        <option key={year} value={year}>
                                                            {year}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    className="block p-2 text-m text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                                                    value={selectedMonth || ""}
                                                    onChange={(e) => {
                                                        const month = e.target.value ? parseInt(e.target.value) : null;
                                                        setSelectedMonth(month);
                                                    }}
                                                >
                                                    <option value="">Todos los meses</option>
                                                    <option value="1">Enero</option>
                                                    <option value="2">Febrero</option>
                                                    <option value="3">Marzo</option>
                                                    <option value="4">Abril</option>
                                                    <option value="5">Mayo</option>
                                                    <option value="6">Junio</option>
                                                    <option value="7">Julio</option>
                                                    <option value="8">Agosto</option>
                                                    <option value="9">Septiembre</option>
                                                    <option value="10">Octubre</option>
                                                    <option value="11">Noviembre</option>
                                                    <option value="12">Diciembre</option>
                                                </select>

                                            </div>
                                        </div>
                                    </div>
                                        <div className="flex justify-end items-center space-x-4">
                                          
                                            <PrincipalBUtton onClick={exportToExcel} icon={FaFileExport}>                      
                                                Exportar
                                            </PrincipalBUtton>
                                        </div>
                                
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 px-4 py-4">
                            <div className="max-w p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                            <VentasChart labels={labels} values={values} year={selectedYear} />

                            </div>

                            <div className="w-full overflow-x-auto">
                                <div className="border border-gray-400 rounded-xl">

                                    <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-3xl overflow-hidden">
                                        <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                            <tr>
                                                <th className="px-6 py-3 uppercase">Nombre</th>
                                                <th className="px-6 py-3 uppercase">Producto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesData.length > 0 ? (
                                                salesData.map((item) => (
                                                    <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-m text-gray-900">{item._id}</td>
                                                        <td className="px-6 py-4 text-m text-gray-900">{item.totalCantidad}</td>

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
                                    <div className="flex justify-between px-6 py-4 text-sm text-gray-700 rounded-b-2xl bg-gray-200 border-t lg mt-2 border-gray-300">
                                        <div className="text-m">Total de Ítems: <span className="font-semibold">{items}</span></div>
                                    </div>
                                    {totalPages > 1 && (
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
                                                        fetchOrders(page);
                                                    }}
                                                    className="border-2 border-gray-900 rounded-3xl px-2 py-1 text-m text-gray-700"
                                                >
                                                    {[5, 10].map((option) => (
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
                                                    className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "text-[#D3423E] cursor-not-allowed" : "text-[#D3423E] font-bold "}`}
                                                >
                                                    ◀
                                                </button>

                                                <button
                                                    onClick={() => setPage(1)}
                                                    className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === 1 ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
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
                                                            className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === p ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}

                                                {page < totalPages - 2 && <span className="px-2 text-gray-900 font-bold">…</span>}

                                                {totalPages > 1 && (
                                                    <button
                                                        onClick={() => setPage(totalPages)}
                                                        className={`px-3 py-1 border-2 border-[#D3423E] rounded-lg ${page === totalPages ? "bg-[#D3423E] text-white font-bold" : "text-gray-900 font-bold"}`}
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
                        <div className="p-4">
                            <h2 className="text-2xl font-bold mb-4">Predicción de ventas por producto</h2>
                            <table className="w-full border">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-2 border">Producto</th>
                                        <th className="p-2 border">Ventas anteriores</th>
                                        <th className="p-2 border">Predicción siguiente mes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(products) && products.length > 0 ? (
                                        products.map((prod, index) => (
                                            <tr key={index}>
                                                <td className="border px-4 py-2">{prod.nombre}</td>
                                                <td className="border px-4 py-2">{prod.totalCantidad}</td>
                                                <td className="border px-4 py-2">
                                                    {prod.forecast.length > 0 ? (
                                                        prod.forecast.map((f, i) => (
                                                            <div key={i}>{f.mes}: {f.valor}</div>
                                                        ))
                                                    ) : (
                                                        <span className="text-red-600 font-semibold">{prod.error}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center py-4">Cargando o sin datos...</td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default StatisticsView;
