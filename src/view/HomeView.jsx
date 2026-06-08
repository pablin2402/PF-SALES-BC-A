import React from "react";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

import { useHome } from "../hooks/useHome";
import { HomeStats } from "../Components/home/HomeStats";
import { HomeSellersSection } from "../Components/home/HomeSellersSection";
import { HomeCharts } from "../Components/home/HomeCharts";
import { HomeSkeleton } from "../Components/home/HomeSkeleton";
import ObjectiveSalesManComponent from "../Components/ObjectiveComponent/ObjectiveSalesManComponent";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const HomeView = () => {
  const navigate = useNavigate();
  const h = useHome();

  return (
    <div className="bg-gray-50 w-full min-h-screen p-4 sm:p-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">
            Reporte de ventas · {h.filterType === "monthYear" ? `${h.currentMonthLabel} ${h.selectedYear}` : `${h.startDate || "..."} → ${h.endDate || "..."}`}
          </p>
        </div>

        {h.loading ? <HomeSkeleton /> : h.error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-bold">{h.error}</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <HomeStats
              totalOrdersSum={h.totalOrdersSum}
              totalAmountSum={h.totalAmountSum}
              averageTicket={h.averageTicket}
              numberOfOrdersNew={h.numberOfOrdersNew}
            />

            <HomeSellersSection
              salesBySeller={h.salesBySeller}
              totalAmountSum={h.totalAmountSum}
              filterType={h.filterType}
              setFilterType={h.setFilterType}
              selectedYear={h.selectedYear}
              setSelectedYear={h.setSelectedYear}
              selectedMonth={h.selectedMonth}
              setSelectedMonth={h.setSelectedMonth}
              years={h.years}
              startDate={h.startDate}
              setStartDate={h.setStartDate}
              endDate={h.endDate}
              setEndDate={h.setEndDate}
              fetchOrders={h.fetchOrders}
              exportToExcel={h.exportToExcel}
              topSeller={h.topSeller}
            />

            <HomeCharts
              labels={h.labels}
              values={h.values}
              selectedYear={h.selectedYear}
              currentMonthLabel={h.currentMonthLabel}
              products={h.products}
              loadingPredict={h.loadingPredict}
              navigate={navigate}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <ObjectiveSalesManComponent region="TOTAL CBB" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;