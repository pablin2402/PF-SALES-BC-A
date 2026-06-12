const axios = require("axios");

const getExchangeRate = async (req, res) => {
  try {
    const [buyRes, sellRes] = await Promise.all([
      axios.post("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
        fiat: "BOB", page: 1, rows: 10, tradeType: "BUY", asset: "USDT", countries: [], payTypes: [],
      }),
      axios.post("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
        fiat: "BOB", page: 1, rows: 10, tradeType: "SELL", asset: "USDT", countries: [], payTypes: [],
      }),
    ]);

    const buyPrices = (buyRes.data?.data || []).map(i => parseFloat(i.adv.price));
    const sellPrices = (sellRes.data?.data || []).map(i => parseFloat(i.adv.price));
    const all = [...buyPrices, ...sellPrices].filter(p => p > 0).sort((a, b) => a - b);

    if (all.length === 0) return res.json({ rate: 9.5, source: "fallback" });

    const trim = Math.floor(all.length * 0.2);
    const trimmed = all.slice(trim, all.length - trim);
    const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

    res.json({ rate: Math.round(avg * 100) / 100, source: "binance_p2p", prices: all.length });
  } catch (e) {
    res.json({ rate: 9.5, source: "fallback" });
  }
};

module.exports = { getExchangeRate };