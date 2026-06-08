import React from "react";
import { motion } from "framer-motion";
import { FaImage, FaFire } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { FALLBACK_IMAGE } from "../../constants/productConfig";

export const ProductCard = ({ sortedData, onEdit, onImageClick }) => (
  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
    {sortedData.map((item) => {
      const hasOffer = item.priceId?.offerPrice;
      const hasDiscount = item.priceId?.discount && item.priceId?.discount !== "0%";
      return (
        <motion.div
          key={item._id}
          whileHover={{ y: -3 }}
          className="bg-white border border-gray-200 hover:border-red-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col"
        >
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-3 group">
            {hasOffer && (
              <span className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <FaFire size={9} /> OFERTA
              </span>
            )}
            {hasDiscount && (
              <span className="absolute top-2 right-2 z-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                -{item.priceId.discount}
              </span>
            )}
            {item.productImage ? (
              <img
                className="w-full h-32 object-contain cursor-pointer hover:scale-105 transition-transform"
                src={item.productImage} alt={item.productName}
                onClick={() => onImageClick(item)}
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center">
                <FaImage className="text-gray-300 text-4xl" />
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[40px]">
              {item.productName || "Sin nombre"}
            </h3>
            {item.categoryId?.categoryName && (
              <p className="text-[10px] text-purple-600 font-bold mt-1 truncate">
                {item.categoryId.categoryName}
              </p>
            )}
            <div className="flex-1" />
            <div className="flex items-end justify-between gap-2 mt-3">
              <div>
                {hasOffer && (
                  <p className="text-[10px] text-gray-400 line-through">Bs. {item.priceId.price}</p>
                )}
                <p className={`text-lg font-black ${hasOffer ? "text-orange-600" : "text-gray-900"}`}>
                  Bs. {hasOffer ? item.priceId.offerPrice : (item.priceId?.price || "0")}
                </p>
              </div>
              <button
                onClick={() => onEdit(item)}
                className="w-9 h-9 bg-red-50 hover:bg-red-100 text-[#D3423E] rounded-xl flex items-center justify-center transition-colors shadow-sm"
                title="Editar"
              >
                <MdEdit size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      );
    })}
  </div>
);