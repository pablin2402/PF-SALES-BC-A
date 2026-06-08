import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserEdit, FaPhone, FaMapMarkerAlt, FaUserTie } from "react-icons/fa";
import { getInitial } from "../../constants/adminConfig";

export const AdminCards = ({ filteredAndSorted, viewMode, onRowClick, onEditClick }) => {
    const containerClass = viewMode === "cards"
        ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        : "lg:hidden p-4 space-y-3";

    return (
        <div className={viewMode === "cards" ? "p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "lg:hidden p-4 space-y-3"}>
            {filteredAndSorted.map((item) => (
                <div
                    key={item._id}
                    className="bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl p-4 hover:shadow-md transition-all"
                >
                    <div className="flex items-start gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${getColor(item.salesId?.fullName, item.salesId?.lastName)}`}>
                                {getInitials(item.salesId?.fullName, item.salesId?.lastName)}
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                <FaCrown className="text-yellow-700" size={9} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{item.salesId?.fullName} {item.salesId?.lastName}</p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold mt-1">
                                <FaUserShield size={8} /> ADMINISTRADOR
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600">
                        {item.salesId?.email && (
                            <a href={`mailto:${item.salesId.email}`} className="flex items-center gap-2 truncate hover:text-[#D3423E] transition-colors">
                                <FaEnvelope className="text-gray-400 flex-shrink-0" size={11} />
                                <span className="truncate">{item.salesId.email}</span>
                            </a>
                        )}
                        {item.salesId?.phoneNumber && (
                            <a href={`tel:${item.salesId.phoneNumber}`} className="flex items-center gap-2 hover:text-[#D3423E] transition-colors">
                                <FaPhone className="text-gray-400 flex-shrink-0" size={11} />
                                {item.salesId.phoneNumber}
                            </a>
                        )}
                        {item.salesId?.region && (
                            <p className="flex items-center gap-2">
                                <FaCity className="text-gray-400 flex-shrink-0" size={11} />
                                {item.salesId.region}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};