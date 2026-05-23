import React from "react";
import { motion } from "framer-motion";
import {
  FaUser, FaMapMarkerAlt, FaPhone, FaCreditCard, FaCalendarAlt,
  FaUserTie, FaShoppingCart, FaCheckCircle, FaTag, FaBox,
} from "react-icons/fa";
import { FiSave } from "react-icons/fi";

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
      <Icon className="text-[#D3423E]" size={13} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-semibold truncate ${highlight ? "text-[#D3423E]" : "text-gray-900"}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

const OrderDetailsComponent = ({
  selectedCliente,
  formData,
  vendedores,
  calcularFechaPago,
  cart,
  calcularTotal,
  handleSubmit,
}) => {
  const totalDescuentos = cart.reduce(
    (sum, item) => sum + item.quantity * (item.discount || 0),
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalFinal = calcularTotal(cart);

  const vendedorObj = vendedores.find((v) => v._id === formData.vendedor);
  const vendedorNombre = vendedorObj
    ? `${vendedorObj.fullName || ""} ${vendedorObj.lastName || ""}`.trim()
    : "—";

  const fechaPago = formData.tipoPago === "Crédito" && formData.plazoCredito
    ? calcularFechaPago(formData.creationDate, formData.plazoCredito)
    : null;

  return (
    <div className="flex flex-col lg:flex-row w-full justify-center gap-6 mt-4">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="lg:w-2/6 w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="bg-gradient-to-br from-[#D3423E] to-red-700 text-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FaUser className="text-white" size={16} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Detalles del Cliente</h3>
              <p className="text-xs text-red-100 mt-0.5">
                Resumen del pedido a registrar
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <InfoRow
            icon={FaUser}
            label="Nombre del cliente"
            value={selectedCliente?.label}
          />
          <InfoRow
            icon={FaMapMarkerAlt}
            label="Dirección"
            value={formData.direccion}
          />
          <InfoRow
            icon={FaPhone}
            label="Teléfono"
            value={formData.telefono}
          />
          <InfoRow
            icon={FaUserTie}
            label="Vendedor asignado"
            value={vendedorNombre}
          />

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
              Información de pago
            </p>

            <div className="space-y-4">
              <InfoRow
                icon={FaCreditCard}
                label="Tipo de pago"
                value={formData.tipoPago === "Crédito" ? "Crédito" : "Contado"}
                highlight
              />

              {formData.tipoPago === "Crédito" && (
                <>
                  <InfoRow
                    icon={FaCalendarAlt}
                    label="Plazo de crédito"
                    value={formData.plazoCredito}
                  />

                  {fechaPago && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
                      <FaCalendarAlt className="text-orange-600 mt-0.5 shrink-0" size={12} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide mb-0.5">
                          Fecha límite de pago
                        </p>
                        <p className="text-sm font-bold text-orange-900">
                          {fechaPago.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="lg:w-4/6 w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
      >
        <div className="bg-gradient-to-br from-[#D3423E] to-red-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FaShoppingCart className="text-white" size={16} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Productos seleccionados</h3>
                <p className="text-xs text-red-100 mt-0.5">
                  {cart.length} producto{cart.length !== 1 ? "s" : ""} · {totalItems} unidad{totalItems !== 1 ? "es" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex-grow flex flex-col">
          {cart.length > 0 ? (
            <>
              <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-xl mb-2">
                <div className="col-span-5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  Producto
                </div>
                <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-center">
                  Cantidad
                </div>
                <div className="col-span-1 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-right">
                  Precio
                </div>
                <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-right">
                  Descuento
                </div>
                <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide text-right">
                  Total
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {cart.map((item, index) => {
                  const subtotal = item.quantity * (item.price - (item.discount || 0));
                  const hasDiscount = item.discount && item.discount > 0;

                  return (
                    <div
                      key={index}
                      className={`relative border ${hasDiscount ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-white hover:bg-gray-50"} rounded-xl p-3 transition-colors`}
                    >
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 flex items-center gap-3 min-w-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                              <FaBox className="text-gray-400" size={16} />
                            </div>
                          )}
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {item.productName}
                          </p>
                        </div>

                        <div className="col-span-2 text-center">
                          <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                        </div>

                        <div className="col-span-1 text-right">
                          <p className="text-sm text-gray-700 font-medium">
                            Bs. {Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="col-span-2 text-right">
                          {hasDiscount ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-lg">
                              <FaTag size={9} />
                              Bs. {item.discount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>

                        <div className="col-span-2 text-right">
                          <p className="text-sm font-black text-gray-900">
                            Bs. {subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="md:hidden flex gap-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <FaBox className="text-gray-400" size={18} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md font-bold text-gray-700">
                              x{item.quantity}
                            </span>
                            <span className="text-gray-600">Bs. {Number(item.price).toFixed(2)}</span>
                            {hasDiscount && (
                              <span className="text-orange-700 font-bold">
                                -Bs. {item.discount.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-black text-gray-900 mt-1">
                            Bs. {subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-5 border-t-2 border-dashed border-gray-200 space-y-2">
                {totalDescuentos > 0 && (
                  <div className="flex justify-between items-center px-3">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaTag className="text-orange-600" size={11} />
                      Total descuentos aplicados
                    </span>
                    <span className="text-sm font-bold text-orange-700">
                      − Bs. {totalDescuentos.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="bg-gradient-to-br from-[#D3423E] to-red-700 rounded-2xl p-5 flex justify-between items-center shadow-md">
                  <div>
                    <p className="text-[10px] font-bold text-red-100 uppercase tracking-wide">
                      Total a cobrar
                    </p>
                    <p className="text-xs text-red-100 mt-0.5">
                      {totalItems} unidad{totalItems !== 1 ? "es" : ""} · {cart.length} producto{cart.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-3xl font-black text-white">
                    Bs. {totalFinal}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <FaShoppingCart size={28} />
              </div>
              <p className="text-sm font-bold text-gray-600">
                No hay productos seleccionados
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Vuelve atrás y agrega productos al carrito
              </p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0}
              className={`w-full px-6 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                cart.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#D3423E] to-red-700 text-white hover:shadow-lg active:scale-95"
              }`}
            >
              <FiSave size={16} />
              Guardar pedido
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailsComponent;