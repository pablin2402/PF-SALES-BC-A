import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const useStatistics = () => {
  const [salesData, setSalesData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPredict, setLoadingPredict] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [years, setYears] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const end = new Date().getFullYear();
    const list = [];
    for (let y = end; y >= 2010; y--) list.push(y);
    setYears(list);
  }, []);

  const fetchStats = useCallback(async (pageNum) => {
    setLoadingStats(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/order/products/stadistics", {
        year: selectedYear, month: selectedMonth, page: pageNum, itemsPerPage,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data || [];
      setSalesData(data);
      setLabels(data.map(i => i._id?.slice(0, 14) || "Sin nombre"));
      setValues(data.map(i => i.totalCantidad || 0));
      setTotalPages(res.data.pagination.totalPages);
      setItems(res.data.pagination.totalItems);
    } catch (e) { setSalesData([]); }
    finally { setLoadingStats(false); }
  }, [selectedYear, selectedMonth, itemsPerPage, token]);

  const fetchPredictions = useCallback(async () => {
    setLoadingPredict(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/order/products/analysis", {},
        { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data.data || []);
    } catch (e) { setProducts([]); }
    finally { setLoadingPredict(false); }
  }, [token]);

  useEffect(() => { fetchStats(page); }, [page, selectedYear, selectedMonth, itemsPerPage, fetchStats]);
  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  const exportToExcel = async () => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/order/products/stadistics", {
        year: selectedYear, month: selectedMonth, page: 1, itemsPerPage: 10000,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data || [];
      const ws = XLSX.utils.json_to_sheet(data.map(i => ({ Producto: i._id, Cantidad: i.totalCantidad })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf], { type: "application/octet-stream" }), `Ventas_${selectedYear}.xlsx`);
    } catch (e) { console.error(e); }
  };

  const getNextMonthLabel = (offset) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleString("es-ES", { month: "long" }).toUpperCase();
  };

  const totalUnidades = salesData.reduce((s, i) => s + (i.totalCantidad || 0), 0);
  const topProducto = salesData[0]?._id || "—";
  const mesLabel = selectedMonth ? MONTHS[selectedMonth - 1] : "Todos";
  const avgUnidades = salesData.length ? Math.round(totalUnidades / salesData.length) : 0;
  const productsWithForecast = products.filter(p => p.forecast?.length > 0);
  const totalForecast = productsWithForecast.reduce((s, p) => s + (p.forecast[0]?.valor || 0), 0);

  return {
    salesData, products, loadingStats, loadingPredict,
    page, setPage, totalPages, items, itemsPerPage, setItemsPerPage,
    selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
    labels, values, years, exportToExcel, getNextMonthLabel,
    totalUnidades, topProducto, mesLabel, avgUnidades, totalForecast,
    productsWithForecast,
  };
};