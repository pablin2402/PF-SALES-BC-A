import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const useOrders = () => {
  const [salesData, setSalesData] = useState([]);
  const [counts, setCounts] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [vendedores, setVendedores] = useState([]);

  const [filters, setFilters] = useState({
    inputValue: "",
    selectedStatus: "",
    selectedSaler: "",
    selectedPaymentType: "",
    selectedPayment: "",
    selectedRegion: "",
    startDate: "",
    endDate: "",
  });

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const buildPayload = (customStatus) => {
    const payload = { id_owner: user };
    if (filters.inputValue) payload.fullName = filters.inputValue;
    const status = customStatus !== undefined ? customStatus : filters.selectedStatus;
    if (status) payload.status = status;
    if (filters.selectedPaymentType) payload.paymentType = filters.selectedPaymentType;
    if (filters.selectedSaler) payload.salesId = filters.selectedSaler;
    if (filters.selectedPayment) payload.payStatus = filters.selectedPayment;
    if (filters.selectedRegion) payload.region = filters.selectedRegion;
    if (filters.startDate && filters.endDate) {
      payload.startDate = filters.startDate;
      payload.endDate = filters.endDate;
    }
    return payload;
  };

  const fetchOrders = async (pageNum = page, customStatus) => {
    setTableLoading(true);
    try {
      const payload = { ...buildPayload(customStatus), page: pageNum, limit: itemsPerPage };
      const res = await axios.post(API_URL + "/whatsapp/order/id", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalesData(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setItems(res.data.totalRecords || 0);
    } catch (e) {
      setSalesData([]);
    } finally {
      setTableLoading(false);
      setInitialLoading(false);
    }
  };
  const fetchVendedores = async () => {
    try {
      const payload = { id_owner: user };
      const res = await axios.post(API_URL + "/whatsapp/sales/list/id",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendedores(res.data.data);
    } catch (error) {
      console.error("Error obteniendo vendedores", error);
      setVendedores([]);
    }
  };
  const fetchCounts = async (customStatus) => {
    setStatsLoading(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/order/filter/id", buildPayload(customStatus), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCounts(res.data.counts);
    } catch (e) {} finally { setStatsLoading(false); }
  };

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const clearAllFilters = () => {
    setFilters({
      inputValue: "", selectedStatus: "", selectedSaler: "",
      selectedPaymentType: "", selectedPayment: "", selectedRegion: "",
      startDate: "", endDate: "",
    });
    setPage(1);
  };
const clearFilter = (type) => {
    const map = {
      seller: "selectedSaler", paymentType: "selectedPaymentType",
      payment: "selectedPayment", region: "selectedRegion", status: "selectedStatus",
    };
    if (type === "date") {
      setFilters((f) => ({ ...f, startDate: "", endDate: "" }));
    } else if (map[type]) {
      setFilters((f) => ({ ...f, [map[type]]: "" }));
    }
  };
  useEffect(() => {
    fetchOrders(page);
    fetchCounts();
    fetchVendedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, itemsPerPage]);
  const applyFilters = () => {
    if (page === 1) {
      fetchOrders(1);
      fetchCounts();
    } else {
      setPage(1);
    }
  };
const hasActiveFilters = Boolean(
    filters.selectedSaler ||
    filters.selectedStatus ||
    filters.selectedPaymentType ||
    filters.selectedPayment ||
    filters.selectedRegion ||
    (filters.startDate && filters.endDate) ||
    filters.inputValue
  );
  useEffect(() => {
    if (!initialLoading) {
      fetchOrders(page);
      fetchCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  return {
    salesData, counts, totalPages, items, page, setPage, itemsPerPage, setItemsPerPage,
    initialLoading, tableLoading, statsLoading,
    filters, updateFilter, clearAllFilters,hasActiveFilters,
    fetchOrders, fetchCounts, applyFilters, vendedores
  };
};