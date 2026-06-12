import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { HiFilter, HiX } from "react-icons/hi";
import { FaFileExport } from "react-icons/fa6";
import {
  FaTimesCircle, FaBullseye, FaChartLine, FaBoxOpen, FaUsers,
  FaPercent, FaPlus, FaUserTie, FaSearch,
} from "react-icons/fa";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { TbArrowsSort } from "react-icons/tb";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";


const nf = new Intl.NumberFormat("es-BO");
const nf2 = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (num, den) => (Number(den) > 0 ? (Number(num) / Number(den)) * 100 : 0);

const fmtDate = (iso) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—");

const monthRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return { startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${String(last).padStart(2, "0")}` };
};

const advanceColor = (p) => {
  if (p >= 100) return { bar: "#16a34a", bg: "bg-green-50", text: "text-green-700" };
  if (p >= 70)  return { bar: "#d97706", bg: "bg-amber-50", text: "text-amber-700" };
  return { bar: "#D3423E", bg: "bg-red-50", text: "text-[#D3423E]" };
};

const INPUT_CLS =
  "px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-xl bg-white transition-all " +
  "focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100";


const StatCard = ({ icon: Icon, label, value, iconBg, iconColor, reducedMotion }) => (
  <motion.div
    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:shadow-md transition"
  >
    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
      <Icon size={20} style={{ color: iconColor }} aria-hidden="true" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-xs text-gray-500 font-medium truncate">{label}</span>
      <span className="text-xl font-bold text-gray-900 leading-tight truncate tabular-nums">{value}</span>
    </div>
  </motion.div>
);

const ProgressBar = ({ value, reducedMotion }) => {
  const clamped = Math.max(0, Math.min(value, 100));
  const c = advanceColor(value);
  return (
    <div className="min-w-[140px]" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold ${c.text}`}>{value.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={reducedMotion ? false : { width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
          className="h-2 rounded-full"
          style={{ backgroundColor: c.bar }}
        />
      </div>
    </div>
  );
};

const FilterChip = ({ color, children, onRemove, removeLabel }) => (
  <span className={`inline-flex items-center gap-2 ${color} text-white px-3 py-1 rounded-full text-xs font-bold`}>
    {children}
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
      className="rounded-full hover:bg-white/20 transition p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <HiX size={12} aria-hidden="true" />
    </button>
  </span>
);


const SHIMMER = {
  background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};
const SBox = ({ className = "", style = {} }) => (
  <div className={`rounded-lg ${className}`} style={{ ...SHIMMER, ...style }} aria-hidden="true" />
);

const SalesManObjectiveSkeleton = () => (
  <div className="w-full" role="status" aria-label="Cargando objetivos">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
          <SBox className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2"><SBox className="h-3 w-20" /><SBox className="h-6 w-16" /></div>
        </div>
      ))}
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-3"><SBox className="h-10 w-48 rounded-xl" /><SBox className="h-10 w-28 rounded-xl" /></div>
    </div>
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-4 space-y-3">
      {[...Array(6)].map((_, i) => <SBox key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.12 }} />)}
    </div>
    <span className="sr-only">Cargando…</span>
  </div>
);


const COLUMNS = [
  { key: "start",  label: "Inicio",   sortValue: (i) => i.startDate ?? "" },
  { key: "end",    label: "Fin",      sortValue: (i) => i.endDate ?? "" },
  { key: "region", label: "Región",   sortValue: null },
  { key: "lyne",   label: "Línea",    sortValue: (i) => (i.lyne ?? "").toLowerCase() },
  { key: "obj",    label: "Objetivo", sortValue: (i) => Number(i.numberOfBoxes) || 0 },
  { key: "vtaAA",  label: "VTA AA",   sortValue: (i) => Number(i.saleLastYear) || 0 },
  { key: "acum",   label: "VTA ACUM", sortValue: (i) => Number(i.caja) || 0 },
  { key: "vsAA",   label: "VS AA",    sortValue: (i) => pct(i.caja, i.saleLastYear) },
  { key: "vsObj",  label: "VS OBJ",   sortValue: (i) => pct(i.caja, i.numberOfBoxes) },
  { key: "seller", label: "Vendedor", sortValue: null },
  { key: "prog",   label: "Progreso", sortValue: (i) => pct(i.caja, i.numberOfBoxes) },
];


const ObjectiveSalesManComponent = ({ region }) => {
  const reducedMotion = useReducedMotion();

  const [objectiveData, setObjectiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showObjectiveErrorModal, setShowObjectiveErrorModal] = useState(false);

  const [draft, setDraft] = useState({ startDate: "", endDate: "", payment: "", saler: "" });
  const [applied, setApplied] = useState({ startDate: "", endDate: "", payment: "", saler: "" });

  const [sort, setSort] = useState({ key: null, dir: null });

  const initialFormData = { numberOfBoxes: "", saleLastYear1: "", startDate: "", endDate: "", categoria: "", ciudad: "", salesMan: "" };
  const [formData, setFormData] = useState(initialFormData);

  const [salesData, setSalesData] = useState([]);   
  const [vendedores, setVendedores] = useState([]);
  const [salesmen, setSalesmen] = useState({});
  const [role, setRole] = useState("");

  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const isAdmin = role === "ADMIN";
  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const abortRef = useRef(null);

  useEffect(() => { setRole(localStorage.getItem("role") ?? ""); }, []);


  const fetchSalesmenByIds = useCallback(async (ids) => {
    if (!ids.length) return;
    try {
      const res = await axios.post(`${API_URL}/whatsapp/salesman/multiple`, { ids }, authHeaders);
      const map = {};
      res.data.forEach(({ _id, fullName, lastName }) => { map[_id] = { fullName, lastName }; });
      setSalesmen(map);
    } catch (error) { console.error("Error fetching salesmen:", error); }
  }, [authHeaders]);

  const fetchObjectives = useCallback(async (filters) => {
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const base = monthRange();
    const body = {
      region,
      startDate: filters.startDate || base.startDate,
      endDate: filters.endDate || base.endDate,
      ...(filters.payment ? { payStatus: filters.payment } : {}),
      ...(filters.saler ? { salesManId: filters.saler } : {}),
    };

    try {
      const res = await axios.post(`${API_URL}/whatsapp/sales/objective/list`, body, { ...authHeaders, signal: controller.signal });
      setObjectiveData(res.data);
      const uniqueIds = [...new Set(res.data.map((i) => i.salesManId || i._id).filter(Boolean))];
      await fetchSalesmenByIds(uniqueIds);
    } catch (error) {
      if (!axios.isCancel?.(error) && error.name !== "CanceledError") console.error("Error fetching objectives:", error);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [region, authHeaders, fetchSalesmenByIds]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/whatsapp/category/id`, { userId: user, page: 1, id_owner: user, limit: 1000 }, authHeaders);
      setSalesData(res.data.data);
    } catch (error) { console.error("Error fetching categories:", error); }
  }, [user, authHeaders]);

  const fetchVendedores = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/whatsapp/sales/list/id`, { id_owner: user }, authHeaders);
      setVendedores(res.data.data);
    } catch (error) { console.error("Error obteniendo vendedores", error); setVendedores([]); }
  }, [user, authHeaders]);

  useEffect(() => {
    fetchCategories();
    fetchVendedores();
    fetchObjectives(applied);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);


  const applyFilters = useCallback((next) => {
    setApplied(next);
    fetchObjectives(next);
  }, [fetchObjectives]);

  const handleApply = () => applyFilters({ ...draft });

  const removeFilter = (keys) => {
    const next = { ...applied };
    keys.forEach((k) => { next[k] = ""; });
    setDraft(next);
    applyFilters(next);
  };

  const clearAll = () => {
    const empty = { startDate: "", endDate: "", payment: "", saler: "" };
    setDraft(empty);
    applyFilters(empty);
  };

  const hasActiveFilters = Boolean(applied.startDate || applied.payment || applied.saler);
  const draftDirty = JSON.stringify(draft) !== JSON.stringify(applied);


  const handleSort = useCallback((key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
  }, []);

  const rows = useMemo(() => {
    if (!sort.key) return objectiveData;
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (!col?.sortValue) return objectiveData;
    const f = sort.dir === "desc" ? -1 : 1;
    return [...objectiveData].sort((a, b) => {
      const va = col.sortValue(a); const vb = col.sortValue(b);
      return va < vb ? -f : va > vb ? f : 0;
    });
  }, [objectiveData, sort]);


  const totals = useMemo(() => {
    const t = objectiveData.reduce((acc, i) => ({
      objetivo: acc.objetivo + (Number(i.numberOfBoxes) || 0),
      vtaAA: acc.vtaAA + (Number(i.saleLastYear) || 0),
      cajas: acc.cajas + (Number(i.caja) || 0),
    }), { objetivo: 0, vtaAA: 0, cajas: 0 });
    return {
      ...t,
      avance: pct(t.cajas, t.objetivo),
      vsAAGlobal: pct(t.cajas, t.vtaAA),
      vendedores: new Set(objectiveData.map((i) => i.salesManId || i._id).filter(Boolean)).size,
    };
  }, [objectiveData]);


  const handleExport = useCallback(() => {
    const headers = ["Inicio", "Fin", "Región", "Línea", "Objetivo", "VTA AA", "VTA ACUM", "VS AA %", "VS OBJ %", "Vendedor"];
    const lines = rows.map((i) => {
      const s = salesmen[i.salesManId || i._id];
      return [
        fmtDate(i.startDate), fmtDate(i.endDate), region, i.lyne ?? "",
        i.numberOfBoxes ?? 0, i.saleLastYear ?? 0, (Number(i.caja) || 0).toFixed(2),
        pct(i.caja, i.saleLastYear).toFixed(2), pct(i.caja, i.numberOfBoxes).toFixed(2),
        s ? `${s.fullName} ${s.lastName}` : "Sin vendedor",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
    });
    const csv = "\uFEFF" + [headers.join(";"), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `objetivos_${region}_${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, salesmen, region]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "numberOfBoxes" || name === "saleLastYear1" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const formInvalid =
    !formData.categoria || !formData.ciudad || !formData.numberOfBoxes ||
    !formData.saleLastYear1 || !formData.startDate || !formData.endDate ||
    (formData.startDate && formData.endDate && formData.endDate < formData.startDate);

  const handleSubmit = async () => {
    if (formInvalid || saving) return;
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/whatsapp/sales/objective/sales`, {
        region: formData.ciudad, lyne: formData.categoria,
        numberOfBoxes: formData.numberOfBoxes, saleLastYear: formData.saleLastYear1,
        id: formData.ciudad + formData.numberOfBoxes, id_owner: user,
        startDate: formData.startDate, endDate: formData.endDate, salesManId: formData.salesMan,
      }, authHeaders);
      if (res.status === 200) {
        fetchObjectives(applied);
        setModalOpen(false);
        setFormData(initialFormData);
      }
    } catch (err) {
      console.error(err);
      setShowObjectiveErrorModal(true);
    } finally { setSaving(false); }
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setModalOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const salerName = (id) => {
    const v = vendedores.find((x) => x._id === id);
    return v ? `${v.fullName} ${v.lastName}` : "";
  };


  return (
    <div className="w-full">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <FaUserTie className="text-[#D3423E]" size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Objetivos por vendedor</h2>
          <p className="text-sm text-gray-500">
            Avance mensual de cada vendedor en <span className="font-semibold text-gray-700">{region}</span>
          </p>
        </div>
      </motion.div>

      {loading ? <SalesManObjectiveSkeleton /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <StatCard reducedMotion={reducedMotion} icon={FaBullseye}  label="Objetivo total"     value={nf.format(totals.objetivo)}        iconBg="#eff6ff" iconColor="#2563eb" />
            <StatCard reducedMotion={reducedMotion} icon={FaChartLine} label="Vta. año anterior"  value={nf.format(totals.vtaAA)}           iconBg="#fef3c7" iconColor="#d97706" />
            <StatCard reducedMotion={reducedMotion} icon={FaBoxOpen}   label="Vta. acumulada"     value={nf.format(Math.round(totals.cajas))} iconBg="#dcfce7" iconColor="#16a34a" />
            <StatCard reducedMotion={reducedMotion} icon={FaPercent}   label="Avance promedio"    value={totals.avance.toFixed(1) + "%"}    iconBg="#f3e8ff" iconColor="#9333ea" />
            <StatCard reducedMotion={reducedMotion} icon={FaUsers}     label="Vendedores activos" value={totals.vendedores}                 iconBg="#fee2e2" iconColor="#D3423E" />
          </div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="flex flex-col gap-1">
                  <label htmlFor="f-desde" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Desde</label>
                  <input id="f-desde" type="date" value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="f-hasta" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Hasta</label>
                  <input id="f-hasta" type="date" value={draft.endDate} min={draft.startDate || undefined}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div className="flex flex-col gap-1 min-w-[170px]">
                  <label htmlFor="f-pago" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado de pago</label>
                  <select id="f-pago" value={draft.payment}
                    onChange={(e) => setDraft((d) => ({ ...d, payment: e.target.value }))} className={`${INPUT_CLS} cursor-pointer`}>
                    <option value="">Todos</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label htmlFor="f-vendedor" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vendedor</label>
                  <select id="f-vendedor" value={draft.saler}
                    onChange={(e) => setDraft((d) => ({ ...d, saler: e.target.value }))} className={`${INPUT_CLS} cursor-pointer`}>
                    <option value="">Todos</option>
                    {vendedores.map((v) => <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>)}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!draftDirty}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D3423E] text-white text-sm font-bold rounded-xl hover:bg-[#bb3330] transition active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50"
                >
                  <HiFilter size={16} aria-hidden="true" /> Filtrar
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-xl"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={!rows.length}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaFileExport size={14} aria-hidden="true" /> Exportar CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D3423E] text-white text-sm font-bold rounded-xl hover:bg-[#bb3330] transition active:scale-[0.98] shadow-sm"
                  >
                    <FaPlus size={12} aria-hidden="true" /> Nuevo objetivo
                  </button>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                {applied.startDate && (
                  <FilterChip color="bg-[#D3423E]" onRemove={() => removeFilter(["startDate", "endDate"])} removeLabel="Quitar filtro de fechas">
                    {fmtDate(applied.startDate)} → {fmtDate(applied.endDate)}
                  </FilterChip>
                )}
                {applied.payment && (
                  <FilterChip color="bg-purple-500" onRemove={() => removeFilter(["payment"])} removeLabel="Quitar filtro de pago">
                    Pago: {applied.payment}
                  </FilterChip>
                )}
                {applied.saler && (
                  <FilterChip color="bg-blue-500" onRemove={() => removeFilter(["saler"])} removeLabel="Quitar filtro de vendedor">
                    {salerName(applied.saler)}
                  </FilterChip>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Objetivos por vendedor: ordena haciendo clic en los encabezados</caption>
                <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {COLUMNS.map((col) => {
                      const active = sort.key === col.key;
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                          className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                        >
                          {col.sortValue ? (
                            <button
                              type="button"
                              onClick={() => handleSort(col.key)}
                              className={`group inline-flex items-center gap-1.5 uppercase rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 ${active ? "text-[#D3423E]" : "text-gray-600 hover:text-gray-900"}`}
                            >
                              {col.label}
                              {active
                                ? (sort.dir === "asc" ? <FiArrowUp size={12} aria-hidden="true" /> : <FiArrowDown size={12} aria-hidden="true" />)
                                : <TbArrowsSort size={12} className="text-gray-300 group-hover:text-gray-400" aria-hidden="true" />}
                            </button>
                          ) : <span className="text-gray-600">{col.label}</span>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows.map((item) => {
                    const salesman = salesmen[item.salesManId || item._id];
                    const vsObj = pct(item.caja, item.numberOfBoxes);
                    const vsAA = pct(item.caja, item.saleLastYear);
                    const colorObj = advanceColor(vsObj);
                    return (
                      <tr key={item.objetivoId || item._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(item.startDate)}</td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(item.endDate)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{region}</td>
                        <td className="px-4 py-3 text-gray-700">{item.lyne}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 tabular-nums">{nf.format(item.numberOfBoxes ?? 0)}</td>
                        <td className="px-4 py-3 text-gray-700 tabular-nums">{nf.format(item.saleLastYear ?? 0)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 tabular-nums">{nf2.format(Number(item.caja) || 0)}</td>
                        <td className="px-4 py-3 text-gray-700 tabular-nums">{vsAA.toFixed(2)}%</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${colorObj.bg} ${colorObj.text}`}>
                            {vsObj.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {salesman ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-[11px] font-bold text-[#D3423E]" aria-hidden="true">
                                {salesman.fullName?.[0]}{salesman.lastName?.[0]}
                              </div>
                              <span className="font-medium text-gray-900">{salesman.fullName} {salesman.lastName}</span>
                            </div>
                          ) : <span className="text-gray-400 italic">Sin vendedor</span>}
                        </td>
                        <td className="px-4 py-3"><ProgressBar value={vsObj} reducedMotion={reducedMotion} /></td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FaSearch size={32} className="mb-3" aria-hidden="true" />
                          <p className="text-base font-semibold text-gray-700">
                            {hasActiveFilters ? "Sin resultados para estos filtros" : "Todavía no hay objetivos este mes"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {hasActiveFilters ? "Ajusta o limpia los filtros para ver más." : isAdmin ? "Crea el primero con “Nuevo objetivo”." : "Los objetivos aparecerán aquí cuando se asignen."}
                          </p>
                          {hasActiveFilters && (
                            <button type="button" onClick={clearAll}
                              className="mt-4 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#D3423E] hover:text-[#D3423E] transition">
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
                      <td className="px-4 py-3" colSpan={4}>TOTAL · {rows.length} objetivos</td>
                      <td className="px-4 py-3 tabular-nums">{nf.format(totals.objetivo)}</td>
                      <td className="px-4 py-3 tabular-nums">{nf.format(totals.vtaAA)}</td>
                      <td className="px-4 py-3 tabular-nums">{nf2.format(totals.cajas)}</td>
                      <td className="px-4 py-3 tabular-nums">{totals.vsAAGlobal.toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${advanceColor(totals.avance).bg} ${advanceColor(totals.avance).text}`}>
                          {totals.avance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3" colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-labelledby="new-objective-title"
              initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reducedMotion ? undefined : { scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2">
                  <FaBullseye className="text-[#D3423E]" size={18} aria-hidden="true" />
                  <h2 id="new-objective-title" className="text-lg font-bold text-gray-900">Nuevo objetivo de venta</h2>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Cerrar"
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded">
                  ×
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="m-categoria" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoría</label>
                  <select id="m-categoria" name="categoria" value={formData.categoria} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition appearance-none cursor-pointer">
                    <option value="">Seleccione una categoría</option>
                    {salesData.map((c) => <option key={c._id} value={c.categoryName}>{c.categoryName}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="m-ciudad" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ciudad</label>
                  <select id="m-ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition appearance-none cursor-pointer">
                    <option value="">Seleccione una ciudad</option>
                    <option value="TOTAL CBB">Cochabamba</option>
                    <option value="TOTAL SC">Santa Cruz</option>
                    <option value="TOTAL LP">La Paz</option>
                    <option value="TOTAL OR">Oruro</option>
                  </select>
                </div>

                {[
                  { label: "Número de cajas", name: "numberOfBoxes", type: "number", min: 1 },
                  { label: "Venta año pasado", name: "saleLastYear1", type: "number", min: 0 },
                  { label: "Fecha inicial", name: "startDate", type: "date" },
                  { label: "Fecha final", name: "endDate", type: "date", min: formData.startDate || undefined },
                ].map(({ label, name, type, min }) => (
                  <div key={name} className="flex flex-col gap-1.5">
                    <label htmlFor={`m-${name}`} className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
                    <input id={`m-${name}`} type={type} name={name} min={min} value={formData[name] ?? ""} onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition" />
                  </div>
                ))}

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="m-vendedor" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Vendedor</label>
                  <select id="m-vendedor" name="salesMan" value={formData.salesMan} onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition appearance-none cursor-pointer">
                    <option value="">Seleccione un vendedor</option>
                    {vendedores.map((v) => <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>)}
                  </select>
                </div>

                {formData.startDate && formData.endDate && formData.endDate < formData.startDate && (
                  <p className="md:col-span-2 text-xs font-semibold text-[#D3423E]" role="alert">
                    La fecha final debe ser posterior a la inicial.
                  </p>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 shrink-0">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition active:scale-[0.98]">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={formInvalid || saving}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold uppercase rounded-xl transition active:scale-[0.98] ${
                    formInvalid || saving
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#D3423E] text-white hover:bg-[#bb3330] shadow-sm hover:shadow-md"
                  }`}
                >
                  {saving ? "Guardando…" : "Guardar objetivo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

s      <AnimatePresence>
        {showObjectiveErrorModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowObjectiveErrorModal(false)}
          >
            <motion.div
              role="alertdialog" aria-modal="true" aria-labelledby="objective-error-title"
              initial={reducedMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reducedMotion ? undefined : { scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <FaTimesCircle className="text-[#D3423E]" size={44} aria-hidden="true" />
              </div>
              <h2 id="objective-error-title" className="text-xl font-bold text-gray-900 mb-1">No se pudo guardar el objetivo</h2>
              <p className="text-center text-gray-500 text-sm mb-6">Revisa tu conexión e inténtalo de nuevo. Si el problema sigue, puede que ya exista un objetivo igual.</p>
              <button
                type="button"
                onClick={() => setShowObjectiveErrorModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#D3423E] hover:bg-[#bb3330] transition active:scale-[0.98]"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ObjectiveSalesManComponent;