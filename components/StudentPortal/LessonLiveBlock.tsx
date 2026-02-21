import React from 'react';
import {
  Video,
  Users,
  Radio,
  Monitor,
  Clock,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Play
} from 'lucide-react';
import { LessonBlock } from '../../types';
import { apiClient } from '../../lib/apiClient';

interface LessonLiveBlockProps {
  block: LessonBlock;
}

export const LessonLiveBlock: React.FC<LessonLiveBlockProps> = ({ block }) => {
  const { payload } = block;
  const platform = payload.platform || 'zoom';
  const joinUrl = payload.joinUrl || '#';
  const startAt = payload.startAt ? new Date(payload.startAt) : null;
  const duration = payload.duration || 60;
  const requiredMinutes = payload.requiredMinutes || Math.floor(duration * 0.8);

  const getPlatformIcon = () => {
    switch (platform) {
      case 'zoom': return <Video className="w-6 h-6" />;
      case 'teams': return <Users className="w-6 h-6" />;
      case 'youtube': return <Monitor className="w-6 h-6" />;
      default: return <Radio className="w-6 h-6" />;
    }
  };

  const getStatus = () => {
    if (!startAt) return 'Scheduled';
    const now = new Date();
    const diff = startAt.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes > 0 && minutes <= 30) return 'Starting Soon';
    if (minutes <= 0 && Math.abs(minutes) < duration) return 'Live Now';
    if (minutes <= 0) return 'Ended';
    return 'Upcoming';
  };

  const status = getStatus();

  const handleJoin = async () => {
    if (!payload.liveClassId) {
      window.open(joinUrl, '_blank');
      return;
    }

    try {
      await apiClient.post(`/api/live-classes/${payload.liveClassId}/attend`, {
        join_time: new Date().toISOString()
      });
      window.open(joinUrl, '_blank');
    } catch (error) {
      console.error("Failed to record attendance", error);
      // Still open the link even if attendance fails, don't block the student
      window.open(joinUrl, '_blank');
    }
  };

  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xl transition-all ${status === 'Live Now'
                ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
              {getPlatformIcon()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${status === 'Live Now' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                  {status}
                </span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Broadcast Node</span>
              </div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight">
                {block.title || "Live Workshop Session"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleJoin}
              className={`px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all active:scale-95 shadow-2xl ${status === 'Live Now'
                  ? 'bg-[#D4AF37] text-black shadow-[#D4AF37]/20 hover:bg-[#B8962E]'
                  : 'bg-white/5 text-slate-500 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
            >
              {status === 'Live Now' ? <Play className="w-4 h-4 fill-current" /> : <ExternalLink className="w-4 h-4" />}
              {status === 'Live Now' ? 'Join Stream' : 'Register / View Link'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-10 border-t border-white/5">
          <InfoCard
            icon={Calendar}
            label="Scheduled Date"
            value={startAt ? startAt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD'}
          />
          <InfoCard
            icon={Clock}
            label="Session Time"
            value={startAt ? startAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
            subValue={`${duration} Min Duration`}
          />
          <InfoCard
            icon={ShieldCheck}
            label="Attendance Policy"
            value={`${requiredMinutes} Minutes`}
            subValue="Min required for credit"
            color="text-emerald-500"
          />
        </div>
      </div>

      <div className="bg-black/40 px-10 py-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Institutional Gateway Active</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Platform: {platform.toUpperCase()}</span>
          <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Ref: BR-492-LIVE</span>
        </div>
      </div>
    </div>
  );
};

const InfoCard: React.FC<{
  icon: any;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}> = ({ icon: Icon, label, value, subValue, color = "text-white" }) => (
  <div className="bg-black/20 border border-white/5 rounded-3xl p-6 group hover:border-[#D4AF37]/30 transition-all">
    <div className="flex items-center gap-4 mb-3">
      <div className="p-2 bg-white/5 rounded-lg">
        <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#D4AF37] transition-colors" />
      </div>
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
    </div>
    <div className="space-y-1">
      <p className={`text-sm font-black uppercase tracking-widest ${color}`}>{value}</p>
      {subValue && <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{subValue}</p>}
    </div>
  </div>
);
