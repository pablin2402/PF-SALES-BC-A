import React from "react";
import { motion } from "framer-motion";
import { FaChartBar, FaBrain } from "react-icons/fa";
import { useStatistics } from "../hooks/useStatistics";
import { StatsKPIRow } from "../Components/statistics/StatsKPIRow";
import { StatsFilters } from "../Components/statistics/StatsFilters";
import { StatsChartsRow } from "../Components/statistics/StatsChartsRows";
import { StatsProductTable } from "../Components/statistics/StatsProductTable";
import { StatsPredictionTable } from "../Components/statistics/StatsPredictionTable";

const StatisticsView = () => {
  const st = useStatistics();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white min-h-screen p-4 sm:p-6">
      <style>{`
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="max-w-[1500px] mx-auto">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#D3423E] to-red-700 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-red-200">
              <FaChartBar className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 leading-tight">Análisis de ventas</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium flex items-center gap-1.5">
                <FaBrain className="text-purple-500" size={12} />
                Predicción en tiempo real con XGBoost ML
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold">Modelo activo</span>
          </div>
        </motion.div>

        <StatsKPIRow
          totalUnidades={st.totalUnidades}
          items={st.items}
          topProducto={st.topProducto}
          selectedYear={st.selectedYear}
          mesLabel={st.mesLabel}
          avgUnidades={st.avgUnidades}
          totalForecast={st.totalForecast}
        />

        <StatsFilters
          years={st.years}
          selectedYear={st.selectedYear}
          setSelectedYear={st.setSelectedYear}
          selectedMonth={st.selectedMonth}
          setSelectedMonth={st.setSelectedMonth}
          onExport={st.exportToExcel}
          onRefresh={() => { st.setPage(1); }}
          loadingStats={st.loadingStats}
        />

        <StatsChartsRow
          labels={st.labels}
          values={st.values}
          selectedYear={st.selectedYear}
          products={st.products}
          loadingStats={st.loadingStats}
          loadingPredict={st.loadingPredict}
        />

        <StatsProductTable
          salesData={st.salesData}
          loadingStats={st.loadingStats}
          items={st.items}
          page={st.page}
          setPage={st.setPage}
          totalPages={st.totalPages}
          itemsPerPage={st.itemsPerPage}
          setItemsPerPage={st.setItemsPerPage}
        />

        <StatsPredictionTable
          products={st.products}
          loadingPredict={st.loadingPredict}
          getNextMonthLabel={st.getNextMonthLabel}
        />
      </div>
    </div>
  );
};

export default StatisticsView;