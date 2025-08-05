import React from "react";
import PrincipalBUtton from "../LittleComponents/PrincipalButton";

const OrderDetailsComponent = ({ selectedCliente, formData, vendedores, calcularFechaPago, cart, calcularTotal, handleSubmit }) => {
  return (
    <div className="flex flex-col md:flex-row w-full justify-center gap-6 mt-4">
    <div className="md:w-2/6 w-full p-6 bg-white border border-black rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Detalles del Cliente</h3>
      <div className="grid gap-4">
        <div>
          <p className="text-gray-900 text-left font-medium">Nombre:</p>
          <p className="text-gray-700 text-left">{selectedCliente?.label || "No seleccionado"}</p>
        </div>
        <div>
          <p className="text-gray-900 font-medium text-left">Dirección:</p>
          <p className="text-gray-700 text-left">{formData.direccion || "No disponible"}</p>
        </div>
        <div>
          <p className="text-gray-900 font-medium text-left">Teléfono:</p>
          <p className="text-gray-700 text-left">{formData.telefono || "No disponible"}</p>
        </div>
        <div>
          <p className="text-gray-900 font-medium text-left">Tipo de Pago:</p>
          <p className="text-gray-700 text-left">
            {formData.tipoPago === "Crédito" ? "Crédito" : "Contado"}
          </p>
        </div>
        {formData.tipoPago === "Crédito" && (
          <div>
            <p className="text-gray-900 font-medium text-left">Plazo de Crédito:</p>
            <p className="text-gray-700 text-left">{formData.plazoCredito || "No seleccionado"}</p>
            <p className="text-gray-900 font-medium text-left">Fecha de Pago:</p>
            <p className="text-gray-700 text-left">
              {calcularFechaPago(formData.creationDate, formData.plazoCredito).toLocaleDateString()}
            </p>
          </div>
        )}
        <div>
          <p className="text-gray-900 font-medium text-left">Vendedor:</p>
          <p className="text-gray-700 text-left">
            {vendedores.find((v) => v._id === formData.vendedor) || "No seleccionado"}{" "}
          </p>
        </div>
      </div>
    </div>
  
    <div className="md:w-4/6 w-full p-6 bg-white border border-black rounded-lg shadow-lg flex flex-col">
      <h3 className="text-left text-lg font-bold text-gray-900 mb-4">Productos Seleccionados</h3>
      <form className="flex flex-col flex-grow">
        <div className="grid gap-4 flex-grow">
          <div className="flex justify-between px-2 py-2 border-b font-bold text-gray-900">
            <span className="w-1/4 text-left">Producto</span>
            <span className="w-1/6 text-center">Cantidad</span>
            <span className="w-1/6 text-center">Precio</span>
            <span className="w-1/6 text-center">Descuento</span>
            <span className="w-1/6 text-center">Total</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {cart.length > 0 ? (
              cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b">
                  <div className="w-1/4 flex items-center gap-2">
                    <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg" />
                    <span className="text-gray-900">{item.productName}</span>
                  </div>
                  <p className="text-gray-900 text-center w-1/6">{item.quantity}</p>
                  <p className="text-gray-900 text-center w-1/6">Bs. {item.price}</p>
                  <p className="text-gray-900 text-center w-1/6">Bs. {item.discount ? item.discount.toFixed(2) : "0.00"}</p>
                  <p className="text-gray-900 text-center w-1/6 font-bold">
                    Bs. {(item.quantity * (item.price - (item.discount || 0))).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-700">No hay productos seleccionados.</p>
            )}
          </div>
          <hr className="h-px my-8 bg-gray-300 border-0 " />
          <h3 className="text-lg text-gray-900 font-bold text-right">
            Total Descuentos: Bs. {cart.reduce((sum, item) => sum + item.quantity * (item.discount || 0), 0).toFixed(2)}
          </h3>
          <h3 className="mt-auto mb-4 text-lg text-gray-900 font-bold text-right mt-3">
            Total: Bs. {calcularTotal(cart)}
          </h3>
        </div>
      </form>
      <PrincipalBUtton onClick={handleSubmit}>GUARDAR</PrincipalBUtton>
    </div>
  </div>
  
  );
};
export default OrderDetailsComponent;
