import { HiLocationMarker, HiUserGroup, HiCurrencyDollar } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function Sidebars() {
  return (
    <div className="h-screen w-64 fixed top-0 left-0 bg-[#D3423E] overflow-y-auto">
      <div className="px-0 py-0">
      <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4 first:mt-0 first:border-t-0 first:pt-0 text-white">
      <Link to="/sales">
            <li>
              <div className="flex items-center justify-center mt-10 p-2 text-xl dark:text-white dark:hover:bg-gray-700 font-bold text-white hover:text-red-700 hover:mx-4  hover:shadow-lg hover:bg-white rounded-md px-0 py-0">
                <span className="flex-1 whitespace-nowrap px-3">
                IMCABEZ S.R.L.
                </span>
                </div>
            </li>

            </Link>
            <li >
            <Link to="/client" className="flex mt-20 mb-6 items-center justify-center text-lg dark:text-white dark:hover:bg-gray-700 font-bold text-white hover:text-red-700 hover:shadow-lg  hover:mx-4 hover:my-4 hover:bg-white rounded-md px-0 py-0">
                <HiUserGroup className="hover:text-white ml-10" />
                <span className="flex-1 whitespace-nowrap px-3">
                  Clientes
                </span>
              </Link>
            </li>
            <li >
            <Link to="" className="flex mt-6 mb-4 items-center justify-center text-lg dark:text-white dark:hover:bg-gray-700 font-bold text-white hover:text-red-700 hover:shadow-lg  hover:mx-4 hover:my-4 hover:bg-white rounded-md px-0 py-0">
              <HiCurrencyDollar className="hover:text-white ml-10" />
                <span className="flex-1 whitespace-nowrap px-3">
                  Finanzas
                </span>
              </Link>
            </li>
            <li >
            <Link to="/inventary" className="flex mt-6 mb-4 items-center justify-center text-lg dark:text-white dark:hover:bg-gray-700 font-bold text-white hover:text-red-700 hover:shadow-lg  hover:mx-4 hover:my-4 hover:bg-white rounded-md px-0 py-0">
              <HiCurrencyDollar className="hover:text-white ml-10" />
                <span className="flex-1 whitespace-nowrap px-3">
                  Inventario
                </span>
              </Link>
            </li>
            <li >
            <Link to="/localization" className="flex mt-6 mb-6 items-center justify-center text-lg dark:text-white dark:hover:bg-gray-700 font-bold text-white hover:text-red-700 hover:shadow-lg  hover:mx-4 hover:my-4 hover:bg-white rounded-md px-0 py-0">
              <HiLocationMarker className="hover:text-white ml-10" />
                <span className="flex-1 whitespace-nowrap px-3">
                  Localización
                </span>
              </Link>
            </li>
            <li >
            <Link to="/order" className="flex mt-6 mb-6 items-center justify-center  text-lg dark:text-white dark:hover:bg-gray-700 font-bold text-white hover:text-red-700 hover:shadow-xl  hover:mx-4 hover:bg-white rounded-md px-0 py-0">
              <HiCurrencyDollar className="hover:text-white ml-10" />
                <span className="flex-1 whitespace-nowrap px-3">
                  Ventas
                </span>
              </Link>
            </li>
           
            
           
          </ul>
        </div>      
      </div>
  );
}
