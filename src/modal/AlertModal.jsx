import React from "react";

const AlertModal = ({ show, onClose, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96">
        <div className="p-4 md:p-5 text-center">
          <svg
            className="mx-auto mb-4 text-gray-500 w-12 h-12"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z"
            />
          </svg>
          <h3 className="mb-5 text-lg font-semibold text-gray-900">
            {message || "Ocurrió un error inesperado."}
          </h3>          
          <button
            onClick={onClose}
            className="px-5 py-2.5 uppercase font-bold text-sm font-medium text-white bg-gray-500 rounded-lg"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
