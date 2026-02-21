import React from 'react';
import {
  Play,
  CheckCircle2,
  Calendar,
  MessageSquare,
  ArrowRight,
  Clock,
  Zap,
  Star,
  Trophy,
  TrendingUp
} from 'lucide-react';
import { CourseData } from '../../types';

interface StudentDashboardProps {
  course: CourseData;
  user: any;
  onCourseSelect: () => void;
  onLaunchTopic?: (lessonId: string, topicId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ course, user, onCourseSelect, onLaunchTopic }) => {
  // Calculate Overall Progress
  const stats = React.useMemo(() => {
    let totalTopics = 0;
    let completedTopics = 0;

    course.weeks.forEach(week => {
      week.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          totalTopics += lesson.topics.length;
          completedTopics += lesson.topics.filter(t => t.isCompleted).length;
        });
      });
    });

    return {
      percentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      totalTopics,
      completedTopics
    };
  }, [course]);

  const firstName = user?.name?.split(' ')[0] || 'Student';
  return (
    <div className="space-y-6 lg:space-y-10 p-4 sm:p-6 lg:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Hero Welcome */}
      <div className="relative bg-[#121214] border border-white/5 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-16 text-white overflow-hidden shadow-2xl ring-1 ring-white/5">
        <div className="relative z-10 flex items-center justify-between">
          <div className="max-w-2xl w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-6 lg:mb-10">
              <Zap className="w-3.5 h-3.5 fill-current" />
              {course.category} Core • {course.skillLevel} Enrollment
            </div>
            <h1 className="text-4xl lg:text-7xl font-black mb-4 italic tracking-tighter uppercase leading-[0.9]">Welcome back, {firstName}.</h1>
            <p className="text-slate-400 text-base lg:text-xl leading-relaxed mb-10 italic font-medium max-w-xl opacity-80">
              Your academic performance is being tracked in real-time. Continue your path to master professional trading strategies.
            </p>
            <button
              onClick={() => {
                if (course.resumeTopic && onLaunchTopic) {
                  onLaunchTopic(course.resumeTopic.lessonId, course.resumeTopic.topicId);
                } else {
                  onCourseSelect();
                }
              }}
              className="w-full sm:w-auto px-10 py-5 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-[#D4AF37]/20 transition-all active:scale-95 flex items-center justify-center gap-4 group"
            >
              {course.resumeTopic ? 'Resume Learning Path' : 'Explore Curriculum'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="hidden lg:block w-80 h-80 relative">
            <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-[100px] opacity-10 animate-pulse"></div>
            <div className="relative w-full h-full bg-black/40 rounded-[3rem] border border-white/5 shadow-2xl p-8 flex flex-col justify-between backdrop-blur-xl">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-[#D4AF37] rounded-2xl shadow-xl shadow-[#D4AF37]/20">
                  <Trophy className="w-8 h-8 text-black" />
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-white italic tracking-tighter">{(course as any).coinBalance || 0}</span>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Accumulated Coins</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Course Progress</p>
                  <p className="text-white text-[10px] font-black italic">{stats.percentage}%</p>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] h-full shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-1000" style={{ width: `${stats.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#D4AF37]/5 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left: Active Curriculum */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37]" />
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Current Modules</h2>
            </div>
            <button
              onClick={onCourseSelect}
              className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline"
            >
              View all modules <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {course.resumeTopic ? (
            <div
              onClick={() => onLaunchTopic?.(course.resumeTopic!.lessonId, course.resumeTopic!.topicId)}
              className="group relative bg-[#161b22] rounded-[2.5rem] border border-white/5 p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 shadow-xl hover:border-[#D4AF37]/40 transition-all cursor-pointer overflow-hidden"
            >
              <div className="w-full lg:w-56 aspect-video rounded-[1.5rem] overflow-hidden shrink-0 border border-white/5">
                <img src={`https://picsum.photos/seed/${course.resumeTopic.topicId}/600/400`} alt="Course" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000 group-hover:opacity-100" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full text-[9px] font-black uppercase tracking-widest">Next Up</span>
                  <span className="text-slate-700 font-black">•</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{course.title}</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-4 italic tracking-tight group-hover:text-[#D4AF37] transition-colors">{course.resumeTopic.title}</h3>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#D4AF37]" /> Pending completion</span>
                  <span className="flex items-center gap-2"><Play className="w-4 h-4 text-[#D4AF37]" /> Continue Session</span>
                </div>
              </div>
              <div className="lg:pr-6">
                <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center text-[#D4AF37] font-black italic text-lg shadow-inner bg-black/20">
                  {stats.percentage}%
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div
              onClick={onCourseSelect}
              className="p-16 text-center bg-[#161b22] border border-dashed border-white/10 rounded-[2.5rem] hover:border-[#D4AF37]/40 transition-all cursor-pointer"
            >
              <Trophy className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-6" />
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Course Completed!</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">You've mastered all current modules in this curriculum.</p>
            </div>
          )}

          {/* Priority Tasks */}
          <div className="space-y-6 pt-6">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Upcoming Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(course.upcomingTasks || []).length > 0 ? (
                course.upcomingTasks?.map(task => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    course={task.course}
                    due={task.due}
                    type={task.type}
                    color={task.type === 'Quiz' ? "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}
                  />
                ))
              ) : (
                <div className="col-span-2 p-10 bg-black/20 border border-white/5 rounded-3xl text-center">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">All primary objectives achieved. Check back soon for new assessments.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Upcoming Sessions */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-[#121214] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl">
            <h3 className="text-xs font-black text-white mb-10 flex items-center gap-3 uppercase tracking-widest">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              Upcoming Classes
            </h3>
            <div className="space-y-8">
              {(course.upcomingClasses || []).length > 0 ? (
                course.upcomingClasses?.map(lc => (
                  <EventItem
                    key={lc.id}
                    title={lc.title}
                    time={lc.time}
                    instructor={lc.instructor}
                  />
                ))
              ) : (
                <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No sessions scheduled</p>
                </div>
              )}
            </div>
            <button className="w-full mt-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/10 transition-all">
              View Calendar
            </button>
          </div>

          {/* Activity Feed Sidebar */}
          <div className="bg-[#121214] rounded-[2.5rem] border border-white/5 p-10 shadow-2xl">
            <h3 className="text-xs font-black text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              Activity Feed
            </h3>
            <div className="space-y-6">
              {(course.activityFeed || []).length > 0 ? (
                course.activityFeed?.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-1.5 h-10 bg-[#D4AF37] rounded-full" />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{activity.type}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 truncate max-w-[150px]">{activity.title}</p>
                      <p className="text-[8px] font-black text-slate-700 uppercase">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center py-4">No recent activity detected.</p>
              )}
            </div>
          </div>

          <div className="bg-[#D4AF37] rounded-[2.5rem] p-10 text-black shadow-2xl shadow-[#D4AF37]/10 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all">
            <div className="relative z-10">
              <MessageSquare className="w-10 h-10 text-black/40 mb-6" />
              <h3 className="text-2xl font-black mb-3 italic tracking-tight uppercase">Instructor Support</h3>
              <p className="text-black/70 text-[11px] font-bold uppercase leading-relaxed mb-8 tracking-widest">
                Get direct help from our mentors and connect with fellow students.
              </p>
              <button className="px-8 py-3 bg-black text-white font-black text-[9px] uppercase tracking-[0.3em] rounded-xl hover:bg-slate-900 transition-all">
                Contact Support
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ title: string; course: string; due: string; type: string; color: string }> = ({ title, course, due, type, color }) => (
  <div className="p-8 bg-[#161b22] border border-white/5 rounded-[2rem] hover:border-[#D4AF37]/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden">
    <div className="flex justify-between items-start mb-6">
      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${color}`}>{type}</span>
      <CheckCircle2 className="w-5 h-5 text-slate-800 group-hover:text-[#D4AF37] transition-colors" />
    </div>
    <h4 className="text-lg font-black text-white mb-2 leading-tight italic tracking-tight group-hover:text-[#D4AF37] transition-colors">{title}</h4>
    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{course}</p>
    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Deadline</span>
      <span className="text-[10px] font-black text-slate-300 italic">{due}</span>
    </div>
    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#D4AF37]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

const EventItem: React.FC<{ title: string; time: string; instructor: string }> = ({ title, time, instructor }) => (
  <div className="flex gap-6 group cursor-pointer">
    <div className="w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/5 group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-all">
      <span className="text-[9px] font-black text-slate-500 group-hover:text-[#D4AF37] uppercase">Dec</span>
      <span className="text-xl font-black text-white italic group-hover:text-[#D4AF37]">28</span>
    </div>
    <div>
      <h4 className="text-[13px] font-black text-white group-hover:text-[#D4AF37] transition-colors uppercase tracking-widest">{title}</h4>
      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{time}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-white/10"></div>
        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic">{instructor}</span>
      </div>
    </div>
  </div>
);
