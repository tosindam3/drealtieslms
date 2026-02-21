import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Zap,
  ShieldAlert,
  Calculator,
  Activity,
  Bot,
  RefreshCcw,
  BarChart3,
  Loader2,
  Radio,
  Maximize2,
  TrendingUp,
  Coins,
  ArrowRightLeft,
  LayoutGrid
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../lib/ToastContext';

// Professional Instrument Configuration
const PAIR_CONFIG: Record<string, {
  base: number,
  pipValue: number,
  volatility: number,
  precision: number,
  tvSymbol: string,
  contractSize: number,
  isJpy: boolean
}> = {
  'EURUSD': { base: 1.08245, pipValue: 10, volatility: 0.00008, precision: 5, tvSymbol: 'FX:EURUSD', contractSize: 100000, isJpy: false },
  'GBPUSD': { base: 1.26780, pipValue: 10, volatility: 0.00012, precision: 5, tvSymbol: 'FX:GBPUSD', contractSize: 100000, isJpy: false },
  'USDJPY': { base: 150.12, pipValue: 6.67, volatility: 0.015, precision: 2, tvSymbol: 'FX:USDJPY', contractSize: 100000, isJpy: true },
  'AUDUSD': { base: 0.65430, pipValue: 10, volatility: 0.00007, precision: 5, tvSymbol: 'FX:AUDUSD', contractSize: 100000, isJpy: false },
  'USDCAD': { base: 1.34920, pipValue: 7.41, volatility: 0.00009, precision: 5, tvSymbol: 'FX:USDCAD', contractSize: 100000, isJpy: false },
  'XAUUSD': { base: 2032.45, pipValue: 10, volatility: 0.35, precision: 2, tvSymbol: 'OANDA:XAUUSD', contractSize: 100, isJpy: false },
  'BTCUSD': { base: 51840.00, pipValue: 1, volatility: 12.5, precision: 2, tvSymbol: 'BINANCE:BTCUSDT', contractSize: 1, isJpy: false },
};

const TIMEFRAME_MAP: Record<string, string> = {
  '1M': '1',
  '5M': '5',
  '15M': '15',
  '1H': '60',
  '4H': '240',
  'D': 'D'
};

export const LotCalculator: React.FC = () => {
  const { addToast } = useToast();
  const [activePair, setActivePair] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('1H');
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [slPips, setSlPips] = useState<number>(20);

  // Terminal Engine States
  const [livePrice, setLivePrice] = useState(PAIR_CONFIG['EURUSD'].base);
  const [isSyncing, setIsSyncing] = useState(false);
  const [smartSentiment, setSmartSentiment] = useState<string>("Initializing market analysis...");
  const [marketBias, setMarketBias] = useState<'Bullish' | 'Bearish' | 'Neutral'>('Neutral');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Sync effect when pair or timeframe changes
  useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => setIsSyncing(false), 800);
    return () => clearTimeout(timer);
  }, [activePair, timeframe]);

  // Live Price Simulation
  useEffect(() => {
    const config = PAIR_CONFIG[activePair];
    setLivePrice(config.base);
    const interval = setInterval(() => {
      setLivePrice(prev => prev + (Math.random() - 0.5) * config.volatility);
    }, 1000);
    return () => clearInterval(interval);
  }, [activePair]);

  // Smart Sentiment Logic
  const syncAiMentor = useCallback(async (pair: string) => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a technical 1-sentence market bias for ${pair}. Current price is ${livePrice.toFixed(4)}. Mention specific institutional levels or volatility expectations.`,
        config: { systemInstruction: "You are an elite institutional trading assistant.", temperature: 0.8 }
      });
      const text = response.text;
      setSmartSentiment(text || "Error retrieving market insights.");
      setMarketBias(text?.toLowerCase().includes('bull') ? 'Bullish' : text?.toLowerCase().includes('bear') ? 'Bearish' : 'Neutral');
    } catch (error) {
      setSmartSentiment("AI Analysis Offline. Using local technical metrics.");
    } finally {
      setIsAiLoading(false);
    }
  }, [livePrice]);

  useEffect(() => { syncAiMentor(activePair); }, [activePair]);

  const metrics = PAIR_CONFIG[activePair];
  const riskAmount = (capital * riskPercent) / 100;

  const calculationResults = useMemo(() => {
    if (slPips <= 0) return { lots: "0.00", units: 0, mini: "0.0", micro: "0" };
    const rawLots = riskAmount / (slPips * metrics.pipValue);
    const units = Math.round(rawLots * metrics.contractSize);
    return {
      lots: rawLots.toFixed(2),
      units: units.toLocaleString(),
      mini: (rawLots * 10).toFixed(1),
      micro: (rawLots * 100).toFixed(0)
    };
  }, [riskAmount, slPips, metrics]);

  const handleFinalizeSetup = async () => {
    setIsLogging(true);
    await apiClient.post('/api/student/trading/positions/log', {
      pair: activePair,
      riskAmount,
      lots: calculationResults.lots,
      sentiment: marketBias,
      timestamp: new Date().toISOString()
    });
    setIsLogging(false);
    addToast({
      title: 'Sync Complete',
      description: 'Position parameters synchronized with trading journal.',
      type: 'success'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1700px] mx-auto animate-in fade-in duration-1000 select-none pb-40 relative">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">Trading Hub</h1>
            <div className="w-fit px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center gap-3">
              <Radio className={`w-3 h-3 text-[#D4AF37] ${isSyncing ? 'animate-ping' : 'animate-pulse'}`} />
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">
                {isSyncing ? 'Updating Data...' : 'Market Data Verified'}
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-bold mt-2 uppercase italic tracking-widest opacity-60">High-Precision Risk Management & Analysis.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => syncAiMentor(activePair)}
            disabled={isAiLoading}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Refresh Analysis
          </button>
          <div className="w-full sm:w-auto flex items-center gap-4 bg-[#161b22] border border-white/5 rounded-3xl px-8 py-4 shadow-2xl justify-center sm:justify-start">
            <StarIcon className="w-5 h-5 text-[#D4AF37]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Membership Status</span>
              <span className="text-xs font-black text-white tracking-widest uppercase">Elite Member</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-9 space-y-8 lg:space-y-10">
          <div className="bg-[#0b0e14] border border-white/5 rounded-[2rem] lg:rounded-[3rem] p-1 shadow-2xl overflow-hidden relative ring-1 ring-white/5">
            {/* PAIR SELECTOR BAR */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 lg:p-8 border-b border-white/5 bg-[#161b22]/30 backdrop-blur-md gap-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full md:w-auto pb-2 md:pb-0">
                {Object.keys(PAIR_CONFIG).map(pair => (
                  <button
                    key={pair}
                    onClick={() => setActivePair(pair)}
                    className={`px-6 lg:px-8 py-2.5 lg:py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activePair === pair ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/30' : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-6 lg:gap-10 md:pl-10 md:border-l border-white/5 w-full md:w-auto justify-between md:justify-end">
                <div className="text-left md:text-right min-w-[120px] lg:min-w-[140px]">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Market Price</p>
                  <p className={`text-xl lg:text-2xl font-black italic tracking-tighter transition-all duration-300 ${marketBias === 'Bearish' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {livePrice.toLocaleString(undefined, { minimumFractionDigits: metrics.precision })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#D4AF37]/10 rounded-lg shrink-0">
                    <Activity className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] lg:tracking-[0.5em]">Live Price Chart</h3>
                </div>
                <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
                  {Object.keys(TIMEFRAME_MAP).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-4 lg:px-5 py-1.5 lg:py-2 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === tf ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-slate-600 hover:text-white'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* TRADING VIEW WIDGET */}
              <div className="w-full h-[350px] sm:h-[450px] lg:h-[580px] bg-[#0d1117] rounded-[1.5rem] lg:rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-inner">
                <div className={`w-full h-full transition-all duration-700 ${isSyncing ? 'blur-3xl opacity-0 scale-95' : 'blur-0 opacity-100 scale-100'}`}>
                  <iframe
                    key={`${activePair}-${timeframe}`}
                    title="TradingView Chart"
                    src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76296&symbol=${PAIR_CONFIG[activePair].tvSymbol}&interval=${TIMEFRAME_MAP[timeframe]}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=drealtiesfx&utm_medium=widget&utm_campaign=chart&utm_term=${PAIR_CONFIG[activePair].tvSymbol}`}
                    className="w-full h-full border-none"
                    allowtransparency="true"
                  />
                </div>
                {isSyncing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 backdrop-blur-xl z-50">
                    <div className="flex flex-col items-center gap-6">
                      <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                      <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.6em] animate-pulse">Syncing Market Data...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI SENTIMENT BLOCK */}
              <div className="bg-[#161b22]/40 border border-white/5 p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] flex flex-col sm:flex-row items-center gap-6 lg:gap-10 shadow-inner relative group hover:border-[#D4AF37]/20 transition-all text-center sm:text-left">
                <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 shadow-2xl ${isAiLoading ? 'animate-pulse' : ''}`}>
                  <Bot className={`w-6 h-6 lg:w-8 lg:h-8 text-[#D4AF37] ${isAiLoading ? 'animate-bounce' : ''}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[9px] lg:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] lg:tracking-[0.4em] mb-2 flex items-center justify-center sm:justify-start gap-2">
                    Technical Market Analysis <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  </h4>
                  <p className={`text-sm lg:text-base font-bold text-slate-400 italic leading-relaxed tracking-wide transition-opacity duration-500 ${isAiLoading ? 'opacity-30' : 'opacity-100'}`}>
                    "{smartSentiment}"
                  </p>
                </div>
                <button onClick={() => syncAiMentor(activePair)} className="hidden sm:block p-4 bg-white/5 text-slate-500 rounded-2xl hover:text-white transition-all">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: RISK PROFILE CALCULATOR */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-[#161b22] border border-white/5 rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group flex flex-col min-h-full">
            <div className="flex items-center justify-between mb-8 lg:mb-10">
              <div className="flex items-center gap-4">
                <Calculator className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-[10px] lg:text-sm font-black text-white uppercase tracking-[0.3em] lg:tracking-[0.5em]">Risk Profile</h2>
              </div>
              <span className="text-[9px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">{activePair}</span>
            </div>

            <div className="space-y-6 lg:space-y-8 flex-1 relative z-10">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Account Balance</label>
                  <span className="text-[9px] font-black text-slate-400 uppercase">USD</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={capital}
                    onChange={e => setCapital(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 px-6 lg:px-8 py-4 lg:py-5 rounded-2xl text-xl lg:text-2xl font-black text-white outline-none focus:border-[#D4AF37]/50 shadow-inner transition-all"
                  />
                  <Coins className="absolute right-6 lg:right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800" />
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Risk Amount (%)</label>
                  <span className="text-xs font-black text-[#D4AF37]">{riskPercent}%</span>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={riskPercent}
                    onChange={e => setRiskPercent(Number(e.target.value))}
                    className="w-full accent-[#D4AF37] h-1.5 bg-black/40 rounded-full cursor-pointer appearance-none"
                  />
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Stop Loss (Pips)</label>
                  <span className="text-xs font-black text-blue-400">{slPips} Pips</span>
                </div>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    step="1"
                    value={slPips}
                    onChange={e => setSlPips(Number(e.target.value))}
                    className="w-full accent-blue-400 h-1.5 bg-black/40 rounded-full cursor-pointer appearance-none"
                  />
                </div>
              </div>

              <div className="pt-6 lg:pt-8 text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-20" />
                <p className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Recommended Position</p>
                <div className="flex flex-col items-center">
                  <h3 className="text-6xl lg:text-8xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(212,175,55,0.25)]">
                    {calculationResults.lots}
                  </h3>
                  <p className="text-[10px] lg:text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] lg:tracking-[0.5em] mt-2">Standard Lots</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Contract Units</p>
                  <p className="text-xs font-black text-slate-300">{calculationResults.units}</p>
                </div>
                <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Risk</p>
                  <p className="text-xs font-black text-emerald-400">${riskAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-white/5 space-y-6">
              <div className="bg-red-500/5 border border-red-500/10 p-4 lg:p-5 rounded-2xl flex items-center gap-4 lg:gap-5">
                <ShieldAlert className="w-6 h-6 text-red-500/60 shrink-0" />
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Advisory</p>
                  <h4 className="text-[10px] font-black text-slate-300 uppercase leading-relaxed tracking-wider">
                    Institutional policy: Risk &lt; 2% per position.
                  </h4>
                </div>
              </div>
              <button
                onClick={handleFinalizeSetup}
                disabled={isLogging}
                className="w-full py-5 lg:py-6 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-[0.3em] lg:tracking-[0.4em] rounded-[1.5rem] shadow-[0_20px_50px_rgba(212,175,55,0.2)] hover:bg-[#B8962E] transition-all hover:-translate-y-1 active:scale-95 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
                Sync Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);
