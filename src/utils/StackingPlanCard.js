import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaWineBottle, FaUser } from "react-icons/fa";

const BOXES_PER_LEVEL = 16;
const TOTAL_LEVELS = 5;

export default function StackingPlanCard({ stackingPlan, tripColor = "#D3423E" }) {
  const [expanded, setExpanded] = useState(false);
  if (!stackingPlan) return null;

  const fullBoxes    = stackingPlan.bottom?.count      || 0;
  const halfBoxes    = stackingPlan.middle?.count      || 0;
  const mixedBoxes   = stackingPlan.top?.count         || 0;
  const looseBottles = stackingPlan.top?.looseBottles  || 0;
  const totalBottles = stackingPlan.totalBottles       || 0;
  const totalBoxes   = stackingPlan.totalPhysicalBoxes || (fullBoxes + halfBoxes + mixedBoxes);
  const topBoxes     = stackingPlan.top?.boxes         || [];

  const TYPES = {
    full:  "#1f2937",
    half:  "#f59e0b",
    mixed: tripColor,
    empty: "#e5e7eb",
  };

  const sequence = [
    ...Array(fullBoxes).fill("full"),
    ...Array(halfBoxes).fill("half"),
    ...Array(mixedBoxes).fill("mixed"),
  ];

  const levels = [];
  for (let lvl = 0; lvl < TOTAL_LEVELS; lvl++) {
    const start = lvl * BOXES_PER_LEVEL;
    const cells = [];
    for (let i = 0; i < BOXES_PER_LEVEL; i++) cells.push(sequence[start + i] || "empty");
    cells.reverse();
    levels.push(cells);
  }
  levels.reverse();

  const usedLevels = Math.ceil(totalBoxes / BOXES_PER_LEVEL) || 0;
  const fillPct = Math.round((totalBoxes / (TOTAL_LEVELS * BOXES_PER_LEVEL)) * 100);

  const getBoxContents = (box) => {
    if (Array.isArray(box?.contents)) return box.contents;
    if (box?.producto) return [box];
    return [];
  };

  return (
    <div className="space-y-2">
      <div
        className="rounded-xl border-2 p-3"
        style={{ borderColor: `${tripColor}35`, backgroundColor: `${tripColor}08` }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-black text-gray-700 uppercase tracking-wide">
            🚚 Apilado en camión
          </p>
          <span
            className="text-[11px] font-black px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: tripColor }}
          >
            {totalBoxes}/80 cajas
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-2.5 mb-2.5">
          <div className="flex flex-col gap-1">
            {levels.map((cells, idx) => {
              const levelNum = TOTAL_LEVELS - idx;
              const hasBoxes = cells.some((c) => c !== "empty");
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className={`text-[8px] font-black w-3 text-right ${hasBoxes ? "text-gray-700" : "text-gray-300"}`}>
                    {levelNum}
                  </span>
                  <div className="flex-1 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${BOXES_PER_LEVEL}, 1fr)` }}>
                    {cells.map((type, ci) => (
                      <motion.div
                        key={ci}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (idx * 4 + ci) * 0.006, duration: 0.2 }}
                        className="rounded-sm"
                        style={{
                          aspectRatio: "1",
                          backgroundColor: TYPES[type],
                          border: type === "empty" ? "1px dashed #d1d5db" : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-[9px] font-bold text-gray-500 uppercase">Base ↓ · Techo ↑</span>
            <span className="text-[9px] font-bold text-gray-500">{usedLevels} de {TOTAL_LEVELS} niveles · {fillPct}%</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {fullBoxes > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#1f2937" }} />
              <span className="text-[10px] font-bold text-gray-600">{fullBoxes} ×12</span>
            </div>
          )}
          {halfBoxes > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-[10px] font-bold text-gray-600">{halfBoxes} ×6</span>
            </div>
          )}
          {mixedBoxes > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: tripColor }} />
              <span className="text-[10px] font-bold text-gray-600">{mixedBoxes} mixtas</span>
            </div>
          )}
          {looseBottles > 0 && (
            <span className="text-[10px] font-bold text-gray-600">🍾 {looseBottles} sueltas</span>
          )}
          <span className="text-[10px] font-bold text-gray-400 ml-auto">{totalBottles} bot.</span>
        </div>
      </div>

      {topBoxes.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
              Contenido de cajas mixtas ({topBoxes.length})
            </span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <FaChevronDown className="text-gray-400" size={10} />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1.5 space-y-2"
              >
                {topBoxes.map((box, i) => {
                  const contents = getBoxContents(box);
                  const boxBottles = contents.reduce((s, c) => s + (Number(c.bottles) || 0), 0);
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div
                        className="flex items-center gap-2 px-3 py-2"
                        style={{ backgroundColor: `${tripColor}10` }}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                          style={{ backgroundColor: tripColor }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-xs font-black text-gray-800 flex-1">Caja {i + 1}</p>
                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                          <FaWineBottle size={9} /> {boxBottles}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {contents.length > 0 ? contents.map((item, ci) => (
                          <div key={ci} className="px-3 py-2 flex items-start gap-2">
                            <span
                              className="mt-0.5 text-[10px] font-black px-1.5 py-0.5 rounded text-white flex-shrink-0"
                              style={{ backgroundColor: tripColor }}
                            >
                              {item.bottles}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-800 leading-tight">{item.producto || "Producto"}</p>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <FaUser size={7} className="text-gray-400" />
                                {item.cliente || "Cliente"}
                                {item.receiveNumber && <span className="text-gray-400">· #{item.receiveNumber}</span>}
                              </p>
                            </div>
                          </div>
                        )) : (
                          <p className="px-3 py-2 text-[10px] text-gray-400 italic">Sin detalle de contenido</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}