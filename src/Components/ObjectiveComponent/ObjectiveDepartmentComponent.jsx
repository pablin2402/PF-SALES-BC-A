import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";
import DateInput from "../LittleComponents/DateInput";
import Spinner from "../LittleComponents/Spinner";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";

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
    const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);

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
    const initialFormData = {
        ciudad: "",
        categoria: "",
        numberOfBoxes: "",
        saleLastYear1: "",
        startDate: "",
        endDate: ""
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
                setFormData(initialFormData); 
                setModalOpen(false);
            }

        } catch (err) {
            console.error(err);
            setShowObjectiveErrorModal(true);
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
            const response = await axios.post(API_URL + "/whatsapp/order/objective/region/id", filters , {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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
  <div className="min-h-screen bg-[#f8f8f8] rounded-[30px] p-6">
    {loading ? (
      <Spinner />
    ) : (
      <div className="space-y-6">

        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-[28px] p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Objetivos por región
              </h1>

              <p className="text-red-100 mt-2 text-lg">
                Control y monitoreo de rendimiento comercial
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-white text-red-700 hover:bg-red-50 transition-all duration-300 font-bold px-6 py-4 rounded-2xl shadow-lg text-lg"
            >
              + Nuevo Objetivo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-red-100 shadow-sm p-5">
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">

            <div className="flex-1">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full bg-[#fafafa] border-2 border-red-100 rounded-2xl px-5 py-4 text-gray-800 font-semibold focus:outline-none focus:border-red-500 transition"
              >
                <option value="">Filtrar por</option>
                <option value="payment">Estado de pago</option>
                <option value="date">Fecha</option>
              </select>
            </div>

            {selectedFilter === "date" && (
              <div className="flex flex-col lg:flex-row gap-4 w-full">

                <div className="w-full">
                  <DateInput
                    value={startDate}
                    onChange={setStartDate}
                    label="Fecha inicial"
                  />
                </div>

                <div className="w-full">
                  <DateInput
                    value={endDate}
                    onChange={setEndDate}
                    min={startDate}
                    label="Fecha final"
                  />
                </div>

                <button
                  onClick={() => {
                    applyFilters();
                    setDateFilterActive(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-8 py-4 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <HiFilter className="text-xl" />
                  Filtrar
                </button>
              </div>
            )}

            {selectedFilter === "payment" && (
              <div className="flex flex-col lg:flex-row gap-4 w-full">

                <select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="w-full bg-[#fafafa] border-2 border-red-100 rounded-2xl px-5 py-4 text-gray-800 font-semibold focus:outline-none focus:border-red-500 transition"
                >
                  <option value="">Selecciona un estado</option>
                  <option value="">Mostrar todos</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>

                <button
                  onClick={() => {
                    applyFilters();
                    setPaymentActive(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-8 py-4 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <HiFilter className="text-xl" />
                  Filtrar
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            {dateFilterActive && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold flex items-center gap-3">
                {startDate} → {endDate}

                <button
                  onClick={() => clearFilter("date")}
                  className="text-red-700 text-lg"
                >
                  ×
                </button>
              </div>
            )}

            {paymentFilterActive && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-3">
                {selectedPayment}

                <button
                  onClick={() => clearFilter("date")}
                  className="text-white text-lg"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

          <div className="bg-white rounded-[26px] p-6 border border-red-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">
              Objetivos
            </p>

            <h2 className="text-4xl font-black text-red-600 mt-3">
              {objectiveData.reduce((sum, item) => sum + (item.objective || 0), 0).toFixed(0)}
            </h2>
          </div>

          <div className="bg-white rounded-[26px] p-6 border border-red-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">
              Venta acumulada
            </p>

            <h2 className="text-4xl font-black text-red-600 mt-3">
              {objectiveData.reduce((sum, item) => sum + (item.totalCajas || 0), 0).toFixed(0)}
            </h2>
          </div>

          <div className="bg-white rounded-[26px] p-6 border border-red-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">
              Venta año pasado
            </p>

            <h2 className="text-4xl font-black text-red-600 mt-3">
              {objectiveData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0).toFixed(0)}
            </h2>
          </div>

          <div className="bg-white rounded-[26px] p-6 border border-red-100 shadow-sm">
            <p className="text-sm font-bold text-gray-500 uppercase">
              Por vender
            </p>

            <h2 className="text-4xl font-black text-red-600 mt-3">
              {objectiveData.reduce((sum, item) => sum + ((item.objective - item.totalCajas) || 0), 0).toFixed(0)}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-[30px] border border-red-100 shadow-sm overflow-hidden">

          <div className="px-8 py-6 border-b border-red-100 bg-red-50">
            <h2 className="text-2xl font-black text-gray-900">
              Objetivos nacionales
            </h2>

            <p className="text-gray-500 mt-1">
              Rendimiento consolidado por línea
            </p>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1200px]">

              <thead className="bg-[#fff5f5]">
                <tr className="text-left">

                  {[
                    "REGIÓN",
                    "LÍNEA",
                    "OBJETIVO",
                    "VTA AA",
                    "VTA ACUM",
                    "VS AA",
                    "VS OBJ",
                    "TENDENCIA",
                    "POR VENDER"
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-5 text-xs font-black tracking-wider text-red-700 uppercase"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {objectiveData.length > 0 ? (
                  objectiveData.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => {
                        setSelectedRegion(item.region);
                        setSelectedLyne(item.categoria);
                        setViewMode("sales");
                      }}
                      className="border-b border-red-50 hover:bg-red-50/40 transition-all duration-200 cursor-pointer"
                    >
                      <td className="px-6 py-5 font-bold text-gray-900">
                        {item.region}
                      </td>

                      <td className="px-6 py-5 font-semibold text-gray-700">
                        {item.categoria}
                      </td>

                      <td className="px-6 py-5 font-black text-red-600">
                        {item.objective}
                      </td>

                      <td className="px-6 py-5 font-semibold text-gray-700">
                        {item.saleLastYear}
                      </td>

                      <td className="px-6 py-5 font-black text-gray-900">
                        {item.totalCajas}
                      </td>

                      <td className="px-6 py-5">
                        <span className="bg-red-100 text-red-700 px-3 py-2 rounded-full text-sm font-bold">
                          {((item.totalCajas / item.saleLastYear) * 100).toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="bg-red-600 text-white px-3 py-2 rounded-full text-sm font-bold">
                          {((item.totalCajas / item.objective) * 100).toFixed(2)}%
                        </span>
                      </td>

                      <td className="px-6 py-5 font-bold text-gray-700">
                        {((item.totalCajas / 14) * 31).toFixed(2)}
                      </td>

                      <td className="px-6 py-5 font-black text-red-600">
                        {(item.objective - item.totalCajas).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-24 text-center">

                      <div className="flex flex-col items-center justify-center">

                        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-5">
                          <FaTimesCircle className="text-red-500 text-5xl" />
                        </div>

                        <h2 className="text-2xl font-black text-gray-800">
                          No hay datos disponibles
                        </h2>

                        <p className="text-gray-500 mt-2">
                          Ajusta los filtros o intenta nuevamente
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot className="bg-[#fff5f5] border-t border-red-100">
                <tr>

                  <td className="px-6 py-5"></td>
                  <td className="px-6 py-5 font-black text-gray-900">
                    TOTAL
                  </td>

                  <td className="px-6 py-5 font-black text-red-700">
                    {objectiveData.reduce((sum, item) => sum + (item.objective || 0), 0).toFixed(2)}
                  </td>

                  <td className="px-6 py-5 font-black text-gray-900">
                    {objectiveData.reduce((sum, item) => sum + (item.saleLastYear || 0), 0).toFixed(2)}
                  </td>

                  <td className="px-6 py-5 font-black text-gray-900">
                    {objectiveData.reduce((sum, item) => sum + (item.totalCajas || 0), 0).toFixed(2)}
                  </td>

                  <td className="px-6 py-5 font-black text-red-700">
                    {(
                      objectiveData.reduce((sum, item) => sum + ((item.totalCajas / item.saleLastYear) * 100), 0) /
                      objectiveData.length
                    ).toFixed(2)}%
                  </td>

                  <td className="px-6 py-5 font-black text-red-700">
                    {(
                      objectiveData.reduce((sum, item) => sum + ((item.totalCajas / item.objective) * 100), 0) /
                      objectiveData.length
                    ).toFixed(2)}%
                  </td>

                  <td className="px-6 py-5 font-black text-gray-900">
                    {(
                      objectiveData.reduce((sum, item) => sum + ((item.totalCajas / 14) * 31), 0) /
                      objectiveData.length
                    ).toFixed(2)}
                  </td>

                  <td className="px-6 py-5 font-black text-red-700">
                    {objectiveData.reduce((sum, item) => sum + ((item.objective - item.totalCajas) || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default ObjectiveDepartmentComponent;
