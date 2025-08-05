import React from "react";

const AlertModalChrome = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6 text-center">
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
        <h3 className="text-lg font-semibold mb-3 text-gray-900">
          Navegador no compatible
        </h3>
        <p className="mb-6 text-gray-700">
          Por favor, usa <strong>Google Chrome</strong> para acceder a esta aplicación.
        </p>
        <button
          onClick={onClose}
          className="px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default AlertModalChrome;
