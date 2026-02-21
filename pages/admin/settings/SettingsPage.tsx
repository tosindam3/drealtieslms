
import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Globe,
  Database,
  Key,
  CheckCircle2,
  Cpu,
  Lock,
  Cloud,
  ChevronRight,
  Eye,
  EyeOff,
  Zap,
  Save,
  Monitor,
  Video,
  Newspaper,
  LineChart,
  Bot,
  Link2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'integrations' | 'system'>('profile');
  const [showApiKey, setShowApiKey] = useState(false);

  // State for the new integration fields
  const [integrations, setIntegrations] = useState({
    videoApi: 'https://api.vimeo.com/v1/channels/dfx-mastery',
    videoKey: '••••••••••••••••••••••••••••',
    newsApi: 'https://api.forexfactory.com/v2/news/stream',
    newsKey: '••••••••••••••••••••••••••••',
    chartsApi: 'wss://api.tradingview.com/v1/realtime',
    aiAgentId: 'gemini-2.5-flash-agent-001',
    aiAgentKey: '••••••••••••••••••••••••••••'
  });

  const sections = [
    { id: 'profile', label: 'Academy Identity', icon: Globe },
    { id: 'security', label: 'Security Protocol', icon: Shield },
    { id: 'integrations', label: 'Intelligence Endpoints', icon: Link2 },
    { id: 'system', label: 'Calibration', icon: Cpu },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* HEADER */}
      <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Governance & Configuration</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Master Control Authorized</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">System Config</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Architecting institutional parameters and security layers.</p>
          </div>
          <button className="flex items-center gap-3 px-10 py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#D4AF37]/10 hover:bg-[#B8962E] transition-all active:scale-95">
            <Save className="w-5 h-5" />
            Commit Changes
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SUB-SIDEBAR */}
        <nav className="w-80 border-r border-white/5 bg-[#121214] p-8 space-y-2">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 pl-4">Management Branches</p>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id as any)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${activeTab === s.id
                ? 'bg-white/5 text-white border border-white/10 shadow-lg'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-4">
                <s.icon className={`w-4 h-4 ${activeTab === s.id ? 'text-[#D4AF37]' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
              </div>
              {activeTab === s.id && <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
            </button>
          ))}
        </nav>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/20">
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">

            {activeTab === 'profile' && (
              <div className="space-y-12">
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Public Deployment</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Academy Hostname</label>
                      <input
                        type="text"
                        defaultValue="drealtiesfx.academy.pro"
                        className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Support Endpoint</label>
                      <input
                        type="text"
                        defaultValue="ops@drealtiesfx.com"
                        className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Manifesto / About</label>
                    <textarea
                      rows={4}
                      defaultValue="Building the next generation of spatial developers through high-fidelity pedagogical streams and real-time performance optimization labs."
                      className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-bold text-slate-300 outline-none focus:border-[#D4AF37]/40 shadow-inner resize-none leading-relaxed"
                    />
                  </div>
                </section>

                <section className="space-y-8 pt-12 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Financial Interface</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl group hover:border-[#D4AF37]/20 transition-all">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Native Currency</p>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Academy Coins</h4>
                    </div>
                    <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl group hover:border-[#D4AF37]/20 transition-all">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Conversion Ratio</p>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">100 : $1.00 USD</h4>
                    </div>
                    <div className="bg-[#161b22] border border-white/5 p-6 rounded-2xl group hover:border-[#D4AF37]/20 transition-all">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Withdrawal Status</p>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase">Enabled</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-12">
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">API Infrastructure</h3>
                  </div>

                  <div className="bg-[#161b22] border border-white/5 rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          <Key className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Master API Key</h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Authorized for core sync operations</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 transition-all"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative z-10">
                      <div className={`bg-black/40 border border-white/5 px-6 py-4 rounded-xl font-mono text-xs tracking-wider transition-all ${showApiKey ? 'text-blue-400' : 'text-slate-700 blur-[3px]'}`}>
                        {showApiKey ? 'dfx_live_582910384755x2948103948576102' : '••••••••••••••••••••••••••••••••••••••••'}
                      </div>
                      <p className="text-[8px] text-slate-600 mt-4 uppercase font-bold tracking-widest flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Last rotated: 12 days ago • System Ref: AL-942
                      </p>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                  </div>
                </section>

                <section className="space-y-6 pt-12 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Auth Protocol</h3>
                  </div>

                  <div className="space-y-4">
                    <ToggleItem
                      title="Two-Factor Authentication (MFA)"
                      description="Enforce biometric or app-based secondary verification for all admin cohort members."
                      enabled={true}
                    />
                    <ToggleItem
                      title="Restricted Session Hijacking Protection"
                      description="Invalidate tokens if IP address variance exceeds geographical threshold (20km)."
                      enabled={true}
                    />
                    <ToggleItem
                      title="Automated Logic Lockdown"
                      description="Disable course edits during cohort 'Final Week' phases to prevent pedagogical drift."
                      enabled={false}
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-12">
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Data Stream Matrix</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Video Channels API */}
                    <IntegrationField
                      icon={<Video className="w-5 h-5" />}
                      label="Video Channels Endpoint"
                      description="Synchronize lessons with external video hosting infrastructure."
                      value={integrations.videoApi}
                      keyValue={integrations.videoKey}
                      onValueChange={(v) => setIntegrations({ ...integrations, videoApi: v })}
                      onKeyChange={(k) => setIntegrations({ ...integrations, videoKey: k })}
                    />

                    {/* Forex News API */}
                    <IntegrationField
                      icon={<Newspaper className="w-5 h-5" />}
                      label="Forex Intelligence Feed"
                      description="Real-time fundamental analysis stream for student dashboards."
                      value={integrations.newsApi}
                      keyValue={integrations.newsKey}
                      onValueChange={(v) => setIntegrations({ ...integrations, newsApi: v })}
                      onKeyChange={(k) => setIntegrations({ ...integrations, newsKey: k })}
                    />

                    {/* Forex Market Charts API */}
                    <IntegrationField
                      icon={<LineChart className="w-5 h-5" />}
                      label="Market Visualization Engine"
                      description="WSS or REST endpoint for high-fidelity technical charting."
                      value={integrations.chartsApi}
                      keyValue=""
                      hideKey
                      onValueChange={(v) => setIntegrations({ ...integrations, chartsApi: v })}
                      onKeyChange={() => { }}
                    />

                    {/* AI Agent for Live Sessions */}
                    <IntegrationField
                      icon={<Bot className="w-5 h-5" />}
                      label="Live Session AI Agent"
                      description="Neural core for real-time automated assistance during live transmissions."
                      value={integrations.aiAgentId}
                      keyValue={integrations.aiAgentKey}
                      onValueChange={(v) => setIntegrations({ ...integrations, aiAgentId: v })}
                      onKeyChange={(k) => setIntegrations({ ...integrations, aiAgentKey: k })}
                    />
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-12">
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Node Calibration</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2rem] space-y-6 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <Monitor className="w-5 h-5 text-purple-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Interface Theme</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black uppercase">
                          Alpha Dark
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 bg-white/5 text-slate-500 text-[10px] font-black uppercase hover:text-white transition-all">
                          Lunar Grey
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2rem] space-y-6 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <Bell className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Notifications</h4>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-3 rounded-xl border border-white/5 bg-white/5 text-slate-500 text-[10px] font-black uppercase hover:text-white transition-all">
                          In-App Only
                        </button>
                        <button className="flex-1 py-3 rounded-xl border border-white/5 bg-white/10 text-white text-[10px] font-black uppercase">
                          Discord + Push
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-8 pt-12 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-1 bg-[#D4AF37]" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Cloud Resource Sync</h3>
                  </div>

                  <div className="bg-[#161b22] border border-white/5 rounded-[2rem] p-10 space-y-10 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                          <Database className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Synapse Storage Cluster</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">GCP Regional: us-east-1</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white italic tracking-tighter">72.4 / 100 GB</span>
                        <div className="w-48 h-2 bg-black/40 rounded-full overflow-hidden mt-2">
                          <div className="bg-blue-500 h-full w-[72%] shadow-[0_0_10px_#3b82f6]" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                      <div className="flex items-start gap-4 p-6 bg-black/20 rounded-2xl border border-white/5">
                        <Zap className="w-5 h-5 text-[#D4AF37] shrink-0 mt-1" />
                        <div>
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Compute Tier: PRO</h5>
                          <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase">Real-time video transcoding and AI generation cycles enabled at high-priority latency.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-6 bg-black/20 rounded-2xl border border-white/5">
                        <Cloud className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                        <div>
                          <h5 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Auto-Scaling: ACTIVE</h5>
                          <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase">System will automatically initialize redundant node clusters during high enrollment peaks.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* FOOTER AUDIT */}
            <div className="mt-20 p-10 bg-white/5 border border-white/10 rounded-[3rem] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Protocol Checksum</h4>
                  <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Verifying integrity of system-wide architectural modifications.</p>
                </div>
              </div>
              <button className="px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Reset Factory Defaults</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationField: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  value: string;
  keyValue: string;
  hideKey?: boolean;
  onValueChange: (v: string) => void;
  onKeyChange: (k: string) => void;
}> = ({ icon, label, description, value, keyValue, hideKey, onValueChange, onKeyChange }) => {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="bg-[#161b22] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl group hover:border-[#D4AF37]/20 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">{label}</h4>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Access Endpoint</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full bg-black/40 border border-white/5 px-5 py-3 rounded-xl text-[10px] font-bold text-blue-400 outline-none focus:border-[#D4AF37]/40 shadow-inner"
          />
        </div>
        {!hideKey && (
          <div className="space-y-2">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-2">Authorization Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => onKeyChange(e.target.value)}
                className="w-full bg-black/40 border border-white/5 px-5 py-3 pr-12 rounded-xl text-[10px] font-bold text-slate-300 outline-none focus:border-[#D4AF37]/40 shadow-inner"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ title: string; description: string; enabled: boolean }> = ({ title, description, enabled }) => {
  const [isOn, setIsOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between p-8 bg-[#161b22] border border-white/5 rounded-[2rem] group hover:border-white/10 transition-all shadow-xl">
      <div className="max-w-lg">
        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2 flex items-center gap-3">
          {title}
          {isOn && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        </h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
          {description}
        </p>
      </div>
      <button
        onClick={() => setIsOn(!isOn)}
        className={`w-14 h-7 rounded-full relative transition-all duration-500 ${isOn ? 'bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-slate-800'}`}
      >
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 ${isOn ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
};
