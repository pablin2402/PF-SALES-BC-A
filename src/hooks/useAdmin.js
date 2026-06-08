import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const useAdmin =()=>{
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  const navigate = useNavigate();
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_URL + "/whatsapp/administrator/list",
        { id_owner: user },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalesData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Error al cargar administradores");
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);
 const filteredAndSorted = salesData.filter(item => {
    const fullName = `${item.salesId?.fullName || ""} ${item.salesId?.lastName || ""}`.toLowerCase();
    const email = (item.salesId?.email || "").toLowerCase();
    const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === "all" || item.salesId?.region === regionFilter;
    return matchesSearch && matchesRegion;
  }).sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case "name":
          valA = `${a.salesId?.fullName || ""} ${a.salesId?.lastName || ""}`.toLowerCase();
          valB = `${b.salesId?.fullName || ""} ${b.salesId?.lastName || ""}`.toLowerCase();
          break;
        case "email":
          valA = (a.salesId?.email || "").toLowerCase();
          valB = (b.salesId?.email || "").toLowerCase();
          break;
        case "region":
          valA = (a.salesId?.region || "").toLowerCase();
          valB = (b.salesId?.region || "").toLowerCase();
          break;
        default: return 0;
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
 });
  const allRegions = [...new Set(salesData.map(item => item.salesId?.region).filter(Boolean))];
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

}