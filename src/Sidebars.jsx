import {
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineLocationMarker,
} from "react-icons/hi";

import { MdTrackChanges } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { useEffect, useState } from "react";

export default function Sidebars() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isAdmin = role === "ADMIN";
  const isSales = role === "SALES";

  const menuItems = [
    ...(isAdmin
      ? [
          {
            path: "/client",
            label: "Clientes",
            icon: <HiOutlineUserGroup size={22} />,
          },
          {
            path: "/delivery",
            label: "Entregas",
            icon: <HiOutlineShoppingCart size={22} />,
          },
          {
            path: "/order/pay",
            label: "Finanzas",
            icon: <HiOutlineCurrencyDollar size={22} />,
          },
          {
            path: "/localization",
            label: "Localización",
            icon: <HiOutlineLocationMarker size={22} />,
          },
          {
            path: "/localization/activivty",
            label: "Monitoreo",
            icon: <MdTrackChanges size={22} />,
          },
        ]
      : []),

    ...(isAdmin || isSales
      ? [
          {
            path: "/objective/sales",
            label: "Objetivos",
            icon: <HiOutlineChartBar size={22} />,
          },
          {
            path: "/order",
            label: "Ventas",
            icon: <HiOutlineShoppingCart size={22} />,
          },
        ]
      : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="
        fixed top-0 left-0 h-screen
        w-16 md:w-60
        bg-red-700
        border-r border-red-500/20
        shadow-2xl
        z-50
        flex flex-col
        transition-all duration-300
      "
    >

      <div className="relative px-4 pt-6 pb-8">
        <Link to="/">
          <div
            className="
              flex items-center justify-center md:justify-start
              gap-3
              bg-white/10
              backdrop-blur-md
              border border-white/10
              rounded-2xl
              px-4 py-4
              hover:bg-white/15
              transition-all duration-300
              cursor-pointer
            "
          >
            <div
              className="
                w-11 h-11
                rounded-xl
                bg-white
                flex items-center justify-center
                shadow-lg
              "
            >
              <span className="text-red-700 font-black text-lg">
                I
              </span>
            </div>

            <div className="hidden md:block">
              <h1 className="text-white font-black text-lg leading-none">
                IMCABEZ
              </h1>

            
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`
                  group relative
                  flex items-center
                  gap-4
                  px-4 py-3.5
                  rounded-2xl
                  transition-all duration-300
                  overflow-hidden
                  ${
                    isActive(item.path)
                      ? `
                        bg-white
                        text-red-700
                        shadow-xl
                        scale-[1.02]
                      `
                      : `
                        text-white
                        hover:bg-white/10
                        hover:translate-x-1
                      `
                  }
                `}
              >
                {isActive(item.path) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-white opacity-60"></div>
                )}

                <div className="relative z-10 flex items-center gap-4">
                  <div
                    className={`
                      min-w-[42px] h-[42px]
                      rounded-xl
                      flex items-center justify-center
                      transition-all duration-300
                      ${
                        isActive(item.path)
                          ? "bg-red-100 text-red-700"
                          : "bg-white/10 text-white group-hover:bg-white/20"
                      }
                    `}
                  >
                    {item.icon}
                  </div>

                  <span
                    className={`
                      hidden md:block
                      font-bold
                      text-[15px]
                      tracking-wide
                    `}
                  >
                    {item.label}
                  </span>
                </div>

                {isActive(item.path) && (
                  <div className="absolute right-3 w-2 h-2 rounded-full bg-red-600"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 border-t border-white/10">
        <div className="space-y-2">
          {isAdmin && (
            <Link
              to="/profile"
              className={`
                flex items-center gap-4
                px-4 py-3.5
                rounded-2xl
                text-white
                hover:bg-white/10
                transition-all duration-300
              `}
            >
              <div className="min-w-[42px] h-[42px] rounded-xl bg-white/10 flex items-center justify-center">
                <HiOutlineUser size={22} />
              </div>

              <span className="hidden md:block font-bold text-[15px]">
                Perfil
              </span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="
              w-full
              flex items-center gap-4
              px-4 py-3.5
              rounded-2xl
              text-white
              hover:bg-red-900/40
              transition-all duration-300
              group
            "
          >
            <div
              className="
                min-w-[42px] h-[42px]
                rounded-xl
                bg-red-900/30
                flex items-center justify-center
                group-hover:scale-110
                transition-all
              "
            >
              <FiLogOut size={20} />
            </div>

            <span className="hidden md:block font-bold text-[15px]">
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}