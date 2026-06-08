import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { sortProducts } from "../constants/productConfig";

export const useProducts = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/product/id", {
        id_user: user, status: false,
        page: pageNum, limit: itemsPerPage,
        search: searchTerm, category: selectedCategory,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSalesData(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setItems(res.data.total || res.data.products?.length || 0);
    } catch (e) { setSalesData([]); }
    finally { setLoading(false); }
  }, [user, token, itemsPerPage, searchTerm, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/category/id",
        { userId: user, id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategoriesList(res.data.data || []);
    } catch (e) {}
  }, [user, token]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { fetchProducts(page); }, [page, itemsPerPage, selectedCategory, fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const sortedData = useMemo(() => sortProducts(salesData, sortBy, sortOrder), [salesData, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: items,
    onOffer: salesData.filter((p) => p.priceId?.offerPrice).length,
    withDiscount: salesData.filter((p) => p.priceId?.discount && p.priceId?.discount !== "0%").length,
    categories: categoriesList.length,
  }), [salesData, items, categoriesList]);

  return {
    salesData, sortedData, loading, page, setPage, totalPages, items,
    itemsPerPage, setItemsPerPage, searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory, categoriesList,
    sortBy, sortOrder, handleSort, stats, fetchProducts,
  };
};