// TradingViewWidget.jsx
"use client";
import { useEffect, useRef, memo } from "react";

function TradingViewTicker() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          { "proName": "FX_IDC:EURUSD", "title": "EUR to USD" },
          { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
          { "proName": "ASX:RIO", "title": "RIO TINTO" },
          { "proName": "ASX:BHP", "title": "BHP" },
          { "proName": "OANDA:AUDUSD", "title": "AUD to USD" },
          { "proName": "ASX:FMG", "title": "FMG" },
          { "proName": "TVC:GOLD", "title": "Gold" },
          { "proName": "ASX:NST", "title": "NST" },
          { "proName": "MIL:1SAND", "title": "Sandvik" },
          { "proName": "ASX:IGO", "title": "IGO" },
          { "proName": "NYSE:AU", "title": "AngloGold" },
          { "proName": "ASX:SFR", "title": "Sandfire" }
        ],
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "adaptive",
        "showSymbolLogo": true,
        "locale": "en"
      }`;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="bg-slate-900/60 backdrop-blur">
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full px-4"
      >
        <div className="tradingview-widget-container__widget" />
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/markets/"
            rel="noopener nofollow"
            target="_blank"
          >
            Ticker tape
          </a>{" "}
          by TradingView
        </div>
      </div>
    </div>
  );
}

export default memo(TradingViewTicker);
