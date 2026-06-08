import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";
import { MONTHS } from "../constants/homeConfigs";

export const useHome = () => {
  const now = new Date();
  const [salesData, setSalesData] = useState([]);
  const [numberOfOrdersNew, setNumberOfOrdersNew] = useState(0);
  const [salesBySeller, setSalesBySeller] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((now.getMonth() + 1).toString().padStart(2, "0"));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("monthYear");
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingPredict, setLoadingPredict] = useState(true);

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const years = Array.from({ length: 17 }, (_, i) => 2010 + i);

  const fetchChart = useCallback(async () => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/order/products/stadistics",
        { year: selectedYear, month: selectedMonth, page: 1, itemsPerPage: 5 },
        { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data || [];
      setLabels(data.map(i => i._id?.slice(0, 12) || "Sin nombre"));
      setValues(data.map(i => i.totalCantidad || 0));
    } catch (e) {}
  }, [selectedYear, selectedMonth, token]);

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const body = filterType === "monthYear"
        ? { id_owner: user, year: selectedYear, month: selectedMonth }
        : { id_owner: user, startDate, endDate };
      const res = await axios.post(API_URL + "/whatsapp/order/id/statistics", body,
        { headers: { Authorization: `Bearer ${token}` } });
      setSalesData(res.data.orders || []);
      const grouped = (res.data.orders || []).reduce((acc, o) => {
        const id = o.salesId?._id || "X";
        const name = `${o.salesId?.fullName || "Desconocido"} ${o.salesId?.lastName || ""}`.trim();
        if (!acc[id]) acc[id] = { sellerName: name, totalAmount: 0, totalOrders: 0 };
        acc[id].totalAmount += o.totalAmount;
        acc[id].totalOrders += 1;
        return acc;
      }, {});
      setSalesBySeller(Object.values(grouped).sort((a, b) => b.totalAmount - a.totalAmount));
    } catch (e) { setError("Error al cargar los datos."); }
    finally { setLoading(false); }
  }, [filterType, selectedYear, selectedMonth, startDate, endDate, token, user]);

  useEffect(() => { fetchChart(); }, [fetchChart]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    axios.post(API_URL + "/whatsapp/order/products/analysis", {},
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setProducts(res.data.data); setLoadingPredict(false); })
      .catch(() => setLoadingPredict(false));
  }, [token]);

  useEffect(() => {
    axios.post(API_URL + "/whatsapp/order/status/count",
      { id_owner: user, status: "En Ruta" },
      { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setNumberOfOrdersNew(res.data.count || 0))
      .catch(() => {});
  }, [user, token]);

  const exportToExcel = () => {
    const rows = salesData.map(o => {
      const prods = o.products.map(p => `${p.nombre} (${p.cantidad}, Bs ${p.precio})`).join(" | ");
      const d = new Date(o.creationDate); d.setHours(d.getHours() - 4);
      return {
        "Recibo": o.receiveNumber || "—",
        "Fecha": d.toISOString().replace("T", " ").substring(0, 19),
        "Vendedor": `${o.salesId?.fullName || "—"} ${o.salesId?.lastName || ""}`.trim(),
        "Productos": prods,
        "Total Bs": o.totalAmount,
        "Estado pago": o.payStatus || "—",
        "Estado entrega": o.orderStatus || "—",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalOrdersSum = useMemo(() => salesBySeller.reduce((s, x) => s + x.totalOrders, 0), [salesBySeller]);
  const totalAmountSum = useMemo(() => salesBySeller.reduce((s, x) => s + x.totalAmount, 0), [salesBySeller]);
  const averageTicket = totalOrdersSum > 0 ? totalAmountSum / totalOrdersSum : 0;
  const topSeller = salesBySeller[0];
  const currentMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";

  return {
    salesData, salesBySeller, loading, error, loadingPredict,
    selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
    startDate, setStartDate, endDate, setEndDate,
    filterType, setFilterType, years,
    labels, values, products, numberOfOrdersNew,
    totalOrdersSum, totalAmountSum, averageTicket, topSeller, currentMonthLabel,
    fetchOrders, exportToExcel,
  };
};