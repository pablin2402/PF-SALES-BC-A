import React from "react";
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaCity } from "react-icons/fa";
import Avatar from "./Avatar";
import ActionsMenu from "./ActionsMenu";

const DeliveryCard = ({ item, onSelect, onToggle }) => (
  <div
    onClick={() => onSelect(item)}
    className={`bg-white border-2 rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer ${item.active ? "border-gray-400 hover:border-gray-300" : "border-gray-200 opacity-75"}`}
  >
    <div className="flex items-start gap-3 mb-3">
      <Avatar fullName={item.fullName} lastName={item.lastName} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 truncate">{item.fullName} {item.lastName}</p>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${item.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-green-500" : "bg-gray-400"}`}></span>
          {item.active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <ActionsMenu
        onView={(e) => { e.stopPropagation(); onSelect(item); }}
        onToggle={(e) => { e.stopPropagation(); onToggle(!item.active, item._id); }}
        isActive={item.active}
      />
    </div>

    <div className="space-y-1.5 text-xs text-gray-600">
      {item.email && (
        <p className="flex items-center gap-2 truncate">
          <FaEnvelope className="text-gray-400 flex-shrink-0" size={11} />
          <span className="truncate">{item.email}</span>
        </p>
      )}
      {item.phoneNumber && (
        <p className="flex items-center gap-2">
          <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
          {item.phoneNumber}
        </p>
      )}
      {item.client_location?.direction && (
        <p className="flex items-start gap-2">
          <FaMapMarkerAlt className="text-gray-400 flex-shrink-0 mt-0.5" size={11} />
          <span className="line-clamp-2">{item.client_location.direction}</span>
        </p>
      )}
      {item.region && (
        <p className="flex items-center gap-2">
          <FaCity className="text-gray-400 flex-shrink-0" size={11} />
          {item.region}
        </p>
      )}
    </div>
  </div>
);

const DeliveryCardsGrid = ({ data, viewMode, onSelect, onToggle }) => {
  const containerClass = viewMode === "cards"
    ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    : "lg:hidden p-4 space-y-3";

  return (
    <div className={containerClass}>
      {data.map(item => (
        <DeliveryCard key={item._id} item={item} onSelect={onSelect} onToggle={onToggle} />
      ))}
    </div>
  );
};

export default DeliveryCardsGrid;