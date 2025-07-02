import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import DateInput from "../LittleComponents/DateInput";
import { FaFileExport } from "react-icons/fa6";
import Spinner from "../LittleComponents/Spinner";

const ObjectiveSalesManComponent = ({ region }) => {

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
    const [saleActive, setActiveSaler] = useState(false);

    const [vendedores, setVendedores] = useState([]);
    const [salesmen, setSalesmen] = useState({});
    const [selectedSaler, setSelectedSaler] = useState("");

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

            const response = await axios.post(
                API_URL + "/whatsapp/sales/objective/sales",
                {
                    region: formData.ciudad,
                    lyne: formData.categoria,
                    numberOfBoxes: formData.numberOfBoxes,
                    saleLastYear: formData.saleLastYear1,
                    id: formData.ciudad + formData.numberOfBoxes,
                    id_owner: user,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
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
    const fetchSalesmenByIds = async (ids) => {
        if (!ids.length) return;
        try {
            const res = await axios.post(API_URL + "/whatsapp/salesman/multiple", { ids });
            const map = {};
            res.data.forEach(({ _id, fullName, lastName }) => {
                map[_id] = { fullName, lastName };
            });
            setSalesmen(map);
        } catch (error) {
            console.error("Error fetching salesmen:", error);
        }
    };
    const fetchObjectiveDataRegion = async (customFilters = {}) => {
        setLoading(true);
        
        const filters = {
            region,
            startDate: "2025-06-01",
            endDate: "2025-06-31",
            ...customFilters,
        };

        try {
            const response = await axios.post(API_URL + "/whatsapp/sales/objective/list", filters);
            const data = response.data;
            setObjectiveData(data);

            const uniqueIds = [...new Set(data.map(item => item.salesManId || item._id).filter(Boolean))];
            await fetchSalesmenByIds(uniqueIds);

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

        if (startDate && endDate) {
            customFilters.startDate = startDate;
            customFilters.endDate = endDate;
        }
        if (selectedPayment) customFilters.payStatus = selectedPayment;
        if (selectedSaler) customFilters.salesManId = selectedSaler;

        fetchObjectiveDataRegion(customFilters);
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
        fetchObjectiveDataRegion();
        fetchVendedores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const clearFilter = (type) => {
        if (type === "date") {
            setStartDate("");
            setEndDate("");
            setSelectedPayment("");
            setSelectedSaler("")
            setDateFilterActive(false);
            setPaymentActive(false);
            setActiveSaler(false)
        }
    };
    return (
        <div className="bg-white max-w-screen">
            <div className="mt-5 relative overflow-x-auto">
                {loading ? (
                    <Spinner/>
                ) : (
                    <div>
                        <div className="flex items-center justify-between w-full mt-5 mb-10">
                            <h2 className="text-2xl font-bold text-gray-900">Objetivo de ventas por mes de vendedor</h2>
                        </div>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">

                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedFilter}
                                    onChange={(e) => setSelectedFilter(e.target.value)}
                                    className="block p-2 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                                >
                                    <option value="">Filtrar por: </option>
                                    <option value="all">Filtrar por todos:</option>
                                    <option value="payment">Filtrar por estado de pago:</option>
                                    <option value="date">Filtrar por fecha:</option>
                                    <option value="saller">Filtrar por vendedor:</option>
                                </select>
                                {selectedFilter === "all" && (
                                    <div className="flex gap-2">

                                        <PrincipalBUtton onClick={() => {
                                            clearFilter("date");
                                            fetchObjectiveDataRegion();
                                        }} icon={HiFilter}>Filtrar</PrincipalBUtton>

                                    </div>
                                )}
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
                                            <option value="Pagado">Pagado</option>
                                            <option value="Pendiente">Pendiente</option>
                                        </select>

                                        <PrincipalBUtton onClick={() => {
                                            applyFilters();
                                            setPaymentActive(true);
                                        }} icon={HiFilter}>Filtrar</PrincipalBUtton>

                                    </div>
                                )}
                                {selectedFilter === "saller" && (
                                    <div className="flex gap-2">
                                    <select
                                        className="block p-2 text-m text-gray-900 border border-gray-900 rounded-3xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
                                         value={selectedSaler} onChange={(e) => setSelectedSaler(e.target.value)} required>
                                        <option value="">Seleccione un vendedor</option>
                                        {vendedores.map((vendedor) => (
                                            <option key={vendedor._id} value={vendedor._id}>{vendedor.fullName + " " + vendedor.lastName}</option>
                                        ))}
                                    </select>
                                        <PrincipalBUtton onClick={() => {
                                            applyFilters();
                                            setActiveSaler(true);
                                        }} icon={HiFilter}>Filtrar</PrincipalBUtton>
                                        </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    className="px-4 py-2 bg-white font-bold text-red-700 text-lg rounded-2xl flex items-center gap-2"
                                >
                                    <FaFileExport size={24} color="bg-red-700" />
                                </button>

                                <PrincipalBUtton onClick={() => setModalOpen(true)}>
                                    Nuevo Objetivo
                                </PrincipalBUtton>
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
                                <span className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    Estado de pago: {selectedPayment}
                                    <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                                </span>
                            )}
                            {saleActive && (
                                <span className="bg-green-500 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    Vendedor: {
                                    vendedores.find(v => v._id === selectedSaler)?.fullName + " " +
                                    vendedores.find(v => v._id === selectedSaler)?.lastName
                                    }
                                    <button onClick={() => clearFilter("date")} className="font-bold">×</button>
                                </span>
                                )}

                        </div>

                        <div className="mt-5 border border-gray-400 rounded-xl overflow-x-auto max-w-full">
                            <table className="w-full text-sm text-left text-gray-500 border border-gray-900 rounded-2xl overflow-hidden">
                                <thead className="text-sm text-gray-700 bg-gray-200 border-b border-gray-300">
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
                                        <th className="px-6 py-3 uppercase">VENDEDOR</th>
                                        <th className="px-10 py-3 uppercase min-w-[200px]">PROGRESO</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {objectiveData.length > 0 ? (
                                        objectiveData.map((item) => {
                                            const salesman = salesmen[item.salesManId || item._id];
                                            return (
                                                <tr key={item.objetivoId || item._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
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
                                                    <td className="px-6 py-4 font-medium text-gray-900">{region}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.lyne}</td>

                                                    <td className="px-6 py-4 text-gray-900">{item.numberOfBoxes}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.saleLastYear}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.caja.toFixed(2)}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{((item.caja / item.saleLastYear) * 100).toFixed(2) + "%"}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{((item.caja / item.numberOfBoxes) * 100).toFixed(2) + "%"}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{salesman ? `${salesman.fullName} ${salesman.lastName}` : "Sin vendedor"}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">

                                                        <div className="flex justify-between mb-1">
                                                            <span className="text-base font-medium text-green-700 dark:text-white"></span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {((item.caja / item.numberOfBoxes) * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-300 rounded-full h-1.5 dark:bg-gray-700">

                                                            <div
                                                                className="bg-green-600 h-1.5 rounded-full"
                                                                style={{
                                                                    width: `${((item.caja / item.numberOfBoxes) * 100).toFixed(2)}%`,
                                                                }}
                                                            >
                                                            </div>
                                                        </div>
                                                    </td>

                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                                No se encontraron registros con esa fecha.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                <tfoot>
                                    <tr className="bg-gray-200 font-semibold text-gray-900">
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3">
                                            {objectiveData.reduce((sum, item) => sum + (item.numberOfBoxes || 0), 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3">
                                            {objectiveData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3">
                                            {objectiveData.reduce((sum, item) => sum + (item.caja || 0), 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3">
                                            {
                                                (
                                                    objectiveData.reduce((sum, item) => sum + ((item.caja / item.saleLastYear) * 100), 0) /
                                                    objectiveData.length
                                                ).toFixed(2) + "%"
                                            }
                                        </td>
                                        <td className="px-6 py-3">
                                            {
                                                (
                                                    objectiveData.reduce((sum, item) => sum + ((item.caja / item.numberOfBoxes) * 100), 0) /
                                                    objectiveData.length
                                                ).toFixed(2) + "%"
                                            }
                                        </td>
                                        <td className="px-6 py-3">

                                        </td>
                                        <td className="px-6 py-3">

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

        </div>
    );
};

export default ObjectiveSalesManComponent;
