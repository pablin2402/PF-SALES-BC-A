import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config';
import { ethers } from 'ethers';
import { QRCodeCanvas } from "qrcode.react";

const NETWORKS = {
  polygon: {
    name: 'Polygon',
    symbol: 'POL',
    color: '#8247E5',
    estimatedFee: '~$0.01 USD',
    description: 'Recomendado: Comisiones bajas y rápido',
    explorerUrl: 'https://polygonscan.com/tx/',
    chainId: 137,
    chainIdHex: '0x89',
  },
  ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    estimatedFee: '~$5 - $30 USD',
    description: 'Red principal, comisiones más altas',
    explorerUrl: 'https://etherscan.io/tx/',
    chainId: 1,
    chainIdHex: '0x1',
  },
  bsc: {
    name: 'BNB Chain',
    symbol: 'BNB',
    color: '#F0B90B',
    estimatedFee: '~$0.30 USD',
    description: 'Comisiones bajas, alta liquidez',
    explorerUrl: 'https://bscscan.com/tx/',
    chainId: 56,
    chainIdHex: '0x38',
  }
};

const PAYMENT_METHODS = {
  cash: { name: 'Efectivo', icon: '💵', description: 'Pago en efectivo' },
  transfer: { name: 'Transferencia', icon: '🏦', description: 'Transferencia bancaria' },
  qr: { name: 'QR', icon: '📱', description: 'Pago con código QR' },
  deposit: { name: 'Depósito', icon: '🏧', description: 'Depósito bancario' }
};

const MIN_USDT_AMOUNT = 10;
const USD_TO_BS_OFFICIAL = 6.96;
const POLYGON_CHAIN_ID = 137;

const ClientPaymentDialog = ({ onClose, onSave, orderId, totalPaid, idClient, salesID, totalGeneral }) => {
  const [paymentData, setPaymentData] = useState({ amount: '', payer: '' });
  const id_user = localStorage.getItem("id_user");
  const [amountError, setAmountError] = useState('');
  const total = totalGeneral - totalPaid;
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  const [normalPaymentType, setNormalPaymentType] = useState('cash');

  const [selectedNetwork, setSelectedNetwork] = useState('polygon');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
  const [manualRateMode, setManualRateMode] = useState(false);
  const [manualRate, setManualRate] = useState('');

  const [txStatus, setTxStatus] = useState('waiting');
  const [txHash, setTxHash] = useState(null);
  const [txConfirmations, setTxConfirmations] = useState(0);
  const [txStartTime, setTxStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const pollingIntervalRef = useRef(null);
  const elapsedIntervalRef = useRef(null);

  const [initialBalance, setInitialBalance] = useState(null);

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const buyResponse = await axios.post(
        'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
        { fiat: 'BOB', page: 1, rows: 10, tradeType: 'BUY', asset: 'USDT', countries: [], payTypes: [] }
      );
      const sellResponse = await axios.post(
        'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
        { fiat: 'BOB', page: 1, rows: 10, tradeType: 'SELL', asset: 'USDT', countries: [], payTypes: [] }
      );

      const buyPrices = buyResponse.data?.data?.map(item => parseFloat(item.adv.price)) || [];
      const sellPrices = sellResponse.data?.data?.map(item => parseFloat(item.adv.price)) || [];
      const allPrices = [...buyPrices, ...sellPrices].sort((a, b) => a - b);

      if (allPrices.length === 0) throw new Error('No hay precios disponibles');

      const trimCount = Math.floor(allPrices.length * 0.2);
      const trimmedPrices = allPrices.slice(trimCount, allPrices.length - trimCount);
      const avgPrice = trimmedPrices.reduce((a, b) => a + b, 0) / trimmedPrices.length;

      setExchangeRate(avgPrice);
      setRateUpdatedAt(new Date());
    } catch (error) {
      console.error('Error al obtener tipo de cambio:', error);
      setExchangeRate(9.5);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    if (paymentMethod === 'crypto' && !exchangeRate) {
      fetchExchangeRate();
    }
  }, [paymentMethod, exchangeRate]);

  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const applyManualRate = () => {
    const rate = parseFloat(manualRate);
    if (rate > 0) {
      setExchangeRate(rate);
      setRateUpdatedAt(new Date());
      setManualRateMode(false);
      setManualRate('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("image", imageFile);
    const res = await axios.post(API_URL + "/whatsapp/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
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

  const toCents = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    return Math.round(n * 100);
  };

  const amountInUSDTNumber = paymentData.amount && exchangeRate
    ? parseFloat(paymentData.amount) / exchangeRate
    : 0;
  const amountInUSDT = amountInUSDTNumber.toFixed(2);
  const totalInUSDT = exchangeRate ? (total / exchangeRate).toFixed(2) : '0.00';
  const totalInUSDOfficial = (total / USD_TO_BS_OFFICIAL).toFixed(2);
  const remainingAfterPayment = paymentData.amount
    ? (total - parseFloat(paymentData.amount)).toFixed(2)
    : total.toFixed(2);

  const isAmountTooLow = paymentMethod === 'crypto' &&
    paymentData.amount &&
    amountInUSDTNumber < MIN_USDT_AMOUNT;
  const minimumBsRequired = exchangeRate
    ? (MIN_USDT_AMOUNT * exchangeRate).toFixed(2)
    : null;

  useEffect(() => {
    if (!order || txStatus === 'confirmed' || txStatus === 'failed') return;

    if (!txStartTime) setTxStartTime(Date.now());

    elapsedIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    const RPC_URLS = {
      polygon: 'https://polygon-bor-rpc.publicnode.com',
      ethereum: 'https://ethereum-rpc.publicnode.com',
      bsc: 'https://bsc-rpc.publicnode.com'
    };
    const USDT_ADDRESSES = {
      polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      bsc: '0x55d398326f99059fF775485246999027B3197955'
    };
    const USDT_DECIMALS = { polygon: 6, ethereum: 6, bsc: 18 };

    const checkPayment = async () => {
      try {
        if (initialBalance === null) return;

        const provider = new ethers.JsonRpcProvider(RPC_URLS[selectedNetwork]);
        const usdtAddress = USDT_ADDRESSES[selectedNetwork];
        const decimals = USDT_DECIMALS[selectedNetwork];
        const targetAddress = order.address;

        const ERC20_ABI = [
          "event Transfer(address indexed from, address indexed to, uint256 value)",
          "function balanceOf(address account) view returns (uint256)"
        ];

        const usdtContract = new ethers.Contract(usdtAddress, ERC20_ABI, provider);

        const usdtBalance = await usdtContract.balanceOf(targetAddress);
        const currentBalance = Number(usdtBalance) / Math.pow(10, decimals);
        const expectedAmount = parseFloat(amountInUSDT);
        const tolerance = expectedAmount * 0.05;

        const amountReceived = currentBalance - initialBalance;
        const isPaymentReceived = amountReceived >= (expectedAmount - tolerance);

        if (isPaymentReceived) {
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = currentBlock - 5000;

          const filter = usdtContract.filters.Transfer(null, targetAddress);
          const events = await usdtContract.queryFilter(filter, fromBlock, currentBlock);

          if (events.length > 0) {
            const latestEvent = events[events.length - 1];
            const confirmations = currentBlock - latestEvent.blockNumber;

            setTxHash(latestEvent.transactionHash);

            if (confirmations >= 12) {
              setTxStatus('confirmed');
              setTxConfirmations(confirmations);
              setPaid(true);
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
            } else if (confirmations >= 1) {
              setTxStatus('confirming');
              setTxConfirmations(confirmations);
            } else {
              setTxStatus('detected');
            }
          } else {
            setTxStatus('confirmed');
            setPaid(true);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
          }
        } else if (amountReceived > 0 && amountReceived < (expectedAmount - tolerance)) {
          setTxStatus('waiting');
        }
      } catch (error) {
        console.error('Error verificando pago:', error);
      }
    };

    checkPayment();
    pollingIntervalRef.current = setInterval(checkPayment, 8000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, txStatus, selectedNetwork, initialBalance, amountInUSDT]);

  const ensurePolygonNetwork = async () => {
    if (!window.ethereum) throw new Error("MetaMask no está instalado");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x89" }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x89",
              chainName: "Polygon Mainnet",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: ["https://polygon-rpc.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            }],
          });
        } else {
          throw new Error("Cambia a Polygon Mainnet para continuar");
        }
      }
    }

    const updatedProvider = new ethers.BrowserProvider(window.ethereum);
    return await updatedProvider.getSigner();
  };

  const sendPaymentToBlockchain = async (registryOrderId, amount, payer) => {
    const signer = await ensurePolygonNetwork();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    setIsBlockchainProcessing(true);
    setStatus("Registrando pago en Polygon...");
    const amountCents = toCents(amount);

    const tx = await contract.registerPayment(registryOrderId, amountCents, payer);
    setStatus("Esperando confirmación on-chain...");
    const receipt = await tx.wait();

    setStatus("Registro guardado en blockchain");
    setBlockchainSuccess(true);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
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

      let blockchainTxHash = null;
      let blockchainBlock = null;

      try {
        const result = await sendPaymentToBlockchain(
          String(orderId),
          paymentData.amount,
          paymentData.payer
        );
        blockchainTxHash = result.transactionHash;
        blockchainBlock = result.blockNumber;
      } catch (err) {
        console.error("Error en blockchain:", err);
        setStatus("Error blockchain: " + err.message);
        clearInterval(dotInterval);
        setIsSaving(false);
        setIsBlockchainProcessing(false);
        return;
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
        id_owner: user,
        paymentType: paymentMethod === 'normal' ? normalPaymentType : 'crypto',
        network: paymentMethod === 'crypto' ? selectedNetwork : 'polygon',
        txHash: blockchainTxHash,
        blockNumber: blockchainBlock,
        contractAddress: CONTRACT_ADDRESS,
      };

      const orderResponse = await Promise.race([
        axios.post(API_URL + "/whatsapp/order/pay", jsonData, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000))
      ]);

      if (orderResponse.status === 200) {
        onSave();
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
          setIsBlockchainProcessing(false);
          setBlockchainSuccess(false);
          setStatus("");
          setSavingText("Guardando");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error al registrar el pago", error);
      clearInterval(dotInterval);
      setIsSaving(false);
      setIsBlockchainProcessing(false);
      setSavingText("Guardando");
    }
  };

  const createPayment = async () => {
    try {
      const payload = { amount: amountInUSDT, network: selectedNetwork };
      const response = await axios.post(API_URL + "/whatsapp/create", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newOrder = response.data || {};

      const RPC_URLS = {
        polygon: 'https://polygon-bor-rpc.publicnode.com',
        ethereum: 'https://ethereum-rpc.publicnode.com',
        bsc: 'https://bsc-rpc.publicnode.com'
      };
      const USDT_ADDRESSES = {
        polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        bsc: '0x55d398326f99059fF775485246999027B3197955'
      };
      const USDT_DECIMALS = { polygon: 6, ethereum: 6, bsc: 18 };

      if (newOrder.address) {
        const provider = new ethers.JsonRpcProvider(RPC_URLS[selectedNetwork]);
        const usdtContract = new ethers.Contract(
          USDT_ADDRESSES[selectedNetwork],
          ["function balanceOf(address account) view returns (uint256)"],
          provider
        );
        const balance = await usdtContract.balanceOf(newOrder.address);
        const balanceFormatted = Number(balance) / Math.pow(10, USDT_DECIMALS[selectedNetwork]);

        setInitialBalance(balanceFormatted);
      }

      setOrder(newOrder);
      setPayment(response.data);
      setTxStatus('waiting');
      setElapsedTime(0);
      setTxHash(null);
      setTxStartTime(Date.now());
    } catch (error) {
      console.error("Error al crear pago:", error);
    }
  };

  const qrValue = order?.address ? String(order.address) : "";

  const TransactionStatus = () => {
    const statusConfig = {
      waiting: { icon: '⏳', title: 'Esperando pago', description: 'Envía el monto exacto a la dirección mostrada', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-800' },
      detected: { icon: '🔍', title: 'Pago detectado', description: 'Tu transacción está en la red, esperando confirmaciones', bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-800' },
      confirming: { icon: '⚙️', title: 'Confirmando', description: `${txConfirmations} confirmaciones recibidas`, bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-800' },
      confirmed: { icon: '✅', title: 'Pago confirmado', description: 'La transacción se completó exitosamente', bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-800' },
      failed: { icon: '❌', title: 'Transacción fallida', description: 'Hubo un problema con la transacción', bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-800' }
    };

    const config = statusConfig[txStatus];
    const isAnimated = txStatus === 'waiting' || txStatus === 'detected' || txStatus === 'confirming';

    return (
      <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-4 mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${isAnimated ? 'animate-pulse' : ''}`}>{config.icon}</span>
            <div>
              <p className={`font-bold ${config.textColor}`}>{config.title}</p>
              <p className={`text-xs ${config.textColor} opacity-80`}>{config.description}</p>
            </div>
          </div>
          {isAnimated && (
            <div className="text-right">
              <p className={`text-xs ${config.textColor} opacity-70`}>Tiempo</p>
              <p className={`font-mono font-bold ${config.textColor}`}>{formatElapsedTime(elapsedTime)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mb-3">
          {['waiting', 'detected', 'confirming', 'confirmed'].map((step, idx) => {
            const stepIndex = ['waiting', 'detected', 'confirming', 'confirmed'].indexOf(txStatus);
            const isActive = idx <= stepIndex;
            return (
              <div
                key={step}
                className="flex-1 h-1.5 rounded-full"
                style={{ backgroundColor: isActive ? (txStatus === 'confirmed' ? '#10b981' : '#3b82f6') : '#d1d5db' }}
              />
            );
          })}
        </div>

        {txHash && (
          <div className="bg-white rounded-lg p-2 mt-2">
            <p className={`text-xs ${config.textColor} font-bold mb-1`}>Hash de transacción:</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-700 font-mono truncate flex-1">{txHash}</p>
              <a
                href={NETWORKS[selectedNetwork].explorerUrl + txHash}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline whitespace-nowrap font-bold"
              >
                Ver en explorador →
              </a>
            </div>
          </div>
        )}

        {isAnimated && (
          <div className="flex justify-center mt-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50 px-4 sm:px-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl text-left text-gray-900 font-bold mb-4">Registrar Pago</h3>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo por pagar</p>
              <p className="text-2xl font-bold text-gray-900">Bs. {total.toFixed(2)}</p>
              {paymentMethod === 'normal' && (
                <p className="text-xs text-gray-600 mt-1">
                  ≈ ${totalInUSDOfficial} USD <span className="text-gray-400">(oficial)</span>
                </p>
              )}
            </div>
            {paymentData.amount && !amountError && (
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Quedará</p>
                <p className={`text-xl font-bold ${parseFloat(remainingAfterPayment) === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  Bs. {remainingAfterPayment}
                </p>
              </div>
            )}
          </div>

          {paymentMethod === 'crypto' && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              {loadingRate ? (
                <p className="text-sm text-gray-500">Obteniendo tipo de cambio...</p>
              ) : exchangeRate && (
                <>
                  <p className="text-sm text-gray-700">
                    Equivalente: <span className="font-bold text-green-700">≈ {totalInUSDT} USDT</span>
                  </p>

                  {!manualRateMode ? (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">1 USDT = Bs. {exchangeRate.toFixed(2)}</p>
                      <button onClick={fetchExchangeRate} className="text-xs text-blue-600 hover:underline">Actualizar</button>
                      <span className="text-xs text-gray-400">|</span>
                      <button
                        onClick={() => { setManualRateMode(true); setManualRate(exchangeRate.toFixed(2)); }}
                        className="text-xs text-blue-600 hover:underline"
                      >Editar manualmente</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-gray-700">1 USDT = Bs.</span>
                      <input
                        type="number"
                        value={manualRate}
                        onChange={(e) => setManualRate(e.target.value)}
                        step="0.01"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
                        placeholder="9.50"
                      />
                      <button onClick={applyManualRate} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Aplicar</button>
                      <button onClick={() => { setManualRateMode(false); setManualRate(''); }} className="text-xs text-gray-600 hover:underline">Cancelar</button>
                    </div>
                  )}

                  {rateUpdatedAt && !manualRateMode && (
                    <p className="text-xs text-gray-400 mt-1">Actualizado: {rateUpdatedAt.toLocaleTimeString()}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-x-2 mb-4">
          <button
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-center transition-all ${paymentMethod === 'normal' ? 'bg-[#D3423E] text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setPaymentMethod('normal')}
          >
            Pago Normal
          </button>
          <button
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-center transition-all ${paymentMethod === 'crypto' ? 'bg-[#D3423E] text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setPaymentMethod('crypto')}
          >
            Pagar con Cripto
          </button>
        </div>

        {paymentMethod === 'normal' && (
          <>
            <div className="mb-4">
              <label className="text-m font-bold block text-left text-gray-700 mb-2">1. Tipo de pago</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <button
                    key={key}
                    onClick={() => setNormalPaymentType(key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${normalPaymentType === key ? 'border-[#D3423E] bg-red-50' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <p className="text-xs font-bold text-gray-800">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-m font-bold block text-left text-gray-700 mb-2">2. Datos del pago</label>
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <label htmlFor="amount" className="text-sm text-left block text-gray-600">Importe (Bs.)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handleInputChange}
                    max={total}
                    className={`mt-1 text-gray-900 border ${amountError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#D3423E] focus:border-transparent w-full px-4 py-2 rounded-xl`}
                    placeholder="Ingrese el importe"
                  />
                  {amountError && <p className="text-sm text-red-600 mt-1">{amountError}</p>}
                  {paymentData.amount && !amountError && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ ${(parseFloat(paymentData.amount) / USD_TO_BS_OFFICIAL).toFixed(2)} USD
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label htmlFor="payer" className="text-sm block text-left text-gray-600">Quién paga</label>
                  <input
                    type="text"
                    id="payer"
                    name="payer"
                    value={paymentData.payer}
                    onChange={handleInputChange}
                    className="mt-1 text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D3423E] focus:border-transparent w-full px-4 py-2 border rounded-xl"
                    placeholder="Nombre del pagador"
                  />
                </div>
              </div>

              {!paymentData.amount && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setPaymentData({ ...paymentData, amount: total.toFixed(2) })}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700"
                  >
                    Pago completo (Bs. {total.toFixed(2)})
                  </button>
                  <button
                    onClick={() => setPaymentData({ ...paymentData, amount: (total / 2).toFixed(2) })}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700"
                  >
                    50%
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-m font-bold block text-left text-gray-700 mb-2">
                3. Comprobante de pago {normalPaymentType === 'cash' ? '(opcional)' : '(recomendado)'}
              </label>
              {!imagePreview ? (
                <div>
                  <input
                    className="block w-full text-gray-900 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-[#D3423E] focus:outline-none"
                    id="user_avatar"
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> SVG, PNG o JPG
                  </p>
                </div>
              ) : (
                <div className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <img src={imagePreview} alt="Comprobante" className="max-h-48 mx-auto rounded" />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600 truncate">{imageFile?.name}</p>
                    <button onClick={removeImage} className="text-xs text-red-600 hover:underline font-bold">
                      Quitar imagen
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col w-full space-y-4">
              {!isBlockchainProcessing && !blockchainSuccess && (
                <div className="flex flex-col sm:flex-row w-full sm:space-x-4 sm:space-y-0 space-y-4">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-1/2 px-4 py-2 text-lg border-2 border-[#D3423E] text-[#D3423E] uppercase font-bold rounded-2xl hover:bg-red-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={!paymentData.amount || !paymentData.payer || amountError || isSaving}
                    className={`w-full sm:w-1/2 px-4 py-2 text-lg font-bold uppercase rounded-2xl ${!paymentData.amount || !paymentData.payer || amountError || isSaving ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#D3423E] text-white hover:bg-red-600'}`}
                  >
                    {isSaving ? savingText : saveSuccess ? "Guardado" : "Guardar"}
                  </button>
                </div>
              )}

              {status && (
                <div className="mt-4 flex justify-center items-center space-x-2 text-lg font-medium">
                  {(status.includes("Registrando") || status.includes("Esperando")) && (
                    <>
                      <span className="text-gray-600">{status}</span>
                      <span className="flex space-x-1">
                        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></span>
                      </span>
                    </>
                  )}
                  {status.includes("guardado") && (
                    <span className="text-green-600 flex items-center space-x-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Registro guardado en Polygon</span>
                    </span>
                  )}
                  {(status.includes("Error") || status.includes("MetaMask")) && (
                    <span className="text-red-600 flex items-center space-x-2">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>{status}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {paymentMethod === 'crypto' && (
          <>
            <div className="mb-4">
              <label className="text-m font-bold block text-left text-gray-700 mb-2">1. Selecciona la red de pago</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedNetwork(key)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedNetwork === key ? 'border-[#D3423E] bg-red-50' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm" style={{ color: network.color }}>{network.name}</span>
                      {selectedNetwork === key && <span className="text-[#D3423E] text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-gray-600">Comisión: {network.estimatedFee}</p>
                    <p className="text-xs text-gray-500 mt-1">{network.description}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⓘ Las comisiones son aproximadas y pueden variar según la congestión de la red.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4 space-y-4 sm:space-y-0">
              <div className="flex-1">
                <label htmlFor="amount" className="text-m font-bold text-left block text-gray-700">2. Importe a pagar (Bs.)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={paymentData.amount}
                  onChange={handleInputChange}
                  max={total}
                  className={`mt-2 text-gray-900 border ${amountError || isAmountTooLow ? 'border-red-500' : 'border-gray-900'} focus:outline-none focus:ring-0 w-full px-4 py-2 rounded-2xl`}
                  placeholder={minimumBsRequired ? `Mínimo Bs. ${minimumBsRequired}` : 'Ingrese el importe'}
                />
                {amountError && <p className="text-sm text-red-600 mt-2">{amountError}</p>}
                {paymentData.amount && exchangeRate && (
                  <p className={`text-sm mt-2 font-medium ${isAmountTooLow ? 'text-red-600' : 'text-green-700'}`}>
                    Equivale a: {amountInUSDT} USDT
                  </p>
                )}
                {isAmountTooLow && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-xs text-red-700">
                      ⚠️ El monto mínimo para pagos en cripto es <span className="font-bold">{MIN_USDT_AMOUNT} USDT</span> (≈ Bs. {minimumBsRequired}).
                    </p>
                    <p className="text-xs text-red-600 mt-1">Esto es debido a las comisiones mínimas de la red.</p>
                  </div>
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

            {!order && paymentData.amount && paymentData.payer && !amountError && !isAmountTooLow && (
              <button
                onClick={createPayment}
                className="w-full mb-4 px-4 py-3 bg-[#D3423E] text-white font-bold rounded-2xl hover:bg-red-600"
              >
                3. Generar dirección de pago
              </button>
            )}

            {order && (
              <>
                <TransactionStatus />

                {txStatus !== 'confirmed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-center">
                    <h2 className="text-gray-900 font-bold mb-2">Envía {amountInUSDT} USDT a esta dirección</h2>
                    <p className="text-sm text-gray-700 mb-3">
                      Red: <span className="font-bold" style={{ color: NETWORKS[selectedNetwork].color }}>
                        {NETWORKS[selectedNetwork].name}
                      </span>
                    </p>

                    {qrValue ? (
                      <div className="bg-white p-3 rounded-xl inline-block shadow-sm mb-3">
                        <QRCodeCanvas value={qrValue} size={220} />
                      </div>
                    ) : (
                      <p className="text-gray-600">Generando QR…</p>
                    )}

                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Dirección de la wallet:</p>
                      <p className="text-sm text-gray-900 break-all font-mono">{order.address}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(order.address)}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        📋 Copiar dirección
                      </button>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                      <p className="text-xs text-yellow-800 font-bold mb-1">⚠️ Importante:</p>
                      <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                        <li>Envía solo USDT por la red {NETWORKS[selectedNetwork].name}</li>
                        <li>Otros tokens o redes pueden resultar en pérdida de fondos</li>
                        <li>El pago se confirmará automáticamente al recibirlo</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mb-6">
              <label className="text-m font-bold block text-left text-gray-700 mb-2">4. Comprobante de la transacción (opcional)</label>
              {!imagePreview ? (
                <div>
                  <input
                    className="block w-full text-gray-900 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-[#D3423E] focus:outline-none"
                    id="crypto_avatar"
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> screenshot de la transacción
                  </p>
                </div>
              ) : (
                <div className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <img src={imagePreview} alt="Comprobante" className="max-h-48 mx-auto rounded" />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600 truncate">{imageFile?.name}</p>
                    <button onClick={removeImage} className="text-xs text-red-600 hover:underline font-bold">
                      Quitar imagen
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:space-x-4 sm:space-y-0 space-y-4">
              <button
                onClick={onClose}
                className="w-full sm:w-1/2 px-4 py-2 text-lg border-2 border-[#D3423E] text-[#D3423E] uppercase font-bold rounded-2xl hover:bg-red-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePayment}
                disabled={!paymentData.amount || !paymentData.payer || amountError || isAmountTooLow || isSaving || !order || txStatus !== 'confirmed'}
                className={`w-full sm:w-1/2 px-4 py-2 text-lg font-bold uppercase rounded-2xl ${!paymentData.amount || !paymentData.payer || amountError || isAmountTooLow || isSaving || !order || txStatus !== 'confirmed' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#D3423E] text-white hover:bg-red-600'}`}
              >
                {isSaving ? savingText : saveSuccess ? "Guardado" : txStatus !== 'confirmed' ? "Esperando confirmación..." : "Confirmar Pago"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientPaymentDialog;