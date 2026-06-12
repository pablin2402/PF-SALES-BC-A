import React, { useMemo, useState, useCallback } from "react";
import { FaReceipt, FaEllipsisV } from "react-icons/fa";
import { FiExternalLink, FiCopy, FiCheck, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { TbArrowsSort } from "react-icons/tb";
import { PAYMENT_STATUS_CONFIG, truncateHash } from "../../constants/paymentConfig";


const money = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBs = (n) => `Bs. ${money.format(Number(n) || 0)}`;

const sellerName = (item) => {
  const s = item.sales_id || item.delivery_id;
  return s ? `${s.fullName ?? ""} ${s.lastName ?? ""}`.trim() : "";
};
const clientName = (item) =>
  item.id_client ? `${item.id_client.name ?? ""} ${item.id_client.lastName ?? ""}`.trim() : "";

const COLUMNS = [
  { key: "note",   label: "Nota",       align: "left",   sortValue: (i) => Number(i.orderId?.receiveNumber) || 0 },
  { key: "date",   label: "Fecha",      align: "left",   sortValue: (i) => (i.creationDate ? new Date(i.creationDate).getTime() : 0) },
  { key: "seller", label: "Vendedor",   align: "left",   sortValue: (i) => sellerName(i).toLowerCase() },
  { key: "client", label: "Cliente",    align: "left",   sortValue: (i) => clientName(i).toLowerCase() },
  { key: "paid",   label: "Pago",       align: "right",  sortValue: (i) => Number(i.total) || 0 },
  { key: "total",  label: "Total",      align: "right",  sortValue: (i) => Number(i.orderId?.totalAmount) || 0 },
  { key: "debt",   label: "Deuda",      align: "right",  sortValue: (i) => Number(i.debt) || 0 },
  { key: "status", label: "Estado",     align: "center", sortValue: (i) => i.paymentStatus ?? "" },
  { key: "chain",  label: "Blockchain", align: "center", sortValue: (i) => (i.txHash ? 1 : 0) },
  { key: "menu",   label: "",           align: "center", sortValue: null },
];

const alignClass = { left: "text-left", right: "text-right", center: "text-center" };


const SortableHeader = ({ col, sort, onSort }) => {
  const active = sort.key === col.key;
  const dir = active ? sort.dir : null;
  if (!col.sortValue) return <th scope="col" className="px-4 py-3.5" aria-label="Acciones" />;

  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3.5 font-black tracking-wider ${alignClass[col.align]}`}
    >
      <button
        type="button"
        onClick={() => onSort(col.key)}
        className={`group inline-flex items-center gap-1.5 uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50 rounded
          ${active ? "text-[#D3423E]" : "text-gray-700 hover:text-gray-900"}
          ${col.align === "right" ? "flex-row-reverse" : ""}`}
      >
        {col.label}
        {active
          ? (dir === "asc" ? <FiArrowUp size={12} aria-hidden="true" /> : <FiArrowDown size={12} aria-hidden="true" />)
          : <TbArrowsSort size={12} className="text-gray-300 group-hover:text-gray-400" aria-hidden="true" />}
      </button>
    </th>
  );
};

const ChainCell = ({ txHash }) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  }, [txHash]);

  if (!txHash) return <span className="text-xs text-gray-300">—</span>;

  return (
    <div className="inline-flex items-center gap-1.5">
      <a
        href={`https://polygonscan.com/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Ver transacción en PolygonScan"
        className="group flex flex-col items-start rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        <span className="text-[11px] font-mono font-bold text-emerald-700">{truncateHash(txHash, 8, 6)}</span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-500 transition-colors group-hover:text-emerald-700">
          Polygon <FiExternalLink size={9} aria-hidden="true" />
        </span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Hash copiado" : "Copiar hash de transacción"}
        className="rounded-md p-1.5 text-gray-300 transition hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      >
        {copied ? <FiCheck size={12} className="text-emerald-600" aria-hidden="true" /> : <FiCopy size={12} aria-hidden="true" />}
      </button>
    </div>
  );
};


export const PaymentsTable = ({ salesData, onOpenModal }) => {
  const [sort, setSort] = useState({ key: null, dir: null });

  const handleSort = useCallback((key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sort.key) return salesData;
    const col = COLUMNS.find((c) => c.key === sort.key);
    if (!col?.sortValue) return salesData;
    const factor = sort.dir === "desc" ? -1 : 1;
    return [...salesData].sort((a, b) => {
      const va = col.sortValue(a);
      const vb = col.sortValue(b);
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });
  }, [salesData, sort]);

  const totals = useMemo(() => sorted.reduce(
    (acc, i) => ({
      paid: acc.paid + (Number(i.total) || 0),
      total: acc.total + (Number(i.orderId?.totalAmount) || 0),
      debt: acc.debt + (Number(i.debt) || 0),
      chained: acc.chained + (i.txHash ? 1 : 0),
    }),
    { paid: 0, total: 0, debt: 0, chained: 0 },
  ), [sorted]);

  const openItem = useCallback((item) => () => onOpenModal(item), [onOpenModal]);
  const keyOpen = useCallback((item) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenModal(item);
    }
  }, [onOpenModal]);

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Lista de pagos: ordena haciendo clic en los encabezados</caption>

        <thead className="sticky top-0 z-10 border-b-2 border-gray-200 bg-gray-50 text-[11px] uppercase">
          <tr>
            {COLUMNS.map((col) => (
              <SortableHeader key={col.key} col={col} sort={sort} onSort={handleSort} />
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.length > 0 ? sorted.map((item) => {
            const sc = PAYMENT_STATUS_CONFIG[item.paymentStatus];
            const StatusIcon = sc?.icon;
            const hasChain = Boolean(item.txHash);
            const debt = Number(item.debt);

            return (
              <tr
                key={item._id}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalle del pago #${item.orderId?.receiveNumber ?? ""}`}
                onClick={openItem(item)}
                onKeyDown={keyOpen(item)}
                className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50
                  focus-visible:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D3423E]/40
                  ${hasChain ? "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/40 to-transparent" : "border-l-4 border-l-transparent"}`}
              >
                <td className="px-4 py-3.5">
                  <span className="font-black text-gray-900">#{item.orderId?.receiveNumber ?? "—"}</span>
                </td>

                <td className="px-4 py-3.5">
                  {item.creationDate ? (
                    <div>
                      <p className="font-bold text-gray-900">
                        {new Date(item.creationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(item.creationDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ) : "—"}
                </td>

                <td className="px-4 py-3.5 text-[13px] font-medium text-gray-700">{sellerName(item) || "—"}</td>
                <td className="px-4 py-3.5 font-bold text-gray-900">{clientName(item) || "—"}</td>

                <td className="px-4 py-3.5 text-right font-black tabular-nums text-gray-900">{fmtBs(item.total)}</td>
                <td className="px-4 py-3.5 text-right font-medium tabular-nums text-gray-700">{fmtBs(item.orderId?.totalAmount)}</td>

                <td className="px-4 py-3.5 text-right tabular-nums">
                  {Number.isFinite(debt) ? (
                    <span className={debt > 0 ? "font-black text-[#D3423E]" : "font-bold text-emerald-600"}>
                      {fmtBs(debt)}
                    </span>
                  ) : "—"}
                </td>

                <td className="px-4 py-3.5">
                  {sc && (
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${sc.bgColor} ${sc.textColor} ${sc.borderColor}`}>
                        {StatusIcon && <StatusIcon size={10} aria-hidden="true" />} {sc.label}
                      </span>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3.5 text-center">
                  <ChainCell txHash={item.txHash} />
                </td>

                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={openItem(item)}
                    aria-label="Abrir detalle del pago"
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D3423E]/50"
                  >
                    <FaEllipsisV className="text-gray-500" size={14} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={COLUMNS.length} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <FaReceipt className="mb-3 text-5xl text-gray-200" aria-hidden="true" />
                  <p className="text-lg font-bold text-gray-500">No hay pagos</p>
                  <p className="mt-1 text-sm">Intenta ajustar los filtros</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>

        {sorted.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50/80 text-[13px]">
              <td className="px-4 py-3 font-bold text-gray-500" colSpan={4}>
                Subtotal de la página · {sorted.length} pagos
                {totals.chained > 0 && (
                  <span className="ml-2 font-semibold text-emerald-600">({totals.chained} on-chain)</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-black tabular-nums text-gray-900">{fmtBs(totals.paid)}</td>
              <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-700">{fmtBs(totals.total)}</td>
              <td className={`px-4 py-3 text-right font-black tabular-nums ${totals.debt > 0 ? "text-[#D3423E]" : "text-emerald-600"}`}>
                {fmtBs(totals.debt)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};