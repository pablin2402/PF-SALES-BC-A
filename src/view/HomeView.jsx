import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { FaFilter, FaCalendarAlt, FaUsers, FaChartLine, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ObjectiveSalesManComponent from "../Components/ObjectiveComponent/ObjectiveSalesManComponent";
import { HiOutlineShoppingCart, HiOutlineCurrencyDollar, HiOutlineDotsVertical, HiOutlineTrendingUp, HiOutlineChartBar } from 'react-icons/hi';
import { MdLocalShipping } from 'react-icons/md';
import VentasChart from "../Components/charts/VentasChart";
import { useNavigate } from 'react-router-dom';
import TrendLineChart from "../Components/charts/TrendLineChart";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];

const COLOR_CLASSES = [
  'bg-gradient-to-br from-red-500 to-red-700',
  'bg-gradient-to-br from-blue-500 to-blue-700',
  'bg-gradient-to-br from-green-500 to-green-700',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-yellow-500 to-yellow-700',
  'bg-gradient-to-br from-pink-500 to-pink-700',
  'bg-gradient-to-br from-indigo-500 to-indigo-700',
  'bg-gradient-to-br from-teal-500 to-teal-700'
];

const HomeView = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const navigate = useNavigate();

  const [salesData, setSalesData] = useState([]);
  const [numberOfOrdersNew, setNumberOfOrdersNew] = useState(0);
  const [salesBySeller, setSalesBySeller] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("monthYear");
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const [itemsPerPage] = useState(5);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [page] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading2, setLoading2] = useState(true);

  const years = Array.from({ length: 17 }, (_, i) => 2010 + i);

  const fetchChart = useCallback(async (pages) => {
    try {
      const response = await axios.post(API_URL + "/whatsapp/order/products/stadistics",
        {
          year: selectedYear,
          month: selectedMonth,
          page: pages,
          itemsPerPage: itemsPerPage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetchedData = response.data.data || [];
      setLabels(fetchedData.map((item) => item._id?.slice(0, 12) || "Sin nombre"));
      setValues(fetchedData.map((item) => item.totalCantidad || 0));
    } catch (error) {
      console.error(error);
    }
  }, [selectedYear, selectedMonth, itemsPerPage, token]);

  useEffect(() => {
    fetchChart(page);
  }, [page, fetchChart]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData = filterType === "monthYear"
        ? { id_owner: user, year: selectedYear, month: selectedMonth }
        : { id_owner: user, startDate, endDate };

      const response = await axios.post(API_URL + "/whatsapp/order/id/statistics", requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(response.data.orders || []);

      const groupedSales = (response.data.orders || []).reduce((acc, order) => {
        const sellerId = order.salesId?._id || "Desconocido";
        const sellerName = `${order.salesId?.fullName || "Desconocido"} ${order.salesId?.lastName || ""}`.trim();
        if (!acc[sellerId]) {
          acc[sellerId] = { sellerName, totalAmount: 0, totalOrders: 0 };
        }
        acc[sellerId].totalAmount += order.totalAmount;
        acc[sellerId].totalOrders += 1;
        return acc;
      }, {});

      const sellersArr = Object.values(groupedSales).sort((a, b) => b.totalAmount - a.totalAmount);
      setSalesBySeller(sellersArr);
    } catch (error) {
      setError("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedYear, selectedMonth, startDate, endDate, token, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    axios.post(API_URL + "/whatsapp/order/products/analysis", {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => {
        setProducts(res.data.data);
        setLoading2(false);
      })
      .catch((err) => {
        console.error('Error al obtener predicciones:', err);
        setLoading2(false);
      });
  }, [token]);

  useEffect(() => {
    const fetchNumber2 = async () => {
      try {
        const response = await axios.post(API_URL + "/whatsapp/order/status/count",
          { id_owner: user, status: "En Ruta" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNumberOfOrdersNew(response.data.count || 0);
      } catch (error) {
        console.error("Error fetching orders count", error);
      }
    };
    fetchNumber2();
  }, [user, token]);

  const exportOrdersToExcel = () => {
    const formattedOrders = salesData.map((order) => {
      const productos = order.products
        .map((p) => `${p.nombre} (Cant: ${p.cantidad}, Precio: Bs ${p.precio})`)
        .join(" | ");
      const creationDateUTC = new Date(order.creationDate);
      creationDateUTC.setHours(creationDateUTC.getHours() - 4);
      const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
      return {
        "Número / Recibo": order.receiveNumber || "—",
        "Fecha de creación": formattedDate,
        "Vencimiento": order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "—",
        "Vendedor": `${order.salesId?.fullName || "—"} ${order.salesId?.lastName || ""}`.trim(),
        "Productos": productos,
        "Total Bs": order.totalAmount,
        "Descuento Bs": order.dissccount || 0,
        "Impuesto Bs": order.tax || 0,
        "Estado de pago": order.payStatus || "—",
        "Estado de entrega": order.orderStatus || "—",
        "Razón social": order.razonSocial || "—",
        "Dirección": order.direction || "—",
        "NIT": order.nit || "—",
        "Estado de cuenta": order.accountStatus || "—",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_By_Sales");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(dataBlob, `ordenes_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getInitials = (name) => name?.charAt(0).toUpperCase() || '?';

  const getColor = (name, lastName) => {
    const hash = (name + lastName).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length];
  };

  const totalOrdersSum = salesBySeller.reduce((sum, seller) => sum + seller.totalOrders, 0);
  const totalAmountSum = salesBySeller.reduce((sum, seller) => sum + seller.totalAmount, 0);
  const averageTicket = totalOrdersSum > 0 ? totalAmountSum / totalOrdersSum : 0;
  const topSeller = salesBySeller[0];

  const currentMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";

return (
    <div className="bg-gray-50 w-full min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Reporte de ventas · {filterType === "monthYear" ? `${currentMonthLabel} ${selectedYear}` : `${startDate || "..."} → ${endDate || "..."}`}
          </p>
        </div>

        {loading ? (
          <HomeSkeleton />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<HiOutlineShoppingCart size={24} />}
                label="Pedidos del mes"
                value={totalOrdersSum}
                bgColor="bg-red-100"
                iconColor="text-[#D3423E]"
                trend={totalOrdersSum > 0 ? 'up' : null}
              />
              <StatCard
                icon={<HiOutlineCurrencyDollar size={24} />}
                label="Total vendido"
                value={`Bs. ${totalAmountSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                bgColor="bg-green-100"
                iconColor="text-green-600"
                trend="up"
              />
              <StatCard
                icon={<HiOutlineTrendingUp size={24} />}
                label="Ticket promedio"
                value={`Bs. ${averageTicket.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                icon={<MdLocalShipping size={24} />}
                label="En camino"
                value={numberOfOrdersNew}
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FaUsers className="text-[#D3423E]" />
                      Ventas por vendedor
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Desempeño por equipo de ventas</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                      <button
                        onClick={() => setFilterType("monthYear")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterType === "monthYear" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        Mes / Año
                      </button>
                      <button
                        onClick={() => setFilterType("dateRange")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterType === "dateRange" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        Rango
                      </button>
                    </div>

                    {filterType === "monthYear" ? (
                      <div className="flex gap-2">
                        <select
                          className="px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                        <select
                          className="px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          {MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                          <input
                            type="date"
                            className="pl-8 pr-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                          <input
                            type="date"
                            className="pl-8 pr-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={fetchOrders}
                          className="px-4 py-2 text-sm font-bold bg-[#D3423E] text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-1.5"
                        >
                          <FaFilter size={12} /> Filtrar
                        </button>
                      </div>
                    )}

                    <button
                      onClick={exportOrdersToExcel}
                      className="px-3 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-1.5"
                    >
                      <FaFileExport size={14} />
                      <span className="hidden sm:inline">Exportar</span>
                    </button>
                  </div>
                </div>

                {topSeller && salesBySeller.length > 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                    <div className="text-2xl">🏆</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 uppercase">Top vendedor del período</p>
                      <p className="font-bold text-gray-900 truncate">{topSeller.sellerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="font-bold text-gray-900">Bs. {topSeller.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Vendedor</th>
                      <th className="px-4 py-3 font-semibold text-center">Pedidos</th>
                      <th className="px-4 py-3 font-semibold text-right">Total vendido</th>
                      <th className="px-4 py-3 font-semibold text-right">Ticket promedio</th>
                      <th className="px-4 py-3 font-semibold text-center">Progreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesBySeller.length > 0 ? (
                      salesBySeller.map((seller, idx) => {
                        const percentage = totalAmountSum > 0 ? (seller.totalAmount / totalAmountSum) * 100 : 0;
                        const ticketAvg = seller.totalOrders > 0 ? seller.totalAmount / seller.totalOrders : 0;
                        return (
                          <tr key={seller.sellerName} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`font-bold text-lg ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`relative inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-sm ${getColor(seller.sellerName, seller.sellerName)}`}>
                                  {getInitials(seller.sellerName)}
                                </div>
                                <span className="font-semibold text-gray-900">{seller.sellerName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="font-bold text-gray-900">{seller.totalOrders}</span>
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-gray-900">
                              Bs. {seller.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-right text-gray-700">
                              Bs. {ticketAvg.toFixed(2)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#D3423E] to-red-700 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-600 min-w-[45px] text-right">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FaUsers className="text-5xl mb-3 text-gray-300" />
                            <p className="text-lg font-semibold">Sin datos</p>
                            <p className="text-sm text-gray-400 mt-1">No hay ventas en este período</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-3">
                {salesBySeller.length > 0 ? salesBySeller.map((seller, idx) => {
                  const percentage = totalAmountSum > 0 ? (seller.totalAmount / totalAmountSum) * 100 : 0;
                  return (
                    <div key={seller.sellerName} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`font-bold text-lg w-8 ${idx === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                          #{idx + 1}
                        </span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getColor(seller.sellerName, seller.sellerName)}`}>
                          {getInitials(seller.sellerName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{seller.sellerName}</p>
                          <p className="text-xs text-gray-500">{seller.totalOrders} pedidos</p>
                        </div>
                        <p className="font-bold text-gray-900">Bs. {seller.totalAmount.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#D3423E] to-red-700 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <FaUsers className="text-4xl mb-3 text-gray-300" />
                    <p className="font-semibold">Sin datos</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <HiOutlineChartBar className="text-[#D3423E]" />
                      Productos más vendidos
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{currentMonthLabel} {selectedYear}</p>
                  </div>
                  <button
                    onClick={() => navigate("/stadistics")}
                    className="p-2 text-gray-400 hover:text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors"
                    title="Ver más"
                  >
                    <HiOutlineDotsVertical size={20} />
                  </button>
                </div>
                <VentasChart labels={labels} values={values} year={selectedYear} />
              </div>

              <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FaChartLine className="text-[#D3423E]" />
                      Tendencia de productos
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Análisis predictivo</p>
                  </div>
                  <button
                    onClick={() => navigate("/stadistics")}
                    className="p-2 text-gray-400 hover:text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors"
                    title="Ver más"
                  >
                    <HiOutlineDotsVertical size={20} />
                  </button>
                </div>
               {loading2 ? (
                  <TrendChartSkeleton />
                ) : (
                  <TrendLineChart products={products} limit={5} />
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <ObjectiveSalesManComponent region="TOTAL CBB" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, bgColor, iconColor, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 ${bgColor} ${iconColor} rounded-xl`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend === 'up' ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
          <span>activo</span>
        </div>
      )}
    </div>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
  </div>
);
const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} />
);

const TrendChartSkeleton = () => (
  <div className="flex flex-col gap-3 h-80 justify-end px-2 pt-4">
    <div className="flex items-end gap-3 h-full">
      {[65, 85, 45, 90, 70].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col gap-2 items-center justify-end">
          <SBox className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
        </div>
      ))}
    </div>
    <div className="flex gap-3">
      {[...Array(5)].map((_, i) => (
        <SBox key={i} className="flex-1 h-3" />
      ))}
    </div>
  </div>
);

const HomeSkeleton = () => (
  <div className="flex flex-col space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <SBox className="w-12 h-12 rounded-xl" />
            <SBox className="w-16 h-5 rounded-full" />
          </div>
          <SBox className="h-3 w-28 mb-2" />
          <SBox className="h-8 w-36" />
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <SBox className="h-6 w-52" />
            <SBox className="h-3 w-36" />
          </div>
          <div className="flex gap-2">
            <SBox className="h-10 w-32 rounded-xl" />
            <SBox className="h-10 w-28 rounded-xl" />
            <SBox className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 border-b border-gray-200">
            <tr>
              {["#", "Vendedor", "Pedidos", "Total vendido", "Ticket promedio", "Progreso"].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <SBox className="h-3 w-20" style={{ background: "#d1d5db" }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100" style={{ opacity: 1 - i * 0.15 }}>
                <td className="px-6 py-4"><SBox className="h-5 w-6" /></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <SBox className="w-10 h-10 rounded-full flex-shrink-0" />
                    <SBox className="h-4 w-32" />
                  </div>
                </td>
                <td className="px-4 py-4 text-center"><SBox className="h-4 w-8 mx-auto" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-28 ml-auto" /></td>
                <td className="px-4 py-4"><SBox className="h-4 w-24 ml-auto" /></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <SBox className="flex-1 h-2 rounded-full" />
                    <SBox className="h-3 w-10" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SBox className="w-8 h-5" />
              <SBox className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <SBox className="h-4 w-32" />
                <SBox className="h-3 w-20" />
              </div>
              <SBox className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <SBox className="flex-1 h-2 rounded-full" />
              <SBox className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <SBox className="h-5 w-48" />
              <SBox className="h-3 w-28" />
            </div>
            <SBox className="w-8 h-8 rounded-lg" />
          </div>
          <TrendChartSkeleton />
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="space-y-3">
        <SBox className="h-6 w-48" />
        <SBox className="h-4 w-64" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, i) => (
            <SBox key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
export default HomeView;