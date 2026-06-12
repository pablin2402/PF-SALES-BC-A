import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, CONTRACT_ABI, CONTRACT_ADDRESS } from '../../config';
import { ethers } from 'ethers';
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaWallet, FaMoneyBillWave, FaCopy, FaCheckCircle, FaExclamationTriangle, FaSync, FaEdit, FaExternalLinkAlt, FaCamera, FaTrash } from "react-icons/fa";

const NETWORKS = {
  polygon: { name: 'Polygon', symbol: 'POL', color: '#8247E5', estimatedFee: '~$0.01', description: 'Recomendado', explorerUrl: 'https://polygonscan.com/tx/', chainId: 137, chainIdHex: '0x89' },
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', estimatedFee: '~$5-30', description: 'Red principal', explorerUrl: 'https://etherscan.io/tx/', chainId: 1, chainIdHex: '0x1' },
  bsc: { name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', estimatedFee: '~$0.30', description: 'Alta liquidez', explorerUrl: 'https://bscscan.com/tx/', chainId: 56, chainIdHex: '0x38' },
};

const PAY_TYPES = [
  { key: 'cash', label: 'Efectivo', icon: '💵' },
  { key: 'transfer', label: 'Transferencia', icon: '🏦' },
  { key: 'qr', label: 'QR', icon: '📱' },
  { key: 'deposit', label: 'Depósito', icon: '🏧' },
];

const MIN_USDT = 10;
const USD_TO_BS = 6.96;
const POLYGON_CHAIN_ID = 137;

const RPC = { polygon: 'https://polygon-bor-rpc.publicnode.com', ethereum: 'https://ethereum-rpc.publicnode.com', bsc: 'https://bsc-rpc.publicnode.com' };
const USDT_ADDR = { polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7', bsc: '0x55d398326f99059fF775485246999027B3197955' };
const USDT_DEC = { polygon: 6, ethereum: 6, bsc: 18 };
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)", "function balanceOf(address account) view returns (uint256)"];

const ClientPaymentDialog = ({ onClose, onSave, orderId, totalPaid, idClient, salesID, totalGeneral }) => {
  const [paymentData, setPaymentData] = useState({ amount: '', payer: '' });
  const [amountError, setAmountError] = useState('');
  const total = totalGeneral - totalPaid;
  const user = localStorage.getItem("id_owner");
  const token = localStorage.getItem("token");
  const id_user = localStorage.getItem("id_user");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [blockchainSuccess, setBlockchainSuccess] = useState(false);
  const [isBlockchainProcessing, setIsBlockchainProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("normal");
  const [normalPaymentType, setNormalPaymentType] = useState('cash');
  const [order, setOrder] = useState(null);
  const [, setPaid] = useState(false);
  const [, setPayment] = useState(null);

  const [selectedNetwork, setSelectedNetwork] = useState('polygon');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
  const [manualRateMode, setManualRateMode] = useState(false);
  const [manualRate, setManualRate] = useState('');
  const [copied, setCopied] = useState(false);

  const [txStatus, setTxStatus] = useState('waiting');
  const [txHash, setTxHash] = useState(null);
  const [txConfirmations, setTxConfirmations] = useState(0);
  const [txStartTime, setTxStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [initialBalance, setInitialBalance] = useState(null);
  const pollingRef = useRef(null);
  const elapsedRef = useRef(null);

  const [rateData, setRateData] = useState(null);

  const fetchExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const res = await axios.post(API_URL + "/whatsapp/exchange-rate", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setRateData(data);
      const rate = data?.recommended;
      if (rate && rate > 5) { setExchangeRate(rate); setRateUpdatedAt(new Date()); }
      else throw new Error();
    } catch (e) {
      setExchangeRate(9.50);
      setManualRateMode(true);
      setManualRate("9.50");
      setRateUpdatedAt(new Date());
    } finally { setLoadingRate(false); }
  };

  const ExchangeRateWidget = () => {
    if (loadingRate) return (
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gray-200" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="space-y-1"><div className="h-2 w-12 bg-gray-200 rounded" /><div className="h-4 w-14 bg-gray-200 rounded" /></div>
                <div className="space-y-1 flex flex-col items-end"><div className="h-2 w-14 bg-gray-200 rounded" /><div className="h-5 w-16 bg-green-100 rounded" /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-8 bg-green-50 rounded-lg border border-green-100" />
        <p className="text-[10px] text-gray-400 text-center font-medium">Consultando Bybit y Binance...</p>
      </div>
    );

    if (!rateData && !exchangeRate) return null;
    const bybit = rateData?.bybit;
    const binance = rateData?.binance;
    return (
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tipo de cambio P2P</p>
          <div className="flex items-center gap-2">
            {!manualRateMode ? (
              <>
                <button onClick={fetchExchangeRate} disabled={loadingRate} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold">
                  <FaSync size={8} className={loadingRate ? "animate-spin" : ""} /> {loadingRate ? "..." : "Actualizar"}
                </button>
                <button onClick={() => { setManualRateMode(true); setManualRate(exchangeRate?.toFixed(2) || "9.50"); }} className="text-[10px] text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <FaEdit size={8} /> Editar
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">1 USDT =</span>
                <input type="number" value={manualRate} onChange={e => setManualRate(e.target.value)} step="0.01"
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg text-gray-900 focus:border-[#D3423E] focus:outline-none" />
                <button onClick={() => { const r = parseFloat(manualRate); if (r > 0) { setExchangeRate(r); setRateUpdatedAt(new Date()); setManualRateMode(false); } }}
                  className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-lg font-bold">OK</button>
                <button onClick={() => setManualRateMode(false)} className="text-[10px] text-gray-500">✕</button>
              </div>
            )}
          </div>
        </div>

        {!manualRateMode && (bybit || binance) && (
          <div className="grid grid-cols-2 gap-2">
            {bybit && (bybit.buy || bybit.sell) && (
              <div className="bg-white rounded-xl border border-gray-200 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#F7A600] flex items-center justify-center">
                    <span className="text-[7px] font-black text-white">B</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-700">Bybit P2P</span>
                </div>
                <div className="flex justify-between">
                  {bybit.buy && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">COMPRA</p>
                      <p className="text-xs font-black text-gray-600">Bs. {bybit.buy}</p>
                    </div>
                  )}
                  {bybit.sell && (
                    <div className="text-right">
                      <p className="text-[9px] text-green-600 font-bold">VENTA ★</p>
                      <p className="text-sm font-black text-green-700">Bs. {bybit.sell}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {binance && (binance.buy || binance.sell) && (
              <div className="bg-white rounded-xl border border-gray-200 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#F0B90B] flex items-center justify-center">
                    <span className="text-[7px] font-black text-black">₿</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-700">Binance P2P</span>
                </div>
                <div className="flex justify-between">
                  {binance.buy && (
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold">COMPRA</p>
                      <p className="text-xs font-black text-gray-600">Bs. {binance.buy}</p>
                    </div>
                  )}
                  {binance.sell && (
                    <div className="text-right">
                      <p className="text-[9px] text-green-600 font-bold">VENTA ★</p>
                      <p className="text-sm font-black text-green-700">Bs. {binance.sell}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!manualRateMode && (
          <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FaCheckCircle className="text-green-600" size={10} />
              <span className="text-[10px] font-bold text-green-800">TC aplicado (venta)</span>
            </div>
            <span className="text-sm font-black text-green-700">1 USDT = Bs. {exchangeRate?.toFixed(2)}</span>
          </div>
        )}

        {rateUpdatedAt && !manualRateMode && (
          <p className="text-[9px] text-gray-400 text-right">Actualizado: {rateUpdatedAt.toLocaleTimeString()}</p>
        )}
      </div>
    );
  };

  useEffect(() => { if (paymentMethod === 'crypto' && !exchangeRate) fetchExchangeRate(); }, [paymentMethod, exchangeRate]);

  const amountUSDT = paymentData.amount && exchangeRate ? parseFloat(paymentData.amount) / exchangeRate : 0;
  const amountUSDTStr = amountUSDT.toFixed(2);
  const totalUSDT = exchangeRate ? (total / exchangeRate).toFixed(2) : '0.00';
  const remaining = paymentData.amount ? (total - parseFloat(paymentData.amount)).toFixed(2) : total.toFixed(2);
  const isTooLow = paymentMethod === 'crypto' && paymentData.amount && amountUSDT < MIN_USDT;
  const minBs = exchangeRate ? (MIN_USDT * exchangeRate).toFixed(2) : null;

  const handleInput = (e) => {
    const { name, value } = e.target;
    if (name === "amount" && parseFloat(value) > total) setAmountError(`Máximo Bs. ${total.toFixed(2)}`);
    else setAmountError('');
    setPaymentData(p => ({ ...p, [name]: value }));
  };

  const handleFile = (e) => {
    const f = e.target.files[0]; setImageFile(f);
    if (f) { const r = new FileReader(); r.onloadend = () => setImagePreview(r.result); r.readAsDataURL(f); }
    else setImagePreview(null);
  };

  const copyAddr = () => { navigator.clipboard.writeText(order?.address || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const toCents = (v) => { const n = Number(v); return Number.isNaN(n) ? 0 : Math.round(n * 100); };

  const ensurePolygon = async () => {
    if (!window.ethereum) throw new Error("MetaMask no está instalado");
    const p = new ethers.BrowserProvider(window.ethereum);
    const net = await p.getNetwork();
    if (Number(net.chainId) !== POLYGON_CHAIN_ID) {
      try { await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x89" }] }); }
      catch (e) {
        if (e.code === 4902) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x89", chainName: "Polygon Mainnet", nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 }, rpcUrls: ["https://polygon-rpc.com"], blockExplorerUrls: ["https://polygonscan.com"] }] });
        else throw new Error("Cambia a Polygon");
      }
    }
    return await (new ethers.BrowserProvider(window.ethereum)).getSigner();
  };

  const sendToBlockchain = async (regId, amount, payer) => {
    const signer = await ensurePolygon();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    setIsBlockchainProcessing(true); setStatus("Registrando en Polygon...");
    const tx = await contract.registerPayment(regId, toCents(amount), payer);
    setStatus("Esperando confirmación...");
    const receipt = await tx.wait();
    setStatus("Guardado en blockchain"); setBlockchainSuccess(true);
    return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true); setSaveSuccess(false);
      let imageUrl = "";
      if (imageFile) {
        const fd = new FormData(); fd.append("image", imageFile);
        const r = await axios.post(API_URL + "/whatsapp/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = r.data.imageUrl;
      }
      let bcHash = null, bcBlock = null;
      try {
        const r = await sendToBlockchain(String(orderId), paymentData.amount, paymentData.payer);
        bcHash = r.transactionHash; bcBlock = r.blockNumber;
      } catch (err) { setStatus("Error: " + err.message); setIsSaving(false); setIsBlockchainProcessing(false); return; }

      const res = await axios.post(API_URL + "/whatsapp/order/pay", {
        saleImage: imageUrl, total: paymentData.amount, note: paymentData.payer,
        orderId, numberOrden: "", paymentStatus: "paid", id_client: idClient,
        sales_id: salesID, delivery_id: null, id_owner: user,
        paymentType: paymentMethod === 'normal' ? normalPaymentType : 'crypto',
        network: paymentMethod === 'crypto' ? selectedNetwork : 'polygon',
        txHash: bcHash, blockNumber: bcBlock, contractAddress: CONTRACT_ADDRESS,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.status === 200) {
        onSave(); setPaymentData({ amount: '', payer: '' });
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(async (pos) => {
          await axios.post(API_URL + "/whatsapp/order/track", {
            orderId, eventType: "Pago Ingresado", triggeredBySalesman: id_user,
            triggeredByDelivery: "", triggeredByUser: "", location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        });
        setSaveSuccess(true);
        setTimeout(() => { setIsSaving(false); setSaveSuccess(false); setIsBlockchainProcessing(false); setBlockchainSuccess(false); setStatus(""); onClose(); }, 2000);
      }
    } catch (e) { setIsSaving(false); setIsBlockchainProcessing(false); }
  };

  const createPayment = async () => {
    try {
      const res = await axios.post(API_URL + "/whatsapp/create", { amount: amountUSDTStr, network: selectedNetwork }, { headers: { Authorization: `Bearer ${token}` } });
      const newOrder = res.data || {};
      if (newOrder.address) {
        const prov = new ethers.JsonRpcProvider(RPC[selectedNetwork]);
        const c = new ethers.Contract(USDT_ADDR[selectedNetwork], ERC20_ABI, prov);
        const bal = await c.balanceOf(newOrder.address);
        setInitialBalance(Number(bal) / Math.pow(10, USDT_DEC[selectedNetwork]));
      }
      setOrder(newOrder); setPayment(res.data); setTxStatus('waiting'); setElapsedTime(0); setTxHash(null); setTxStartTime(Date.now());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!order || txStatus === 'confirmed' || txStatus === 'failed') return;
    if (!txStartTime) setTxStartTime(Date.now());
    elapsedRef.current = setInterval(() => setElapsedTime(p => p + 1), 1000);
    const check = async () => {
      try {
        if (initialBalance === null) return;
        const prov = new ethers.JsonRpcProvider(RPC[selectedNetwork]);
        const c = new ethers.Contract(USDT_ADDR[selectedNetwork], ERC20_ABI, prov);
        const bal = await c.balanceOf(order.address);
        const cur = Number(bal) / Math.pow(10, USDT_DEC[selectedNetwork]);
        const expected = parseFloat(amountUSDTStr);
        const received = cur - initialBalance;
        if (received >= expected * 0.95) {
          const block = await prov.getBlockNumber();
          const events = await c.queryFilter(c.filters.Transfer(null, order.address), block - 5000, block);
          if (events.length > 0) {
            const last = events[events.length - 1];
            const conf = block - last.blockNumber;
            setTxHash(last.transactionHash);
            if (conf >= 12) { setTxStatus('confirmed'); setTxConfirmations(conf); setPaid(true); clearInterval(pollingRef.current); clearInterval(elapsedRef.current); }
            else if (conf >= 1) { setTxStatus('confirming'); setTxConfirmations(conf); }
            else setTxStatus('detected');
          } else { setTxStatus('confirmed'); setPaid(true); clearInterval(pollingRef.current); clearInterval(elapsedRef.current); }
        }
      } catch (e) {}
    };
    check(); pollingRef.current = setInterval(check, 8000);
    return () => { clearInterval(pollingRef.current); clearInterval(elapsedRef.current); };
  }, [order, txStatus, selectedNetwork, initialBalance, amountUSDTStr]);

  const canSaveNormal = paymentData.amount && paymentData.payer && !amountError && !isSaving;
  const canSaveCrypto = canSaveNormal && !isTooLow && order && txStatus === 'confirmed';
  const canSave = paymentMethod === 'normal' ? canSaveNormal : canSaveCrypto;

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

          <div className="p-5 bg-gradient-to-r from-[#D3423E] to-red-600 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                {paymentMethod === 'crypto' ? <><FaWallet /> Pago Blockchain</> : <><FaMoneyBillWave /> Registrar Pago</>}
              </h3>
              <p className="text-xs text-red-100 font-medium mt-0.5">Pedido #{orderId?.slice(-6)}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center"><FaTimes /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Saldo por pagar</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">Bs. {total.toFixed(2)}</p>
                  {paymentMethod === 'crypto' && exchangeRate && (
                    <p className="text-sm text-green-700 font-bold mt-1">≈ {totalUSDT} USDT</p>
                  )}
                </div>
                {paymentData.amount && !amountError && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Quedará</p>
                    <p className={`text-2xl font-black mt-1 ${parseFloat(remaining) === 0 ? 'text-green-600' : 'text-amber-600'}`}>Bs. {remaining}</p>
                  </div>
                )}
              </div>
              {paymentMethod === 'crypto' && <ExchangeRateWidget />}
            </div>

            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button onClick={() => setPaymentMethod('normal')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${paymentMethod === 'normal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <FaMoneyBillWave size={14} /> Pago Normal
              </button>
              <button onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${paymentMethod === 'crypto' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                <FaWallet size={14} /> Cripto
              </button>
            </div>

            {paymentMethod === 'normal' && (
              <>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Tipo de pago</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PAY_TYPES.map(t => (
                      <button key={t.key} onClick={() => setNormalPaymentType(t.key)}
                        className={`p-2.5 rounded-xl border-2 text-center transition-all ${normalPaymentType === t.key ? 'border-[#D3423E] bg-red-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-lg">{t.icon}</span>
                        <p className="text-[10px] font-bold text-gray-700 mt-1">{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Importe (Bs.)</label>
                    <input type="number" name="amount" value={paymentData.amount} onChange={handleInput} max={total}
                      className={`w-full px-3 py-3 border-2 ${amountError ? 'border-red-400' : 'border-gray-200'} rounded-xl text-gray-900 font-bold focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100`}
                      placeholder="0.00" />
                    {amountError && <p className="text-xs text-red-600 mt-1 font-medium">{amountError}</p>}
                    {!paymentData.amount && (
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={() => setPaymentData(p => ({ ...p, amount: total.toFixed(2) }))} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full text-gray-700 font-bold">Total</button>
                        <button onClick={() => setPaymentData(p => ({ ...p, amount: (total / 2).toFixed(2) }))} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full text-gray-700 font-bold">50%</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Quién paga</label>
                    <input type="text" name="payer" value={paymentData.payer} onChange={handleInput}
                      className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-[#D3423E] focus:ring-2 focus:ring-red-100"
                      placeholder="Nombre" />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'crypto' && (
              <>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Red de pago</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(NETWORKS).map(([k, n]) => {
                      const fee = rateData?.fees?.[k];
                      return (
                        <button key={k} onClick={() => setSelectedNetwork(k)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${selectedNetwork === k ? 'border-[#D3423E] bg-red-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                          <p className="font-black text-sm" style={{ color: n.color }}>{n.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {fee !== null && fee !== undefined ? `$${fee < 0.01 ? '<0.01' : fee.toFixed(4)} USD` : n.estimatedFee}
                          </p>
                          {fee !== null && fee !== undefined && fee < 0.05 && <span className="text-[9px] text-green-600 font-bold">✓ Muy bajo</span>}
                          {fee !== null && fee !== undefined && fee >= 5 && <span className="text-[9px] text-amber-600 font-bold">⚠ Alto</span>}
                          {selectedNetwork === k && <p className="text-[10px] text-[#D3423E] font-bold mt-1">✓ Seleccionada</p>}
                        </button>
                      );
                    })}
                  </div>
                  {rateData?.fees && (
                    <p className="text-[9px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <FaCheckCircle size={8} className="text-green-500" />
                      Comisiones reales de la red en tiempo real
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Importe (Bs.)</label>
                    <input type="number" name="amount" value={paymentData.amount} onChange={handleInput} max={total}
                      className={`w-full px-3 py-3 border-2 ${amountError || isTooLow ? 'border-red-400' : 'border-gray-200'} rounded-xl text-gray-900 font-bold focus:outline-none focus:border-[#D3423E]`}
                      placeholder={minBs ? `Mín Bs. ${minBs}` : '0.00'} />
                    {paymentData.amount && exchangeRate && <p className={`text-xs font-bold mt-1 ${isTooLow ? 'text-red-600' : 'text-green-700'}`}>≈ {amountUSDTStr} USDT</p>}
                    {isTooLow && <p className="text-[10px] text-red-600 mt-1">Mínimo {MIN_USDT} USDT (≈ Bs. {minBs})</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">Quién paga</label>
                    <input type="text" name="payer" value={paymentData.payer} onChange={handleInput}
                      className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-[#D3423E]"
                      placeholder="Nombre" />
                  </div>
                </div>

                {!order && paymentData.amount && paymentData.payer && !amountError && !isTooLow && (
                  <button onClick={createPayment} className="w-full py-3 bg-gradient-to-r from-[#8247E5] to-purple-600 text-white font-black rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <FaWallet size={14} /> Generar dirección de pago
                  </button>
                )}

                {order && (
                  <>
                    <div className={`rounded-xl border-2 p-4 ${txStatus === 'confirmed' ? 'bg-green-50 border-green-300' : txStatus === 'failed' ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xl ${txStatus !== 'confirmed' && txStatus !== 'failed' ? 'animate-pulse' : ''}`}>
                            {txStatus === 'confirmed' ? '✅' : txStatus === 'failed' ? '❌' : txStatus === 'detected' ? '🔍' : txStatus === 'confirming' ? '⚙️' : '⏳'}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-gray-900">
                              {txStatus === 'confirmed' ? 'Confirmado' : txStatus === 'detected' ? 'Detectado' : txStatus === 'confirming' ? `${txConfirmations} confirmaciones` : 'Esperando pago'}
                            </p>
                          </div>
                        </div>
                        {txStatus !== 'confirmed' && <p className="font-mono font-bold text-gray-700">{fmtTime(elapsedTime)}</p>}
                      </div>
                      <div className="flex gap-1">{['waiting', 'detected', 'confirming', 'confirmed'].map((s, i) => (
                        <div key={s} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: i <= ['waiting', 'detected', 'confirming', 'confirmed'].indexOf(txStatus) ? (txStatus === 'confirmed' ? '#22c55e' : '#3b82f6') : '#d1d5db' }} />
                      ))}</div>
                      {txHash && (
                        <a href={NETWORKS[selectedNetwork].explorerUrl + txHash} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1 font-bold">
                          <FaExternalLinkAlt size={9} /> Ver en explorador
                        </a>
                      )}
                    </div>

                    {txStatus !== 'confirmed' && (
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                        <p className="text-sm font-bold text-gray-900 mb-3">Envía <span className="text-green-700">{amountUSDTStr} USDT</span> a:</p>
                        {order.address && (
                          <div className="bg-white p-3 rounded-xl inline-block shadow-sm mb-3 border border-gray-100">
                            <QRCodeCanvas value={String(order.address)} size={180} />
                          </div>
                        )}
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Dirección:</p>
                          <p className="text-xs text-gray-900 font-mono break-all">{order.address}</p>
                          <button onClick={copyAddr} className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 mx-auto">
                            {copied ? <><FaCheckCircle size={10} /> Copiado</> : <><FaCopy size={10} /> Copiar</>}
                          </button>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-left">
                          <p className="text-[10px] text-amber-800 font-black flex items-center gap-1"><FaExclamationTriangle size={10} /> Solo USDT en {NETWORKS[selectedNetwork].name}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
                Comprobante {normalPaymentType === 'cash' && paymentMethod === 'normal' ? '(opcional)' : ''}
              </p>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:border-[#D3423E] hover:bg-red-50/30 transition-all">
                  <FaCamera className="text-gray-400 mb-1" size={18} />
                  <span className="text-xs text-gray-500 font-bold">Subir imagen</span>
                  <input type="file" accept=".png,.jpg,.jpeg" onChange={handleFile} className="hidden" />
                </label>
              ) : (
                <div className="relative bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <img src={imagePreview} alt="" className="max-h-32 mx-auto rounded-lg" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm">
                    <FaTrash size={10} />
                  </button>
                </div>
              )}
            </div>

            {status && (
              <div className={`rounded-xl p-3 text-center text-sm font-bold ${status.includes("Error") ? 'bg-red-50 text-red-700' : status.includes("Guardado") || status.includes("guardado") ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                {status}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            {!isBlockchainProcessing && !blockchainSuccess && (
              <>
                <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50">Cancelar</button>
                <button onClick={handleSave} disabled={!canSave}
                  className={`flex-1 py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all ${canSave ? 'bg-gradient-to-r from-[#D3423E] to-red-600 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed'}`}>
                  {isSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                    : saveSuccess ? <><FaCheckCircle /> Guardado</>
                    : paymentMethod === 'crypto' && txStatus !== 'confirmed' ? 'Esperando confirmación...'
                    : 'Confirmar Pago'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientPaymentDialog;