import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import DateInput from "../LittleComponents/DateInput";
import Spinner from "../LittleComponents/Spinner";

const ObjectiveSalesDetailComponent = ({ region, lyne, date1, date2 }) => {
    const [objectiveData, setObjectiveData] = useState([]);
    const [dateFilterActive, setDateFilterActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ numberOfBoxes: 0, saleLastYear1: 0, startDate, endDate, categoria: "", ciudad: "", salesMan: "" });
    const [salesData, setSalesData] = useState("");
    const [selectedPayment, setSelectedPayment] = useState("");
    const [paymentFilterActive, setPaymentActive] = useState(false);
    const [vendedores, setVendedores] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [setItems] = useState();


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
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            endDate.setDate(endDate.getDate() + 1);

            const response = await axios.post(
                API_URL + "/whatsapp/sales/objective/sales",
                {
                    region: formData.ciudad,
                    lyne: formData.categoria,
                    numberOfBoxes: formData.numberOfBoxes,
                    saleLastYear: formData.saleLastYear1,
                    id: formData.ciudad + formData.numberOfBoxes,
                    id_owner: user,
                    startDate: startDate,
                    endDate: endDate,
                    salesManId: formData.salesMan
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
    const fetchObjectiveDataRegion = async (pageNumber, customFilters = {}) => {
        setLoading(true);
        const filters = {
            region,
            id_owner:user,
            lyne,
            page: pageNumber,
            limit: itemsPerPage,
            startDate: date1 || customFilters.startDate,
            endDate: date2 || customFilters.endDate,
            ...customFilters 
        };
    
        try {
            const response = await axios.post(API_URL + "/whatsapp/order/objective/region/product", filters);
            setObjectiveData(response.data.data);
            setTotalPages(response.data.pages);
            setItems(response.data.total);

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
    
        const start = new Date(startDate);
        const end = new Date(endDate);
        const min = new Date(date1);
        const max = new Date(date2);
    
        if (startDate && endDate) {
            if (start < min || end > max) {
                return;
            }
            customFilters.startDate = startDate + "T00:00:00.000Z";
            customFilters.endDate = endDate + "T23:59:59.999Z";
        }
    
        if (selectedFilter === "payment" && !selectedPayment) {
            return;
        }
        if (selectedFilter === "payment" && selectedPayment === "") {
            setDateFilterActive(false);
            setPaymentActive(false);
            fetchObjectiveDataRegion(1); 
            return;
        }
        if (selectedPayment) {
            customFilters.payStatus = selectedPayment;
        }
    
        fetchObjectiveDataRegion(1, customFilters);
    };
    
    const fetchVendedores = async () => {
        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/list/id",
                {
                    id_owner: user
                }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setVendedores(response.data.data);
        } catch (error) {
            console.error("Error obteniendo vendedores", error);
            setVendedores([]);
        }
    };
    useEffect(() => {
        fetchCategories();
        fetchObjectiveDataRegion(page);
        fetchVendedores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, itemsPerPage]);
    const clearFilter = (type) => {
        if (type === "date") {
            setStartDate("");
            setEndDate("");
            setDateFilterActive(false);
            setSelectedFilter("");
        } else if (type === "pay") {
            setSelectedPayment("");
            setPaymentActive(false);
            setSelectedFilter("");

        }
    };
    return (
        <div className="bg-white min-h-screen rounded-lg p-5">
            {loading ? (
                <Spinner />
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
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedFilter(value);
                            
                                    if (value === "all") {
                                        setStartDate("");
                                        setEndDate("");
                                        setSelectedPayment("");
                                        setDateFilterActive(false);
                                        setPaymentActive(false);
                                        fetchObjectiveDataRegion(1);
                                    }
                                }}  
                                className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                            >
                                <option value="">Filtrar por: </option>
                                <option value="all">Mostrar todos</option>
                                <option value="payment">Filtrar por estado de pago:</option>
                                <option value="date">Filtrar por fecha:</option>
                            </select>
                            {selectedFilter === "date" && (
                                <div className="flex gap-2">
                                    <div className="flex items-center space-x-2">
                                        <DateInput
                                            value={startDate}
                                            onChange={setStartDate}
                                            label="Fecha de Inicio"
                                            min={date1}
                                            max={date2}
                                        />                                    
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <DateInput
                                            value={endDate}
                                            onChange={setEndDate}
                                            label="Fecha Final"
                                            min={startDate || date1}
                                            max={date2}
                                        />                                    
                                    </div>
                                    <PrincipalBUtton
                                        onClick={() => {
                                            if (startDate && endDate) {
                                                applyFilters();
                                                setDateFilterActive(true);
                                            }
                                        }}
                                        icon={HiFilter}
                                    >
                                        Filtrar
                                    </PrincipalBUtton>
                                   
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
                                    <PrincipalBUtton
                                        onClick={() => {
                                            if (selectedPayment) {
                                                applyFilters();
                                                setPaymentActive(true);
                                            }
                                        }}
                                        icon={HiFilter}
                                    >
                                        Filtrar
                                    </PrincipalBUtton>
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
                                <button onClick={() => clearFilter("pay")} className="font-bold">×</button>
                            </span>
                        )}
                    </div>
                    <div className="mt-5 border border-gray-400 rounded-xl">
                        <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                            <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
                                <tr>
                                    <th className="px-6 py-3 uppercase">Region</th>
                                    <th className="px-6 py-3 uppercase">Linea</th>
                                    <th className="px-6 py-3 uppercase">Producto</th>
                                    <th className="px-6 py-3 uppercase">Número de pedido</th>
                                    <th className="px-6 py-3 uppercase">Vendedor</th>
                                    <th className="px-6 py-3 uppercase">Fecha de creación</th>
                                    <th className="px-6 py-3 uppercase">Botellas</th>
                                    <th className="px-6 py-3 uppercase">Caja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {objectiveData.length > 0 ? (
                                    objectiveData.map((item) => (
                                        <tr key={item.receiveNumber + item.categoria + item.productName} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{region}</td>
                                            <td className="px-6 py-4 text-gray-900">{item.categoria}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.receiveNumber}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.salesFullName + " " + item.salesLastName}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900"> {item.creationDate
                                                ? new Date(item.creationDate).toLocaleString("es-ES", {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                    hour12: false,
                                                }).toUpperCase() : ''}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.totalBotellas}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.cantidadVendida.toFixed(2)}</td>
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
                            <tfoot className="text-sm text-gray-900 bg-gray-200 border-t border-gray-300 font-semibold ">
                                <tr className="bg-gray-200 font-semibold text-gray-900">
                                    <td className="px-6 py-3"></td>
                                    <td className="px-6 py-3"></td>
                                    <td className="px-6 py-3">
                                    </td>
                                    <td className="px-6 py-3">
                                    </td>
                                    <td className="px-6 py-3">

                                    </td>
                                    <td className="px-6 py-3">
                                    </td>
                                    <td className="px-6 py-3">
                                        {objectiveData.reduce((sum, item) => sum + (item.totalBotellas || 0), 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3">
                                        {objectiveData.reduce((sum, item) => sum + (item.cantidadVendida || 0), 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
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
                                            const selectedValue = Number(e.target.value);
                                            setItemsPerPage(selectedValue);
                                            setPage(1);
                                            fetchObjectiveDataRegion(1);
                                        }}
                                        className="border-2 border-gray-900 rounded-2xl px-2 py-1 text-m text-gray-700"
                                    >
                                            {[5, 10, 20].map((option) => (
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
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-900 mb-1">Seleccionar Vendedor</label>
                                        <select
                                            className="text-gray-900 rounded-2xl p-2 focus:outline-none focus:ring-0 focus:border-red-500"
                                            name="salesMan"
                                            value={formData.salesMan}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Seleccione un vendedor</option>
                                            <option value="">Mostrar Todos</option>
                                            <option value="">Mostrar Todos</option>
                                            {vendedores.map((vendedor) => (
                                                <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                                            ))}
                                        </select>
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

export default ObjectiveSalesDetailComponent;
