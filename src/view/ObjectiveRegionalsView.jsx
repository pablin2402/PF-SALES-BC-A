import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { HiFilter } from "react-icons/hi";
import { FiTrash2, FiEdit2 } from "react-icons/fi";

import ObjectiveDepartmentComponent from "../ObjectiveComponent/ObjectiveDepartmentComponent";
import ObjectiveSalesDetailComponent from "../ObjectiveComponent/ObjectiveSalesDetailComponent";
import PrincipalBUtton from "../Components/PrincipalButton";
import DateInput from "../Components/DateInput";

const ObjectiveRegionalsView = () => {
    const [salesData, setSalesData] = useState([]);
    const [salesNationalData, setSalesNationaData] = useState([]);
    const [dateFilterActive, setDateFilterActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditModal1, setShowEditModal1] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState("card");
    const [selectedItem, setSelectedItem] = useState(null);
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, region: "", startDate, endDate, ciudad: "" });
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedLyne, setSelectedLyne] = useState(null);
    const [objective, setObjective] = useState(0);
    const [saleLastYear, setSaleLastYear] = useState(0);
    const [id, setId] = useState("");

    const applyFilters = () => {
        const customFilters = {};

        if (startDate && endDate) {
            customFilters.startDate = startDate;
            customFilters.endDate = endDate;
        }
        fetchProducts(customFilters);
        fetchSalesNational(customFilters);
    };
    const fetchProducts = async (customFilters) => {
        setLoading(true);
        const filters = {
            id_owner: user,
            ...customFilters
        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/objective/region/order", filters);
            console.log(response.data)
            setSalesData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    const fetchSalesNational = async (customFilters) => {
        setLoading(true);
        try {
            const filters = {
                id_owner: user,
                ...customFilters
            };
            const response = await axios.post(API_URL + "/whatsapp/sales/objective/national", filters, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(response.data)
            setSalesNationaData(response.data || []);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProducts();
        fetchSalesNational();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const clearFilter = (type) => {
        if (type === "date") {
            setStartDate("");
            setEndDate("");
            setDateFilterActive(false);
        }
        fetchProducts(1);
    };
    const handleSubmit = async () => {
        try {
            const response = await axios.post(
                API_URL + "/whatsapp/sales/objective/regional",
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
                    id_owner: user
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                fetchProducts();
                setModalOpen(false);
            }

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
    const uploadProducts = async () => {
        try {
            const response = await axios.put(
                API_URL + "/whatsapp/order/objective/region/product",
                {
                    _id: id,
                    id_owner: user,
                    saleLastYear: saleLastYear,
                    objective: objective
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                fetchProducts(1);
                setShowEditModal(false);
                setSaleLastYear(0);
                setObjective(0);
            }
        } catch (error) {
            console.error("Error al actualizar el estado de pago:", error);
        }

    };
    const deleteObjective = async (id2) => {
        try {
            const response = await axios.delete(
                API_URL + "/whatsapp/order/objective/region/product",
                {
                    data: {
                        _id: id2,
                        id_owner: user,
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                fetchProducts(1);
                setShowEditModal(false);
            }
        } catch (error) {
            console.error("Error al actualizar el estado de pago:", error);
        }

    };
    const uploadProducts1 = async () => {
        try {
            const response = await axios.put(
                API_URL + "/whatsapp/order/objective/product",
                {
                    _id: id,
                    id_owner: user,
                    saleLastYear: saleLastYear,
                    numberOfBoxes: objective
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                fetchSalesNational();
                setShowEditModal(false);
                showEditModal1(false);
                setSaleLastYear(0);
                setObjective(0);
            }
        } catch (error) {
            console.error("Error al actualizar el estado de pago:", error);
        }

    };
    const deleteObjective1 = async (id2) => {
        try {
            const response = await axios.delete(
                API_URL + "/whatsapp/order/objective/product",
                {
                    data: {
                        _id: id2,
                        id_owner: user,
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                fetchProducts(1);
                setShowEditModal(false);
            }
        } catch (error) {
            console.error("Error al actualizar el estado de pago:", error);
        }

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
                <div>
                    <div className="flex mt-4 justify-start space-x-2">
                        {viewMode === "card" ? (
                            <div className="flex mt-4 mb-4 justify-start space-x-2">
                                <nav className="flex" aria-label="Breadcrumb">
                                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                        <li className="inline-flex items-center"
                                        >
                                            <button
                                                onClick={() => setViewMode("card")}
                                                className="inline-flex items-center text-m font-bold text-[#D3423E] hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                                            >
                                                <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                                </svg>
                                                Objetivos a nivel nacional
                                            </button>

                                        </li>
                                        <li>
                                            <div className="flex items-center"
                                            >
                                                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                                </svg>
                                                <button
                                                    onClick={() => setViewMode("form")}
                                                    disabled
                                                    className="ms-1 text-sm font-medium text-gray-900 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    Objetivos a nivel regional
                                                </button>

                                            </div>
                                        </li>
                                        <li aria-current="page">
                                            <div className="flex items-center">
                                                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                                </svg>
                                                <span className="ms-1 text-sm font-medium text-gray-900 md:ms-2 dark:text-gray-400">Productos por categoría</span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        ) : viewMode === "form" ? (
                            <div className="flex mt-4 mb-4 justify-start space-x-2">
                                <nav className="flex" aria-label="Breadcrumb">
                                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                        <li className="inline-flex items-center" >
                                            <button
                                                onClick={() => setViewMode("card")}
                                                className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                                            >
                                                <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                                </svg>
                                                Objetivos a nivel nacional
                                            </button>

                                        </li>
                                        <li>
                                            <div className="flex items-center">
                                                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                                </svg>
                                                <button
                                                    className="ms-1 text-m font-bold text-[#D3423E] hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    Objetivos a nivel regional
                                                </button>
                                            </div>
                                        </li>
                                        <li aria-current="page">
                                            <div className="flex items-center">
                                                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                                </svg>
                                                <span className="ms-1 text-sm font-medium text-gray-900 md:ms-2 dark:text-gray-400">Productos por categoría</span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        ) : viewMode === "sales" ? (
                            <div className="flex mt-4 mb-4 justify-start space-x-2">
                                <nav className="flex" aria-label="Breadcrumb">
                                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                        <li className="inline-flex items-center"
                                        >
                                            <button
                                                onClick={() => setViewMode("card")}
                                                className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-[#D3423E] dark:text-gray-400 dark:hover:text-white"
                                            >
                                                <svg className="w-3 h-3 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                                                </svg>
                                                Objetivos a nivel nacional
                                            </button>

                                        </li>
                                        <li>
                                            <div className="flex items-center"
                                            >
                                                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                                </svg>
                                                <button
                                                    onClick={() => setViewMode("form")}
                                                    className="ms-1 text-sm font-medium text-gray-900 hover:text-[#D3423E] md:ms-2 dark:text-gray-400 dark:hover:text-white"
                                                >
                                                    Objetivos a nivel regional
                                                </button>

                                            </div>
                                        </li>
                                        <li aria-current="page">
                                            <div className="flex items-center" onClick={() => setViewMode("table")}>
                                                <svg className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                                </svg>
                                                <span className="ms-1 text-m font-bold text-[#D3423E] md:ms-2 dark:text-gray-400">Productos por categoría</span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                        ) : null}
                    </div>
                    {viewMode === "card" ? (
                        <div>
                            <div className="ml-1 mr-1 mt-10 relative overflow-x-auto">
                                <div className="flex flex-col w-full space-y-4">
                                    <div className="flex justify-end items-center space-x-4">

                                        <PrincipalBUtton onClick={() => setModalOpen(true)}>
                                            Nuevo Objetivo
                                        </PrincipalBUtton>

                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-2">
                                            <div className="flex items-center space-x-2">
                                                <DateInput value={startDate} onChange={setStartDate} label="Fecha de Inicio" />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <DateInput value={endDate} onChange={setEndDate} min={startDate} label="Fecha Final" />
                                            </div>
                                            <PrincipalBUtton onClick={() => {
                                                applyFilters();
                                                setDateFilterActive(true);
                                            }} icon={HiFilter}>Filtrar</PrincipalBUtton>
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
                                <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto max-w-full">
                                    <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                                        <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300 rounded-t-2xl">
                                            <tr>
                                                <th className="px-6 py-3 uppercase">Fecha de Inicio</th>
                                                <th className="px-6 py-3 uppercase">Fecha de Fin</th>
                                                <th className="px-6 py-3 uppercase">Region</th>
                                                <th className="px-6 py-3 uppercase">Linea</th>
                                                <th className="px-6 py-3 uppercase">Objetivo</th>
                                                <th className="px-6 py-3 uppercase">VTA AA</th>
                                                <th className="px-6 py-3 uppercase">VTA ACUM</th>
                                                <th className="px-6 py-3 uppercase">VS AA</th>
                                                <th className="px-6 py-3 uppercase">VS OBJETIVO</th>
                                                <th className="px-6 py-3 uppercase">TENDENCIA</th>
                                                <th className="px-6 py-3 uppercase">POR VENDER</th>
                                                <th className="px-6 py-3 uppercase">%AVANCE</th>
                                                <th className="px-6 py-3 uppercase">PROYECCIÓN</th>
                                                <th className="px-6 py-3 uppercase"></th>
                                                <th className="px-6 py-3 uppercase"></th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesData.length > 0 ? (
                                                salesData.map((item) => (
                                                    <tr onClick={() => {
                                                        setViewMode("form");
                                                        setSelectedItem(item)
                                                    }}
                                                        key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">
                                                            {item.startDate
                                                                ? new Date(item.startDate).toISOString().slice(0, 10).split("-").reverse().join("/").slice(0, 8)
                                                                : "-"}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">
                                                            {item.endDate
                                                                ? new Date(item.endDate).toISOString().slice(0, 10).split("-").reverse().join("/").slice(0, 8)
                                                                : "-"}
                                                        </td>

                                                        <td className="px-6 py-4 font-medium text-gray-900">{item.region}</td>
                                                        <td className="px-6 py-4 text-gray-900">{item.lyne}</td>
                                                        <td className="px-6 py-4 text-gray-900">{item.objetivo}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{item.saleLastYear}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{item.cajasVendidas.toFixed(2)}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / item.saleLastYear) * 100).toFixed(2) + "%"}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / item.objetivo) * 100).toFixed(2) + "%"}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / 14) * 31).toFixed(2)}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{(item.objetivo - item.cajasVendidas).toFixed(2)}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / item.objetivo) * 100).toFixed(2) + "%"}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / item.saleLastYear) * 100).toFixed(2)}</td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteObjective(item._id || "");
                                                                }}
                                                                className="text-[#D3423E] bg-white font-bold py-1 px-3 rounded"
                                                                aria-label="Opciones"
                                                            >
                                                                <FiTrash2 size={20} />

                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowEditModal(true);
                                                                    setId(item._id || "");
                                                                    setObjective(item.objetivo || "");
                                                                    setSaleLastYear(item.saleLastYear || "");

                                                                }}
                                                                className="text-[#D3423E] bg-white font-bold py-1 px-3 rounded"
                                                                aria-label="Opciones"
                                                            >
                                                                <FiEdit2 size={20} />

                                                            </button>
                                                        </td>

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
                                        <tfoot className="text-sm text-gray-900 bg-gray-100 border-t border-gray-300 font-semibold rounded-b-xl">
                                            <tr className="bg-gray-200 font-semibold text-gray-900">
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>

                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3"></td>
                                                <td className="px-6 py-3">
                                                    {salesData.reduce((sum, item) => sum + (item.objetivo || 0), 0)}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {salesData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0)}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {salesData.reduce((sum, item) => sum + (item.cajasVendidas || 0), 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {
                                                        (
                                                            salesData.reduce((sum, item) => sum + ((item.cajasVendidas / item.saleLastYear) * 100), 0) /
                                                            salesData.length
                                                        ).toFixed(2) + "%"
                                                    }
                                                </td>
                                                <td className="px-6 py-3">
                                                    {
                                                        (
                                                            salesData.reduce((sum, item) => sum + ((item.cajasVendidas / item.objetivo) * 100), 0) /
                                                            salesData.length
                                                        ).toFixed(2) + "%"
                                                    }
                                                </td>
                                                <td className="px-6 py-3">
                                                    {
                                                        (salesData.reduce((sum, item) => sum + ((item.cajasVendidas / 14) * 31), 0) / salesData.length).toFixed(2) + "%"
                                                    }
                                                </td>
                                                <td className="px-6 py-3">
                                                    {
                                                        (salesData.reduce((sum, item) => sum + ((item.objetivo - item.cajasVendidas) || 0), 0).toFixed(2))
                                                    }
                                                </td>
                                                <td className="px-6 py-3">
                                                    {
                                                        (salesData.reduce((sum, item) => sum + ((item.cajasVendidas / item.saleLastYear) * 100 || 0), 0).toFixed(2) + "%")
                                                    }
                                                </td>
                                                <td className="px-6 py-3">
                                                    {
                                                        (salesData.reduce((sum, item) => sum + ((item.cajasVendidas / item.saleLastYear) * 100 || 0), 0).toFixed(2))
                                                    }
                                                </td>
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
                                                        className="text-gray-900 border p-2 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500"
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <label className="block mb-2 text-gray-900 font-medium">Venta Año Pasado</label>
                                                    <input
                                                        type="number"
                                                        name="saleLastYear1"
                                                        value={formData.saleLastYear1}
                                                        onChange={handleChange}
                                                        className="text-gray-900 border p-2 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500"
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <label className="block mb-2 text-gray-900 font-medium">Fecha Inicial</label>
                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        value={formData.startDate || ''}
                                                        onChange={handleChange}
                                                        className="text-gray-900 border p-2 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500"
                                                    />
                                                </div>

                                                <div className="flex flex-col">
                                                    <label className="block mb-2 text-gray-900 font-medium">Fecha Final</label>
                                                    <input
                                                        type="date"
                                                        name="endDate"
                                                        value={formData.endDate || ''}
                                                        onChange={handleChange}
                                                        className="text-gray-900 border p-2 rounded-3xl focus:outline-none focus:ring-0 focus:border-red-500"
                                                    />
                                                </div>
                                                <div className="flex flex-col md:col-span-2">
                                                    <label className="text-sm font-medium text-gray-900 mb-1">Seleccionar Ciudad</label>
                                                    <select
                                                        className="text-gray-900 rounded-3xl p-2 focus:outline-none focus:ring-0 focus:border-red-500"
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
                            <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto max-w-full">
                                <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                                    <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300 rounded-t-2xl">
                                        <tr>
                                            <th className="px-6 py-3 uppercase">Fecha de Inicio</th>
                                            <th className="px-6 py-3 uppercase">Fecha de Fin</th>
                                            <th className="px-6 py-3 uppercase">Linea</th>
                                            <th className="px-6 py-3 uppercase">Objetivo</th>
                                            <th className="px-6 py-3 uppercase">VTA AA</th>
                                            <th className="px-6 py-3 uppercase">VTA ACUM</th>
                                            <th className="px-6 py-3 uppercase">VS AA</th>
                                            <th className="px-6 py-3 uppercase">VS OBJETIVO</th>
                                            <th className="px-6 py-3 uppercase">TENDENCIA</th>
                                            <th className="px-6 py-3 uppercase">POR VENDER</th>
                                            <th className="px-6 py-3 uppercase"></th>
                                            <th className="px-6 py-3 uppercase"></th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesNationalData.length > 0 ? (
                                            salesNationalData.map((item) => (
                                                <tr
                                                   
                                                    key={item._id + item.saleLastYear} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {item.startDate
                                                            ? new Date(item.startDate).toISOString().slice(0, 10).split("-").reverse().join("/").slice(0, 8)
                                                            : "-"}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {item.endDate
                                                            ? new Date(item.endDate).toISOString().slice(0, 10).split("-").reverse().join("/").slice(0, 8)
                                                            : "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900">{item.lyne}</td>
                                                    <td className="px-6 py-4 text-gray-900">{item.objetivo}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.saleLastYear}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.cajasVendidas.toFixed(2)}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / item.saleLastYear) * 100).toFixed(2) + "%"}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / item.objetivo) * 100).toFixed(2) + "%"}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{((item.cajasVendidas / 14) * 31).toFixed(2)}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{(item.objetivo - item.cajasVendidas).toFixed(2)}</td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteObjective1(item._id || "");
                                                            }}
                                                            className="text-[#D3423E] bg-white font-bold py-1 px-3 rounded"
                                                            aria-label="Opciones"
                                                        >
                                                            <FiTrash2 size={20} />

                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowEditModal(true);
                                                                setShowEditModal1(true);
                                                                setId(item._id || "");
                                                                setObjective(item.objetivo || "");
                                                                setSaleLastYear(item.saleLastYear || "");
                                                            }}
                                                            className="text-[#D3423E] bg-white font-bold py-1 px-3 rounded"
                                                            aria-label="Opciones"
                                                        >
                                                            <FiEdit2 size={20} />

                                                        </button>
                                                    </td>
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
                                    <tfoot className="text-sm text-gray-900 bg-gray-100 border-t border-gray-300 font-semibold rounded-b-2xl">
                                        <tr className="bg-gray-200 font-semibold text-gray-900">
                                            <td className="px-6 py-3"></td>
                                            <td className="px-6 py-3"></td>

                                            <td className="px-6 py-3"></td>
                                            <td className="px-6 py-3">
                                                {salesNationalData.reduce((sum, item) => sum + (item.objetivo || 0), 0)}
                                            </td>
                                            <td className="px-6 py-3">
                                                {salesNationalData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0)}
                                            </td>
                                            <td className="px-6 py-3">
                                                {salesNationalData.reduce((sum, item) => sum + (item.cajasVendidas || 0), 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-3">
                                                {
                                                    (
                                                        salesNationalData.reduce((sum, item) => sum + ((item.cajasVendidas / item.saleLastYear) * 100), 0) /
                                                        salesNationalData.length
                                                    ).toFixed(2) + "%"
                                                }
                                            </td>
                                            <td className="px-6 py-3">
                                                {
                                                    (
                                                        salesNationalData.reduce((sum, item) => sum + ((item.cajasVendidas / item.objetivo) * 100), 0) /
                                                        salesNationalData.length
                                                    ).toFixed(2) + "%"
                                                }
                                            </td>
                                            <td className="px-6 py-3">
                                                {
                                                    (
                                                        salesNationalData.reduce((sum, item) => sum + ((item.cajasVendidas / 14) * 31), 0) /
                                                        salesNationalData.length
                                                    ).toFixed(2) + "%"
                                                }
                                            </td>
                                            <td className="px-6 py-3">
                                                {
                                                    (
                                                        salesNationalData.reduce((sum, item) => sum + ((item.objetivo - item.cajasVendidas) || 0), 0).toFixed(2))
                                                }
                                            </td>
                                            <td className="px-6 py-3"></td>
                                            <td className="px-6 py-3"></td>
                                        </tr>
                                    </tfoot>

                                </table>
                            </div>
                            {showEditModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white p-8 rounded-lg shadow-xl w-[700px]">
                                        {showEditModal1 ? (
                                            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                                                Actualizar Objetivo por linea
                                            </h2>
                                        ) : showEditModal ? (
                                            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                                                Actualizar Objetivo
                                            </h2>
                                        ) : null}

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Objetivo:</label>
                                                <input
                                                    type="number"

                                                    value={objective}
                                                    onChange={(e) => setObjective(e.target.value)}

                                                    className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block mb-1 text-sm font-medium text-gray-700">Venta año anterior:</label>
                                                <input
                                                    type="number"
                                                    value={saleLastYear}
                                                    onChange={(e) => setSaleLastYear(e.target.value)}

                                                    className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-6">

                                            <button
                                                onClick={() => setShowEditModal(false)}
                                                className="w-1/2 px-4 py-2 border-2 border-[#D3423E] bg-white uppercase rounded-3xl text-[#D3423E] font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            {showEditModal1 ? (
                                                <button
                                                    onClick={uploadProducts1}
                                                    className="w-1/2 px-4 py-2 bg-[#D3423E] text-white font-bold uppercase rounded-3xl"
                                                >
                                                    Guardar
                                                </button>
                                            ) : showEditModal ? (
                                                <button
                                                    onClick={uploadProducts}
                                                    className="w-1/2 px-4 py-2 bg-[#D3423E] text-white font-bold uppercase rounded-3xl"
                                                >
                                                    Guardar
                                                </button>
                                            ) : null}




                                        </div>


                                    </div>
                                </div>
                            )}
                        </div>

                    ) : viewMode === "form" ? (
                        <div>
                            <ObjectiveDepartmentComponent
                                item={selectedItem}
                                setViewMode={setViewMode}
                                setSelectedRegion={setSelectedRegion}
                                setSelectedLyne={setSelectedLyne}
                                date1={startDate}
                                date2={endDate}
                            />
                        </div>
                    ) : viewMode === "sales" ? (
                        <div>
                            <ObjectiveSalesDetailComponent
                                region={selectedRegion}
                                lyne={selectedLyne}
                                date1={startDate}
                                date2={endDate}
                            ></ObjectiveSalesDetailComponent>
                        </div>
                    ) : null}
                </div>


            )}

        </div>
    );
};

export default ObjectiveRegionalsView;
