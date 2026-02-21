import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
  MoreVertical,
  BookOpen,
  ArrowLeft,
  Star,
  Download,
  Share2,
  Lock,
  Zap,
  Target,
  FileText,
  Activity,
  Radio,
  ExternalLink,
  Youtube,
  Layers,
  ChevronDown,
  Box,
  Image as ImageIcon,
  CreditCard,
  Layout,
  CheckCircle,
  Trophy,
  PartyPopper,
  Clock,
  RotateCcw,
  Rocket,
  ShieldCheck,
  Zap as ZapIcon
} from 'lucide-react';
import { CourseData, Lesson, Week, Topic, LessonBlock, Module, TopicBlock } from '../../types';
import { TopicPhotoBlock } from './TopicPhotoBlock';
import { LessonLiveBlock } from './LessonLiveBlock';
import { StudentQuizModal } from './StudentQuizModal';
import { StudentAssignmentModal } from './StudentAssignmentModal';
import { apiClient, API_BASE_URL, normalizeUrl } from '../../lib/apiClient';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { useTopicTimer } from '../../hooks/useTopicTimer';
import { useToast } from '../../lib/ToastContext';

interface StudentCourseViewProps {
  course: CourseData;
  onBack: () => void;
  initialLessonId?: string;
  initialTopicId?: string;
  hasPaid: boolean;
  onPurchase: () => void;
}

const Confetti = () => {
  const particles = Array.from({ length: 50 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: ['#D4AF37', '#FFF3D0', '#B8962E', '#FACC15', '#4ADE80'][Math.floor(Math.random() * 5)],
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animation: `fall ${2 + Math.random() * 3}s linear forwards`,
            animationDelay: `${Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            "--rot": `${Math.random() * 360}deg`
          } as any}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            top: 110%;
            transform: rotate(calc(var(--rot) + 720deg)) translateX(${Math.random() * 100 - 50}px);
          }
        }
      `}</style>
    </div>
  );
};

export const StudentCourseView: React.FC<StudentCourseViewProps> = ({
  course,
  onBack,
  initialLessonId,
  initialTopicId,
  hasPaid,
  onPurchase
}) => {
  const { addToast } = useToast();
  const [activeLessonId, setActiveLessonId] = useState<string>(initialLessonId || '');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(initialTopicId || null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [localWeeks, setLocalWeeks] = useState<Week[]>(course.weeks);
  const [celebration, setCelebration] = useState<{ active: boolean; weekTitle: string; xp: number } | null>(null);
  const [activeQuizBlock, setActiveQuizBlock] = useState<LessonBlock | null>(null);
  const [activeAssignmentBlock, setActiveAssignmentBlock] = useState<LessonBlock | null>(null);
  const [isCompletingTopic, setIsCompletingTopic] = useState(false);
  const [isCourseSidebarOpen, setIsCourseSidebarOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Time tracking for active topic
  const { timeSpent, isEligible, timeRemaining, isCompleted: topicIsCompleted } = useTopicTimer(activeTopicId);

  // Calculate Overall Statistics
  const stats = React.useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;
    let totalTopics = 0;
    let completedTopics = 0;
    let totalQuizzes = 0;
    let passedQuizzes = 0;
    let totalAssignments = 0;
    let approvedAssignments = 0;
    let totalLive = 0;
    let attendedLive = 0;

    localWeeks.forEach(week => {
      // Lessons & Topics
      week.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          totalLessons++;
          const lessonTopics = lesson.topics.length;
          const completedLessonTopics = lesson.topics.filter(t => t.isCompleted).length;

          totalTopics += lessonTopics;
          completedTopics += completedLessonTopics;

          if (lessonTopics > 0 && completedLessonTopics === lessonTopics) {
            completedLessons++;
          } else if (lessonTopics === 0) {
            // Handle lessons with no topics but maybe lesson blocks
            const lessonBlocks = lesson.lessonBlocks || [];
            const evaluatableBlocks = lessonBlocks.filter(b => ['quiz', 'assignment', 'live'].includes(b.type));
            if (evaluatableBlocks.length > 0 && evaluatableBlocks.every(b => b.isCompleted)) {
              completedLessons++;
            }
          }

          // Blocks in lessons
          (lesson.lessonBlocks || []).forEach(block => {
            if (block.type === 'quiz') {
              totalQuizzes++;
              if (block.isCompleted) passedQuizzes++;
            } else if (block.type === 'assignment') {
              totalAssignments++;
              if (block.isCompleted) approvedAssignments++;
            } else if (block.type === 'live') {
              totalLive++;
              if (block.isCompleted) attendedLive++;
            }
          });
        });
      });
    });

    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    return {
      lessons: { completed: completedLessons, total: totalLessons },
      topics: { completed: completedTopics, total: totalTopics },
      quizzes: { completed: passedQuizzes, total: totalQuizzes },
      assignments: { completed: approvedAssignments, total: totalAssignments },
      live: { completed: attendedLive, total: totalLive },
      overallProgress: Math.round(overallProgress)
    };
  }, [localWeeks]);

  useEffect(() => {
    setLocalWeeks(course.weeks);
  }, [course.weeks]);

  // Refresh progress from server after completion
  const refreshProgressFromServer = async () => {
    try {
      const response = await apiClient.get('/api/student/courses/authorized');
      if (response && response.weeks) {
        setLocalWeeks(response.weeks);
      }
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    }
  };

  useEffect(() => {
    let targetLessonId = initialLessonId;
    if (!targetLessonId) {
      const firstWeek = localWeeks[0];
      const firstModule = firstWeek?.modules[0];
      const firstLesson = firstModule?.lessons[0] || firstWeek?.lessons[0];
      if (firstLesson) targetLessonId = firstLesson.id;
    }

    if (targetLessonId) {
      setActiveLessonId(targetLessonId);
      const res = findHierarchyByLessonId(targetLessonId);
      if (res) {
        setExpandedModules(new Set([res.module.id]));

        // ONLY auto-select first topic IF lesson content is empty
        const hasLessonContent = res.lesson.lessonBlocks && res.lesson.lessonBlocks.length > 0;
        if (!hasLessonContent && res.lesson.topics.length > 0) {
          setActiveTopicId(res.lesson.topics[0].id);
        } else {
          setActiveTopicId(null);
        }
      }
    }
  }, [initialLessonId]);

  const playCelebrationSound = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046.50, context.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  };

  const findHierarchyByLessonId = (id: string) => {
    for (const week of localWeeks) {
      for (const module of week.modules) {
        const lesson = module.lessons.find(l => l.id === id);
        if (lesson) return { lesson, module, week };
      }
      const lesson = week.lessons?.find(l => l.id === id);
      if (lesson) return { lesson, module: { id: 'root', title: 'General' } as any, week };
    }
    return null;
  };

  const activeContent = findHierarchyByLessonId(activeLessonId);
  const isAccessible = hasPaid || activeContent?.lesson.isFree || activeContent?.week.isFree;
  const activeTopic = activeContent?.lesson.topics.find(t => t.id === activeTopicId);

  const handleLessonSelect = (lessonId: string, moduleId: string, isFree: boolean, isWeekFree: boolean) => {
    if (!hasPaid && !isFree && !isWeekFree) return;

    setActiveLessonId(lessonId);
    const res = findHierarchyByLessonId(lessonId);

    // ONLY auto-select first topic IF lesson content is empty
    const hasLessonContent = res?.lesson.lessonBlocks && res.lesson.lessonBlocks.length > 0;

    if (res && !hasLessonContent && res.lesson.topics.length > 0) {
      setActiveTopicId(res.lesson.topics[0].id);
    } else {
      setActiveTopicId(null);
    }

    const newSet = new Set(expandedModules);
    newSet.add(moduleId);
    setExpandedModules(newSet);
  };

  const handleTopicCompletion = async (topicId: string) => {
    if (isCompletingTopic) return;

    // Check if topic is already completed
    const topic = localWeeks
      .flatMap(w => w.modules)
      .flatMap(m => m.lessons)
      .flatMap(l => l.topics)
      .find(t => t.id === topicId);

    if (!topic) return;

    // Don't allow uncompleting
    if (topic.isCompleted || topic.progressPercent === 100) {
      addToast({
        title: 'Already Completed',
        description: 'This topic has already been completed.',
        type: 'info'
      });
      return;
    }

    setIsCompletingTopic(true);

    try {
      // Call the correct completion endpoint
      const response = await apiClient.post(`/api/topics/${topicId}/complete`, {
        completion_data: {
          completed_from: 'course_view',
          time_spent: timeSpent,
          timestamp: new Date().toISOString()
        }
      });

      if (response) {
        // Update local state from server response
        let weekCompleted = false;
        let completedWeekTitle = "";

        const newWeeks = localWeeks.map((week) => {
          const allModulesInWeekDoneBefore = week.modules.every(m =>
            m.lessons.every(l => l.topics.every(t => t.isCompleted || t.progressPercent === 100))
          );

          const updatedModules = week.modules.map(module => ({
            ...module,
            lessons: module.lessons.map(lesson => ({
              ...lesson,
              topics: lesson.topics.map(t => {
                if (t.id === topicId) {
                  return {
                    ...t,
                    isCompleted: true,
                    progressPercent: 100
                  };
                }
                return t;
              })
            }))
          }));

          const allModulesInWeekDoneAfter = updatedModules.every(m =>
            m.lessons.every(l => l.topics.every(t => t.isCompleted || t.progressPercent === 100))
          );

          if (!allModulesInWeekDoneBefore && allModulesInWeekDoneAfter) {
            weekCompleted = true;
            completedWeekTitle = week.title || `Week ${week.number}`;
          }

          return { ...week, modules: updatedModules };
        });

        setLocalWeeks(newWeeks);

        // Show success toast
        addToast({
          title: 'Topic Completed!',
          description: `You earned ${response.topic?.coin_reward || 0} coins!`,
          type: 'success'
        });

        // Refresh progress from server to ensure sync
        await refreshProgressFromServer();

        // Check for week completion
        if (weekCompleted) {
          setCelebration({ active: true, weekTitle: completedWeekTitle, xp: 500 });
          playCelebrationSound();

          // Trigger Upgrade Prompt if Foundation (Week 0) is completed and user hasn't paid
          const currentWeek = findHierarchyByLessonId(topic.lesson_id)?.week;
          if (currentWeek && currentWeek.number === 0 && !hasPaid) {
            // Delay slightly to let celebration show first
            setTimeout(() => {
              setShowUpgradePrompt(true);
            }, 1000);
          }

          // Unlock next week
          const finalWeeks = newWeeks.map((week, idx) => {
            if (idx > 0 && newWeeks[idx - 1].modules.every(m =>
              m.lessons.every(l => l.topics.every(t => t.isCompleted || t.progressPercent === 100))
            )) {
              return { ...week, lockPolicy: { ...week.lockPolicy, lockedByDefault: false } };
            }
            return week;
          });
          setLocalWeeks(finalWeeks);
        }
      }
    } catch (error: any) {
      console.error('Topic completion failed:', error);
      addToast({
        title: 'Completion Failed',
        description: error.message || 'Failed to complete topic. Please try again.',
        type: 'error'
      });
    } finally {
      setIsCompletingTopic(false);
    }
  };

  const renderLessonBlock = (block: LessonBlock) => {
    if (!isAccessible) return null;
    switch (block.type) {
      case 'video':
        const videoUrl = block.payload?.url || '';
        const sourceType = block.payload?.sourceType || 'youtube';
        const posterUrl = block.payload?.posterUrl || '';
        const coinReward = block.coinReward || 0;
        const isRequired = block.required || false;

        // Helper to get correct video source
        const getVideoSrc = () => {
          if (sourceType === 'youtube') {
            // Extract ID from full URL if present
            let videoId = videoUrl;
            try {
              if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                const urlObj = new URL(videoUrl);
                if (videoUrl.includes('youtube.com/watch')) {
                  videoId = urlObj.searchParams.get('v') || videoId;
                } else if (videoUrl.includes('youtu.be')) {
                  videoId = urlObj.pathname.slice(1);
                }
              }
            } catch (e) {
              // Fallback to original if parsing fails
            }
            return `https://www.youtube.com/embed/${videoId}`;
          }
          // Handle valid internal paths
          if (sourceType === 'internal' && !videoUrl.startsWith('http') && !videoUrl.startsWith('vault://')) {
            return `${API_BASE_URL}${videoUrl}`;
          }

          // Legacy/Invalid check
          if (videoUrl.startsWith('vault://')) {
            console.warn('Legacy vault URL detected:', videoUrl);
            return ''; // This will trigger the "Video not available" fallback
          }

          return videoUrl;
        };

        const embedUrl = getVideoSrc();

        return (
          <div key={block.id} className="bg-[#121214] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="px-6 lg:px-8 py-4 lg:py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Play className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">{block.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    {coinReward > 0 && (
                      <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider">
                        +{coinReward} Coins
                      </span>
                    )}
                    {isRequired && (
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-8">
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl">
                {embedUrl ? (
                  sourceType === 'youtube' ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={embedUrl}
                      poster={posterUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Video not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div key={block.id} className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
            <RichTextRenderer content={block.payload?.content || ''} />
          </div>
        );
      case 'live': return <LessonLiveBlock key={block.id} block={block} />;
      case 'quiz':
        return (
          <div className="bg-[#161b22] border border-white/5 p-6 lg:p-10 rounded-[2.5rem] shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 lg:gap-6 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assessment</span>
                  <h4 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter">{block.title}</h4>
                </div>
              </div>
              <button
                onClick={() => setActiveQuizBlock(block)}
                className="w-full sm:w-auto px-8 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase rounded-xl hover:bg-[#B8962E] transition-all flex items-center justify-center gap-2"
              >
                {block.isCompleted ? (
                  <>
                    <RotateCcw className="w-4 h-4" /> Retake Quiz
                  </>
                ) : 'Initialize Quiz'}
              </button>
            </div>
          </div>
        );
      case 'assignment':
        return (
          <div className="bg-[#161b22] border border-white/5 p-6 lg:p-10 rounded-[2.5rem] shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 lg:gap-6 text-center sm:text-left flex-col sm:flex-row">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                  <Target className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Submission</span>
                  <h4 className="text-xl lg:text-2xl font-black text-white italic uppercase tracking-tighter">{block.title}</h4>
                </div>
              </div>
              <button
                onClick={() => setActiveAssignmentBlock(block)}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                {block.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                {block.isCompleted ? 'Assignment Approved' : 'Access Assignment'}
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderTopicBlock = (block: TopicBlock) => {
    if (!isAccessible) return null;
    switch (block.type) {
      case 'video':
        const isDone = activeTopic?.progressPercent === 100 || activeTopic?.isCompleted;
        const videoUrl = normalizeUrl(block.payload?.url || '');
        const posterUrl = normalizeUrl(block.payload?.posterUrl || '');
        const enableManualCompletion = block.payload?.enableManualCompletion || false;
        const autoCompleteOnEnd = block.payload?.autoCompleteOnEnd || false;

        return (
          <div key={block.id} className="bg-[#121214] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl space-y-6 pb-1">
            <div className="px-6 lg:px-8 py-4 lg:py-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-500/10 rounded-lg"><Play className="w-4 h-4 text-red-500" /></div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Video Stream</h4>
              </div>
              {enableManualCompletion && activeTopic && (
                <div className="flex flex-col sm:flex-row items-center gap-3 lg:gap-4 w-full lg:w-auto">
                  {/* Time tracking indicator */}
                  {!isDone && !isEligible && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl w-full sm:w-auto justify-center">
                      <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-center">
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} remaining
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => activeTopic && handleTopicCompletion(activeTopic.id)}
                    disabled={!isEligible || isDone || isCompletingTopic}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 border ${isDone
                      ? 'bg-emerald-500 text-black border-emerald-500'
                      : isEligible
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] hover:bg-[#B8962E] cursor-pointer'
                        : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                      }`}
                  >
                    {isCompletingTopic ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Completing...
                      </>
                    ) : isDone ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 fill-current" />
                        Completed
                      </>
                    ) : isEligible ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Complete Topic
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Keep Learning
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="px-8 pb-8">
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={posterUrl}
                    controls
                    onEnded={() => autoCompleteOnEnd && activeTopic && isEligible && handleTopicCompletion(activeTopic.id)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Video not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div key={block.id} className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-10 shadow-xl">
            <RichTextRenderer content={block.payload?.content || ''} />
          </div>
        );
      case 'photo':
        const images = block.payload?.images || [];
        return images.length > 0 ? <TopicPhotoBlock key={block.id} images={images} /> : null;
      default: return null;
    }
  };

  const OverallProgressCard = () => (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 mb-8 lg:mb-12 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#D4AF37]/5 to-transparent pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-10">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
              <Activity className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Course Progress</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Aggregated Performance Metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6">
            <StatItem label="Lessons" completed={stats.lessons.completed} total={stats.lessons.total} icon={BookOpen} color="text-blue-400" />
            <StatItem label="Topics" completed={stats.topics.completed} total={stats.topics.total} icon={Layers} color="text-amber-400" />
            <StatItem label="Quizzes" completed={stats.quizzes.completed} total={stats.quizzes.total} icon={Zap} color="text-[#D4AF37]" />
            <StatItem label="Assignments" completed={stats.assignments.completed} total={stats.assignments.total} icon={Target} color="text-emerald-400" />
            <StatItem label="Live" completed={stats.live.completed} total={stats.live.total} icon={Radio} color="text-red-400" />
          </div>
        </div>

        <div className="lg:w-64 space-y-6 lg:border-l lg:border-white/5 lg:pl-10">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-4xl font-black text-white italic tracking-tighter">{(course as any).coinBalance || 0}</p>
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Accumulated Coins</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white italic tracking-tighter">{stats.overallProgress}%</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Completion</p>
            </div>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden shadow-inner ring-1 ring-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] transition-all duration-1000 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const StatItem = ({ label, completed, total, icon: Icon, color }: any) => (
    <div className="p-4 bg-black/20 border border-white/5 rounded-2xl group/stat hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-white italic tracking-tighter">{completed}</span>
        <span className="text-[10px] font-bold text-slate-600">/ {total}</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0b] overflow-hidden selection:bg-[#D4AF37]/30">
      {celebration && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <Confetti />
          <div className="absolute inset-0 bg-[#07070A]/90 backdrop-blur-md" onClick={() => setCelebration(null)} />
          <div className="relative w-full max-w-xl bg-[#121214] border border-[#D4AF37]/30 rounded-[3.5rem] p-12 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-[2rem] border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <PartyPopper className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-4">Milestone Reached!</h2>
            <p className="text-slate-400 text-lg font-medium italic mb-10">You've successfully completed <span className="text-white font-black">{celebration.weekTitle}</span>.</p>
            <button onClick={() => setCelebration(null)} className="px-12 py-5 bg-[#D4AF37] text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl">Continue Training</button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      {isCourseSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[140]"
          onClick={() => setIsCourseSidebarOpen(false)}
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-[150] w-80 bg-[#121214] border-r border-white/5 flex flex-col shrink-0 transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isCourseSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 border-b border-white/5">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all mb-6 text-[10px] font-black uppercase tracking-[0.2em] group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Terminal
          </button>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight line-clamp-2">{course.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {localWeeks.map((week) => (
            <div key={week.id} className="space-y-3">
              <div className={`px-4 py-2 rounded-lg border flex items-center justify-between ${week.isFree ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${week.isFree ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {week.number === 0 ? 'Foundation' : `WEEK ${week.number.toString().padStart(2, '0')}`}
                </span>
                {week.isFree && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">FREE</span>}
              </div>
              <div className="space-y-1 pl-1">
                {week.modules.map((module) => {
                  const isExpanded = expandedModules.has(module.id);
                  return (
                    <div key={module.id} className="space-y-1">
                      <button onClick={() => setExpandedModules(new Set([module.id]))} className={`w-full px-4 py-2.5 flex items-center justify-between rounded-xl transition-all ${isExpanded ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isExpanded ? 'text-white' : 'text-slate-500'}`}>{module.title}</span>
                      </button>
                      {isExpanded && (
                        <div className="pl-6 space-y-2 animate-in slide-in-from-top-2 duration-300">
                          {module.lessons.map((lesson) => {
                            const accessible = hasPaid || lesson.isFree || week.isFree;
                            const active = activeLessonId === lesson.id;
                            return (
                              <div key={lesson.id} className="space-y-1">
                                <button
                                  onClick={() => {
                                    handleLessonSelect(lesson.id, module.id, lesson.isFree || false, week.isFree || false);
                                    if (window.innerWidth < 1024) setIsCourseSidebarOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 flex items-center justify-between rounded-lg transition-all border border-transparent ${active ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]' : 'hover:bg-white/5 text-slate-500'} ${!accessible ? 'opacity-30' : ''}`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {lesson.topics.length > 0 && lesson.topics.every(t => t.isCompleted) && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">{lesson.title}</span>
                                  </div>
                                  {!accessible && <Lock className="w-3 h-3" />}
                                </button>

                                {active && accessible && lesson.topics.length > 0 && (
                                  <div className="pl-6 space-y-1 py-1 border-l border-white/5 ml-4">
                                    {lesson.topics.map((topic) => (
                                      <button
                                        key={topic.id}
                                        onClick={() => {
                                          setActiveTopicId(topic.id);
                                          if (window.innerWidth < 1024) setIsCourseSidebarOpen(false);
                                        }}
                                        className={`w-full px-3 py-1.5 flex items-center justify-between rounded-lg transition-all ${activeTopicId === topic.id ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                                      >
                                        <div className="flex items-center gap-2 truncate mr-2">
                                          {topic.isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                          <span className="text-[9px] font-bold uppercase tracking-wider truncate">{topic.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[8px] font-black">{topic.progressPercent || 0}%</span>
                                          <div className="w-6 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-emerald-500 transition-all duration-700"
                                              style={{ width: `${topic.progressPercent || 0}%` }}
                                            />
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col bg-[#0a0a0b]">
        {!isAccessible ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 text-center">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-[2rem] flex items-center justify-center mb-8 lg:mb-10 shadow-2xl">
              <Lock className="w-8 h-8 lg:w-10 lg:h-10 text-[#D4AF37]" />
            </div>
            <h2 className="text-3xl lg:text-6xl font-black text-white italic tracking-tighter uppercase mb-4 lg:mb-6">Restricted Node</h2>
            <p className="text-slate-400 text-base lg:text-xl font-medium leading-relaxed italic max-w-lg mb-8 lg:mb-12">Authorized credentials required for advanced modules.</p>
            <button onClick={onPurchase} className="px-10 py-5 lg:px-12 lg:py-6 bg-[#D4AF37] text-black text-[10px] lg:text-[12px] font-black uppercase tracking-widest rounded-2xl shadow-2xl active:scale-95 flex items-center gap-4">
              <CreditCard className="w-5 h-5" /> Initialize Upgrade
            </button>
          </div>
        ) : activeContent ? (
          <>
            <header className="h-20 lg:h-24 border-b border-white/5 px-6 lg:px-12 flex items-center justify-between bg-[#121214]/60 backdrop-blur-xl sticky top-0 z-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCourseSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Layout className="w-6 h-6" />
                </button>
                <h2 className="text-[10px] lg:text-sm font-black text-white uppercase tracking-widest truncate max-w-[200px] sm:max-w-none">
                  {activeTopic ? `Topic: ${activeTopic.title}` : `Lesson: ${activeContent.lesson.title}`}
                </h2>
              </div>
            </header>
            <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-12 space-y-8 lg:space-y-12 pb-40">
              <OverallProgressCard />
              {!activeTopic ? (
                <div className="space-y-6 animate-in fade-in duration-700">
                  <div className="space-y-6">
                    <h1 className="text-4xl lg:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">{activeContent.lesson.title}</h1>
                    <div className="border-l-4 border-[#D4AF37] pl-6 lg:pl-10">
                      <RichTextRenderer content={activeContent.lesson.description || "<p className='text-lg lg:text-2xl text-slate-400 font-medium leading-relaxed italic'>Synthesizing instructional objectives...</p>"} />
                    </div>
                  </div>
                  <div className="space-y-8 pt-8 border-t border-white/5">
                    {(!activeContent.lesson.lessonBlocks || activeContent.lesson.lessonBlocks.length === 0) ? (
                      <div className="p-16 text-center bg-black/20 border border-white/5 rounded-3xl">
                        <BookOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No lesson blocks configured yet</p>
                        <p className="text-xs text-slate-700 mt-2">Lesson blocks will appear here once configured by the instructor</p>
                      </div>
                    ) : (
                      activeContent.lesson.lessonBlocks.map(block => renderLessonBlock(block))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-10 lg:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="space-y-6 lg:space-y-8">
                    <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">{activeTopic.title}</h1>
                    {activeTopic.description && (
                      <div className="border-l-4 border-[#D4AF37] pl-6 lg:pl-10">
                        <RichTextRenderer content={activeTopic.description} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-12">
                    {activeTopic.blocks?.map(block => renderTopicBlock(block))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>

      {activeQuizBlock && (
        <StudentQuizModal
          isOpen={!!activeQuizBlock}
          onClose={() => setActiveQuizBlock(null)}
          block={activeQuizBlock}
          onComplete={async (score, coins) => {
            // Mark quiz block as completed in local state
            const updatedWeeks = localWeeks.map(week => ({
              ...week,
              modules: week.modules.map(module => ({
                ...module,
                lessons: module.lessons.map(lesson => ({
                  ...lesson,
                  lessonBlocks: lesson.lessonBlocks?.map(block =>
                    block.id === activeQuizBlock.id
                      ? { ...block, isCompleted: true, score, coinsEarned: coins }
                      : block
                  )
                }))
              }))
            }));

            setLocalWeeks(updatedWeeks);

            // Show success toast
            addToast({
              title: score >= (activeQuizBlock.payload.passScore || 70) ? 'Quiz Passed!' : 'Quiz Completed',
              description: `You scored ${Math.round(score)}% and earned ${coins} coins`,
              type: score >= (activeQuizBlock.payload.passScore || 70) ? 'success' : 'info'
            });

            // Refresh from server to get updated coin balance
            await refreshProgressFromServer();
          }}
        />
      )}

      {activeAssignmentBlock && (
        <StudentAssignmentModal
          isOpen={!!activeAssignmentBlock}
          onClose={() => setActiveAssignmentBlock(null)}
          block={activeAssignmentBlock}
          onComplete={async (status) => {
            // Mark assignment block as completed in local state if approved
            if (status === 'approved') {
              const updatedWeeks = localWeeks.map(week => ({
                ...week,
                modules: week.modules.map(module => ({
                  ...module,
                  lessons: module.lessons.map(lesson => ({
                    ...lesson,
                    lessonBlocks: lesson.lessonBlocks?.map(block =>
                      block.id === activeAssignmentBlock.id
                        ? { ...block, isCompleted: true, status }
                        : block
                    )
                  }))
                }))
              }));

              setLocalWeeks(updatedWeeks);

              addToast({
                title: 'Assignment Approved!',
                description: 'Your assignment has been approved',
                type: 'success'
              });

              await refreshProgressFromServer();
            }
          }}
        />
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <Confetti />
          <div className="absolute inset-0 bg-[#07070A]/95 backdrop-blur-xl" onClick={() => setShowUpgradePrompt(false)} />
          <div className="relative w-full max-w-2xl bg-[#121214] border border-[#D4AF37]/30 rounded-[3.5rem] p-10 lg:p-14 text-center shadow-[0_0_100px_rgba(212,175,55,0.15)] animate-in zoom-in-95 duration-500">
            <div className="flex justify-center -mt-24 mb-10">
              <div className="relative">
                <div className="absolute inset-0 bg-[#D4AF37] blur-[50px] opacity-20 animate-pulse" />
                <div className="relative w-32 h-32 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3 transition-transform hover:rotate-6">
                  <Rocket className="w-16 h-16 text-black" />
                </div>
              </div>
            </div>

            <span className="inline-block px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-6">
              Foundation Complete
            </span>

            <h2 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none">
              Ready for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFF3D0]">The Major Leagues?</span>
            </h2>

            <p className="text-slate-400 text-base lg:text-lg font-medium italic mb-10 max-w-lg mx-auto leading-relaxed">
              Congratulations on mastering the basics! You've successfully completed the <span className="text-white font-black">Foundation Node</span>. Unlock the full curriculum to access advanced psychological patterns, institutional liquidity models, and our exclusive live trading terminal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Advanced Curriculum</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <ZapIcon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Signals</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                <Trophy className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Certification</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => {
                  setShowUpgradePrompt(false);
                  onPurchase();
                }}
                className="w-full sm:w-auto px-12 py-5 bg-[#D4AF37] text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:bg-[#B8962E] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4"
              >
                <CreditCard className="w-5 h-5" /> Initialize Upgrade
              </button>
              <button
                onClick={() => setShowUpgradePrompt(false)}
                className="text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
