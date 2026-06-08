import React, { useMemo } from "react";
import { FaMapMarkerAlt, FaReceipt, FaBoxes, FaWineBottle, FaPlus, FaTimes, FaCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getChannelConfig } from "../../utils/ClientMarkerIcons";
import { getMunicipioForPoint } from "../../utils/CochabambaMunicipios";
import { calculateOrderPacking } from "../../utils/RouteOptimizer";
import { ACCOUNT_STATUS_CONFIG, FALLBACK_IMAGE, PAGE_SIZE_OPTIONS } from "../../constants/routeConfigs";
import { PedidosSkeletonLoader } from "./RouteSkeletons";

export const PedidosPanel = ({
  loading, markers, totalOrders, isClientSelected, panToLocation, goToClientDetails,
  handleDelete, handleMarkerClick, page, setPage, totalPages, pageSize, setPageSize, selectedMunicipio,
}) => {
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, page - 1, page, page + 1, totalPages];
  }, [page, totalPages]);

  if (loading) return <PedidosSkeletonLoader />;
  if (markers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
        <FaReceipt className="text-gray-300 text-3xl" />
      </div>
      <p className="text-gray-700 font-bold">{selectedMunicipio ? "Sin pedidos en esta zona" : "Sin pedidos aprobados"}</p>
      <p className="text-sm text-gray-500 mt-1">{selectedMunicipio ? "Prueba otra zona" : "No hay pedidos disponibles"}</p>
    </div>
  );

  return (
    <div className="p-4 space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide px-1">
        {selectedMunicipio ? `${markers.length} en zona` : `${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, totalOrders)} de ${totalOrders}`}
      </p>

      {markers.map(client => {
        const sel = isClientSelected(client._id);
        const acct = ACCOUNT_STATUS_CONFIG[client.accountStatus];
        const pk = calculateOrderPacking(client);
        const ch = getChannelConfig(client.id_client?.userCategory);
        const loc = client.id_client?.client_location;
        const muni = loc?.latitud ? getMunicipioForPoint(loc.latitud, loc.longitud) : null;
        return (
          <div key={client._id} onClick={() => panToLocation({ client_location: loc })}
            className={`bg-white border-2 rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-md ${sel ? "border-[#D3423E] shadow-md ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"}`}>
            <div className="flex gap-3 p-3">
              <div className="relative flex-shrink-0">
                <img className="w-14 h-14 object-cover rounded-xl bg-gray-100"
                  src={client.id_client?.identificationImage || FALLBACK_IMAGE} alt=""
                  onError={e => { e.target.src = FALLBACK_IMAGE; }} />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[11px] shadow-sm"
                  style={{ backgroundColor: ch.color }}>{ch.emoji}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 onClick={e => { e.stopPropagation(); goToClientDetails(client); }}
                    className="font-bold text-gray-900 text-sm truncate hover:text-[#D3423E]">
                    {client.id_client?.name} {client.id_client?.lastName}
                  </h3>
                  {sel && <span className="flex-shrink-0 w-5 h-5 bg-[#D3423E] text-white rounded-full flex items-center justify-center"><FaCheck size={9} /></span>}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><FaReceipt size={9} /> #{client.receiveNumber}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {acct && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${acct.color}`}>{acct.label}</span>}
                  {muni && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: muni.accent }} />{muni.name}</span>}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-[#D3423E] border border-red-200 flex items-center gap-0.5"><FaBoxes size={8} />{pk.physicalBoxes}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5"><FaWineBottle size={8} />{pk.totalBottles}</span>
                </div>
              </div>
            </div>
            <div className="px-3 pb-3 space-y-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Empaque</p>
                <div className="flex flex-wrap gap-1">
                  {pk.fullBoxes > 0 && <span className="text-[10px] bg-gray-700 text-white px-1.5 py-0.5 rounded font-bold">{pk.fullBoxes} × 12</span>}
                  {pk.halfBoxes > 0 && <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded font-bold">{pk.halfBoxes} × 6</span>}
                  {pk.looseBottles > 0 && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">{pk.looseBottles} sueltas</span>}
                  {pk.physicalBoxes === 0 && <span className="text-[10px] text-gray-400 italic">Sin productos</span>}
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-gray-600">
                <FaMapMarkerAlt className="text-[#D3423E] flex-shrink-0 mt-0.5" size={10} />
                <span className="break-words text-[11px]">{loc?.direction || "Sin dirección"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Bs. {Number(client.totalAmount).toFixed(2)}</span>
                <button onClick={e => { e.stopPropagation(); sel ? handleDelete(client._id) : handleMarkerClick(client); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${sel ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-[#D3423E] text-white hover:bg-red-700"}`}>
                  {sel ? <><FaTimes size={9} /> Quitar</> : <><FaPlus size={9} /> Agregar</>}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {!selectedMunicipio && totalPages > 1 && (
        <div className="pt-4 space-y-3">
          <nav className="flex items-center justify-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === 1 ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"}`}>‹‹</button>
            <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} className={`p-2 rounded-lg ${page === 1 ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"}`}><FaChevronLeft size={12} /></button>
            {visiblePages.map((num, idx) => {
              const gap = idx > 0 && num - visiblePages[idx - 1] > 1;
              return (<React.Fragment key={num}>{gap && <span className="text-gray-400 px-1">…</span>}
                <button onClick={() => setPage(num)} className={`w-9 h-9 rounded-lg text-sm font-bold ${page === num ? "bg-gradient-to-br from-[#D3423E] to-red-700 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"}`}>{num}</button>
              </React.Fragment>);
            })}
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages} className={`p-2 rounded-lg ${page === totalPages ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"}`}><FaChevronRight size={12} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className={`px-2 h-9 rounded-lg text-xs font-bold ${page === totalPages ? "text-gray-300" : "text-gray-700 hover:bg-gray-100"}`}>››</button>
          </nav>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Mostrar</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="app-select">
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};