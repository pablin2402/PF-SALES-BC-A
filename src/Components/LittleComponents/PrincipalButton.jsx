import React from "react";

const ButtonPrincipal = ({ onClick, icon: Icon, children,disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 h-full text-white text-m bg-red-700 uppercase font-bold rounded-3xl flex items-center justify-center gap-2 transition duration-200"
    >
      {Icon && <Icon className="text-white text-lg" />}
      {children}
    </button>
  );
};

export default ButtonPrincipal;
