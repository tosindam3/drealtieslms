import React, { useState, useEffect } from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  Award,
  Edit2,
  ShieldCheck,
  Target,
  Flame,
  Trophy,
  History,
  Target as TargetIcon,
  Search,
  BookOpen,
  Loader2,
  X
} from 'lucide-react';
import { apiClient, normalizeUrl } from '../../lib/apiClient';
import { useToast } from '../../lib/ToastContext';

interface ProfileStats {
  total_experience: number;
  lessons_completed: number;
  learning_hours: number;
  certifications: number;
  level: number;
  xp_in_level: number;
  xp_to_next_level: number;
  xp_total_for_level: number;
  study_streak: number;
  avg_grade: number;
}

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  role: string;
  member_since: string;
}

export const StudentProfile: React.FC = () => {
  const { addToast } = useToast();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfileData = async () => {
    try {
      const response = await apiClient.get('/api/student/profile/stats') as any;
      if (response) {
        setStats(response.stats);
        setUser(response.user);
        setNewName(response.user.name);
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load profile data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSaving(true);
    try {
      await apiClient.post('/api/student/profile/update', { name: newName });
      addToast({
        title: 'Success',
        description: 'Profile updated successfully',
        type: 'success'
      });
      setIsEditing(false);
      fetchProfileData();
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!user || !stats) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700 space-y-8 lg:space-y-10 pb-32">
      {/* Header Profile Section */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-end gap-6 lg:gap-8 bg-[#161b22]/40 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm">
          <div className="relative group mx-auto md:mx-0">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-[2rem] lg:rounded-[2.5rem] border-4 border-[#D4AF37]/20 overflow-hidden shadow-2xl relative group-hover:border-[#D4AF37]/40 transition-all">
              <img
                src={normalizeUrl(user.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=161b22&color=D4AF37&size=300`}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 pb-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-3xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{user.name}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-white transition-all shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 lg:gap-6 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4" />
                {user.role === 'administrator' ? 'Institutional Admin' : 'Verified Member'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Student since {user.member_since}
              </div>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="bg-[#161b22] border border-[#D4AF37]/30 rounded-2xl p-4 flex items-center gap-4 shadow-2xl w-fit mx-auto md:mx-0">
            <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
              <StarIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Academy Rank</p>
              <p className="text-xs font-black text-white tracking-widest uppercase">
                {stats.level >= 10 ? 'Elite Grandmaster' : stats.level >= 5 ? 'Elite' : 'Novice'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-black text-xs italic ml-2">{stats.level}</div>
          </div>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard icon={<Zap className="w-5 h-5 text-[#D4AF37]" />} label="Total Experience" value={stats.total_experience.toLocaleString()} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} label="Lessons Completed" value={stats.lessons_completed.toString()} />
        <StatCard icon={<Clock className="w-5 h-5 text-blue-400" />} label="Learning Hours" value={`${stats.learning_hours}h`} />
        <StatCard icon={<Award className="w-5 h-5 text-purple-400" />} label="Certifications" value={stats.certifications.toString()} />
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Level Progress */}
        <div className="bg-[#161b22] border border-white/5 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] lg:text-xs font-black text-white uppercase tracking-[0.2em] lg:tracking-[0.3em]">Knowledge Level</h3>
            <div className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg flex items-center gap-2">
              <StarIcon className="w-3 h-3 text-[#D4AF37]" />
              <span className="text-[9px] font-black text-[#D4AF37] uppercase">Level {stats.level}</span>
            </div>
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Experience Points</span>
              <span className="text-xs font-black text-white italic tracking-widest">
                {stats.xp_in_level} / {stats.xp_total_for_level}
              </span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-1000"
                style={{ width: `${(stats.xp_in_level / stats.xp_total_for_level) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">{stats.xp_to_next_level} XP to level up</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Level {stats.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Study Stats */}
        <div className="bg-[#161b22] border border-white/5 rounded-[2rem] lg:rounded-[2.5rem] p-8 lg:p-10 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] lg:text-xs font-black text-white uppercase tracking-[0.2em] lg:tracking-[0.3em]">Study Performance</h3>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
              <ActivityIcon className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 uppercase">Active</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:gap-10 pt-4">
              <div className="text-center p-4 lg:p-6 bg-black/20 rounded-2xl lg:rounded-3xl border border-white/5">
                <p className="text-3xl lg:text-4xl font-black text-white italic">{stats.study_streak}</p>
                <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 px-1 lg:px-2">Current Day Streak</p>
              </div>
              <div className="text-center p-4 lg:p-6 bg-black/20 rounded-2xl lg:rounded-3xl border border-white/5">
                <p className="text-3xl lg:text-4xl font-black text-white italic">{stats.avg_grade}%</p>
                <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 px-1 lg:px-2">Avg. Quiz Grade</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center italic">
                Keep up the consistency to reach Elite rank faster.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-all font-medium"
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSaving || !newName.trim()}
                className="w-full py-4 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#B8962E] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-2xl lg:rounded-[2rem] p-6 lg:p-8 flex items-center gap-4 lg:gap-6 shadow-2xl group hover:border-[#D4AF37]/30 transition-all">
    <div className="p-3 lg:p-3.5 bg-white/5 rounded-xl lg:rounded-2xl group-hover:scale-110 transition-transform shadow-inner shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-2xl lg:text-3xl font-black text-white italic tracking-tighter leading-none">{value}</h4>
      <p className="text-[9px] lg:text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">{label}</p>
    </div>
  </div>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
