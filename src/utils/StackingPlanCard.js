import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBoxes, FaWineBottle, FaArrowDown, FaInfoCircle, FaChevronDown, FaUser } from "react-icons/fa";

const BoxDetail = ({ box, idx, color, type }) => {
  const [expanded, setExpanded] = useState(false);

  if (type === "mixed") {
    return (
      <motion.div
        layout
        className="bg-white rounded-lg border border-blue-200 overflow-hidden"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-2 flex items-center gap-2 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-gray-900">
              Caja mixta #{idx + 1}
            </p>
            <p className="text-[10px] text-gray-500">
              {box.totalBottles} botella{box.totalBottles !== 1 ? "s" : ""} · {box.contents.length} producto{box.contents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <FaChevronDown
            className={`text-blue-500 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
            size={10}
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-2 pt-0 space-y-1 bg-blue-50/30">
                {box.contents.map((content, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-white rounded border border-blue-100"
                  >
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-black shrink-0">
                      {content.bottles}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-900 truncate">
                        {content.producto}
                      </p>
                      <p className="text-[9px] text-gray-500 flex items-center gap-1 truncate">
                        <FaUser size={7} />
                        {content.cliente} · #{content.receiveNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 p-2 bg-white rounded-lg border"
      style={{ borderColor: `${color}40` }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-black shrink-0"
        style={{ backgroundColor: color }}
      >
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-900 truncate">
          {box.producto}
        </p>
        <p className="text-[9px] text-gray-500 flex items-center gap-1 truncate">
          <FaUser size={7} />
          {box.cliente} · #{box.receiveNumber}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-black text-gray-700">{box.bottles}</p>
        <p className="text-[8px] text-gray-400">botellas</p>
      </div>
    </div>
  );
};

const LayerSection = ({ layer, type, tripColor, layerColor, layerBg, layerBorder, label }) => {
  const [expanded, setExpanded] = useState(false);

  if (layer.count === 0) return null;

  return (
    <div className={`${layerBg} border-2 ${layerBorder} rounded-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: layerColor }}
          >
            {type === "mixed" ? <FaWineBottle size={13} /> : <FaBoxes size={14} />}
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-gray-900">
              {layer.count} {label}
            </p>
            <p className="text-[10px] text-gray-600">
              {type === "mixed"
                ? `${layer.looseBottles} botellas sueltas`
                : `${layer.bottlesPerUnit} botellas c/u · ${layer.totalBottles} total`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase">
            {expanded ? "Ocultar" : "Ver detalle"}
          </span>
          <FaChevronDown
            className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            size={11}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-1.5 max-h-72 overflow-y-auto">
              {layer.boxes.map((box, idx) => (
                <BoxDetail
                  key={idx}
                  box={box}
                  idx={idx}
                  color={layerColor}
                  type={type}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StackingPlanCard = ({ stackingPlan, tripColor = "#D3423E", compact = false }) => {
  if (!stackingPlan) return null;

  const { bottom, middle, top, totalPhysicalBoxes, totalBottles } = stackingPlan;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px]">
        {bottom.count > 0 && (
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md font-bold text-gray-700">
            <FaBoxes size={9} /> {bottom.count}×12
          </span>
        )}
        {middle.count > 0 && (
          <span className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-md font-bold text-yellow-800">
            <FaBoxes size={9} /> {middle.count}×6
          </span>
        )}
        {top.looseBottles > 0 && (
          <span className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-md font-bold text-blue-800">
            <FaWineBottle size={9} /> {top.looseBottles}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <FaBoxes size={11} style={{ color: tripColor }} />
            Plan de apilado
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {totalPhysicalBoxes} cajas físicas · {totalBottles} botellas
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: tripColor }}>{totalPhysicalBoxes}</p>
          <p className="text-[9px] text-gray-500 uppercase font-bold">cajas</p>
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
          <FaArrowDown size={9} />
          Orden de carga
        </div>
      </div>

      <div className="space-y-1.5">
        <LayerSection
          layer={top}
          type="mixed"
          tripColor={tripColor}
          layerColor="#3B82F6"
          layerBg="bg-gradient-to-r from-blue-100 to-blue-50"
          layerBorder="border-blue-300 border-dashed"
          label={`caja${top.count !== 1 ? "s" : ""} mixta${top.count !== 1 ? "s" : ""}`}
        />

        <LayerSection
          layer={middle}
          type="half"
          tripColor={tripColor}
          layerColor="#EAB308"
          layerBg="bg-gradient-to-r from-yellow-100 to-yellow-50"
          layerBorder="border-yellow-400"
          label={`media${middle.count !== 1 ? "s" : ""} caja${middle.count !== 1 ? "s" : ""}`}
        />

        <LayerSection
          layer={bottom}
          type="full"
          tripColor={tripColor}
          layerColor="#374151"
          layerBg="bg-gradient-to-r from-gray-200 to-gray-100"
          layerBorder="border-gray-500"
          label={`caja${bottom.count !== 1 ? "s" : ""} cerrada${bottom.count !== 1 ? "s" : ""}`}
        />

        {totalPhysicalBoxes === 0 && (
          <div className="text-center py-4 text-gray-400 text-xs">
            Sin carga asignada
          </div>
        )}
      </div>

      {totalPhysicalBoxes > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-start gap-2 text-[10px] text-gray-600">
          <FaInfoCircle className="text-blue-600 mt-0.5 shrink-0" size={10} />
          <p>
            Las cajas cerradas (12) van <strong>abajo</strong> por estabilidad, las medias cajas (6) al <strong>medio</strong> y las sueltas <strong>arriba</strong>. Click en cada nivel para ver qué productos van en cada caja.
          </p>
        </div>
      )}
    </div>
  );
};

export default StackingPlanCard;