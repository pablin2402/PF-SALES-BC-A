import React, { useMemo } from "react";

export const ModernPagination = ({ page, totalPages, onChange }) => {
  const visiblePages = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, totalPages];
    if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, page - 1, page, page + 1, totalPages];
  }, [page, totalPages]);

  return (
    <nav className="flex items-center gap-1">
      <button
        onClick={() => onChange(1)}
        disabled={page === 1}
        className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
        title="Primera"
      >
        ‹‹
      </button>
      <button
        onClick={() => onChange(Math.max(page - 1, 1))}
        disabled={page === 1}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
      >
        ← Anterior
      </button>
      {visiblePages.map((num, idx) => {
        const isGap = idx > 0 && num - visiblePages[idx - 1] > 1;
        return (
          <React.Fragment key={num}>
            {isGap && <span className="text-gray-400 px-1">…</span>}
            <button
              onClick={() => onChange(num)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === num ? "bg-gradient-to-br from-[#D3423E] to-red-700 text-white shadow-sm" : "text-gray-700 hover:bg-gray-200"}`}
            >
              {num}
            </button>
          </React.Fragment>
        );
      })}
      <button
        onClick={() => onChange(Math.min(page + 1, totalPages))}
        disabled={page === totalPages}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
      >
        Siguiente →
      </button>
      <button
        onClick={() => onChange(totalPages)}
        disabled={page === totalPages}
        className={`px-2 h-9 rounded-lg text-xs font-bold transition-colors ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"}`}
        title="Última"
      >
        ››
      </button>
    </nav>
  );
};

 