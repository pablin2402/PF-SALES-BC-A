import React from "react";

const ButtonPrincipal = ({ onClick, icon: Icon, children,disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2 bg-[#D3423E] text-white rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 font-bold shadow-md"
    >
      {Icon && <Icon className="text-white text-lg" />}
      {children}
    </button>
  );
};

export default ButtonPrincipal;
