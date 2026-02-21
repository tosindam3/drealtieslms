
import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Play, 
  CheckCircle2, 
  MoreVertical,
  RotateCcw,
  LayoutGrid,
  Bell,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  CheckCircle
} from 'lucide-react';

interface StudentPreviewProps {
  onCancel: () => void;
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({ onCancel }) => {
  const [activeWeek, setActiveWeek] = useState(3);

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden">
      {/* Left Sidebar - Student Navigation */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
           <h2 className="text-xl font-bold text-slate-800 mb-1">Preview as Student</h2>
           <p className="text-xs text-slate-400 font-medium">Experience the course as a student.</p>
        </div>

        <div className="p-6">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-6 bg-slate-50">
            <img 
              src="https://picsum.photos/seed/vr-preview/400/250" 
              alt="Course" 
              className="w-full aspect-video object-cover"
            />
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-800 leading-tight">VR Game Development Mastery</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">8 Weeks | May 10, 2024 – July 4, 2024</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Course Progress</h4>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            <ProgressItem 
              weekNum={1} 
              status="100% Completed" 
              percent={100} 
              checked={true} 
            />
            <ProgressItem 
              weekNum={2} 
              status="50% In Progress" 
              percent={50} 
              checked={true} 
              activeProgress={true}
            />
            <div className={`p-4 rounded-xl border transition-all ${activeWeek === 3 ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${activeWeek === 3 ? 'text-blue-600' : 'text-slate-800'}`}>Week 3</span>
                <ChevronRight className={`w-4 h-4 ${activeWeek === 3 ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Week 3 of 8</p>
            </div>
            
            <ProgressItem 
              weekNum={4} 
              status="" 
              percent={0} 
              checked={false} 
              collapsed={true}
            />

            <button className="w-full py-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors mt-4">
              View All Weeks
            </button>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
              Student data is simulated in preview mode.
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-white border-b border-slate-200 px-10 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6">
             <div>
               <h1 className="text-xl font-bold text-slate-800">VR Game Development Mastery</h1>
               <p className="text-xs text-slate-500">8 Weeks | <span className="text-slate-400">May 10, 2024 – July 4, 2024</span></p>
             </div>
             <div className="h-10 w-px bg-slate-200 mx-2" />
             <div className="flex items-center gap-6">
               <div className="flex flex-col gap-1">
                 <div className="flex items-center justify-between w-48">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">54% Completed</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                 </div>
                 <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full w-[54%]" />
                 </div>
               </div>
             </div>
          </div>
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-all shadow-sm active:scale-95"
          >
            Exit Preview
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 p-10 gap-10">
          <div className="flex-1 max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400">Lesson 3.2</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lesson Content</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900">VR Prototyping & Testing</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded-full border border-blue-200">In Progress</span>
              </div>
              <p className="text-slate-600 leading-relaxed max-w-2xl">
                Learn how to prototype VR environments and perform basic testing to ensure functionality. Follow along with the video tutorial and the provided checklist to create and test a simple VR prototype.
              </p>
            </div>

            {/* Video Block */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400">Watch</span>
                  <span className="text-sm font-bold text-blue-600">Prototyping In Unity</span>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-300 cursor-pointer" />
              </div>
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center group overflow-hidden">
                <img 
                   src="https://picsum.photos/seed/vr-lesson/1200/800" 
                   alt="Video" 
                   className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-white/30 transition-all shadow-2xl scale-110 active:scale-95">
                  <Play className="w-8 h-8 fill-current" />
                </button>
                <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 text-white/80">
                   <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[42%]" />
                   </div>
                   <span className="text-xs font-mono">12:45 / 24:00</span>
                </div>
              </div>
              <div className="p-8">
                 <p className="text-sm text-slate-500 leading-relaxed">
                   Learn how to prototype VR environments and perform basic testing to ensure functionality. Follow along with the video tutorial and the provided checklist to create and test a simple VR prototype.
                 </p>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-200">
               <button className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-400 text-sm font-bold hover:bg-slate-50 transition-all">
                 <ChevronLeft className="w-4 h-4" /> Previous Lesson
               </button>
               <button className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                 Next Lesson <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Right Sidebar - Mobile Mockup */}
          <div className="w-[380px] shrink-0 sticky top-24 h-fit">
            <div className="relative">
               {/* Phone Frame */}
               <div className="w-[320px] h-[650px] bg-slate-800 rounded-[3rem] p-3 border-8 border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-700 mx-auto">
                  <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col relative">
                     {/* StatusBar */}
                     <div className="h-10 px-6 flex items-center justify-between bg-white text-slate-900">
                        <span className="text-[10px] font-bold">9:41</span>
                        <div className="flex items-center gap-1.5">
                           <LayoutGrid className="w-3 h-3" />
                           <Bell className="w-3 h-3" />
                           <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-100">
                              <img src="https://i.pravatar.cc/100?u=katie" alt="User" />
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto pb-10">
                        <div className="p-5 space-y-4">
                           <div className="flex items-center gap-2 text-[8px] font-bold text-blue-600">
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>VR Game Courses</span>
                           </div>
                           
                           <h3 className="text-xs font-bold text-slate-800 leading-tight">VR Game Development Mastery</h3>
                           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">8 Weeks | May 10, 2024</p>
                           
                           <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                 <span className="text-[8px] font-bold text-blue-600 uppercase">54% Completed</span>
                                 <span className="text-[8px] font-bold text-slate-400">54%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="bg-emerald-500 h-full w-[54%]" />
                              </div>
                           </div>

                           <div className="pt-2 border-t border-slate-50">
                              <span className="text-[9px] font-bold text-slate-400">Lesson 3.2</span>
                              <div className="mt-2 flex items-center gap-2">
                                 <div className="p-1 bg-blue-100 text-blue-600 rounded">
                                    <BookOpen className="w-2.5 h-2.5" />
                                 </div>
                                 <span className="text-[8px] font-bold text-blue-600">In Progress</span>
                                 <span className="text-slate-200">|</span>
                                 <span className="text-[8px] font-bold text-slate-300">In Progress</span>
                              </div>
                           </div>

                           <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 p-2">
                              <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                                 <img src="https://picsum.photos/seed/mobile/400/250" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="w-4 h-4 text-white fill-current" />
                                 </div>
                              </div>
                              <p className="text-[7px] text-slate-500 leading-relaxed line-clamp-2">Learn how to prototype VR environments and perform basic testing...</p>
                           </div>

                           {/* Checklist */}
                           <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                 <RotateCcw className="w-3 h-3 text-slate-300" />
                                 <div className="flex items-center gap-1 p-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                    <CheckCircle className="w-2 h-2" />
                                    <span className="text-[6px] font-bold">Created!</span>
                                    <div className="flex gap-0.5 ml-1">
                                       {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-0.5 rounded-full bg-emerald-500" />)}
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-2">
                                 <ChecklistItem label="Tested the inter s-ctive objects" checked={true} />
                                 <ChecklistItem label="Tested the interactive object's" checked={true} />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Tab Bar */}
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-100 rounded-full flex items-center justify-center gap-1 p-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <div className="w-4 h-1.5 rounded-full bg-slate-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                     </div>
                  </div>
               </div>

               {/* Hint */}
               <div className="mt-8 flex items-center justify-center gap-3 text-slate-400">
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-medium">Responsive Mobile View</span>
               </div>
            </div>
          </div>
        </div>

        {/* Console Footers (Stylized) */}
        <div className="px-10 py-4 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono italic">
           <div className="flex items-center gap-4">
              <span>Critical API: |led.custtedents| (racurse)</span>
           </div>
           <div className="flex items-center gap-4">
              <span>GET |ap/student/./course&(course)</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const ProgressItem: React.FC<{ 
  weekNum: number; 
  status: string; 
  percent: number; 
  checked: boolean; 
  collapsed?: boolean;
  activeProgress?: boolean;
}> = ({ weekNum, status, percent, checked, collapsed, activeProgress }) => (
  <div className={`p-4 rounded-xl border transition-all ${activeProgress ? 'border-blue-200 bg-white' : 'border-slate-100 bg-white'}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
          {checked && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
        </div>
        <span className="text-sm font-bold text-slate-800">Week {weekNum}</span>
      </div>
      <span className="text-xs font-bold text-emerald-500">{percent}%</span>
    </div>
    {!collapsed && (
       <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{status}</p>
          {activeProgress && (
             <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full w-[50%]" />
             </div>
          )}
       </div>
    )}
  </div>
);

const ChecklistItem: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
  <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-50 bg-white shadow-sm">
    <div className={`w-2.5 h-2.5 rounded border flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-200'}`}>
      {checked && <CheckCircle className="w-1.5 h-1.5 text-white" />}
    </div>
    <span className="text-[6px] text-slate-600 font-medium truncate">{label}</span>
  </div>
);
