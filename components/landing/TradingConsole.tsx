import React, { useState, useEffect, useMemo } from 'react';
import {
    Calculator,
    TrendingUp,
    Zap,
    Target,
    ChevronDown,
    Layers,
    ShieldCheck,
    Activity,
    ArrowUpRight,
    Maximize2,
    RefreshCcw,
    BarChart3,
    Bot,
    Radio,
    Clock,
    LayoutGrid
} from 'lucide-react';

// Simplified type for Trading Asset
interface Asset {
    symbol: string;
    name: string;
    type: 'forex' | 'index' | 'crypto';
    pipSize: number; // 0.0001 for most, 0.01 for JPY
    contractSize: number; // 100000 for FX, 1 for Crypto/Indices
    basePrice: number;
    volatility: number;
}

const ASSETS: Asset[] = [
    { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', pipSize: 0.0001, contractSize: 100000, basePrice: 1.0854, volatility: 0.00005 },
    { symbol: 'GBPUSD', name: 'Pound / US Dollar', type: 'forex', pipSize: 0.0001, contractSize: 100000, basePrice: 1.2678, volatility: 0.00006 },
    { symbol: 'USDJPY', name: 'Dollar / Yen', type: 'forex', pipSize: 0.01, contractSize: 100000, basePrice: 150.12, volatility: 0.01 },
    { symbol: 'AUDUSD', name: 'Aussie / Dollar', type: 'forex', pipSize: 0.0001, contractSize: 100000, basePrice: 0.6543, volatility: 0.00004 },
    { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'forex', pipSize: 0.1, contractSize: 100, basePrice: 2032.45, volatility: 0.15 },
    { symbol: 'NAS100', name: 'Nasdaq 100', type: 'index', pipSize: 1, contractSize: 1, basePrice: 18050.25, volatility: 1.5 },
    { symbol: 'US30', name: 'Dow Jones 30', type: 'index', pipSize: 1, contractSize: 1, basePrice: 38950.80, volatility: 2.0 },
    { symbol: 'BTCUSD', name: 'Bitcoin / Dollar', type: 'crypto', pipSize: 1, contractSize: 1, basePrice: 51840.00, volatility: 15.0 },
];

export const TradingConsole: React.FC = () => {
    const [activeAsset, setActiveAsset] = useState<Asset>(ASSETS[0]);
    const [balance, setBalance] = useState(10000);
    const [riskPercent, setRiskPercent] = useState(1);
    const [slPips, setSlPips] = useState(20);
    const [entryPrice, setEntryPrice] = useState(ASSETS[0].basePrice);
    const [slPrice, setSlPrice] = useState(ASSETS[0].basePrice - (20 * ASSETS[0].pipSize));
    const [isPriceMode, setIsPriceMode] = useState(false);
    const [livePrice, setLivePrice] = useState(ASSETS[0].basePrice);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [journal, setJournal] = useState<any[]>([]);
    const [xp, setXp] = useState(0);

    // Real-time price simulation (mocked for now, will connect to WebSocket later)
    useEffect(() => {
        setLivePrice(activeAsset.basePrice);
    }, [activeAsset]);

    useEffect(() => {
        const interval = setInterval(() => {
            setLivePrice(prev => prev + (Math.random() - 0.5) * activeAsset.volatility);
        }, 2000);
        return () => clearInterval(interval);
    }, [activeAsset.volatility]);

    // Update prices if SL Pips changed in pips mode
    useEffect(() => {
        if (!isPriceMode) {
            const priceShift = slPips * activeAsset.pipSize;
            setSlPrice(entryPrice - priceShift);
        }
    }, [slPips, entryPrice, isPriceMode, activeAsset]);

    // Update SL Pips if prices changed in price mode
    useEffect(() => {
        if (isPriceMode) {
            const diff = Math.abs(entryPrice - slPrice);
            setSlPips(Math.round(diff / activeAsset.pipSize));
        }
    }, [entryPrice, slPrice, isPriceMode, activeAsset]);

    // Comprehensive Calculation Logic
    const results = useMemo(() => {
        const riskAmount = (balance * riskPercent) / 100;

        // pipValuePerLot calculation
        // If USD is NOT the quote currency (e.g., USDJPY), we need to convert to USD
        let pipValuePerLot = activeAsset.contractSize * activeAsset.pipSize;

        // Handle JPY conversion (Quote currency is JPY, we need it in USD)
        if (activeAsset.symbol.endsWith('JPY')) {
            pipValuePerLot = (activeAsset.pipSize / livePrice) * activeAsset.contractSize;
        }

        // lotSize = riskAmount / (SL_Pips * Pip_Value_Per_Lot)
        const lotSize = slPips > 0 ? riskAmount / (slPips * pipValuePerLot) : 0;

        return {
            riskAmount: riskAmount.toFixed(2),
            lots: lotSize.toFixed(2),
            pipValue: (lotSize * pipValuePerLot).toFixed(2)
        };
    }, [balance, riskPercent, slPips, activeAsset, livePrice]);

    return (
        <div className="grid grid-cols-12 gap-6 items-start">
            {/* PROFESSIONAL CHART INTERFACE (TradingView Style Mockup) */}
            <div className="col-span-12 lg:col-span-8 bg-[#121214] border border-white/10 rounded-[3.5rem] shadow-2xl overflow-hidden group">
                {/* Pair Selector Strip */}
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/40">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                        {ASSETS.map((asset) => (
                            <button
                                key={asset.symbol}
                                onClick={() => {
                                    setActiveAsset(asset);
                                    setEntryPrice(livePrice); // Sync entry to live price on change
                                }}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeAsset.symbol === asset.symbol
                                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                                    : 'text-slate-600 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {asset.symbol}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-10 pl-8 border-l border-white/5">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Market Price</p>
                            <p className={`text-2xl font-black italic tracking-tighter ${Math.random() > 0.5 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {livePrice.toFixed(activeAsset.pipSize < 0.01 ? 5 : 3)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual Chart Area */}
                <div className="p-10 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Direct Market Feed</h3>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                            {['1M', '5M', '15M', '1H', '4H', 'D'].map(tf => (
                                <button key={tf} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-colors ${tf === '1H' ? 'bg-[#D4AF37] text-black' : 'text-slate-600 hover:text-white'}`}>{tf}</button>
                            ))}
                        </div>
                    </div>

                    {/* REAL TRADING VIEW WIDGET */}
                    <div className="h-[420px] w-full relative overflow-hidden bg-[#0a0a0b] border border-white/5 rounded-3xl">
                        <iframe
                            key={activeAsset.symbol}
                            src={`https://s.tradingview.com/widgetembed/?symbol=${activeAsset.symbol === 'NAS100' ? 'NDX' : activeAsset.symbol === 'US30' ? 'DJI' : activeAsset.symbol}&interval=1&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=drealtiesfx&utm_medium=widget&utm_campaign=chart`}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allowtransparency="true"
                        />
                    </div>

                    {/* Expert Insights */}
                    <div className="bg-black/60 border border-white/5 rounded-3xl p-6 flex items-center gap-6 group/mentor">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[8px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Trading Desk Intelligence</h4>
                            <p className="text-[10px] font-bold text-slate-400 italic">
                                {Number(results.lots) > 5 ? "WARNING: High positional exposure detected. Consider equity hedge." : "Market liquidity profile is stable. Maintain 1:2 risk-to-reward parameters."}
                            </p>
                        </div>
                        <Radio className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                    </div>
                </div>

                {/* LEAD MAGNET: MINI JOURNAL & NEWS FEED */}
                <div className="p-10 bg-black/40 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Recent Logs (Journal Starter) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Recent Trade History</h4>
                            </div>
                            <span className="text-[8px] font-bold text-slate-600 uppercase">{journal.length}/5 Demo Logs</span>
                        </div>
                        <div className="space-y-2">
                            {journal.length === 0 ? (
                                <div className="py-8 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] font-bold text-slate-600 italic">No executions logged in this session.</p>
                                </div>
                            ) : (
                                journal.map((log, i) => (
                                    <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group/log animate-in slide-in-from-left-2 transition-all hover:bg-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                            <span className="text-[10px] font-black text-white">{log.pair}</span>
                                            <span className="text-[9px] font-bold text-slate-500">{log.lots} Lots</span>
                                        </div>
                                        <span className="text-[9px] font-black text-red-500/80 italic">-${log.risk}</span>
                                    </div>
                                ))
                            )}
                            {journal.length >= 5 && (
                                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-center">
                                    <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest leading-loose">
                                        Session Journal Full<br />
                                        <span className="text-white">Register for Elite Cohort to unlock unlimited cloud storage</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Institutional News (Dummy Data for now) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Key Market Events</h4>
                        </div>
                        <div className="space-y-3">
                            <NewsItem title="FOMC Minutes: Hawkish Sentiment Persists" impact="High" />
                            <NewsItem title="ETH/BTC Ratio Hits Critical Support Level" impact="Medium" />
                            <NewsItem title="Gold Technicals Hint at Bullish Inversion" impact="Low" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RISK ENGINE PANEL */}
            <div className="col-span-12 lg:col-span-4 lg:pl-4 space-y-6 h-full">
                <div className="bg-[#121214] border border-white/10 rounded-[3.5rem] p-10 shadow-2xl h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Calculator className="w-6 h-6 text-[#D4AF37]" />
                            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Position Calculator</h2>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            Live Mode | {xp} XP Earned
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        {/* Account Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Capital (USD)</label>
                                <input
                                    type="number"
                                    value={balance}
                                    onChange={e => setBalance(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/5 px-5 py-3.5 rounded-2xl text-lg font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Risk %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={riskPercent}
                                        onChange={e => setRiskPercent(Number(e.target.value))}
                                        className="w-full bg-black/40 border border-white/5 px-5 py-3.5 rounded-2xl text-lg font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-700">%</div>
                                </div>
                            </div>
                        </div>

                        {/* Input Toggle: Pips vs Price */}
                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                            <button
                                onClick={() => setIsPriceMode(false)}
                                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${!isPriceMode ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10' : 'text-slate-600 hover:text-white'}`}
                            >
                                Distance (Pips)
                            </button>
                            <button
                                onClick={() => setIsPriceMode(true)}
                                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${isPriceMode ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10' : 'text-slate-600 hover:text-white'}`}
                            >
                                Structure (Price)
                            </button>
                        </div>

                        <div className="space-y-6">
                            {!isPriceMode ? (
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Stop Loss Distance</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            value={slPips}
                                            onChange={e => setSlPips(Number(e.target.value))}
                                            className="w-full bg-black/40 border border-white/5 px-5 py-4 rounded-2xl text-xl font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner"
                                        />
                                        <span className="absolute right-5 text-[10px] font-black text-[#D4AF37]">PIPS</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Entry Price</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={entryPrice}
                                            onChange={e => setEntryPrice(Number(e.target.value))}
                                            className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-2xl text-md font-black text-white outline-none focus:border-[#D4AF37]/40"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Stop Loss</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={slPrice}
                                            onChange={e => setSlPrice(Number(e.target.value))}
                                            className="w-full bg-black/40 border border-white/5 px-4 py-3 rounded-2xl text-md font-black text-white outline-none focus:border-[#D4AF37]/40"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Display */}
                        <div className="pt-8 border-t border-white/5 flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Calculated Exposure</p>
                            <div className="flex flex-col items-center">
                                <h3 className="text-[80px] font-black text-white italic tracking-tighter leading-none group-hover:scale-105 transition-transform">
                                    {results.lots}
                                </h3>
                                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mt-2">Recommended Units</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="bg-black/60 border border-white/5 p-5 rounded-2xl text-center">
                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Cash at Risk</p>
                                <span className="text-md font-black text-red-500 italic">${results.riskAmount}</span>
                            </div>
                            <div className="bg-black/60 border border-white/5 p-5 rounded-2xl text-center">
                                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Pip Value</p>
                                <span className="text-md font-black text-[#D4AF37] italic">${results.pipValue}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={() => {
                                if (journal.length < 5) {
                                    setJournal([...journal, { pair: activeAsset.symbol, lots: results.lots, risk: results.riskAmount }]);
                                    setXp(prev => prev + 50);
                                } else {
                                    // Trigger signup modal via event or prop (simplified here)
                                    alert("Upgrade to Elite Cohort to save more trades!");
                                }
                            }}
                            className="btn-gold-slide w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Target className="w-4 h-4" /> {journal.length >= 5 ? 'Unlock Pro Journal' : 'Log Execution Plan'}
                        </button>
                        <p className="text-[8px] text-zinc-700 font-bold uppercase text-center">
                            Earn Academy XP for every risk profile logged
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewsItem: React.FC<{ title: string, impact: 'High' | 'Medium' | 'Low' }> = ({ title, impact }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group/news hover:bg-white/10 transition-all">
        <span className="text-[9px] font-bold text-slate-300 group-hover:text-white truncate pr-4">{title}</span>
        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${impact === 'High' ? 'bg-red-500/20 text-red-500' :
            impact === 'Medium' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                'bg-emerald-500/20 text-emerald-500'
            }`}>{impact}</span>
    </div>
);
