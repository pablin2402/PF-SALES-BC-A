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
import { FaFilter } from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ObjectiveSalesManComponent from "../Components/ObjectiveComponent/ObjectiveSalesManComponent";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);


const HomeView = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");

  const [salesData, setSalesData] = useState([]);
  const [numberOfOrders, setNumberOfOrders] = useState([]);
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

  const colorClasses = [
    'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-yellow-300',
    'bg-red-800', 'bg-red-900', 'bg-yellow-600', 'bg-yellow-800'
  ];
  const years = Array.from({ length: 16 }, (_, i) => 2010 + i);
  const months = [
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
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requestData =
        filterType === "monthYear"
          ? { id_owner: user, year: selectedYear, month: selectedMonth }
          : { id_owner: user, startDate, endDate };

      const response = await axios.post(API_URL + "/whatsapp/order/id/statistics", requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      setSalesData(response.data.orders);

      const groupedSales = response.data.orders.reduce((acc, order) => {
        const sellerId = order.salesId?._id || "Desconocido";
        const sellerName = `${order.salesId?.fullName || "Desconocido"} ${order.salesId?.lastName || ""}`.trim();

        if (!acc[sellerId]) {
          acc[sellerId] = { sellerName, totalAmount: 0, totalOrders: 0 };
        }
        acc[sellerId].totalAmount += order.totalAmount;
        acc[sellerId].totalOrders += 1;
        return acc;
      }, {});

      setSalesBySeller(Object.values(groupedSales));
    } catch (error) {
      setError("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedYear, selectedMonth, startDate, endDate, token, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const exportOrdersToExcel = () => {
    const formattedOrders = salesData.map((order) => {
      const productos = order.products
        .map(
          (p) =>
            `${p.nombre} (Cant: ${p.cantidad}, Precio: Bs ${p.precio})`
        )
        .join(" | ");
      const creationDateUTC = new Date(order.creationDate);
      creationDateUTC.setHours(creationDateUTC.getHours() - 4);
      const formattedDate = creationDateUTC.toISOString().replace('T', ' ').substring(0, 19);
      return {
        "Número / Recibo": order.receiveNumber || "—",
        "Fecha de creación": formattedDate,
        "Vencimiento": new Date(order.dueDate).toLocaleDateString(),
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
  const getInitials = (name) => {
    const firstInitial = name?.charAt(0).toUpperCase() || '';
    return firstInitial;
  };
  const getColor = (name, lastName) => {
    const hash = (name + lastName)
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % colorClasses.length;
    return colorClasses[index];
  };
  const totalOrdersSum = salesBySeller.reduce((sum, seller) => sum + seller.totalOrders, 0);
  const totalAmountSum = salesBySeller.reduce((sum, seller) => sum + seller.totalAmount, 0);

  const fetchNumber = async () => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/whatsapp/order/status/count",
        {
          id_owner: user,
        }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNumberOfOrders(response.data.count);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="bg-white w-full min-h-screen p-4 sm:p-5">
      <div className="mx-auto w-full max-w-7xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div role="status">
              <svg className="w-10 h-10 text-gray-200 animate-spin fill-red-500" viewBox="0 0 100 101">
                <path d="M100 50.59..." fill="currentColor" />
                <path d="M93.97 39.04..." fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="w-full p-6 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-between items-start sm:items-center mt-2 sm:mt-5">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Reporte de ventas</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <select
                  className="p-2 text-sm text-gray-900 border border-gray-500 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="monthYear">Filtrar por Mes y Año</option>
                  <option value="dateRange">Filtrar por Rango de Fechas</option>
                </select>

                {filterType === "monthYear" ? (
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="p-2 text-sm font-bold text-gray-700 border border-gray-500 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      className="p-2 text-sm font-bold text-gray-700 border border-gray-500 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="date"
                      className="p-2 text-sm font-semibold  text-gray-700 border border-gray-500 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                      type="date"
                      className="p-2 text-sm font-semibold text-gray-700 border border-gray-500 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <button
                      onClick={fetchOrders}
                      className="px-4 py-2 text-sm font-bold bg-white text-[#D3423E] border border-red-400 rounded-2xl hover:bg-gray-100 flex items-center gap-1"
                    >
                      <FaFilter />
                      Filtrar
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 border border-gray-300 rounded-xl overflow-x-auto">
                <table className="min-w-full text-xs text-left text-gray-500">
                  <thead className="text-xs sm:text-sm text-gray-700 bg-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase"></th>
                      <th className="px-4 py-3 font-bold uppercase">Vendedor</th>
                      <th className="px-4 py-3 font-bold uppercase">Número de pedidos</th>
                      <th className="px-4 py-3 font-bold uppercase">Total Vendido</th>
                      <th className="px-4 py-3 font-bold uppercase">Exportar</th>

                    </tr>
                  </thead>
                  <tbody>
                    {salesBySeller.length > 0 ? (
                      salesBySeller.map((seller) => (
                        <tr key={seller.sellerName} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div
                              className={`relative inline-flex items-center justify-center w-10 h-10 overflow-hidden rounded-full ${getColor(seller.sellerName, seller.sellerName)}`}
                            >
                              <span className="font-medium text-white">
                                {getInitials(seller.sellerName)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{seller.sellerName}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{seller.totalOrders}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">Bs. {seller.totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={exportOrdersToExcel}
                              className="p-2 bg-white font-bold text-[#D3423E] rounded-2xl flex items-center gap-1"
                            >
                              <FaFileExport size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                          No hay datos disponibles.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Pedidos del mes</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-2">{totalOrdersSum}</h2>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Total vendido</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-2">Bs. {totalAmountSum.toFixed(2)}</h2>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Clientes nuevos</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-2">150</h2>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Pedidos en camino</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-2">{numberOfOrders}</h2>
              </div>
            </div>
            <div className="w-full p-6 bg-white border border-gray-200 rounded-2xl shadow-md dark:bg-gray-800 dark:border-gray-700">

            <ObjectiveSalesManComponent region="TOTAL CBB" />
            </div>
          </div>
        )}
      </div>
    </div>

  );
}

export default HomeView;
