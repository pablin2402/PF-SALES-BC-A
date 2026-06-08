import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUserEdit, FaTag, FaPhone, FaMapMarkerAlt, FaSort, FaSortUp, FaSortDown,
} from "react-icons/fa";
import {getInitials}from "../../constants/adminConfig"

export const AdminTable = ({
    sortedData, sortBy, sortOrder, onSort, onRowClick, onEditClick,
}) => (
    <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3"></th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("name")}>
                        <div className="flex items-center gap-1">Nombre {getSortIcon("name")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("email")}>
                        <div className="flex items-center gap-1">Correo {getSortIcon("email")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold">Teléfono</th>
                    <th className="px-4 py-3 font-semibold cursor-pointer hover:text-[#D3423E]" onClick={() => handleSort("region")}>
                        <div className="flex items-center gap-1">Ciudad {getSortIcon("region")}</div>
                    </th>
                    <th className="px-4 py-3 font-semibold text-center">Rol</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndSorted.map((item) => (
                    <tr
                        key={item._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                        <td className="px-6 py-4">
                            <div className="relative">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getColor(item.salesId?.fullName, item.salesId?.lastName)}`}>
                                    {getInitials(item.salesId?.fullName, item.salesId?.lastName)}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                    <FaCrown className="text-yellow-700" size={9} />
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-4">
                            <p className="font-bold text-gray-900">{item.salesId?.fullName} {item.salesId?.lastName}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                            {item.salesId?.email ? (

                                <a href={`mailto:${item.salesId.email}`}
                                    className="hover:text-[#D3423E] transition-colors flex items-center gap-1.5"
                                >
                                    <FaEnvelope size={10} className="text-gray-400" />
                                    {item.salesId.email}
                                </a>
                            ) : "-"}
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                            {item.salesId?.phoneNumber ? (

                                <a href={`tel:${item.salesId.phoneNumber}`}
                                    className="hover:text-[#D3423E] transition-colors flex items-center gap-1.5"
                                >
                                    <FaPhone size={10} className="text-gray-400" />
                                    {item.salesId.phoneNumber}
                                </a>
                            ) : "-"}
                        </td>
                        <td className="px-4 py-4">
                            {item.salesId?.region ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                                    <FaMapMarkerAlt size={9} />
                                    {item.salesId.region}
                                </span>
                            ) : (
                                <span className="text-gray-400 text-xs">Sin ciudad</span>
                            )}
                        </td>
                        <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                                <FaUserShield size={9} />
                                ADMIN
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);