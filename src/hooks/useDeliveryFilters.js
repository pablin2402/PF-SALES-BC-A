import { useState, useMemo } from "react";

const SORT_VALUE = {
  name:   (x) => `${x.fullName || ""} ${x.lastName || ""}`.toLowerCase(),
  email:  (x) => (x.email || "").toLowerCase(),
  region: (x) => (x.region || "").toLowerCase(),
};

export const useDeliveryFilters = (salesData) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const getVal = SORT_VALUE[sortBy];
    return salesData
      .filter(s => {
        if (statusFilter === "active") return s.active;
        if (statusFilter === "inactive") return !s.active;
        return true;
      })
      .sort((a, b) => {
        if (!getVal) return 0;
        const va = getVal(a), vb = getVal(b);
        if (va < vb) return sortOrder === "asc" ? -1 : 1;
        if (va > vb) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [salesData, statusFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    total: salesData.length,
    active: salesData.filter(s => s.active).length,
    inactive: salesData.filter(s => !s.active).length,
    regions: new Set(salesData.map(s => s.region).filter(Boolean)).size,
  }), [salesData]);

  return {
    statusFilter, setStatusFilter,
    viewMode, setViewMode,
    sortBy, sortOrder, handleSort,
    filteredAndSorted, stats,
  };
};