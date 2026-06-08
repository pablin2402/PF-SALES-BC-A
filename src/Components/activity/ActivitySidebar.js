import React from "react";
import {
  FaMapMarkerAlt, FaUser, FaCalendarAlt, FaRoute, FaClock,
  FaSearch, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { HiFilter } from "react-icons/hi";
import PrincipalBUtton from "../../Components/LittleComponents/PrincipalButton";
import { DETAILS_CONFIG } from "../../constants/activityConfigs";
import { ActivitySidebarSkeleton } from "./ActivitySkeletons";

export const ActivitySidebar = ({
  collapsed, setCollapsed,
  vendedores, selectedSaler, setSelectedSaler,
  startDate, setStartDate, onFilter,
  searchTerm, setSearchTerm,
  loading, filteredData, selectedClientId, findLocation,
  salesData, visitsEnCurso, visitsCompletadas,
  page, setPage, totalPages,
}) => (
  <div className={`${collapsed ? "w-0 lg:w-16" : "w-full lg:w-[420px]"} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
    {!collapsed && (
      <>
        <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-[#D3423E] to-red-700 rounded-br-3xl text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                <FaRoute /> Ruta de actividades
              </h1>
              <p className="text-xs text-red-100 mt-0.5 font-medium">Seguimiento de visitas</p>
            </div>
            <button onClick={() => setCollapsed(true)} className="hidden lg:flex p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
              <FaChevronLeft size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", val: salesData.length },
              { label: "En curso", val: visitsEnCurso },
              { label: "Finalizadas", val: visitsCompletadas },
            ].map(s => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
                <p className="text-[10px] text-red-100 font-black uppercase">{s.label}</p>
                <p className="text-xl font-black">{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Vendedor</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <select value={selectedSaler}
                onChange={e => { setSelectedSaler(e.target.value); setPage(1); }}
                className="pl-9 w-full py-2.5 pr-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all cursor-pointer shadow-sm">
                <option value="">Todos los vendedores</option>
                {vendedores.map(v => (
                  <option key={v._id} value={v._id}>{v.fullName} {v.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Fecha</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 shadow-sm" />
              </div>
              <PrincipalBUtton onClick={onFilter} icon={HiFilter}>Filtrar</PrincipalBUtton>
            </div>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none z-10" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 shadow-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <ActivitySidebarSkeleton /> : filteredData.length > 0 ? (
            <div className="space-y-3">
              {filteredData.map((client, index) => {
                const config = DETAILS_CONFIG[client.details];
                const Icon = config?.icon;
                const isSelected = selectedClientId === client._id;
                return (
                  <div key={client._id} onClick={() => findLocation(client)}
                    className={`relative bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-[#D3423E] shadow-md ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="absolute -left-0.5 top-4 bottom-4 w-1 bg-[#D3423E] rounded-r-full transition-opacity"
                      style={{ opacity: isSelected ? 1 : 0 }} />

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#D3423E] to-red-700 text-white rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm shadow-sm">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {client.clientName.name} {client.clientName.lastName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {client.salesMan.fullName} {client.salesMan.lastName}
                          </p>
                        </div>
                      </div>
                      {config && Icon && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold whitespace-nowrap ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                          <Icon className={config.iconColor} size={10} />
                          {config.label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                        <FaClock className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(client.creationDate).toLocaleTimeString("es-ES", {
                            timeZone: "America/La_Paz", hour: "2-digit", minute: "2-digit", hour12: false,
                          })}
                        </span>
                      </div>
                      {client.visitDuration && (
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                          <FaRoute className="text-gray-400 flex-shrink-0" />
                          <span className="truncate font-medium">{client.visitDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && searchTerm === "" && (
                <nav className="flex items-center justify-center pt-4 gap-1">
                  <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                    className={`p-2 rounded-lg transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}>
                    <FaChevronLeft size={14} />
                  </button>
                  {(() => {
                    let start = Math.max(1, page - 1);
                    let end = Math.min(totalPages, page + 1);
                    if (page === 1) end = Math.min(3, totalPages);
                    else if (page === totalPages) start = Math.max(totalPages - 2, 1);
                    const pages = [];
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map(num => (
                      <button key={num} onClick={() => setPage(num)}
                        className={`w-9 h-9 rounded-lg text-sm font-black transition-colors ${page === num ? "bg-[#D3423E] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}>
                        {num}
                      </button>
                    ));
                  })()}
                  <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
                    className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}>
                    <FaChevronRight size={14} />
                  </button>
                </nav>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <FaMapMarkerAlt className="text-gray-300 text-3xl" />
              </div>
              <p className="text-gray-700 font-bold text-lg">Sin actividades</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">No hay rutas para este día</p>
            </div>
          )}
        </div>
      </>
    )}

    {collapsed && (
      <button onClick={() => setCollapsed(false)}
        className="hidden lg:flex h-full w-full rounded-r-xl border-4 border-red-700 items-center justify-center hover:bg-gray-50 transition-colors flex-col gap-2">
        <FaChevronRight className="text-red-700" />
      </button>
    )}
  </div>
);