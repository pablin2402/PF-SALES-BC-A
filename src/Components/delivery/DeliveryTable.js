import React from "react";
import { FaSort, FaSortUp, FaSortDown, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import Avatar from "./Avatar";
import StatusToggle from "./StatusToggle";
import ActionsMenu from "./ActionsMenu";

const SortableHeader = ({ field, label, sortBy, sortOrder, onSort }) => {
  const icon = sortBy !== field
    ? <FaSort className="text-gray-300" size={10} />
    : sortOrder === "asc"
      ? <FaSortUp className="text-[#D3423E]" size={10} />
      : <FaSortDown className="text-[#D3423E]" size={10} />;
  return (
    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">{label} {icon}</div>
    </th>
  );
};

const DeliveryRow = ({ item, onSelect, onToggle }) => (
  <tr onClick={() => onSelect(item)}
    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
    <td className="px-6 py-4">
      <Avatar fullName={item.fullName} lastName={item.lastName} />
    </td>
    <td className="px-4 py-4">
      <p className="font-bold text-gray-900">{item.fullName} {item.lastName}</p>
    </td>
    <td className="px-4 py-4 text-gray-700">
      {item.email
        ? <a href={`mailto:${item.email}`} onClick={(e) => e.stopPropagation()}
            className="hover:text-[#D3423E] transition-colors">{item.email}</a>
        : "-"}
    </td>
    <td className="px-4 py-4 text-gray-700">
      {item.phoneNumber
        ? <a href={`tel:${item.phoneNumber}`} onClick={(e) => e.stopPropagation()}
            className="hover:text-[#D3423E] transition-colors flex items-center gap-1">
            <FaPhone size={10} className="text-gray-400" />
            {item.phoneNumber}
          </a>
        : "-"}
    </td>
    <td className="px-4 py-4 text-gray-600 text-xs max-w-xs truncate">
      {item.client_location?.direction || "-"}
    </td>
    <td className="px-4 py-4">
      {item.region
        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
            <FaMapMarkerAlt size={9} />
            {item.region}
          </span>
        : <span className="text-gray-400 text-xs">Sin ciudad</span>}
    </td>
    <td className="px-4 py-4 text-center">
      <StatusToggle active={item.active} onChange={(s) => onToggle(s, item._id)} />
    </td>
    <td className="px-4 py-4">
      <ActionsMenu
        onView={(e) => { e.stopPropagation(); onSelect(item); }}
        onToggle={(e) => { e.stopPropagation(); onToggle(!item.active, item._id); }}
        isActive={item.active}
      />
    </td>
  </tr>
);

const DeliveryTable = ({ data, sortBy, sortOrder, onSort, onSelect, onToggle }) => (
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-s text-gray-600 uppercase bg-gray-200 border-b border-gray-200">
        <tr>
          <th className="px-6 py-3"></th>
          <SortableHeader field="name" label="Nombre" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <SortableHeader field="email" label="Correo" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <th className="px-4 py-3 font-semibold">Teléfono</th>
          <th className="px-4 py-3 font-semibold">Dirección</th>
          <SortableHeader field="region" label="Ciudad" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <th className="px-4 py-3 font-semibold text-center">Estado</th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <DeliveryRow key={item._id} item={item} onSelect={onSelect} onToggle={onToggle} />
        ))}
      </tbody>
    </table>
  </div>
);

export default DeliveryTable;