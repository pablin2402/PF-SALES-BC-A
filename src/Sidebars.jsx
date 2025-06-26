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
    <div className="fixed top-0 left-0 h-screen w-16 md:w-60 bg-white border-r-2 border-black-700 z-50 overflow-y-auto flex flex-col transition-all duration-300">
      <div className="px-0 py-0 flex-1">
        <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-white">
          <Link to="/">
            <li>
              <div className="flex items-center text-[#D3423E] justify-center mt-10 p-2 text-xl font-bold hover:text-red-700 hover:font-bold hover:bg-white rounded-md">
                <h1 className="mb-4 font-semibold text-2xl text-left hidden md:block">IMCABEZ S.R.L.</h1>
              </div>
            </li>
          </Link>

          {isAdmin && (
            <>
              <li>
                <Link to="/client" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineUserGroup className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Clientes</h1>
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineShoppingCart className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Entregas</h1>
                </Link>
              </li>
              <li>
                <Link to="/order/pay" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineCurrencyDollar className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Finanzas</h1>
                </Link>
              </li>
              <li>
                <Link to="/localization" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineMap className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Localización</h1>
                </Link>
              </li>
              <li>
                <Link to="/localization/activivty" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineChartBar className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Monitoreo</h1>
                </Link>
              </li>
            </>
          )}

          {(isAdmin || isSales) && (
            <>
              <li>
                <Link to="/objective/sales" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineChartBar className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Objetivos</h1>
                </Link>
              </li>
              <li>
                <Link to="/order" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
                  <HiOutlineShoppingCart className="mx-auto md:ml-4" />
                  <h1 className="ml-3 font-bold hidden md:block">Ventas</h1>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="px-0 pb-4">
        <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-white">
          <li>
            <Link to="/profile" className="flex items-center text-gray-900 text-lg hover:font-bold hover:bg-white rounded-md px-4 py-2">
              <HiOutlineUser className="mx-auto md:ml-4" />
              <h1 className="ml-3 font-bold hidden md:block">Perfil</h1>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center font-bold text-[#D3423E] text-lg rounded-md px-4 py-2"
            >
              <FiLogOut className="text-xl mx-auto md:ml-4" />
              <span className="ml-3 font-bold hidden md:block">Salir</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

  
  


