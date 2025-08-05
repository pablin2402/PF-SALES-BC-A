export const API_URL = "http://localhost:3055"; 
export const GOOGLE_API_KEY ="AIzaSyBn4M7fGwSm8N7Ndje6_gU0AOjXKIsTyzs";
export const CONTRACT_DIRECTION="0xd9145CCE52D386f254917e481eB44e9943F39138";
export const UPLOAD_TIME=50000;
//export const API_URL = "http://18.223.136.136:3041"; 
export const CONTRACT_ADDRESS = "0xf245Dc3C202867E8E4C2e6eCCCddf204ee6EbF2F";
export const DESTINATION_WALLET_ADDRESS = "0x49A623323b37B62b7952142eA07B3c0B23f83650";
export const USDT_CONTRACT_ADDRESS="0x3813e82e6f7098b9583FC0F33a962D02018B6803";
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
