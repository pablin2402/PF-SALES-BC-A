import React from "react";
import { ModernPagination } from "../../utils/ModernPagination";

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];

const DeliveryFooter = ({
  shown, total,
  itemsPerPage, onItemsPerPageChange,
  page, totalPages, onPageChange,
  showPagination,
}) => (
  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span>
        Mostrando <strong className="text-gray-900">{shown}</strong> de <strong className="text-gray-900">{total}</strong> repartidores
      </span>
      <div className="h-4 w-px bg-gray-300"></div>
      <div className="flex items-center gap-2">
        <label htmlFor="itemsPerPage" className="font-semibold">Mostrar:</label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="app-select"
        >
          {ITEMS_PER_PAGE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>

    {showPagination && (
      <ModernPagination page={page} totalPages={totalPages} onChange={onPageChange} />
    )}
  </div>
);

export default DeliveryFooter;