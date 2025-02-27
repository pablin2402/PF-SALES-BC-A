import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const ClientPaymentDialog = ({ isOpen, onClose, onSave, totalDebt,orderId,idClient,salesID }) => {
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payer: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData({ ...paymentData, [name]: value });
    };

    const handleSavePayment = async () => {
        console.log(orderId, idClient);
        try {
            await axios.post(API_URL+"/whatsapp/order/pay", {
              saleImage: "",
              total: paymentData.amount,
              orderId: orderId,
              id_owner:"CL-01",
              numberOrden:"",
              paymentStatus:"paid",
              id_client: idClient,
              sales_id: salesID,
              note: paymentData.payer 
            });
            onSave(); 
            setPaymentData({ amount: '', payer: '' });
            onClose(); 
        } catch (error) {
            console.error("Error al registrar el pago", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-xl text-left text-gray-900 font-bold mb-4">Registrar Pago</h3>

                <div className="mb-4">
                    <p className="text-left text-xl text-gray-900 mb-4">Saldo en Bs. {totalDebt.toFixed(2)}</p>
                    <label htmlFor="amount" className="text-m text-left block text-gray-700">Importe</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={paymentData.amount}
                        onChange={handleInputChange}
                        className="mt-2 hover:border-[#D3423E] text-gray-900 border-gray-900 focus:outline-none focus:ring-0 w-full px-4 py-2 border rounded-md"
                        placeholder="Ingrese el importe"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="payer" className="text-m block text-left text-gray-700">Quién paga</label>
                    <input
                        type="text"
                        id="payer"
                        name="payer"
                        value={paymentData.payer}
                        onChange={handleInputChange}
                        className="mt-2 hover:border-[#D3423E] text-gray-900 border-gray-900 focus:outline-none focus:ring-0 w-full px-4 py-2 border rounded-md"
                        placeholder="Ingrese el nombre del pagador"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-lg text-[#D3423E] font-bold rounded-lg hover:bg-[#D3423E] hover:text-white"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSavePayment}
                        className="px-4 py-2 text-lg bg-[#D3423E] text-white font-bold rounded-lg hover:bg-[#FF9C99] hover:text-gray-900"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientPaymentDialog;
