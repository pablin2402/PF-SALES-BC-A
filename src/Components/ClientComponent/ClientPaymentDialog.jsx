import { useState } from 'react';
import axios from 'axios';
import { API_URL, CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config';
import { ethers } from 'ethers';
//import PaymentWithUSDTComponent from "./PaymentWithUSDTComponent";
import { QRCodeCanvas } from "qrcode.react";

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
  const [status, setStatus] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingText, setSavingText] = useState("Guardando");
  const [blockchainSuccess, setBlockchainSuccess] = useState(false);
  const [isBlockchainProcessing, setIsBlockchainProcessing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("normal");

  const [order, setOrder] = useState(null);
  const [paid, setPaid] = useState(false);
  const [payment, setPayment] = useState(null);

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
  const sendPayment = async (orderId, amount, payer) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask no está instalado");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setIsBlockchainProcessing(true);
      setStatus("Registrando pago en blockchain...");

      const tx = await contract.registerPayment(orderId, amount, payer);
      await tx.wait();

      setStatus("Registro guardado en blockchain");
      setBlockchainSuccess(true);

      setTimeout(() => {
        setStatus("");
        setIsBlockchainProcessing(false);
        setBlockchainSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
      setIsBlockchainProcessing(false);
    }
  };
  const handleSavePayment = async () => {
    let dotInterval;
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setSavingText("Guardando");

      let dots = 0;
      dotInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        setSavingText("Guardando" + ".".repeat(dots));
      }, 500);

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage();
        if (!imageUrl || typeof imageUrl !== "string" || imageUrl === "null") {
          console.error("No se pudo obtener la URL de la imagen");
          clearInterval(dotInterval);
          setIsSaving(false);
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
          headers: { Authorization: `Bearer ${token}` }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);

      if (orderResponse.status === 200) {
        onSave();
        const savedOrder = orderResponse.data;
        const orderId = savedOrder._id;
        await sendPayment(orderId, paymentData.amount, paymentData.payer);
        setPaymentData({ amount: '', payer: '' });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
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
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (error) {
              console.error("Error al enviar evento de orden:", error);
            }
          }, (error) => {
            console.error("No se pudo obtener la ubicación:", error);
          });
        }

        clearInterval(dotInterval);
        setSaveSuccess(true);
        setSavingText("Guardado");

        setTimeout(() => {
          setIsSaving(false);
          setSaveSuccess(false);
          setSavingText("Guardando");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error al registrar el pago", error);
      clearInterval(dotInterval);
      setIsSaving(false);
      setSavingText("Guardando");
    }
  };
  const createPayment = async () => {
    try {
      const payload = {
        amount: 1
      };
      const response = await axios.post(API_URL + "/whatsapp/create", payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setOrder(response.data || []);
      setPayment(response.data);
    } catch (error) {
      console.error("Error al obtener los productos", error);
    }
  };

  const qrValue = order?.address ? String(order.address) : "";
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50 px-4 sm:px-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl text-left text-gray-900 font-bold mb-4">Registrar Pago</h3>

        <p className="text-left text-m text-gray-900 mb-4">
          Saldo por pagar Bs. {total.toFixed(2)}
        </p>
        <div className="flex gap-x-2 mb-4">
          <button
            className={`flex-1 px-4 py-2 rounded-xl font-bold text-center ${paymentMethod === 'normal' ? 'bg-[#D3423E] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            onClick={() => setPaymentMethod('normal')}
          >
            Pago Normal
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-xl font-bold text-center ${paymentMethod === 'usdt' ? 'bg-[#D3423E] text-white' : 'bg-gray-200 text-gray-700'
              }`}
            onClick={() => {
              setPaymentMethod('usdt');
              createPayment();
            }}
          >
            Pagar con ETH
          </button>
        </div>

        {paymentMethod === 'normal' && (
          <>
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

            <div className="flex flex-col w-full space-y-4">
              <div className="flex flex-col w-full space-y-4">
                {!isBlockchainProcessing && !blockchainSuccess && (
                  <div className="flex flex-col sm:flex-row w-full sm:space-x-4 sm:space-y-0 space-y-4">
                    <button
                      onClick={onClose}
                      className="w-full sm:w-1/2 px-4 py-2 text-lg border-2 border-[#D3423E] text-[#D3423E] uppercase font-bold rounded-2xl"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={handleSavePayment}
                      disabled={!paymentData.amount || !paymentData.payer || amountError || isSaving}
                      className={`w-full sm:w-1/2 px-4 py-2 text-lg font-bold uppercase rounded-2xl ${!paymentData.amount || !paymentData.payer || amountError || isSaving
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-[#D3423E] text-white hover:bg-red-600'
                        }`}
                    >
                      {isSaving ? savingText : saveSuccess ? "Guardado" : "Guardar"}
                    </button>
                  </div>
                )}

                {status && (
                  <div className="mt-4 flex justify-center items-center space-x-2 text-lg font-medium">
                    {status.includes("Registrando") && (
                      <>
                        <span className="text-gray-600">Registrando pago en la blockchain</span>
                        <span className="flex space-x-1">
                          <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                        </span>
                      </>
                    )}

                    {status.includes("guardado") && (
                      <span className="text-green-600 flex items-center space-x-2">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Registro guardado en la blockchain</span>
                      </span>
                    )}

                    {(status.includes("Error") || status.includes("MetaMask")) && (
                      <span className="text-red-600 flex items-center space-x-2">
                        <svg
                          className="w-6 h-6 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{status}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {paymentMethod === 'usdt' && (
           <>
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
           <div style={{ textAlign: "center" }}>
            {paymentMethod === "usdt" && (
              <div style={{ textAlign: "center" }}>
                {!order ? (
                  <>
                    <h2 className="text-gray-900 font-bold">Generando pago...</h2>
                    <p className="text-gray-600">Espera un momento</p>
                  </>
                ) : !paid ? (
                  <>
                    {qrValue ? (
                      <div
                        style={{
                          background: "#fff",
                          padding: 12,
                          borderRadius: 12,
                          width: "fit-content",
                          margin: "12px auto",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                      >
                        <QRCodeCanvas value={qrValue} size={220} />
                      </div>
                    ) : (
                      <p className="text-gray-600">Generando QR…</p>
                    )}

                    <p style={{ color: "#111827", wordBreak: "break-all" }}>
                      <b>Address:</b> {order.address}
                    </p>
                  </>
                ) : (
                  <h1 style={{ color: "#16a34a", fontWeight: 800 }}>✅ Pago confirmado</h1>
                )}
              </div>
            )}

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
           <div className="flex flex-col w-full space-y-4">
              <div className="flex flex-col w-full space-y-4">
                {!isBlockchainProcessing && !blockchainSuccess && (
                  <div className="flex flex-col sm:flex-row w-full sm:space-x-4 sm:space-y-0 space-y-4">
                    <button
                      onClick={onClose}
                      className="w-full sm:w-1/2 px-4 py-2 text-lg border-2 border-[#D3423E] text-[#D3423E] uppercase font-bold rounded-2xl"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={handleSavePayment}
                      disabled={!paymentData.amount || !paymentData.payer || amountError || isSaving}
                      className={`w-full sm:w-1/2 px-4 py-2 text-lg font-bold uppercase rounded-2xl ${!paymentData.amount || !paymentData.payer || amountError || isSaving
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-[#D3423E] text-white hover:bg-red-600'
                        }`}
                    >
                      {isSaving ? savingText : saveSuccess ? "Guardado" : "Guardar"}
                    </button>
                  </div>
                )}
              </div>
            </div>
         </>
         
        )}
      </div>

    </div>



  );
};

export default ClientPaymentDialog;
