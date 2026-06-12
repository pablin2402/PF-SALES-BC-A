import React from "react";

const StatusToggle = ({ active, onChange, stopPropagation = true }) => (
  <label
    onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    className="relative inline-flex items-center cursor-pointer"
  >
    <input
      type="checkbox"
      className="sr-only peer"
      checked={!!active}
      onChange={() => onChange(!active)}
    />
    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors duration-300 relative">
      <div className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5 shadow-sm"></div>
    </div>
  </label>
);

export default StatusToggle;