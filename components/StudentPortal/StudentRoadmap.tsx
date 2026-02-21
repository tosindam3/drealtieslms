import React, { useState } from 'react';
import {
  Lightbulb,
  Pencil,
  Search,
  ShieldCheck,
  Layers,
  Box,
  Zap,
  Target,
  Trophy,
  Star,
  Gamepad2,
  ChevronRight,
  ArrowLeft,
  Play,
  Lock,
  CheckCircle2,
  FileText,
  Activity,
  Clock,
  Unlock
} from 'lucide-react';
import { CourseData, Week, Lesson, Module } from '../../types';

interface StudentRoadmapProps {
  courseData: CourseData;
  hasPaid: boolean;
  onLaunchLesson: (lessonId: string) => void;
}

interface ModuleCardProps {
  module: Module;
  weekNum: number;
  icon: React.ElementType;
  progress: number;
  onClick: () => void;
  isFree: boolean;
  hasPaid: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, weekNum, icon: Icon, progress, onClick, isFree, hasPaid }) => {
  const isAccessible = hasPaid || isFree;

  return (
    <button
      onClick={onClick}
      className="relative group text-left w-full h-full"
    >
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-6 py-1 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded shadow-lg italic ${isFree ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-[#D4AF37] shadow-[#D4AF37]/20'}`}>
        {isFree ? 'FREE ACCESS' : `WEEK ${weekNum}`}
      </div>

      <div className={`bg-[#121214] border rounded-[2.5rem] p-10 pt-14 flex flex-col items-center text-center transition-all shadow-2xl h-full w-full relative overflow-hidden group ${isAccessible ? 'border-white/5 hover:border-[#D4AF37]/40 hover:bg-[#161b22]' : 'border-white/5 opacity-60'}`}>
        {!isAccessible && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8">
            <Lock className="w-12 h-12 text-[#D4AF37] mb-4" />
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Premium Required</span>
          </div>
        )}

        <div className={`w-16 h-16 border rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all shadow-xl ${isFree ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-[#D4AF37]'}`}>
          <Icon className="w-8 h-8" />
        </div>

        <h3 className="text-base font-black text-white uppercase tracking-widest mb-3 group-hover:text-[#D4AF37] transition-colors line-clamp-1 italic tracking-tight">
          {module.title}
        </h3>

        <div className="w-full pt-8 border-t border-white/5 mt-auto relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Access Status</span>
            <span className={`text-[10px] font-black italic tracking-tighter uppercase ${isAccessible ? 'text-emerald-500' : 'text-orange-500'}`}>
              {isAccessible ? 'Authorized' : 'Locked'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full transition-all duration-1000 ${isFree ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E]'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
};

export const StudentRoadmap: React.FC<StudentRoadmapProps> = ({ courseData, hasPaid, onLaunchLesson }) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  const getWeekIcon = (num: number) => {
    const icons = [Zap, Box, Target, Layers, Trophy, Star, Gamepad2, ShieldCheck];
    return icons[num % icons.length];
  };

  const allModules = courseData.weeks.flatMap(w => w.modules.map(m => ({
    ...m,
    weekNum: w.number,
    isFree: w.isFree || false
  })));
  const selectedModule = allModules.find(m => m.id === selectedModuleId);

  if (selectedModule) {
    return (
      <div className="p-12 max-w-[1100px] mx-auto min-h-screen animate-in fade-in duration-700">
        <button
          onClick={() => setSelectedModuleId(null)}
          className="flex items-center gap-3 text-slate-600 hover:text-[#D4AF37] transition-all mb-12 text-[10px] font-black uppercase tracking-[0.3em] group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Roadmap
        </button>

        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 mb-12 lg:mb-20 bg-[#121214] border border-white/5 p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl relative overflow-hidden text-center lg:text-left">
          <div className={`w-20 h-20 lg:w-24 lg:h-24 border rounded-3xl flex items-center justify-center shadow-2xl relative z-10 ${selectedModule.isFree ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'}`}>
            {React.createElement(getWeekIcon(selectedModule.weekNum), { className: "w-10 h-10 lg:w-12 lg:h-12" })}
          </div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Learning Module 0{selectedModule.position}</p>
              {selectedModule.isFree && <span className="inline-block px-3 py-1 bg-emerald-500 text-black text-[8px] font-black uppercase tracking-widest rounded mx-auto lg:mx-0 w-fit">Free Access</span>}
            </div>
            <h1 className="text-3xl lg:text-6xl font-black text-white italic tracking-tighter uppercase leading-tight">{selectedModule.title}</h1>
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          {selectedModule.lessons.map((lesson) => {
            const isLessonAccessible = hasPaid || lesson.isFree || selectedModule.isFree;
            return (
              <div
                key={lesson.id}
                className={`group flex flex-col md:flex-row items-center justify-between p-6 lg:p-8 bg-[#121214] border border-white/5 rounded-[2rem] transition-all shadow-xl gap-6 ${isLessonAccessible ? 'hover:border-[#D4AF37]/40' : 'opacity-50 cursor-not-allowed grayscale'}`}
              >
                <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-8 text-center md:text-left">
                  <div className={`w-14 h-14 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center font-black italic tracking-tighter text-xl text-slate-600 transition-colors shrink-0 ${isLessonAccessible ? 'group-hover:text-[#D4AF37]' : ''}`}>
                    {lesson.number}
                  </div>
                  <div>
                    <h4 className="text-lg lg:text-xl font-black text-white uppercase tracking-widest mb-1 lg:mb-2">{lesson.title}</h4>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      {lesson.isFree ? (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 text-center">
                          <Unlock className="w-3 h-3" /> Free Preview
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                          <Lock className="w-3 h-3" /> Premium Lesson
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto">
                  {!isLessonAccessible ? (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 mx-auto md:mx-0">
                      <Lock className="w-5 h-5 text-slate-800" />
                    </div>
                  ) : (
                    <button
                      onClick={() => onLaunchLesson(lesson.id)}
                      className="w-full md:w-auto flex items-center justify-center gap-4 px-8 py-3.5 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#B8962E] transition-all shadow-2xl active:scale-95 group/btn"
                    >
                      Start Lesson
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 max-w-[1500px] mx-auto min-h-screen animate-in fade-in duration-1000 relative">
      <div className="text-center mb-16 lg:mb-32 mt-8 lg:mt-16 space-y-4">
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-4 italic drop-shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          Learning Roadmap
        </h1>
        <p className="text-xs sm:text-base lg:text-xl font-bold text-slate-600 uppercase italic tracking-[0.2em] sm:tracking-[0.4em]">
          Master the fundamentals for free. Progress to professional levels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20 mb-32">
        {allModules.map((m, idx) => (
          <ModuleCard
            key={m.id}
            module={m}
            weekNum={m.weekNum}
            icon={getWeekIcon(m.weekNum)}
            progress={idx === 0 ? 100 : 0}
            onClick={() => setSelectedModuleId(m.id)}
            isFree={m.isFree}
            hasPaid={hasPaid}
          />
        ))}
      </div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[#D4AF37]/3 rounded-full blur-[180px] pointer-events-none -z-10" />
    </div>
  );
};