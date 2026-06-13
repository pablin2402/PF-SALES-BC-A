import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { sortProducts } from "../constants/productConfig";

export const useProducts = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [globalStats, setGlobalStats] = useState({ onOffer: 0, withDiscount: 0 });

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const abortRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCategory, itemsPerPage]);

  const fetchProducts = useCallback(async (pageNum = page) => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await axios.post(
        `${API_URL}/whatsapp/product/id`,
        {
          id_user: user, status: false,
          page: pageNum, limit: itemsPerPage,
          search: debouncedSearch, category: selectedCategory,
        },
        { ...authHeaders, signal: controller.signal },
      );
      const products = res.data.products || [];
      setSalesData(products);
      setTotalPages(res.data.totalPages || 1);
      setItems(res.data.total ?? products.length);
      if (typeof res.data.onOfferTotal === "number" || typeof res.data.withDiscountTotal === "number") {
        setGlobalStats({
          onOffer: res.data.onOfferTotal ?? 0,
          withDiscount: res.data.withDiscountTotal ?? 0,
        });
      }
    } catch (e) {
      if (e.name === "CanceledError" || axios.isCancel?.(e)) return;
      console.error("Error al cargar productos:", e);
      setError("No se pudieron cargar los productos. Reintenta en unos segundos.");
      setSalesData([]);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [user, authHeaders, itemsPerPage, debouncedSearch, selectedCategory, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.post(
        `${API_URL}/whatsapp/category/id`,
        { userId: user, id_owner: user },
        authHeaders,
      );
      setCategoriesList(res.data.data || []);
    } catch (e) {
      console.error("Error al cargar categorías:", e);
    }
  }, [user, authHeaders]);

  useEffect(() => { fetchProducts(page); return () => abortRef.current?.abort(); }, [fetchProducts, page]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSort = useCallback((field) => {
    setSortBy((prevField) => {
      if (prevField === field) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prevField;
      }
      setSortOrder("asc");
      return field;
    });
  }, []);

  const sortedData = useMemo(
    () => sortProducts(salesData, sortBy, sortOrder),
    [salesData, sortBy, sortOrder],
  );

  const stats = useMemo(() => ({
    total: items,
    onOffer: globalStats.onOffer || salesData.filter((p) => p.priceId?.offerPrice).length,
    withDiscount: globalStats.withDiscount || salesData.filter((p) => p.priceId?.discount && p.priceId.discount !== "0%").length,
    categories: categoriesList.length,
  }), [salesData, items, categoriesList, globalStats]);

  return {
    salesData, sortedData, loading, error, page, setPage, totalPages, items,
    itemsPerPage, setItemsPerPage, searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory, categoriesList,
    sortBy, sortOrder, handleSort, stats, fetchProducts,
  };
};