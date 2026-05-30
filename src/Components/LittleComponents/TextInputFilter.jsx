import React from "react";
import {
  FaSearch
} from "react-icons/fa";
const TextInputFilter = ({ value, onChange, onEnter, placeholder = "Buscar..." }) => {
  return (
    <div className="relative w-full">
      <div className="relative flex-1 max-w-md">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
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
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#D3423E] focus:bg-white transition-all"
        />
        </div>
      </div>
      );
};

      export default TextInputFilter;
