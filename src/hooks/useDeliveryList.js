import { useState, useEffect, useCallback } from "react";
import { fetchDeliveryList, updateDeliveryStatus } from "./deliveryApi";

export const useDeliveryList = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPageRaw] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const refetch = useCallback(async (pageNumber = page) => {
    setLoading(true);
    try {
      const res = await fetchDeliveryList({ page: pageNumber, limit: itemsPerPage, searchTerm });
      setSalesData(res.data);
      setTotalPages(res.totalPages);
      setItems(res.items);
    } catch (err) {
      console.error("Error fetching delivery list:", err);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [page, itemsPerPage, searchTerm]);

  // Debounce: al cambiar searchTerm, vuelve a la página 1 después de 400ms
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    refetch(page);
  }, [page, itemsPerPage, searchTerm, refetch]);

  const setItemsPerPage = (n) => {
    setItemsPerPageRaw(n);
    setPage(1);
  };

  const handleToggle = async (newStatus, id) => {
    setSalesData(prev => prev.map(s => s._id === id ? { ...s, active: newStatus } : s));
    try {
      await updateDeliveryStatus(id, newStatus);
    } catch (err) {
      console.error("Error al cambiar estado", err);
      setSalesData(prev => prev.map(s => s._id === id ? { ...s, active: !newStatus } : s));
    }
  };

  return {
    salesData, loading,
    page, setPage, totalPages,
    items, itemsPerPage, setItemsPerPage,
    searchTerm, setSearchTerm,
    handleToggle, refetch,
  };
};