import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export const ProductImageModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div className="relative max-w-2xl w-full">
          <img
            src={item.productImage} alt={item.productName}
            className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-4 bg-black/60 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
            <p className="font-black text-sm">{item.productName}</p>
            {item.priceId?.price && (
              <p className="text-xs text-gray-300 font-medium">Bs. {item.priceId.price}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 shadow-xl transition-colors"
          >
            <FaTimes />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};