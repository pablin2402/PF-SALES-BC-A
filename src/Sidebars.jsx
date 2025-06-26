import { HiOutlineUserGroup, HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineChartBar, HiOutlineMap, HiOutlineUser } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function Sidebars() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const isAdmin = role === "ADMIN";
  const isSales = role === "SALES";

  return (
    <div className="Sidebar fixed top-0 left-0 h-screen bg-white border-r-2 border-black-700 w-full md:w-60 z-50 overflow-y-auto flex flex-col">
      <div className="px-0 py-0 flex-1">
        <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4 first:mt-0 first:border-t-0 first:pt-0 text-white">
          <Link to="/">
            <li>
              <div className="flex items-center text-[#D3423E] justify-center mt-10 p-2 text-xl font-bold hover:text-red-700 hover:font-bold hover:bg-white rounded-md px-0 py-0">
                <h1 className="mb-4 font-semibold text-2xl text-left">IMCABEZ S.R.L.</h1>
              </div>
            </li>
          </Link>

          {isAdmin && (
            <>
              <li>
                <Link to="/client" className="flex mt-20 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineUserGroup className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Clientes</h1>
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineShoppingCart className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Entregas</h1>
                </Link>
              </li>
              <li>
                <Link to="/order/pay" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineCurrencyDollar className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Finanzas</h1>
                </Link>
              </li>
              <li>
                <Link to="/localization" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineMap className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Localización</h1>
                </Link>
              </li>
              <li>
                <Link to="/localization/activivty" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineChartBar className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Monitoreo</h1>
                </Link>
              </li>
            </>
          )}

          {(isAdmin || isSales) && (
            <>
              <li>
                <Link to="/objective/sales" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineChartBar className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Objetivos</h1>
                </Link>
              </li>
              <li>
                <Link to="/order" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineShoppingCart className="font-medium ml-4" />
                  <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Ventas</h1>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="px-0 pb-4">
        <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-white">
          <li>
            <Link to="/profile" className="flex mt-2 mb-2 items-center justify-start text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
              <HiOutlineUser className="font-medium ml-4" />
              <h1 className="ml-3 flex-1 whitespace-nowrap font-bold m-0">Perfil</h1>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex mt-2 mb-2 items-center font-bold justify-start text-[#D3423E] text-lg rounded-md px-4 py-2"
            >
              <FiLogOut className="text-xl ml-4" />
              <span className="flex-1 whitespace-nowrap font-bold ml-3 m-0">Salir</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

