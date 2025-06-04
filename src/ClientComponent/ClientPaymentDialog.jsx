import { useState } from 'react';
import axios from 'axios';
import { API_URL, CONTRACT_DIRECTION } from '../config';
import PagoRegistroABI from "../contracts/PagoRegistro.json"
import { ethers } from 'ethers';

const ClientPaymentDialog = ({ isOpen, onClose, onSave, totalPaid,totalGeneral,orderId,idClient,salesID }) => {
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payer: ''
    });
    const [file, setFile] = useState(null);
    const [amountError, setAmountError] = useState('');
    const total = totalGeneral - totalPaid;
    const user = localStorage.getItem("id_owner");
    const token = localStorage.getItem("token");
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "amount") {
            const numericValue = parseFloat(value);
            if (numericValue > total) {
                setAmountError(`El monto no puede ser mayor a Bs. ${total.toFixed(2)}`);
            } else {
                setAmountError('');
            }
        }
    
        setPaymentData({ ...paymentData, [name]: value });
    };
    
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
      };
      
const registrarPagoEnBlockchain = async (orderId, payer, amount) => {
    try {
        if (!window.ethereum) {
            alert("MetaMask no está disponible");
            return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.BrowserProvider(window.ethereum); 
        const signer = await provider.getSigner();
        const contrato = new ethers.Contract(CONTRACT_DIRECTION, PagoRegistroABI, signer);

        const tx = await contrato.registrarPago(orderId, payer, ethers.parseUnits(amount.toString(), 0));
        await tx.wait();

        console.log("✅ Pago registrado en blockchain:", tx.hash);
    } catch (error) {
        console.error("❌ Error al registrar pago en blockchain:", error);
    }
};
    const handleSavePayment = async () => {
        try {
            const formData = new FormData();
            formData.append("saleImage", file);
            formData.append("total", paymentData.amount);
            formData.append("note", paymentData.payer);
            formData.append("orderId", orderId);
            formData.append("numberOrden", "");
            formData.append("paymentStatus", "paid");
            formData.append("id_client", idClient);
            formData.append("sales_id", salesID);
            formData.append("id_owner", user);
        
            await axios.post(API_URL + "/whatsapp/order/pay", formData, {
              headers: { "Content-Type": "multipart/form-data",     
                        Authorization: `Bearer ${token}`
            },
            });
            await registrarPagoEnBlockchain(orderId, paymentData.payer, paymentData.amount);

            onSave();
            setPaymentData({ amount: '', payer: '' });
            setFile(null);
            onClose();
          } catch (error) {
            console.error("Error al registrar el pago", error);
          }
    };

    if (!isOpen) return null;
    const numericAmount = parseFloat((paymentData.amount || '').replace(',', '.').trim());
    const isSaveDisabled =
        numericAmount > total

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-2xl text-left text-gray-900 font-bold mb-4">Registrar Pago</h3>

                <div className="mb-4">
                    <p className="text-left text-m text-gray-900 mb-4">Saldo por pagar Bs. {total.toFixed(2)}</p>
                    <label htmlFor="amount" className="text-m font-bold text-left block text-gray-700">Importe</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={paymentData.amount}
                        onChange={handleInputChange}
                        max={total}
                        className={`mt-2 text-gray-900 border ${
                            amountError ? 'border-red-500' : 'border-gray-900'
                        } focus:outline-none focus:ring-0 w-full px-4 py-2 rounded-md`}
                        placeholder="Ingrese el importe"
                    />
                    {amountError && (
                        <p className="text-sm text-red-600 mt-2">{amountError}</p>
                    )}
                </div>
                <div className="mb-4">
                    <label htmlFor="payer" className="text-m block font-bold text-left text-gray-700">Quién paga</label>
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
                <div className="mb-4">
                <label htmlFor="payer" className="text-m font-bold block text-left text-gray-700 mb-2">Adjunta una imagen del comprobante de pago</label>
                <input 
                    class="block w-full text-sm text-gray-900 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" 
                    aria-describedby="user_avatar_help" 
                    id="user_avatar" 
                    type="file"
                    onChange={handleFileChange}
                />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Haz clic para subir</span> SVG, PNG O JPG</p>

                </div>

                <div className="flex w-full space-x-4">
                        <button
                            onClick={onClose}
                            className="w-1/2 px-4 py-2 text-lg border-2 border-[#D3423E] text-[#D3423E] uppercase font-bold rounded-2xl"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSavePayment}
                            disabled={isSaveDisabled}
                            className={`w-1/2 px-4 py-2 text-lg font-bold uppercase rounded-2xl ${
                            isSaveDisabled
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-[#D3423E] text-white hover:bg-red-600'
                            }`}
                        >
                            Guardar
                        </button>
                </div>
            </div>
        </div>
    );
};

export default ClientPaymentDialog;
