export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3056";
export const GOOGLE_API_KEY =process.env.REACT_APP_GOOGLE_API_KEY;
export const UPLOAD_TIME=50000;
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS; //18/15/26
export const DESTINATION_WALLET_ADDRESS = process.env.REACT_APP_DESTINATION_WALLET_ADDRESS;
export const USDT_CONTRACT_ADDRESS=process.env.REACT_APP_USDT_CONTRACT_ADDRESS;
export const CONTRACT_CHAIN_ID = process.env.REACT_APP_CONTRACT_CHAIN_ID;
export const GOOGLE_MAPS_ID = process.env.REACT_APP_GOOGLE_MAPS_ID;

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "orderId", "type": "string" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "string", "name": "payer", "type": "string" }
    ],
    "name": "registerPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPaymentsCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "orderId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "payer", "type": "string" },
      { "indexed": false, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "PaymentRegistered",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }],
    "name": "getPayment",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },     // orderId
      { "internalType": "uint256", "name": "", "type": "uint256" },   // amount
      { "internalType": "string", "name": "", "type": "string" },     // payer
      { "internalType": "address", "name": "", "type": "address" },   // sender
      { "internalType": "uint256", "name": "", "type": "uint256" }    // timestamp
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const USDT_CONTRACTS = {
  polygon: "0xc2132D05D31c914a87C6611C10748AaCBaF9dAC",  // USDT oficial Polygon
  ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT oficial Ethereum
  bsc: "0x55d398326f99059fF775485246999027B3197955",      // USDT oficial BSC
};
