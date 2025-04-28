
const OrderButton = ({onClick}) => {

  return (
    <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-[#D3423E] text-lg text-white font-bold rounded-lg hover:bg-white hover:text-[#D3423E] transition duration-200"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
          clipRule="evenodd"
        ></path>
      </svg>
      Nuevo Pedido
    </button>
  );
};

export default OrderButton;
