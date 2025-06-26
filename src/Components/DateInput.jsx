import React from "react";

const DateInput = ({ value, min, max, onChange, label }) => {
  const handleChange = (e) => {
    const newValue = e.target.value;

    if (min && newValue < min) {
      return;
    }
    if (max && newValue > max) {
      return;
    }

    onChange(newValue);
  };

  return (
    <div className="flex flex-col">
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
        className="h-full px-3 py-2 border border-gray-900 text-sm text-gray-900 rounded-2xl focus:outline-none focus:ring-0 focus:border-red-500"      />
    </div>
  );
};


export default DateInput;
