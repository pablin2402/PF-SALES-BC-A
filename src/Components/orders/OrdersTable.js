import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { FaEllipsisV, FaCheck, FaTrash } from "react-icons/fa";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { TbArrowsSort } from "react-icons/tb";
import { ORDER_STATUS_CONFIG, ACCOUNT_STATUS_CONFIG, PAY_STATUS_CONFIG } from "../../constants/orderConfigs";
import { SkeletonTable } from "../../utils/SkeletonLoading";
import { EmptyState } from "../../utils/StatCard";

const money = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBs = (n) => `Bs. ${money.format(Number(n) || 0)}`;

const clientName = (i) => `${i.id_client?.name ?? ""} ${i.id_client?.lastName ?? ""}`.trim();
const sellerName = (i) => `${i.salesId?.fullName ?? ""} ${i.salesId?.lastName ?? ""}`.trim();

const COLUMNS = [
  { key: "date",   label: "Fecha",    align: "left",   sortValue: (i) => (i.creationDate ? new Date(i.creationDate).getTime() : 0) },
  { key: "region", label: "Ciudad",   align: "left",   sortValue: (i) => i.region ?? "" },
  { key: "client", label: "Cliente",  align: "left",   sortValue: (i) => clientName(i).toLowerCase() },
  { key: "type",   label: "Tipo",     align: "left",   sortValue: (i) => i.accountStatus ?? "" },
  { key: "seller", label: "Vendedor", align: "left",   sortValue: (i) => sellerName(i).toLowerCase() },
  { key: "pay",    label: "Pago",     align: "left",   sortValue: (i) => i.payStatus ?? "" },
  { key: "total",  label: "Total",    align: "right",  sortValue: (i) => Number(i.totalAmount) || 0 },
  { key: "saldo",  label: "Saldo",    align: "right",  sortValue: (i) => Number(i.restante) || 0 },
  { key: "mora",   label: "Mora",     align: "center", sortValue: (i) => Number(i.diasMora) || 0 },
  { key: "status", label: "Estado",   align: "center", sortValue: (i) => i.orderStatus ?? "" },
  { key: "menu",   label: "",         align: "center", sortValue: null },
];

const alignClass = { left: "text-left", right: "text-right", center: "text-center" };

const RowMenu = ({ item, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const disabled = ["deliver", "En Ruta", "aproved"].includes(item.orderStatus);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen((v) => !v); }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={disabled ? "Sin acciones disponibles para este estado" : "Acciones del pedido"}
        title={disabled ? "Sin acciones disponibles para este estado" : "Acciones"}
        disabled={disabled}
        className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50"
      >
        <FaEllipsisV className="text-gray-500" size={13} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { onEdit(item); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:bg-emerald-50"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FaCheck className="text-emerald-600" size={11} aria-hidden="true" />
            </span>
            Confirmar pedido
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { onDelete(item); setOpen(false); }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 focus-visible:outline-none focus-visible:bg-red-50"
          >
            <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <FaTrash className="text-red-600" size={10} aria-hidden="true" />
            </span>
            Eliminar pedido
          </button>
        </div>
      )}
    </div>
  );
};

export const OrdersTable = ({
  salesData, initialLoading, tableLoading, hasActiveFilters,
  onRowClick, onEditClick, onDeleteClick, clearAllFilters, onCreate,
}) => {
  const [sort, setSort] = useState({ key: null, dir: null });

  const handleSort = useCallback((key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
  }, []);

  const rows = useMemo(() => {
    if (!sort.key) return salesData;
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (!col?.sortValue) return salesData;
    const f = sort.dir === "desc" ? -1 : 1;
    return [...salesData].sort((a, b) => {
      const va = col.sortValue(a);
      const vb = col.sortValue(b);
      return va < vb ? -f : va > vb ? f : 0;
    });
  }, [salesData, sort]);

  const totals = useMemo(() => rows.reduce(
    (acc, i) => ({
      total: acc.total + (Number(i.totalAmount) || 0),
      saldo: acc.saldo + (Number(i.restante) || 0),
      overdue: acc.overdue + (Number(i.diasMora) > 0 ? 1 : 0),
    }),
    { total: 0, saldo: 0, overdue: 0 },
  ), [rows]);

  if (initialLoading || tableLoading) return <SkeletonTable />;
  if (salesData.length === 0) {
    return <EmptyState hasFilters={hasActiveFilters} onClear={clearAllFilters} onCreate={onCreate} />;
  }

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <caption className="sr-only">Lista de pedidos: ordena haciendo clic en los encabezados</caption>
        <thead className="sticky top-0 z-10 text-xs uppercase bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key;
              if (!col.sortValue) return <th key={col.key} scope="col" className="px-4 py-3.5" aria-label="Acciones" />;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  className={`px-4 py-3.5 font-black tracking-wider ${alignClass[col.align]}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className={`group inline-flex items-center gap-1.5 uppercase rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 ${
                      active ? "text-[#D3423E]" : "text-gray-600 hover:text-gray-900"
                    } ${col.align === "right" ? "flex-row-reverse" : ""}`}
                  >
                    {col.label}
                    {active
                      ? (sort.dir === "asc" ? <FiArrowUp size={12} aria-hidden="true" /> : <FiArrowDown size={12} aria-hidden="true" />)
                      : <TbArrowsSort size={12} className="text-gray-300 group-hover:text-gray-400" aria-hidden="true" />}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const sc = ORDER_STATUS_CONFIG[item.orderStatus];
            const StatusIcon = sc?.icon;
            const saldo = Number(item.restante) || 0;
            return (
              <tr
                key={item._id}
                onClick={() => onRowClick(item)}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle del pedido de ${clientName(item)}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(item); } }}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D3423E]/40"
              >
                <td className="px-4 py-3.5">
                  {item.creationDate ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {new Date(item.creationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.creationDate).getFullYear()} · {new Date(item.creationDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  {item.region ? (
                    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold whitespace-nowrap">
                      {item.region}
                    </span>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-xs font-black text-[#D3423E] flex-shrink-0">
                      {item.id_client?.name?.[0]}{item.id_client?.lastName?.[0]}
                    </div>
                    <span className="font-bold text-gray-900 whitespace-nowrap">{clientName(item)}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {ACCOUNT_STATUS_CONFIG[item.accountStatus] && (
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${ACCOUNT_STATUS_CONFIG[item.accountStatus]}`}>
                      {item.accountStatus.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-gray-700 text-sm whitespace-nowrap">{sellerName(item) || "—"}</td>
                <td className="px-4 py-3.5">
                  {PAY_STATUS_CONFIG[item.payStatus] && (
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${PAY_STATUS_CONFIG[item.payStatus]}`}>
                      {item.payStatus.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-black text-gray-900 tabular-nums">{fmtBs(item.totalAmount)}</span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {saldo > 0 ? (
                    <span className="font-black text-[#D3423E] tabular-nums text-sm">{fmtBs(saldo)}</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">
                      Pagado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {item.diasMora > 0 ? (
                    <span className="bg-red-50 text-red-700 text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap">
                      {item.diasMora} días
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {sc && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${sc.color}`}>
                      {StatusIcon && <StatusIcon className={sc.iconColor} size={11} aria-hidden="true" />}
                      {sc.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <RowMenu item={item} onEdit={onEditClick} onDelete={onDeleteClick} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50/80 border-t-2 border-gray-200 text-sm">
            <td className="px-4 py-3 font-bold text-gray-500" colSpan={6}>
              Subtotal de la página · {rows.length} pedidos
              {totals.overdue > 0 && (
                <span className="ml-2 font-semibold text-red-600">({totals.overdue} en mora)</span>
              )}
            </td>
            <td className="px-4 py-3 text-right font-black tabular-nums text-gray-900">{fmtBs(totals.total)}</td>
            <td className={`px-4 py-3 text-right font-black tabular-nums ${totals.saldo > 0 ? "text-[#D3423E]" : "text-emerald-600"}`}>
              {fmtBs(totals.saldo)}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};