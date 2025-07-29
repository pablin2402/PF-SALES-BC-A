import React from "react";

const ErrorModal = ({ show, onClose, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="text-center">
          <svg
            className="mx-auto mb-4 text-red-500 w-12 h-12"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M5.636 18.364A9 9 0 1 1 18.364 5.636 9 9 0 0 1 5.636 18.364z"
            />
          </svg>
          <h3 className="mb-5 text-lg font-semibold text-gray-900">
            {message || "Ocurrió un error inesperado."}
          </h3>
          <button
            onClick={onClose}
            className="text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-0 focus:border-red-500 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
