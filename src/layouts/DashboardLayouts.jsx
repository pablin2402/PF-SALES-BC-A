import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const DashboardLayout = () => {
    const [role, setRole] = useState("");
    useEffect(() => {
        const userRole = localStorage.getItem("role");
        setRole(userRole);
      }, []);
    
      const isAdmin = role === "ADMIN";
    
    return (
        <div>
            <nav className="bg-white border-gray-200 border-b-2 border-black-400">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    </a>
                    <button data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                    <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                        <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white">
                            <li>
                                <a href="/stadistics" className="block py-2 px-3 text-m md:hover:text-lg font-bold text-[#3A3737] rounded-sm md:bg-transparent md:p-0 md:hover:text-[#D3423E]">
                                    Análisis de ventas
                                </a>
                            </li>
                            {isAdmin && (
                            <li>
                                <a href="/category" className="block py-2 text-m px-3 text-[#3A3737] md:hover:text-lg font-bold rounded-sm md:p-0 md:hover:text-[#D3423E]">Categoria</a>
                            </li>
                             )}
                            <li>
                                <a href="/order" className="block py-2 px-3 text-m text-[#3A3737] md:hover:text-lg font-bold rounded-sm md:p-0 md:hover:text-[#D3423E]">Pedidos</a>
                            </li>
                            {isAdmin && (
                            <li>
                                <a href="/product" className="block py-2 px-3 text-m font-bold text-[#3A3737] md:hover:text-lg rounded-sm md:bg-transparent md:p-0 md:hover:text-[#D3423E]">
                                    Productos
                                </a>
                            </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
            <div className="p-6">
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
