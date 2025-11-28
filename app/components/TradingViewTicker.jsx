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
            
             { "proName": "ASX:CYM", "title": "Cyprium Metals" },
              { "proName": "ASX:LKY", "title": "Locksley Resources" },
    { "proName": "ASX:GSM", "title": "Golden State Mining" },
    { "proName": "ASX:AWJ", "title": "Auric Mining" },
     { "proName": "ASX:AIS", "title": "Aeris Resources" },
             { "proName": "ASX:GMD", "title": "Genesis Minerals" },
          { "proName": "ASX:SVL", "title": "Silver Mines" },
          { "proName": "ASX:NIC", "title": "Nickel Industries" },
           { "proName": "ASX:CMM", "title": "Capricorn Metals" },
            { "proName": "NYSE:AA", "title": "Alcoa" },
            { "proName": "ASX:S32", "title": "South32" }, 
             { "proName": "ASX:LTR", "title": "Liontown Resources" },
              { "proName": "ASX:PLS", "title": "Pilbara Minerals" },
          { "proName": "ASX:EVN", "title": "Evolution Mining" },
           { "proName": "ASX:RMS", "title": "Ramelius Resources" },
          { "proName": "ASX:RRL", "title": "Regis Resources" },
            { "proName": "ASX:RIO", "title": "RIO TINTO" },
             { "proName": "ASX:ILU", "title": "Iluka Resources" },
          { "proName": "ASX:LYC", "title": "Lynas" },
          { "proName": "ASX:BHP", "title": "BHP" },
          { "proName": "ASX:FMG", "title": "FMG" },
          { "proName": "ASX:NST", "title": "NST" },
          { "proName": "MIL:1SAND", "title": "Sandvik" },
          { "proName": "ASX:IGO", "title": "IGO" },
          { "proName": "NYSE:AU", "title": "AngloGold" },
          { "proName": "ASX:SFR", "title": "Sandfire" },
          { "proName": "ASX:WAF", "title": "West African Resources" },
          { "proName": "ASX:CHN", "title": "Chalice Mining" },
          { "proName": "ASX:BOE", "title": "Boss Energy" },
          { "proName": "ASX:PDN", "title": "Paladin Energy" },
          { "proName": "ASX:DYL", "title": "Deep Yellow" }
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
