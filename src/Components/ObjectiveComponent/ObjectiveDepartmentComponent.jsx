import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import DateInput from "../LittleComponents/DateInput";
import Spinner from "../LittleComponents/Spinner";

const ObjectiveDepartmentComponent = ({ item, setViewMode, setSelectedRegion, setSelectedLyne, date1, date2 }) => {

    const [objectiveData, setObjectiveData] = useState([]);
    const [dateFilterActive, setDateFilterActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, startDate, endDate, categoria: "", ciudad: "" });
    const [salesData, setSalesData] = useState("");
    const [selectedPayment, setSelectedPayment] = useState("");
    const [paymentFilterActive, setPaymentActive] = useState(false);

    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "numberOfBoxes" ? Number(value) : value,
            [name]: name === "saleLastYear1" ? Number(value) : value
        });
    };
    const handleSubmit = async () => {
        try {
            const endDate = new Date(formData.endDate);
            endDate.setDate(endDate.getDate() + 1);

            const response = await axios.post(
                API_URL + "/whatsapp/sales/objective/id",
                {
                    region: formData.ciudad,
                    lyne: formData.categoria,
                    numberOfBoxes: formData.numberOfBoxes,
                    saleLastYear: formData.saleLastYear1,
                    id: formData.ciudad + formData.numberOfBoxes,
                    id_owner: user,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                fetchObjectiveDataRegion();
                setModalOpen(false);
            }

        } catch (err) {
            console.error(err);
            alert("Error al insertar");
        } finally {
            setLoading(false);
        }
    };
    const fetchObjectiveDataRegion = async (customFilters) => {
        if (!item?.region) {
            return;
        }
    
        setLoading(true);
    
        const filters = {
            region: item.region,
            salesId: "",
            id_owner: user,
            payStatus: "",
            startDate: date1,
            endDate: date2,
            ...customFilters,
        };
    
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/objective/region/id", filters);
            setObjectiveData(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.post(API_URL + "/whatsapp/category/id",
                {
                    userId: user,
                    page: 1,
                    id_owner: user,
                    limit: 1000,
                }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSalesData(response.data.data);

        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
    const applyFilters = () => {
        const customFilters = {};
        if (selectedPayment) customFilters.payStatus = selectedPayment;

        fetchObjectiveDataRegion(customFilters);
    };
    useEffect(() => {
        fetchCategories();
        fetchObjectiveDataRegion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const clearFilter = (type) => {
        if (type === "date") {
            setStartDate("");
            setEndDate("");
            setSelectedPayment("")
            setDateFilterActive(false);
            setPaymentActive(false);
        }
    };

    return (
        <div className="bg-white min-h-screen rounded-lg p-5">
            {loading ? (
               <Spinner/>
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
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                            >
                                <option value="">Filtrar por: </option>
                                <option value="payment">Filtrar por estado de pago:</option>
                                <option value="date">Filtrar por fecha:</option>
                            </select>
                            {selectedFilter === "date" && (
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
                            )}
                            {selectedFilter === "payment" && (
                                <div className="flex gap-2">
                                    <select
                                        value={selectedPayment}
                                        onChange={(e) => setSelectedPayment(e.target.value)}
                                        className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                                    >
                                        <option value="">Selecciona un estado</option>
                                        <option value="">Mostrar Todos</option>
                                        <option value="Pagado">Pagado</option>
                                        <option value="Pendiente">Pendiente</option>
                                    </select>
                                    <button
                                        onClick={() => {
                                            applyFilters();
                                            setPaymentActive(true);
                                        }}
                                        className="px-4 py-2 font-bold text-lg text-white bg-[#D3423E] uppercase rounded-2xl hover:bg-gray-100 hover:text-[#D3423E] flex items-center gap-2"
                                    >
                                        Filtrar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {dateFilterActive && (
                            <span className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                Fecha: {startDate} → {endDate}
                                <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                            </span>
                        )}
                        {paymentFilterActive && (
                            <span className="bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                Estado de pago: {selectedPayment}
                                <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                            </span>
                        )}
                    </div>

                    <div className="mt-5 border border-gray-400 rounded-xl">
                        <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                <tr>
                               
                                    <th className="px-6 py-3 uppercase">Region</th>
                                    <th className="px-6 py-3 uppercase">Linea</th>
                                    <th className="px-6 py-3 uppercase">Objetivo</th>
                                    <th className="px-6 py-3 uppercase">VTA AA</th>
                                    <th className="px-6 py-3 uppercase">VTA ACUM</th>
                                    <th className="px-6 py-3 uppercase">VS AA</th>
                                    <th className="px-6 py-3 uppercase">VS OBJETIVO</th>
                                    <th className="px-6 py-3 uppercase">TENDENCIA</th>
                                    <th className="px-6 py-3 uppercase">POR VENDER</th>
                                </tr>
                            </thead>
                            <tbody>
                                {objectiveData.length > 0 ? (
                                    objectiveData.map((item) => (
                                        <tr onClick={() => {
                                            setSelectedRegion(item.region);
                                            setSelectedLyne(item.categoria)
                                            setViewMode("sales");
                                        }}
                                            key={item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                                                                         
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.region}</td>
                                            <td className="px-6 py-4 text-gray-900">{item.categoria}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.objective}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.saleLastYear}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.totalCajas}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{((item.totalCajas / item.saleLastYear) * 100).toFixed(2) + "%"}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{((item.totalCajas / item.objective) * 100).toFixed(2) + "%"}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{(item.totalCajas / 14) * 31}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{(item.objective - item.totalCajas).toFixed(2)}</td>

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
                                 
                                    <td className="px-6 py-3" ></td>
                                    <td className="px-6 py-3"></td>
                                    <td className="px-6 py-3">
                                        {objectiveData.reduce((sum, item) => sum + (item.objective || 0), 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {objectiveData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {objectiveData.reduce((sum, item) => sum + (item.totalCajas || 0), 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {
                                            (
                                                objectiveData.reduce((sum, item) => sum + ((item.totalCajas / item.saleLastYear) * 100), 0) /
                                                objectiveData.length
                                            ).toFixed(2) + "%"
                                        }
                                    </td>
                                    <td className="px-6 py-3">
                                        {
                                            (
                                                objectiveData.reduce((sum, item) => sum + ((item.totalCajas / item.objective) * 100), 0) /
                                                objectiveData.length
                                            ).toFixed(2) + "%"
                                        }
                                    </td>
                                    <td className="px-6 py-3">
                                        {
                                            (
                                                objectiveData.reduce((sum, item) => sum + ((item.totalCajas / 14) * 31), 0) /
                                                objectiveData.length
                                            ).toFixed(2)
                                        }
                                    </td>
                                    <td className="px-6 py-3">
                                        {objectiveData.reduce((sum, item) => sum + ((item.objective - item.totalCajas) || 0), 0).toFixed(2)}
                                    </td>

                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {modalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white w-full max-w-4xl p-6 rounded-lg relative">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="absolute top-2 text-gray-900 right-3 text-3xl font-bold"
                                >
                                    &times;
                                </button>
                                <h2 className="text-xl font-bold mb-2 text-gray-900">Insertar Objetivos de Venta a nivel de Departamento</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Seleccionar Categoría</label>
                                        <select
                                            className="text-gray-900 hover:text-red-700focus:outline-none focus:ring-0 focus:border-red-500 rounded-2xl p-2"
                                            name="categoria"
                                            value={formData.categoria}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Seleccione una categoría</option>
                                            {salesData.map((categoria) => (
                                                <option key={categoria._id} value={categoria.categoryName}>
                                                    {categoria.categoryName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Seleccionar Ciudad</label>
                                        <select
                                            className="text-gray-900 rounded-2xl p-2 focus:outline-none focus:ring-0 focus:border-red-500"
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

                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Número de Cajas</label>
                                        <input
                                            type="number"
                                            name="numberOfBoxes"
                                            value={formData.numberOfBoxes}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Venta Año Pasado</label>
                                        <input
                                            type="number"
                                            name="saleLastYear1"
                                            value={formData.saleLastYear1}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Fecha Inicial</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate || ''}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Fecha Final</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate || ''}
                                            onChange={handleChange}
                                            className="text-gray-900 border p-2 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        !formData.categoria ||
                                        !formData.ciudad ||
                                        !formData.numberOfBoxes ||
                                        !formData.saleLastYear1 ||
                                        !formData.startDate ||
                                        !formData.endDate
                                    }
                                    className={`mt-6 w-full text-lg px-4 py-2 rounded-3xl uppercase font-bold transition-colors duration-300 ${!formData.categoria ||
                                        !formData.ciudad ||
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

export default ObjectiveDepartmentComponent;
