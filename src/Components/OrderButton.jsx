
const OrderButton = ({onClick}) => {

  return (
    <button
    onClick={onClick}
    className="px-4 py-2 p-6 font-bold text-lg text-white rounded-3xl uppercase bg-[#D3423E] flex items-center gap-2"
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
