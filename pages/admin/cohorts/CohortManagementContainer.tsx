
import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Layers,
  ShieldCheck,
  Activity,
  ChevronRight,
  Zap,
  Layout
} from 'lucide-react';
import { CohortWeeksPage } from '../weeks/CohortWeeksPage';
import { CohortSettingsPage } from './CohortSettingsPage';

interface CohortManagementContainerProps {
  cohortId: string;
  onBack: () => void;
}

export const CohortManagementContainer: React.FC<CohortManagementContainerProps> = ({ cohortId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'prep' | 'settings'>('prep');

  // Mock cohort name - in a real app this would be fetched
  const cohortName = "May 2024 Alpha";

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0b]">
      {/* UNIFIED COHORT HEADER */}
      <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0 bg-[#121214]/80 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={onBack}
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-colors flex items-center gap-2 group"
              >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to List
              </button>
              <div className="h-4 w-px bg-white/5 mx-2" />
              <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
                <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Intake Control Active</span>
              </div>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2">
              {cohortName}
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] italic opacity-60">
              Intake Identification: {String(cohortId).toUpperCase()} • Status: Operational
            </p>
          </div>

          {/* SUB-TAB NAVIGATION */}
          <div className="flex items-center bg-black/40 p-1.5 rounded-[1.5rem] border border-white/5 shadow-inner">
            <button
              onClick={() => setActiveTab('prep')}
              className={`px-8 py-3.5 rounded-[1.2rem] flex items-center gap-3 transition-all duration-500 ${activeTab === 'prep'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'prep' ? 'text-black' : 'text-slate-600'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-inherit">Module Designer</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-8 py-3.5 rounded-[1.2rem] flex items-center gap-3 transition-all duration-500 ${activeTab === 'settings'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-black' : 'text-slate-600'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-inherit">Intake Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* RENDER ACTIVE TERMINAL CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'prep' ? (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Pass minimal props to avoid header duplication if possible, 
                 but keeping functionality intact. */}
            <CohortWeeksPage
              cohortId={cohortId}
              onBack={onBack}
              onOpenSettings={() => setActiveTab('settings')}
              isNested={true} // New flag to hide redundant headers
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            <CohortSettingsPage
              cohortId={cohortId}
              onBack={onBack}
              isNested={true}
            />
          </div>
        )}

        {/* Aesthetic Background Layer */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#D4AF37]/5 pointer-events-none -z-10 blur-[120px]" />
      </div>
    </div>
  );
};
