import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt, FaUser, FaStore, FaChevronLeft, FaChevronRight,
  FaBuilding, FaFilter, FaSearch, FaSort, FaMapMarkedAlt,
  FaTimes, FaChevronDown, FaCity,
} from "react-icons/fa";
import { CHANNEL_LIST } from "../../utils/ClientMarkerIcons";
import { getChannelConfig } from "../../utils/ClientMarkerIcons";
import { MUNICIPIOS_COCHABAMBA, getMunicipioForPoint } from "../../utils/CochabambaMunicipios";
import { FALLBACK_IMAGE } from "../../utils/MapDetails";
import { SidebarSkeleton } from "../../utils/MapSkeleton";

const SORT_OPTIONS = [
  { value: "name", label: "Nombre (A-Z)" },
  { value: "nameDesc", label: "Nombre (Z-A)" },
  { value: "creationDate", label: "Más recientes" },
  { value: "creationDateAsc", label: "Más antiguos" },
  { value: "company", label: "Empresa (A-Z)" },
];

export const MapSidebar = ({
  collapsed, setCollapsed,
  searchInput, setSearchInput, loading,
  salesManData, selectedSalesmen, setSelectedSalesmen,
  selectedCategories, setSelectedCategories, channelStats,
  selectedMunicipio, setSelectedMunicipio, fitMunicipio, municipioGroups,
  sortBy, setSortBy, hasLocationOnly, setHasLocationOnly,
  hasActiveFilters, clearFilters,
  sidebarClients, selectedClient, findLocation,
  viewAllMode, allClientsCache, total, page, setPage,
  limit, setLimit, totalPages, visiblePages,
  activeSalesmen, activeDeliveries,
}) => {
  const navigate = useNavigate();
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Ordenar";

  const goToClientDetails = (client) => navigate(`/client/${client._id}`, { state: { client } });

  return (
    <div className={`${collapsed ? "w-0 lg:w-16" : "w-full lg:w-[440px]"} h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
      {!collapsed && (
        <>
          <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-[#D3423E] to-red-700 rounded-br-3xl text-white flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-black flex items-center gap-2">
                  <FaMapMarkerAlt /> Mapa de clientes
                </h1>
                <p className="text-xs text-red-100 mt-0.5 font-medium">
                  {viewAllMode
                    ? `${allClientsCache.length} clientes (vista completa)`
                    : total > 0 ? `${total} cliente${total !== 1 ? "s" : ""} ${hasActiveFilters ? "encontrados" : ""}` : "Ubicaciones en tiempo real"}
                </p>
              </div>
              <button onClick={() => setCollapsed(true)} className="hidden lg:flex p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <FaChevronLeft size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Clientes", val: viewAllMode ? allClientsCache.length : total },
                { label: "Vendedores", val: activeSalesmen },
                { label: "Repartidores", val: activeDeliveries },
              ].map(s => (
                <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-2 text-center">
                  <p className="text-[10px] text-red-100 font-black uppercase">{s.label}</p>
                  <p className="text-xl font-black">{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <input
                type="text" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Nombre, empresa, NIT, teléfono..."
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 text-gray-900 rounded-xl bg-white outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 transition-all shadow-sm"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D3423E]">
                  <FaTimes size={12} />
                </button>
              )}
              {loading && searchInput && (
                <div className="absolute right-9 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-200 border-t-[#D3423E]" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Vendedor</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                  <select value={selectedSalesmen} onChange={e => setSelectedSalesmen(e.target.value)}
                    className="pl-8 w-full py-2.5 pr-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 cursor-pointer shadow-sm">
                    <option value="">Todos</option>
                    {salesManData.map(s => <option key={s._id} value={s._id}>{s.fullName} {s.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Canal</label>
                <div className="relative">
                  <FaStore className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                  <select value={selectedCategories} onChange={e => setSelectedCategories(e.target.value)}
                    className="pl-8 w-full py-2.5 pr-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100 cursor-pointer shadow-sm">
                    <option value="">Todos</option>
                    {CHANNEL_LIST.map(c => <option key={c} value={c}>{c}{channelStats[c] ? ` (${channelStats[c]})` : ""}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <FaCity size={9} /> Municipio
              </label>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setSelectedMunicipio("")}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${selectedMunicipio === "" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                  Todos
                </button>
                {Object.values(MUNICIPIOS_COCHABAMBA).map(m => {
                  const count = municipioGroups[m.id]?.count || 0;
                  const isActive = selectedMunicipio === m.id;
                  return (
                    <button key={m.id}
                      onClick={() => { setSelectedMunicipio(isActive ? "" : m.id); if (!isActive) fitMunicipio(m.id); }}
                      disabled={count === 0}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${isActive ? "bg-gray-900 text-white border-gray-900" : count === 0 ? "opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.accent }} />
                      {m.name}
                      {count > 0 && <span className={`text-[10px] ${isActive ? "opacity-75" : "text-gray-500"}`}>({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <button onClick={() => setShowSortMenu(!showSortMenu)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-white text-gray-700 hover:border-[#D3423E] transition-colors shadow-sm">
                  <span className="flex items-center gap-2"><FaSort className="text-gray-400" size={11} />{sortLabel}</span>
                  <FaChevronDown className={`text-gray-400 transition-transform ${showSortMenu ? "rotate-180" : ""}`} size={10} />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                          className={`w-full px-3 py-2.5 text-xs text-left hover:bg-red-50 transition-colors ${sortBy === opt.value ? "bg-red-50 text-[#D3423E] font-black" : "text-gray-700"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setShowAdvanced(!showAdvanced)}
                className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 shadow-sm ${showAdvanced ? "bg-[#D3423E] text-white border-[#D3423E]" : "bg-white text-gray-700 border-gray-200 hover:border-[#D3423E]"}`}>
                <FaFilter size={10} />{showAdvanced ? "Ocultar" : "Más"}
              </button>
            </div>

            {showAdvanced && (
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-colors">
                  <input type="checkbox" checked={hasLocationOnly} onChange={e => setHasLocationOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#D3423E] cursor-pointer" />
                  <FaMapMarkedAlt className="text-[#D3423E]" size={11} />
                  <span className="text-xs text-gray-700 font-semibold">Solo con ubicación válida</span>
                </label>
              </div>
            )}

            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="w-full text-xs font-bold text-gray-500 hover:text-[#D3423E] transition-colors flex items-center justify-center gap-1 py-1.5 rounded-lg hover:bg-red-50">
                <FaTimes size={10} /> Limpiar todos los filtros
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? <SidebarSkeleton /> : sidebarClients.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  {viewAllMode
                    ? `${sidebarClients.length} en vista completa`
                    : selectedMunicipio
                      ? `${sidebarClients.length} en ${MUNICIPIOS_COCHABAMBA[selectedMunicipio]?.name}`
                      : `${((page - 1) * limit) + 1}–${Math.min(page * limit, total)} de ${total}`}
                </p>

                {sidebarClients.slice(0, viewAllMode ? 50 : sidebarClients.length).map(client => {
                  const isSelected = selectedClient?._id === client._id;
                  const channelConf = getChannelConfig(client.userCategory);
                  const hasLoc = client.client_location?.latitud && client.client_location?.longitud;
                  const muni = hasLoc ? getMunicipioForPoint(client.client_location.latitud, client.client_location.longitud) : null;
                  return (
                    <div key={client._id} onClick={() => findLocation(client)}
                      className={`bg-white border-2 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-[#D3423E] shadow-md ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex gap-3 p-3">
                        <div className="relative flex-shrink-0">
                          <img className="w-20 h-20 object-cover rounded-xl bg-gray-100"
                            src={client.identificationImage || FALLBACK_IMAGE} alt={client.name}
                            onError={e => { e.target.src = FALLBACK_IMAGE; }} />
                          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-base shadow-md"
                            style={{ backgroundColor: channelConf.color }}>
                            <span>{channelConf.emoji}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 onClick={e => { e.stopPropagation(); goToClientDetails(client); }}
                            className="font-bold text-gray-900 truncate hover:text-[#D3423E] transition-colors cursor-pointer">
                            {client.name} {client.lastName}
                          </h3>
                          {client.company && (
                            <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                              <FaBuilding className="text-gray-400 flex-shrink-0" size={10} /> {client.company}
                            </p>
                          )}
                          {client.sales_id && (
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                              <FaUser className="text-gray-400 flex-shrink-0" size={10} />
                              {client.sales_id?.fullName} {client.sales_id?.lastName}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                              style={{ backgroundColor: `${channelConf.color}20`, color: channelConf.colorDark, borderColor: `${channelConf.color}50` }}>
                              {channelConf.emoji} {client.userCategory || "Cliente"}
                            </span>
                            {muni && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: muni.accent }} />
                                {muni.name}
                              </span>
                            )}
                            {!hasLoc && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                Sin ubicación
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="px-3 pb-3">
                        <div className="flex items-start gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 text-xs text-gray-600">
                          <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0 mt-0.5" size={10} />
                          <span className="break-words">{client.client_location?.direction || "Ubicación no disponible"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {viewAllMode && sidebarClients.length > 50 && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 text-center text-xs text-gray-600 border border-gray-200">
                    <p className="font-bold">Mostrando los primeros 50 en lista</p>
                    <p className="text-[10px] mt-1 text-gray-500">Los {sidebarClients.length} están visibles en el mapa</p>
                  </div>
                )}

                {!viewAllMode && !selectedMunicipio && (
                  <div className="pt-4 space-y-3 border-t border-gray-100 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-bold">
                        {total > 0 ? `${((page - 1) * limit) + 1}–${Math.min(page * limit, total)} de ${total}` : "0 clientes"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-500 font-bold">Ver:</span>
                        <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                          className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#D3423E]">
                          {[10, 20, 30, 50, 100].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <nav className="flex items-center justify-center gap-1">
                        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}
                          className={`p-2 rounded-lg transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}>
                          <FaChevronLeft size={12} />
                        </button>
                        {visiblePages.map((num, idx) => {
                          const isGap = idx > 0 && num - visiblePages[idx - 1] > 1;
                          return (
                            <React.Fragment key={num}>
                              {isGap && <span className="text-gray-400 px-1">…</span>}
                              <button onClick={() => setPage(num)}
                                className={`w-9 h-9 rounded-lg text-sm font-black transition-colors ${page === num ? "bg-[#D3423E] text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}>
                                {num}
                              </button>
                            </React.Fragment>
                          );
                        })}
                        <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}
                          className={`p-2 rounded-lg transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`}>
                          <FaChevronRight size={12} />
                        </button>
                      </nav>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <FaMapMarkerAlt className="text-gray-300 text-3xl" />
                </div>
                <p className="text-gray-700 font-bold text-lg">Sin clientes</p>
                <p className="text-sm text-gray-500 mt-1">{hasActiveFilters ? "Ajusta los filtros e intenta de nuevo" : "No hay clientes para mostrar"}</p>
                {hasActiveFilters && <button onClick={clearFilters} className="mt-4 text-xs font-bold text-[#D3423E] hover:underline">Limpiar filtros</button>}
              </div>
            )}
          </div>
        </>
      )}

      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="hidden lg:flex h-full w-full rounded-r-xl border-4 border-red-700 items-center justify-center hover:bg-gray-50 transition-colors flex-col gap-2">
          <FaChevronRight className="text-red-700" />
          {total > 0 && <div className="w-8 h-8 bg-[#D3423E] text-white rounded-full flex items-center justify-center text-xs font-black">{total}</div>}
        </button>
      )}
    </div>
  );
};