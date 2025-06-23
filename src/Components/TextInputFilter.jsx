import React from "react";
import { HiOutlineSearch } from "react-icons/hi";

const TextInputFilter = ({ value, onChange, onEnter, placeholder = "Buscar..." }) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
        <HiOutlineSearch className="w-5 h-5 text-red-500" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            onEnter();
          }
        }}
        className="block w-full p-2 ps-10 text-m text-gray-900 border border-gray-900 rounded-2xl bg-gray-50 focus:outline-none focus:ring-0 focus:border-red-500"
      />
    </div>
  );
};

export default TextInputFilter;
