import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import Select from "react-select";
import usdtLogo from "../../icons/usdt-logo.png";
import { USDT_CONTRACT_ADDRESS } from "../../config";

const networks = [
    { value: "polygon", label: "Polygon (MATIC)", chainId: 137, rpc: "https://polygon-rpc.com" },
    { value: "bsc", label: "BNB Smart Chain", chainId: 56, rpc: "https://bsc-dataseed.binance.org" },
    { value: "ethereum", label: "Ethereum", chainId: 1, rpc: "https://eth.llamarpc.com" }
];

const PaymentWithUSDTComponent = () => {
    const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
    const [copied, setCopied] = useState(false);
    const qrValue = `ethereum:${USDT_CONTRACT_ADDRESS}@${selectedNetwork.chainId}`;

    return (
        <div className="p-4 space-y-4 border border-gray-200 rounded-2xl shadow-sm bg-white">
            <div className="flex justify-between items-center">
                <label className="font-bold text-gray-900">Red</label>
                <Select
                    value={selectedNetwork}
                    onChange={(option) => setSelectedNetwork(option)}
                    options={networks}
                    className="w-2/3 text-gray-900"
                    classNamePrefix="select"
                    styles={customStyles}
                />
            </div>

            <div className="relative w-fit mx-auto">
                <QRCodeCanvas value={qrValue} size={200} level="H" includeMargin={true} />
                <img
                    src={usdtLogo}
                    alt="USDT"
                    className="absolute top-[50%] left-[50%] w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-1"
                />
            </div>
            <div className="bg-gray-100 text-gray-900 rounded-xl px-3 py-2 text-sm flex items-center justify-between">
                <span className="truncate text-gray-900">{USDT_CONTRACT_ADDRESS}</span>
                <CopyToClipboard text={USDT_CONTRACT_ADDRESS} onCopy={() => setCopied(true)}>
                    <button className="ml-2">
                        {copied ? <FaCheck className="text-green-500" /> : <FaRegCopy />}
                    </button>
                </CopyToClipboard>
            </div>

            <p className="text-xs text-center text-gray-500">
                Escanea con Binance, Trust Wallet o MetaMask usando la red {selectedNetwork.label}.
            </p>
        </div>
    );
};

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        backgroundColor: state.hasValue ? "#D3423E" : "white",
        borderColor: "#d1d5db",
        color: state.hasValue ? "#fff" : "#000",
        padding: "2px",
        borderRadius: "0.75rem",
        boxShadow: "none",
        "&:hover": {
            borderColor: "#D3423E"
        }
    }),
    singleValue: (provided, state) => ({
        ...provided,
        color: state.hasValue ? "#fff" : "#000",
        fontWeight: "bold"
    }),
    input: (provided) => ({
        ...provided,
        color: "#fff"
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#f3f4f6"
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 10
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#dc2626" : state.isFocused ? "#fecaca" : "white",
        color: state.isSelected ? "#fff" : "#000",
        fontWeight: state.isSelected ? "bold" : "normal",
        cursor: "pointer"
    })
};

export default PaymentWithUSDTComponent;
