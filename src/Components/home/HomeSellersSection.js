import React from "react";
import { FaFilter, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import { MONTHS, getInitials, getColor } from "../../constants/homeConfigs";

export const HomeSellersSection = ({
  salesBySeller, totalAmountSum,
  filterType, setFilterType,
  selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, years,
  startDate, setStartDate, endDate, setEndDate,
  fetchOrders, exportToExcel, topSeller,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FaUsers className="text-[#D3423E]" />Ventas por vendedor</h2>
          <p className="text-sm text-gray-500 mt-0.5">Desempeño del equipo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shadow-inner">
            <button onClick={() => setFilterType("monthYear")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === "monthYear" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>Mes / Año</button>
            <button onClick={() => setFilterType("dateRange")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === "dateRange" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>Rango</button>
          </div>
          {filterType === "monthYear" ? (
            <div className="flex gap-2">
              <select className="app-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="app-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input type="date" className="pl-8 pr-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 shadow-sm"
                  value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input type="date" className="pl-8 pr-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 shadow-sm"
                  value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <button onClick={fetchOrders} className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-[#D3423E] to-red-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-1.5">
                <FaFilter size={12} /> Filtrar
              </button>
            </div>
          )}
          <button onClick={exportToExcel}
            className="px-3 py-2 text-sm font-semibold bg-white text-gray-700 border border-gray-200 rounded-xl hover:border-[#D3423E] hover:text-[#D3423E] transition-all flex items-center gap-1.5 shadow-sm">
            <FaFileExport size={14} /><span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {topSeller && salesBySeller.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl flex items-center gap-3">
          <div className="text-2xl">🏆</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-600 uppercase">Top vendedor</p>
            <p className="font-bold text-gray-900 truncate">{topSeller.sellerName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Total</p>
            <p className="font-bold text-gray-900">Bs. {topSeller.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>

    {/* Table desktop */}
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-[11px] text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3.5 font-black tracking-wider">#</th>
            <th className="px-4 py-3.5 font-black tracking-wider">Vendedor</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-center">Pedidos</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-right">Total vendido</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-right">Ticket prom.</th>
            <th className="px-4 py-3.5 font-black tracking-wider text-center">Progreso</th>
          </tr>
        </thead>
        <tbody>
          {salesBySeller.length > 0 ? salesBySeller.map((seller, idx) => {
            const pct = totalAmountSum > 0 ? (seller.totalAmount / totalAmountSum) * 100 : 0;
            const avg = seller.totalOrders > 0 ? seller.totalAmount / seller.totalOrders : 0;
            return (
              <tr key={seller.sellerName} className="border-b border-gray-100 hover:bg-red-50/20 transition-colors">
                <td className="px-6 py-4"><span className={`font-black text-lg ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-gray-500"}`}>#{idx + 1}</span></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white ${getColor(seller.sellerName, seller.sellerName)}`}>{getInitials(seller.sellerName)}</div>
                    <span className="font-bold text-gray-900">{seller.sellerName}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center"><span className="font-black text-gray-900">{seller.totalOrders}</span></td>
                <td className="px-4 py-4 text-right font-black text-gray-900">Bs. {seller.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-4 text-right text-gray-700 font-medium">Bs. {avg.toFixed(2)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#D3423E] to-red-700 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-black text-gray-600 min-w-[45px] text-right">{pct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr><td colSpan="6" className="px-6 py-20 text-center">
              <div className="flex flex-col items-center text-gray-500"><FaUsers className="text-5xl mb-3 text-gray-200" /><p className="font-bold text-lg">Sin datos</p><p className="text-sm text-gray-400 mt-1">No hay ventas en este período</p></div>
            </td></tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Cards mobile */}
    <div className="md:hidden p-4 space-y-3">
      {salesBySeller.length > 0 ? salesBySeller.map((seller, idx) => {
        const pct = totalAmountSum > 0 ? (seller.totalAmount / totalAmountSum) * 100 : 0;
        return (
          <div key={seller.sellerName} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className={`font-black text-lg w-8 ${idx === 0 ? "text-yellow-500" : "text-gray-500"}`}>#{idx + 1}</span>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white ${getColor(seller.sellerName, seller.sellerName)}`}>{getInitials(seller.sellerName)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{seller.sellerName}</p>
                <p className="text-xs text-gray-500">{seller.totalOrders} pedidos</p>
              </div>
              <p className="font-black text-gray-900">Bs. {seller.totalAmount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#D3423E] to-red-700 h-2 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-black text-gray-600">{pct.toFixed(1)}%</span>
            </div>
          </div>
        );
      }) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500"><FaUsers className="text-4xl mb-3 text-gray-200" /><p className="font-bold">Sin datos</p></div>
      )}
    </div>
  </div>
);