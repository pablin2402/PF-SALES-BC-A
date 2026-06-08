import React from "react";
import { FaChartLine } from "react-icons/fa";
import { HiOutlineChartBar, HiOutlineDotsVertical } from "react-icons/hi";
import VentasChart from "../../Components/charts/VentasChart";
import TrendLineChart from "../../Components/charts/TrendLineChart";
import { TrendChartSkeleton } from "./HomeSkeleton";

export const HomeCharts = ({ labels, values, selectedYear, currentMonthLabel, products, loadingPredict, navigate }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><HiOutlineChartBar className="text-[#D3423E]" />Productos más vendidos</h3>
          <p className="text-xs text-gray-500 mt-0.5">{currentMonthLabel} {selectedYear}</p>
        </div>
        <button onClick={() => navigate("/stadistics")} className="p-2 text-gray-400 hover:text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors"><HiOutlineDotsVertical size={20} /></button>
      </div>
      <VentasChart labels={labels} values={values} year={selectedYear} />
    </div>

    <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FaChartLine className="text-[#D3423E]" />Tendencia de productos</h3>
          <p className="text-xs text-gray-500 mt-0.5">Análisis predictivo</p>
        </div>
        <button onClick={() => navigate("/stadistics")} className="p-2 text-gray-400 hover:text-[#D3423E] hover:bg-red-50 rounded-lg transition-colors"><HiOutlineDotsVertical size={20} /></button>
      </div>
      {loadingPredict ? <TrendChartSkeleton /> : <TrendLineChart products={products} limit={5} />}
    </div>
  </div>
);