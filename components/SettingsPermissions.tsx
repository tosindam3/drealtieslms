
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Settings as SettingsIcon,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  History,
  Shield,
  Clock,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

interface SettingsPermissionsProps {
  onCancel: () => void;
}

export const SettingsPermissions: React.FC<SettingsPermissionsProps> = ({ onCancel }) => {
  const [taEnabled, setTaEnabled] = useState(true);

  const activities = [
    {
      date: 'April 27',
      activity: 'Unlocked Lesson 2.2. VR Prototyping & Testing',
      type: '81%',
      action: 'Student',
      icon: <FileText className="w-4 h-4 text-slate-500" />
    },
    {
      date: 'April 27',
      activity: 'Can Grade Assignments & VR Game Design (Earned 9 of 10 points) 9/1/0 points)',
      type: '9/10',
      action: 'Student',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />
    },
    {
      date: 'April 28',
      activity: 'Completed Lesson 2.1, Fundamentals of VR Game Design',
      type: '63%',
      action: 'Student',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />
    },
    {
      date: 'April 26',
      activity: 'Completed Week 2 Materials',
      type: '61%',
      action: 'Student',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    }
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-[#f3f4f6] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">Settings & Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">Purpose: Governance and safety</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center overflow-hidden rounded-md border border-blue-600 shadow-sm">
            <button 
              className="px-8 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors border-r border-blue-500"
            >
              Save
            </button>
            <button className="px-2 py-2 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1e293b]">Instructor Access</h2>
            <button className="text-xs text-slate-400 hover:text-slate-600"><Info className="w-4 h-4" /></button>
          </div>
          <div className="p-8">
            <p className="text-sm text-slate-500 mb-8">Manage access levels for instructores by setting default privileges.</p>

            <div className="grid grid-cols-12 gap-8">
              {/* Instructor Access Card */}
              <div className="col-span-4 space-y-6">
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-[#1e293b] mb-6">Instructor Access</h3>
                  <div className="space-y-6">
                    <div className="relative">
                      <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>Default Instructor Privileges</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm text-slate-700 font-medium">Can Enroll & Remove Users</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm text-slate-700 font-medium leading-relaxed">Can Create & Manage Quizzes, Assignments & Live Sessions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Cohort Small Card */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-[#1e293b] mb-4">Linked Cohort</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>May 2024 Cohort</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                      <Calendar className="w-4 h-4" />
                      <span>May 10, 2024 — July 4, 2024</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TA Permissions Card */}
              <div className="col-span-4 space-y-6">
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-[#1e293b]">TA Permissions</h3>
                    <button 
                      onClick={() => setTaEnabled(!taEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${taEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${taEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teaching Assistant Privileges</p>
                    <div className="relative">
                      <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option>Read & Grade Only</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm text-slate-700 font-medium leading-relaxed">Can Grade Assignments & Quizzes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm text-slate-700 font-medium">Can Send Messages to Students</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        <span className="text-sm text-slate-400 font-medium">Can Enroll & Remove Users</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Summary Right Card */}
              <div className="col-span-4">
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 h-full">
                  <h3 className="text-sm font-bold text-[#1e293b] mb-6">Activity Summary</h3>
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Restrict content editing permissions or enable approval for drafts.
                    </p>
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center bg-emerald-100 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">Require Approval for Drafts</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center bg-emerald-100 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">Lock Lesson Content After Publish</span>
                      </div>
                      <div className="flex items-start gap-3 opacity-50">
                        <div className="w-5 h-5 mt-0.5 flex items-center justify-center border border-slate-300 rounded"></div>
                        <span className="text-xs text-slate-600 font-medium leading-relaxed">
                          Lock lesson content editing after publish; prevent inadvertent changes by instructors & TAs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Activity Summary Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#1e293b]">Activity Summary</h3>
                <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center bg-emerald-100 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">Require Approval for Drafts</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100/50 text-blue-700 rounded-full text-xs font-bold border border-blue-200 cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    Grade Submission
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-lg">
                  <div className="w-5 h-5 flex items-center justify-center bg-emerald-100 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">Lock Lesson Content After Publish</span>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1e293b]">Recent Activity</h3>
                  <div className="relative">
                    <select className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs font-bold appearance-none bg-white focus:ring-1 focus:ring-blue-500 outline-none">
                      <option>All Activity</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {activities.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">{item.date}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.icon}
                              <span className="text-xs font-semibold text-slate-700 line-clamp-1">{item.activity}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500 w-8">{item.type}</span>
                              <div className="flex-1 min-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-blue-600' : idx === 2 ? 'bg-blue-600' : 'bg-emerald-500'}`} 
                                  style={{ width: item.type === '9/10' ? '90%' : item.type }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block">
                              <select className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs font-bold appearance-none bg-white focus:ring-1 focus:ring-blue-500 outline-none">
                                <option>{item.action}</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
