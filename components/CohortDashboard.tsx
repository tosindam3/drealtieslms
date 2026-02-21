
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Users, 
  Calendar, 
  TrendingUp, 
  Download, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  Bell,
  UserPlus,
  GraduationCap,
  MessageSquare,
  FileText,
  LayoutGrid
} from 'lucide-react';

export const CohortDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All Students');

  const stats = [
    { label: 'Members', value: '38', subtext: 'Enrollment Passed', trend: '76%', icon: <Users className="w-5 h-5 text-slate-400" /> },
    { label: 'Active', value: '38', subtext: 'Enrollment Capacity', trend: '45%', icon: <Calendar className="w-5 h-5 text-slate-400" /> },
    { label: 'Median Progress', value: '20%', subtext: 'Median Progress', icon: <TrendingUp className="w-5 h-5 text-slate-400" /> },
    { label: 'Pending Submissions', value: '8', subtext: '8', icon: <GraduationCap className="w-5 h-5 text-slate-400" />, hasExport: true }
  ];

  const students = [
    { name: 'Jake Stevens', email: 'j.stevens@email.com', avatar: 'https://i.pravatar.cc/150?u=jake', lastActivity: '1 hour ago', daysActive: '32 / 56', progress: 94, role: 'Student' },
    { name: 'Katie Rogers', email: 'k.rogers@email.com', avatar: 'https://i.pravatar.cc/150?u=katie', lastActivity: 'Today', daysActive: '31 / 56', progress: 81, role: 'Student' },
    { name: 'Brian Kim', email: 'b.kim@email.com', avatar: 'https://i.pravatar.cc/150?u=brian', lastActivity: 'Today', daysActive: '28 / 56', progress: 65, role: 'Student' },
    { name: 'Megan Chang', email: 'm.chang@email.com', avatar: 'https://i.pravatar.cc/150?u=megan', lastActivity: 'Today', daysActive: '26 / 56', progress: 61, role: 'Student' },
    { name: 'David Harris', email: 'd.hants@email.com', avatar: 'https://i.pravatar.cc/150?u=david', lastActivity: 'Today', daysActive: '25 / 56', progress: 59, role: 'Student' },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-[#f3f4f6] min-h-full">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-medium mb-6">
        <span className="text-blue-600">VR Game Development Mastery</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-600">Cohort Dashboard</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-400">May 2024 Cohort</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">May 2024 Cohort</h1>
          <p className="text-sm text-slate-500 mt-1">VR Game Development Mastery</p>
          <p className="text-xs text-slate-400">May 10, 2024 – July 4, 2024</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer group">
            <img src="https://i.pravatar.cc/150?u=jacob" alt="Instructor" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-sm font-bold text-[#1e293b]">Jacob White</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                Instructor <ChevronDown className="w-2.5 h-2.5 ml-1" />
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-2" />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-2">
              Manage <ChevronDown className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50">
              Publish
            </button>
            <div className="flex items-center overflow-hidden rounded-lg border border-blue-600 shadow-sm">
              <button className="px-3 py-2 text-white bg-blue-600 hover:bg-blue-700">
                <Bell className="w-4 h-4" />
              </button>
              <button className="px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 border-l border-blue-500">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#1e293b]">{stat.value}</span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
              </div>
              {stat.icon}
            </div>
            <div className="space-y-3">
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-500 rounded-full`} style={{ width: stat.trend || '60%' }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  {stat.subtext} <ChevronDown className="w-3 h-3" />
                </p>
                {stat.hasExport && (
                  <button className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase hover:bg-slate-200">
                    <Download className="w-3 h-3" /> Export <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                )}
                {stat.trend && <span className="text-[10px] font-bold text-slate-400">{stat.trend}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Table Column */}
        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                {['All Students', 'Actents (38)', 'Active (56)'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-bold transition-all relative pb-4 -mb-4 ${
                      activeTab === tab ? 'text-[#1e293b] border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <MoreHorizontal className="w-4 h-4 text-slate-300 cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"><Download className="w-4 h-4" /></button>
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2 uppercase">
                  Bulk Actions <ChevronDown className="w-3 h-3" />
                </button>
                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-2 uppercase">
                  <UserPlus className="w-4 h-4" /> Enrollment
                </button>
                <div className="flex items-center bg-blue-600 rounded-lg overflow-hidden shadow-sm">
                   <button className="px-4 py-2 text-white text-xs font-bold flex items-center gap-2 uppercase">
                     <Users className="w-4 h-4" /> Student
                   </button>
                   <button className="px-2 py-2 text-white border-l border-blue-500">
                     <ChevronDown className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white transition-all text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4"><input type="checkbox" className="rounded" /></th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1">Name <ChevronDown className="w-3 h-3" /></div>
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Last Activity</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Days Active</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cert</th>
                  <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-6">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full border border-slate-100" />
                        <div>
                          <p className="text-sm font-bold text-[#1e293b]">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-500 text-center">{student.lastActivity}</td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-500 text-center">{student.daysActive}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">{student.progress}%</span>
                        <div className="flex-1 min-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${student.progress}%` }} />
                        </div>
                        {student.progress > 90 && <div className="w-5 h-5 flex items-center justify-center bg-orange-100 rounded-full text-orange-600"><GraduationCap className="w-3 h-3" /></div>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                       <CheckCircle2 className={`w-4 h-4 mx-auto ${student.progress > 80 ? 'text-emerald-500' : 'text-slate-200'}`} />
                    </td>
                    <td className="px-4 py-4 text-right pr-6">
                      <div className="relative inline-block">
                         <select className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold uppercase appearance-none bg-white focus:ring-1 focus:ring-blue-500 outline-none">
                            <option>{student.role}</option>
                         </select>
                         <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs font-medium text-slate-400">1 – 20 of 38</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                  <button className="p-1 hover:bg-slate-200 rounded rotate-180"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                  <div className="flex items-center gap-2 ml-4">
                    <input type="text" value="1" className="w-8 py-1 border border-slate-200 rounded text-center text-xs font-bold" readOnly />
                    <span className="text-xs text-slate-400">of 12</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                  <button className="p-1 hover:bg-slate-200 rounded"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                  <button className="px-2 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm">1</button>
                  <button className="p-1 hover:bg-slate-200 rounded rotate-180"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Dashboard Column */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1e293b] mb-6">To-Do List</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><LayoutGrid className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1e293b]">Review Quiz</h4>
                    <p className="text-[10px] text-slate-500">Fundamentals of VR Gane Design</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">8 Pending <FileText className="w-3 h-3" /></span>
                  <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase shadow-sm">View Submissions</button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FileText className="w-4 h-4" /></div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1e293b]">Review Assignment</h4>
                    <p className="text-[10px] text-slate-500">Develop a Basic VR Game</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">5 Pending <FileText className="w-3 h-3" /></span>
                  <button className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase shadow-sm">View Submissions</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#1e293b] mb-6">Progress Summary</h3>
            
            <div className="relative aspect-square flex items-center justify-center mb-6">
              {/* Simulated Pie Chart with CSS Conic Gradient */}
              <div className="w-full h-full rounded-full border-8 border-slate-50" style={{ 
                background: 'conic-gradient(#3b82f6 0% 31%, #a855f7 31% 52%, #fb923c 52% 73%, #10b981 73% 86%, #cbd5e1 86% 100%)' 
              }}>
                <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-[#1e293b]">38</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <LegendItem color="bg-blue-500" label="Incomplete" count="14" percent="31%" />
              <LegendItem color="bg-purple-500" label="Behind schedule" count="8" percent="21%" />
              <LegendItem color="bg-orange-400" label="In Progress" count="14" percent="31%" />
              <LegendItem color="bg-emerald-500" label="Completed" count="2" percent="13%" />
            </div>

            <button className="w-full mt-6 py-2 text-blue-600 text-xs font-bold flex items-center justify-center gap-1 hover:underline">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; count: string; percent: string }> = ({ color, label, count, percent }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-[#1e293b]">{count} {label}</span>
    </div>
    <span className="text-[10px] font-medium text-slate-400">({percent})</span>
  </div>
);
