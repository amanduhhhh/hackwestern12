import yfinance as yf
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from tool_generator import tool_function

logger = logging.getLogger(__name__)


class StocksDataFetcher:
    def __init__(self, alpha_vantage_key: str = ""):
        self.alpha_vantage_key = alpha_vantage_key

    @tool_function(
        description="Get portfolio performance data for multiple stock symbols including current price, position value, and gain/loss percentage",
        params={
            "symbols": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of stock ticker symbols (e.g., ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'])"
            }
        }
    )
    def fetch_portfolio_data(self, symbols: List[str]) -> Optional[Dict[str, Any]]:
        try:
            portfolio = []
            total = 0

            for symbol in symbols:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="1mo")

                if hist.empty:
                    continue

                price = hist["Close"].iloc[-1]
                shares = 10
                value = price * shares
                total += value
                gain = (
                    ((price - hist["Close"].iloc[0]) / hist["Close"].iloc[0] * 100)
                    if len(hist) > 1
                    else 0
                )

                portfolio.append(
                    {
                        "symbol": symbol,
                        "name": ticker.info.get("longName", symbol),
                        "shares": shares,
                        "current_price": round(price, 2),
                        "position_value": round(value, 2),
                        "gain_percent": round(gain, 2),
                    }
                )

            return {
                "portfolio": portfolio,
                "total_value": round(total, 2),
                "last_updated": datetime.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to fetch portfolio data: {e}")
            return None

    @tool_function(
        description="Get current market overview including major indices (S&P 500, NASDAQ, DOW) and top gaining/losing stocks",
        params={}
    )
    def fetch_market_trends(self) -> Optional[Dict[str, Any]]:
        try:
            indices = {}
            for name, sym in {
                "S&P 500": "^GSPC",
                "NASDAQ": "^IXIC",
                "DOW": "^DJI",
            }.items():
                info = yf.Ticker(sym).info
                indices[name] = {
                    "value": info.get("regularMarketPrice", 0),
                    "change": info.get("regularMarketChangePercent", 0),
                }

            trending = []
            for sym in ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META"]:
                info = yf.Ticker(sym).info
                trending.append(
                    {
                        "symbol": sym,
                        "price": info.get("regularMarketPrice", 0),
                        "change": round(info.get("regularMarketChangePercent", 0), 2),
                    }
                )

            trending.sort(key=lambda x: x["change"], reverse=True)

            return {
                "indices": indices,
                "top_gainers": [s for s in trending if s["change"] > 0][:3],
                "top_losers": [s for s in trending if s["change"] < 0][:3],
                "last_updated": datetime.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to fetch market trends: {e}")
            return None

    @tool_function(
        description="Get real-time stock price, volume, market cap, and year performance for a ticker symbol",
        params={
            "symbol": {
                "type": "string",
                "description": "Stock ticker symbol (e.g., AAPL, TSLA, GOOGL, MSFT, AMZN, NVDA, META)"
            }
        }
    )
    def fetch_stock_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="1y")

            year_perf = 0
            if not hist.empty and len(hist) > 0:
                year_perf = round(
                    (
                        (hist["Close"].iloc[-1] - hist["Close"].iloc[0])
                        / hist["Close"].iloc[0]
                    )
                    * 100,
                    2,
                )

            return {
                "symbol": symbol,
                "name": info.get("longName", symbol),
                "current_price": info.get("regularMarketPrice", 0),
                "change_percent": info.get("regularMarketChangePercent", 0),
                "market_cap": info.get("marketCap", 0),
                "year_performance": year_perf,
                "last_updated": datetime.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to fetch stock info for {symbol}: {e}")
            return None

    def is_authenticated(self) -> bool:
        return True
