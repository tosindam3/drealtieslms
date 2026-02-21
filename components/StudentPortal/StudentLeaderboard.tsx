
import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Search,
  Filter,
  Activity,
  Crown,
  Medal,
  Cpu,
  Monitor,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface LeaderboardStudent {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  status: string;
  xp: number;
  lessonsCompleted: number;
  achievements: number;
  isCurrentUser?: boolean;
}

interface StudentLeaderboardProps {
  onContinue?: () => void;
  onViewProfile?: (userId: string) => void;
}

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({ onContinue, onViewProfile }) => {
  const [filter, setFilter] = useState<'Global' | 'Class'>('Global');
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number>(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const scope = filter.toLowerCase();
        const response = await apiClient.get(`/api/leaderboard?scope=${scope}`);
        if (response && response.success) {
          const mappedStudents: LeaderboardStudent[] = response.data.leaderboard.map((item: any, index: number) => ({
            id: item.user_id,
            rank: index + 1,
            name: item.user.name,
            avatar: item.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
            status: getStatusFromXp(item.total_balance),
            xp: item.total_balance,
            lessonsCompleted: item.user.topic_completions_count || 0,
            achievements: 0, // Placeholder
            isCurrentUser: item.user_id === response.data.current_user_id
          }));
          setStudents(mappedStudents);
          setUserRank(response.data.user_rank);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filter]);

  const getStatusFromXp = (xp: number) => {
    if (xp > 10000) return 'Expert';
    if (xp > 5000) return 'Advanced';
    if (xp > 2000) return 'Intermediate';
    if (xp > 500) return 'Junior';
    return 'Beginner';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const podium = students.slice(0, 3);
  const remaining = students.slice(3);

  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-[1400px] mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 lg:mb-16">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Student Rankings</h1>
          <p className="text-slate-500 text-xs sm:text-sm font-bold mt-2 uppercase italic tracking-widest opacity-60">
            "Celebrating individual excellence and professional growth."
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#1e293b] p-1.5 rounded-2xl border border-slate-800 w-fit">
          {['Global', 'Class'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-6 lg:px-8 py-2 lg:py-2.5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-slate-400 hover:text-white'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end mb-24 max-w-5xl mx-auto px-10">
        {podium.length > 1 && <PodiumCard student={podium[1]} tier="Silver" height="h-64" />}
        {podium.length > 0 && <PodiumCard student={podium[0]} tier="Gold" height="h-80" />}
        {podium.length > 2 && <PodiumCard student={podium[2]} tier="Bronze" height="h-52" />}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl mb-32">
        <div className="p-6 lg:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h3 className="text-xs lg:text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            Academy Standings
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search students..." className="w-full sm:w-48 pl-10 pr-4 py-2 bg-[#0f172a] border border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white outline-none focus:border-[#D4AF37]/50" />
            </div>
            <button className="p-2 bg-[#0f172a] border border-slate-800 rounded-xl text-slate-500 hover:text-white">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0f172a]/50">
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Rank</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Student</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Level</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Total XP</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Lessons Finished</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Certifications</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {remaining.map((student) => (
                <tr
                  key={student.rank}
                  className={`group hover:bg-white/5 transition-all ${student.isCurrentUser ? 'bg-[#D4AF37]/5' : ''}`}
                >
                  <td className="px-8 py-6">
                    <span className={`text-lg font-black italic tracking-tighter ${student.isCurrentUser ? 'text-[#D4AF37]' : 'text-slate-600'}`}>
                      #{student.rank}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-xl ring-2 ring-slate-800 group-hover:ring-[#D4AF37]/50 transition-all" />
                        {student.isCurrentUser && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF37] rounded-full border-2 border-[#0f172a]" />}
                      </div>
                      <span className={`text-xs font-black uppercase tracking-widest ${student.isCurrentUser ? 'text-white' : 'text-slate-300'}`}>
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${student.status === 'Expert' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' : 'bg-slate-800/50 text-slate-500'
                      }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-black text-white">{student.xp.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-[#D4AF37] font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {student.lessonsCompleted}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black text-slate-400">{student.achievements}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => onViewProfile?.(student.id)}
                      className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-0 lg:bottom-10 left-1/2 -translate-x-1/2 w-full lg:max-w-4xl z-50 animate-in slide-in-from-bottom duration-1000 px-4 pb-4 lg:pb-0">
        <div className="bg-[#1e293b] border border-[#D4AF37]/30 rounded-2xl lg:rounded-3xl p-4 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl shadow-[#D4AF37]/10 backdrop-blur-xl">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#D4AF37] rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-[#D4AF37]/20 shrink-0">
              <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-black fill-current" />
            </div>
            <div>
              <p className="text-[9px] lg:text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Current Standing</p>
              <h4 className="text-base lg:text-xl font-black text-white italic tracking-tighter uppercase">{userRank > 0 ? `${userRank}${getOrdinal(userRank)} Place` : 'Not Ranked'}</h4>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 lg:gap-12 sm:border-l border-slate-800 sm:pl-6 lg:pl-12 w-full sm:w-auto">
            <div>
              <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">XP to next rank</p>
              <span className="text-xs lg:text-sm font-black text-white tracking-widest">{calculateXpToNext(students.find(s => s.isCurrentUser)?.xp || 0)} XP</span>
            </div>
            <button
              onClick={onContinue}
              className="px-6 lg:px-8 py-2.5 lg:py-3 bg-[#D4AF37] text-black text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#B8962E] transition-all shadow-lg shadow-[#D4AF37]/20 whitespace-nowrap"
            >
              Continue Learning
            </button>
          </div>
        </div>
      </div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none -z-10" />
    </div>
  );
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const calculateXpToNext = (xp: number) => {
  const thresholds = [500, 2000, 5000, 10000];
  const next = thresholds.find(t => t > xp);
  return next ? next - xp : 0;
};

const PodiumCard: React.FC<{ student: LeaderboardStudent; tier: 'Gold' | 'Silver' | 'Bronze'; height: string }> = ({ student, tier, height }) => (
  <div className="flex flex-col items-center group">
    <div className="relative mb-6">
      <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 ${tier === 'Gold' ? 'border-[#D4AF37] ring-4 ring-[#D4AF37]/20' :
        tier === 'Silver' ? 'border-slate-300 ring-4 ring-slate-300/20' : 'border-amber-700 ring-4 ring-amber-700/20'
        } shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
      </div>
      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl flex items-center justify-center border-2 border-[#1e293b] ${tier === 'Gold' ? 'bg-[#D4AF37]' : tier === 'Silver' ? 'bg-slate-300' : 'bg-amber-700'
        }`}>
        {tier === 'Gold' ? <Crown className="w-5 h-5 text-black fill-current" /> : <Medal className="w-5 h-5 text-white" />}
      </div>
    </div>

    <div className="text-center mb-6">
      <h3 className="text-sm font-black text-white uppercase tracking-widest">{student.name}</h3>
      <p className="text-[10px] font-black text-[#D4AF37]/80 uppercase tracking-widest mt-1 italic">{student.status}</p>
    </div>

    <div className={`w-full ${height} bg-[#1e293b] border-t-4 ${tier === 'Gold' ? 'border-[#D4AF37]' : tier === 'Silver' ? 'border-slate-300' : 'border-amber-700'
      } rounded-t-[2.5rem] p-8 flex flex-col items-center justify-between shadow-2xl group-hover:bg-[#232f45] transition-all`}>
      <div className="text-center">
        <span className="text-3xl font-black text-white italic tracking-tighter">
          {tier === 'Gold' ? '1st' : tier === 'Silver' ? '2nd' : '3rd'}
        </span>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Student Rank</p>
      </div>

      <div className="w-full space-y-4 pt-6 border-t border-slate-800">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">XP</span>
          <span className="text-[10px] font-black text-white">{student.xp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lessons</span>
          <span className="text-[10px] font-black text-[#D4AF37]">+{student.lessonsCompleted}</span>
        </div>
      </div>
    </div>
  </div>
);
