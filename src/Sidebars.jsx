import { HiOutlineUserGroup, HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineChartBar, HiOutlineUser } from 'react-icons/hi';
import { MdTrackChanges } from "react-icons/md";

import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut } from "react-icons/fi";
import { useEffect, useState } from "react";
import { HiOutlineLocationMarker } from "react-icons/hi";
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
    <div className="fixed top-0 left-0 h-screen w-16 md:w-60 bg-red-700 z-50 overflow-y-auto flex flex-col transition-all duration-300">
      <div className="px-0 py-0 flex-1">
        <ul className="mt-4 space-y-2 border-t border-red-400 pt-4 text-white">
          <Link to="/">
            <li>
              <div className="flex items-center justify-center mt-10 p-2 text-xl font-bold hover:text-white hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md transition">
                <h1 className="mb-4 font-semibold text-2xl text-left hidden md:block">IMCABEZ S.R.L.</h1>
              </div>
            </li>
          </Link>

          {isAdmin && (
            <>
              <li>
                <Link to="/client" className="flex items-center mt-20 font-bold text-white text-lg hover:text-white hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
                  <HiOutlineUserGroup className="mx-auto md:ml-4 hover:text-white" />
                  <h1 className="ml-3 hidden md:block">Clientes</h1>
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="flex items-center font-bold text-white text-lg hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
                  <HiOutlineShoppingCart className="mx-auto md:ml-4" />
                  <h1 className="ml-3 hidden md:block">Entregas</h1>
                </Link>
              </li>
              <li>
                <Link to="/order/pay" className="flex items-center font-bold text-white text-lg hover:bg-red-600 hover:mr-5 hover:ml-5  rounded-md px-4 py-2 transition">
                  <HiOutlineCurrencyDollar className="mx-auto md:ml-4" />
                  <h1 className="ml-3 hidden md:block">Finanzas</h1>
                </Link>
              </li>
              <li>
                <Link to="/localization" className="flex items-center font-bold text-white text-lg hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
                  <HiOutlineLocationMarker className="mx-auto md:ml-4" />
                  <h1 className="ml-3 hidden md:block">Localización</h1>
                </Link>
              </li>
              <li>
                <Link to="/localization/activivty" className="flex font-bold items-center text-white text-lg hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
                  <MdTrackChanges className="mx-auto md:ml-4" />
                  <h1 className="ml-3 hidden md:block">Monitoreo</h1>
                </Link>
              </li>
            </>
          )}

          {(isAdmin || isSales) && (
            <>
              <li>
                <Link to="/objective/sales" className="flex items-center font-bold text-white text-lg hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
                  <HiOutlineChartBar className="mx-auto md:ml-4" />
                  <h1 className="ml-3 hidden md:block">Objetivos</h1>
                </Link>
              </li>
              <li>
                <Link to="/order" className="flex items-center text-white font-bold text-lg hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
                  <HiOutlineShoppingCart className="mx-auto md:ml-4" />
                  <h1 className="ml-3 hidden md:block">Ventas</h1>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="px-0 pb-4">
        <ul className="mt-4 space-y-2 border-t border-red-400 pt-4 text-white">
          <li>
            <Link to="/profile" className="flex items-center text-white font-bold text-lg hover:bg-red-600 hover:mr-5 hover:ml-5 rounded-md px-4 py-2 transition">
              <HiOutlineUser className="mx-auto md:ml-4" />
              <h1 className="ml-3 hidden md:block">Perfil</h1>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center font-bold text-white font-bold text-lg rounded-md px-4 py-2 hover:bg-red-600 hover:mr-5 hover:ml-5 transition"
            >
              <FiLogOut className="text-xl mx-auto md:ml-4" />
              <span className="ml-3 hidden md:block">Salir</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};





