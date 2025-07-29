import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
//import PagoRegistroABI from "../contracts/PagoRegistro.json"
//import { ethers } from 'ethers';

const ClientPaymentDialog = ({ isOpen, onClose, onSave, totalPaid, totalGeneral, orderId, idClient, salesID }) => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payer: ''
  });
  const id_user = localStorage.getItem("id_user");
  const [amountError, setAmountError] = useState('');
  const total = totalGeneral - totalPaid;
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const [imageFile, setImageFile] = useState(null);

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };
  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await axios.post(API_URL + "/whatsapp/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.imageUrl;
  };
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

  /*
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

      console.log("Pago registrado en blockchain:", tx.hash);
  } catch (error) {
      console.error("Error al registrar pago en blockchain:", error);
  }
}*/
  const handleSavePayment = async () => {
    try {
      let imageUrl = "";

      if (imageFile) {
        imageUrl = await uploadImage();

        if (!imageUrl || typeof imageUrl !== "string" || imageUrl === "null") {
          console.error("No se pudo obtener la URL de la imagen");
          return;
        }
      }
      const jsonData = {
        saleImage: imageUrl,
        total: paymentData.amount,
        note: paymentData.payer,
        orderId: orderId,
        numberOrden: "",
        paymentStatus: "paid",
        id_client: idClient,
        sales_id: salesID,
        delivery_id: null,
        id_owner: user
      };

      const orderResponse = await Promise.race([
        axios.post(API_URL + "/whatsapp/order/pay", jsonData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

      if (orderResponse.status === 200) {
        onSave();
        setPaymentData({ amount: '', payer: '' });
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;

              try {
                await axios.post(API_URL + "/whatsapp/order/track", {
                  orderId,
                  eventType: "Pago Ingresado",
                  triggeredBySalesman: id_user,
                  triggeredByDelivery: "",
                  triggeredByUser: "",
                  location: { lat, lng }
                }, {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });

              } catch (error) {
                console.error("Error al enviar evento de orden:", error);
              }
            },
            (error) => {
              console.error("No se pudo obtener la ubicación:", error);
            }
          );
        } else {
          console.warn("La geolocalización no es soportada por este navegador.");
        }

        onClose();
      }

    } catch (error) {
      console.error("Error al registrar el pago", error);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50 px-4 sm:px-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
      <h3 className="text-2xl text-left text-gray-900 font-bold mb-4">Registrar Pago</h3>
  
      <p className="text-left text-m text-gray-900 mb-4">
        Saldo por pagar Bs. {total.toFixed(2)}
      </p>
  
      <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <label htmlFor="amount" className="text-m font-bold text-left block text-gray-700">Importe</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={paymentData.amount}
            onChange={handleInputChange}
            max={total}
            className={`mt-2 text-gray-900 border ${amountError ? 'border-red-500' : 'border-gray-900'} focus:outline-none focus:ring-0 w-full px-4 py-2 rounded-2xl`}
            placeholder="Ingrese el importe"
          />
          {amountError && (
            <p className="text-sm text-red-600 mt-2">{amountError}</p>
          )}
        </div>
  
        <div className="flex-1">
          <label htmlFor="payer" className="text-m block font-bold text-left text-gray-700">Quién paga</label>
          <input
            type="text"
            id="payer"
            name="payer"
            value={paymentData.payer}
            onChange={handleInputChange}
            className="mt-2 hover:border-[#D3423E] text-gray-900 border-gray-900 focus:outline-none focus:ring-0 w-full px-4 py-2 border rounded-2xl"
            placeholder="Ingrese el nombre del pagador"
          />
        </div>
      </div>
  
      <div className="mb-6">
        <label htmlFor="user_avatar" className="text-m font-bold block text-left text-gray-700 mb-2">
          Adjunta una imagen del comprobante de pago
        </label>
        <input
          className="block w-full text-gray-900 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-[#D3423E] focus:outline-none"
          id="user_avatar"
          type="file"
          accept=".svg,.png,.jpg,.jpeg"
          onChange={handleFileChange}
        />
        <p className="mt-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> SVG, PNG o JPG</p>
      </div>
  
      <div className="flex flex-col sm:flex-row w-full space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onClose}
          className="w-full sm:w-1/2 px-4 py-2 text-lg border-2 border-[#D3423E] text-[#D3423E] uppercase font-bold rounded-2xl"
        >
          Cancelar
        </button>
        <button
          onClick={handleSavePayment}
          disabled={
            !paymentData.amount ||
            !paymentData.payer ||
            amountError
          }
          className={`w-full sm:w-1/2 px-4 py-2 text-lg font-bold uppercase rounded-2xl ${
            !paymentData.amount || !paymentData.payer || amountError
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
