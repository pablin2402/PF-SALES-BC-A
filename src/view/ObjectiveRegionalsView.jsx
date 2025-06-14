import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import { FaFileExport } from "react-icons/fa6";
import { IoPersonAdd } from "react-icons/io5";

const ObjectiveRegionalsView = () => {
    const [salesData, setSalesData] = useState([]);
    const [generalData, setGeneralData] = useState([]);
    const [objectiveData, setObjectiveData] = useState([]);
    const [dateFilterActive, setDateFilterActive] = useState(false);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");

    const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, region: "", startDate, endDate, ciudad: "" });

    const navigate = useNavigate();
    const fetchCategories = async () => {
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
            console.log(response.data.data)
            setCategories(response.data.data);
        } catch (error) {
        } finally {
        }
    };
    const applyFilters = () => {
        const customFilters = {};

        if (startDate && endDate) {
            customFilters.startDate = startDate;
            customFilters.endDate = endDate;
        }
        fetchProducts(customFilters);
    };
    const fetchProducts = async (customFilters) => {
        setLoading(true);
        const filters = {
            id_owner: user,
            ...customFilters
        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/objective/general", filters);
            console.log(response.data)
            setSalesData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchObjectiveRegional = async () => {
        setLoading(true);
        const filters = {
            id_owner: user,

        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/objective/general", filters);
            setGeneralData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchObjectiveData = async () => {
        setLoading(true);
        const filters = {
            startDate: '2025-06-01',
            endDate: '2025-06-31',
            region: formData.ciudad,
            salesId: "674e31a22ec84c2b04dbacae",

        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/order/objective", filters);
            setObjectiveData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchObjectiveDataRegion = async (customFilters) => {
        setLoading(true);
        const filters = {
            region: "TOTAL CBB",
            salesId: "",
            id_owner: "CL-01",
            payStatus: "Pendiente",
            ...customFilters,

        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/order/objective/region", filters);
            setObjectiveData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCategories();
        fetchObjectiveRegional();
        fetchProducts();
        fetchObjectiveDataRegion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, itemsPerPage]);
    const goToClientDetails = (client) => {
        navigate(`/objective/department/${client._id}`, { state: { client } });
    };
    const clearFilter = (type) => {
        if (type === "date") {
            setStartDate("");
            setEndDate("");
            setDateFilterActive(false);
        }
        fetchObjectiveDataRegion(1);
    };
    const handleSubmit = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/objective/regional",
                {
                    region: formData.ciudad,
                    lyne: "GENERAL",
                    objective: formData.numberOfBoxes,
                    saleLastYear: formData.saleLastYear1,
                    acumulateSales: 0,
                    currentSaleVsSameMonthLastYear: 0,
                    saleVsEstablishedObjectiveMonth: 0,
                    date: null,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    id: formData.region + formData.numberOfBoxes,
                    id_owner: "CL-01"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            fetchProducts();
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Error al insertar");
        } finally {
            setLoading(false);
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "numberOfBoxes" ? Number(value) : value,
            [name]: name === "saleLastYear1" ? Number(value) : value
        });
    };
    return (
        <div className="bg-white min-h-screen rounded-lg p-5">
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
                <div className="ml-1 mr-1 mt-10 relative overflow-x-auto">
                    <div className="flex flex-col w-full space-y-4">
                        <div className="flex justify-end items-center space-x-4">
                            <button
                                onClick={() => setModalOpen(true)}
                                className="px-4 py-2 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] hover:bg-white hover:text-[#D3423E] flex items-center gap-2"
                            >
                                Nuevo Objetivo
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex gap-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                        }}
                                        className="h-10 px-3 py-2 border text-m text-gray-900 rounded-2xl focus:outline-none focus:ring focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                        }}
                                        className="h-10 px-3 py-2 border text-m text-gray-900 rounded-2xl focus:outline-none focus:ring focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        applyFilters();
                                        setDateFilterActive(true);
                                    }}
                                    className="px-4 py-2 font-bold text-lg text-white bg-[#D3423E] uppercase rounded-2xl hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
                                >
                                    Filtrar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {dateFilterActive && (
                            <span className="bg-purple-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                Fecha: {startDate} → {endDate}
                                <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                            </span>
                        )}
                    </div>
                    <div className="mt-5 border border-gray-400 rounded-xl">
                        <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                            <thead className="text-sm text-gray-700 bg-gray-100 border-b border-gray-300">
                                <tr>
                                    <th className="px-6 py-3 uppercase">Region</th>
                                    <th className="px-6 py-3 uppercase">Linea</th>
                                    <th className="px-6 py-3 uppercase">Objectivo</th>
                                    <th className="px-6 py-3 uppercase">VTA AA</th>
                                    <th className="px-6 py-3 uppercase">VTA ACUM</th>
                                    <th className="px-6 py-3 uppercase">VS AA</th>
                                    <th className="px-6 py-3 uppercase">VS OBJECTIVO</th>
                                    <th className="px-6 py-3 uppercase">TENDENCIA</th>
                                    <th className="px-6 py-3 uppercase">POR VENDER</th>
                                    <th className="px-6 py-3 uppercase">%AVANCE</th>
                                    <th className="px-6 py-3 uppercase">PROYECCIÓN</th>

                                </tr>
                            </thead>
                            <tbody>
                                {salesData.length > 0 ? (
                                    salesData.map((item) => (
                                        <tr onClick={() => goToClientDetails(item)} key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">

                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {item.region}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">{item.lyne}</td>
                                            <td className="px-6 py-4 text-gray-900">{item.objective}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.saleLastYear}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.acumulateSales}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{(item.currentSaleVsSameMonthLastYear * 100).toFixed(2) + "%"}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.saleVsEstablishedObjectiveMonth}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.saleVsEstablishedObjectiveMonth}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{(item.objective - item.acumulateSales).toFixed(2)}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{ }</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.saleVsEstablishedObjectiveMonth}</td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            No se encontraron registros con esa fecha.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-200 font-semibold text-gray-900">
                                    <td className="px-6 py-3">Totales</td>
                                    <td className="px-6 py-3"></td>
                                    <td className="px-6 py-3">
                                        {salesData.reduce((sum, item) => sum + (item.objective || 0), 0)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {salesData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {salesData.reduce((sum, item) => sum + (item.acumulateSales || 0), 0)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {(
                                            (salesData.reduce((sum, item) => sum + (item.currentSaleVsSameMonthLastYear || 0), 0) /
                                                salesData.length) * 100
                                        ).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-3">
                                        {(
                                            (salesData.reduce((sum, item) => sum + (item.saleVsEstablishedObjectiveMonth || 0), 0) /
                                                salesData.length) * 100
                                        ).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-3"></td>
                                    <td className="px-6 py-3"></td>
                                    <td className="px-6 py-3"></td>

                                </tr>
                            </tfoot>

                        </table>
                    </div>
                    {modalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white w-full max-w-xl p-6 rounded-lg relative">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="absolute top-2 text-gray-900 right-3 text-3xl font-bold"
                                >
                                    &times;
                                </button>

                                <h2 className="text-xl font-bold mb-4 text-gray-900">Insertar Objetivos de Venta</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    

                                    <div className="flex flex-col">
                                        <label className="block mb-2 text-gray-900 font-medium">Número de Cajas</label>
                                        <input
                                            type="number"
                                            name="numberOfBoxes"
                                            value={formData.numberOfBoxes}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-3xl"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="block mb-2 text-gray-900 font-medium">Venta Año Pasado</label>
                                        <input
                                            type="number"
                                            name="saleLastYear1"
                                            value={formData.saleLastYear1}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-3xl"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="block mb-2 text-gray-900 font-medium">Fecha Inicial</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate || ''}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-3xl"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="block mb-2 text-gray-900 font-medium">Fecha Final</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate || ''}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-3xl"
                                        />
                                    </div>
                                    <div className="flex flex-col md:col-span-2">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Seleccionar Ciudad</label>
                                        <select
                                            className="text-gray-900 rounded-2xl p-2"
                                            name="ciudad"
                                            value={formData.ciudad}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Seleccione una ciudad</option>
                                            <option value="TOTAL CBB">Cochabamba</option>
                                            <option value="TOTAL SC">Santa Cruz</option>
                                            <option value="TOTAL LP">La Paz</option>
                                            <option value="TOTAL OR">Oruro</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        !formData.ciudad ||
                                        !formData.numberOfBoxes ||
                                        !formData.saleLastYear1 ||
                                        !formData.startDate ||
                                        !formData.endDate
                                    }
                                    className={`mt-6 w-full text-lg px-4 py-2 rounded-3xl uppercase font-bold transition-colors duration-300 ${!formData.ciudad ||
                                            !formData.numberOfBoxes ||
                                            !formData.saleLastYear1 ||
                                            !formData.startDate ||
                                            !formData.endDate
                                            ? "bg-gray-400 cursor-not-allowed text-white"
                                            : "bg-[#D3423E] text-white hover:bg-red-700"
                                        }`}
                                >
                                    Insertar Objetivos
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            )}

        </div>
    );
};

export default ObjectiveRegionalsView;
