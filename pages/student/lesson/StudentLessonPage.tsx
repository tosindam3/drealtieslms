import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle2,
  Lock,
  Coins,
  ArrowLeft,
  Layout,
  BookOpen,
  Zap,
  Star,
  Trophy,
  History
} from 'lucide-react';
import { Lesson, Topic, LessonBlock, TopicBlock } from '../../../types';
import { RichTextRenderer } from '../../../components/common/RichTextRenderer';
import { useTopicTimer } from '../../../hooks/useTopicTimer';
import { TopicCompletionButton } from '../../../components/TopicCompletionButton';
import { apiClient } from '../../../lib/apiClient';
import { useToast } from '../../../lib/ToastContext';

export const StudentLessonPage: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const { addToast } = useToast();

  // Time tracking for current topic
  const { timeSpent, isEligible, timeRemaining, isCompleted, minTimeRequired } = useTopicTimer(
    selectedTopic?.id || null
  );

  useEffect(() => {
    // Mock API Fetch: apiClient.get(`/student/lessons/${lessonId}`).then(...)
    setTimeout(() => {
      setLesson({
        id: lessonId,
        number: '1.1',
        title: 'The Golden Mindset',
        thumbnailUrl: 'https://picsum.photos/seed/mindset/800/450',
        order: 1,
        status: 'published',
        topics: [
          {
            id: 't1',
            title: 'Psychology of the Top 1%',
            thumbnailUrl: 'https://picsum.photos/seed/psy/200/200',
            order: 1,
            progressPercent: 100,
            blocks: []
          },
          {
            id: 't2',
            title: 'Risk Tolerance Architect',
            thumbnailUrl: 'https://picsum.photos/seed/risk/200/200',
            order: 2,
            progressPercent: 45,
            blocks: []
          },
          {
            id: 't3',
            title: 'Capital Preservation Systems',
            thumbnailUrl: 'https://picsum.photos/seed/cap/200/200',
            order: 3,
            isLocked: true,
            blocks: []
          }
        ],
        lessonBlocks: []
      });
      setIsLoading(false);
    }, 1000);
  }, [lessonId]);

  const handleCompleteTopic = async () => {
    if (!selectedTopic || isCompleting) return;

    // Check if already completed
    if (selectedTopic.progressPercent === 100 || selectedTopic.isCompleted) {
      addToast({
        title: 'Already Completed',
        description: 'This topic has already been completed.',
        type: 'info'
      });
      return;
    }

    setIsCompleting(true);
    try {
      const response = await apiClient.post(`/api/topics/${selectedTopic.id}/complete`, {
        completion_data: {
          completed_from: 'lesson_page',
          time_spent: timeSpent,
          timestamp: new Date().toISOString()
        }
      });

      if (response) {
        addToast({
          title: 'Topic Completed!',
          description: `You earned ${response.topic?.coin_reward || 0} coins!`,
          type: 'success'
        });

        // Update local topic state
        setSelectedTopic(prev => prev ? { ...prev, progressPercent: 100, isCompleted: true } : null);

        // Refresh lesson data to update completion status
        // In production, you'd fetch updated lesson data here
        if (lesson) {
          const updatedTopics = lesson.topics.map(t =>
            t.id === selectedTopic.id ? { ...t, progressPercent: 100, isCompleted: true } : t
          );
          setLesson({ ...lesson, topics: updatedTopics });
        }
      }
    } catch (error: any) {
      console.error('Topic completion failed:', error);
      addToast({
        title: 'Completion Failed',
        description: error.message || 'Failed to mark topic as complete.',
        type: 'error'
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a]">
      {/* LEFT: Topics Navigation */}
      <aside className="w-80 border-r border-slate-800 flex flex-col shrink-0 bg-[#121214]">
        <div className="p-8 border-b border-slate-800">
          <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight">{lesson.title}</h1>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-black text-slate-500 tracking-widest">54% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
            <div className="h-full bg-[#D4AF37]" style={{ width: '54%' }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Course Topics</h3>
          {lesson.topics.map(topic => (
            <button
              key={topic.id}
              disabled={topic.isLocked}
              onClick={() => setSelectedTopic(topic)}
              className={`w-full text-left p-4 rounded-2xl border transition-all relative group overflow-hidden ${selectedTopic?.id === topic.id
                ? 'bg-[#D4AF37]/5 border-[#D4AF37]/30'
                : topic.isLocked ? 'bg-black/20 border-slate-800/50 opacity-40 grayscale' : 'bg-[#121214] border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow-xl group-hover:scale-110 transition-transform">
                  <img src={topic.thumbnailUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-widest truncate ${selectedTopic?.id === topic.id ? 'text-[#D4AF37]' : 'text-slate-200'}`}>
                    {topic.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                      {topic.isLocked ? 'Locked' : `${topic.progressPercent || 0}%`}
                    </span>
                    <div className="h-1 w-8 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${topic.progressPercent || 0}%` }} />
                    </div>
                  </div>
                </div>
                {topic.isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedTopic?.id === topic.id ? 'translate-x-1 text-[#D4AF37]' : 'text-slate-800'}`} />
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN: Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-slate-800 px-10 flex items-center justify-between bg-[#121214]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Current Module</span>
            <h2 className="text-sm font-black text-white uppercase tracking-widest mt-1">
              {selectedTopic ? selectedTopic.title : 'Overview: Initializing Alpha Stream'}
            </h2>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Wallet Balance</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-black text-[#D4AF37] italic tracking-tighter">2,450</span>
                <Coins className="w-5 h-5 text-[#D4AF37]" />
              </div>
            </div>
            <img src="https://picsum.photos/seed/user/100/100" className="w-10 h-10 rounded-xl ring-2 ring-slate-800" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {selectedTopic ? (
            <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="space-y-12">
                {selectedTopic.blocks.map((block) => (
                  <div key={block.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {block.type === 'video' && (
                      <div className="aspect-video rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl relative group bg-black/40">
                        <img src={block.payload.posterUrl || lesson.thumbnailUrl} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" />
                        <button className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <div className="w-24 h-24 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-2xl shadow-[#D4AF37]/40 ring-8 ring-[#D4AF37]/10">
                            <Play className="w-10 h-10 fill-current ml-1" />
                          </div>
                        </button>
                        <div className="absolute bottom-10 left-10 right-10">
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                            <div className="h-full bg-[#D4AF37] w-1/3 shadow-[0_0_15px_#D4AF37]" />
                          </div>
                          <div className="flex items-center justify-between mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                            <span>Playback Stream</span>
                            <span>Golden Stream HD</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'text' && (
                      <RichTextRenderer content={block.payload.content || ''} />
                    )}

                    {block.type === 'photo' && (
                      <div className="grid grid-cols-2 gap-6">
                        {(block.payload.images || []).map((img: any, i: number) => (
                          <div key={i} className="space-y-3">
                            <div className="aspect-video rounded-3xl overflow-hidden border border-slate-800 shadow-xl group cursor-pointer">
                              <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={img.caption} />
                            </div>
                            {img.caption && (
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">{img.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {selectedTopic.blocks.length === 0 && (
                  <div className="prose prose-invert max-w-none space-y-6">
                    <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">{selectedTopic.title}</h1>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed italic">
                      {selectedTopic.description || 'This topic content is currently being synchronized with the curriculum.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20">
              <BookOpen className="w-40 h-40 mb-10" />
              <p className="text-4xl font-black italic uppercase tracking-tighter">Knowledge Stream Inactive</p>
              <p className="text-sm font-bold uppercase tracking-widest mt-4">Select a topic from the terminal to begin stream</p>
            </div>
          )}
        </div>

        {/* FOOTER: Controls */}
        <footer className="h-24 border-t border-slate-800 px-12 flex items-center justify-between bg-[#121214]/80 backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-800 rounded-full px-5 py-2.5 shadow-2xl">
              <History className="w-4 h-4 text-[#D4AF37]" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Latest XP</span>
                <span className="text-xs font-black text-white uppercase tracking-widest">+45 XP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 px-8 py-4 bg-[#1e293b] border border-slate-700 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all">
              <ChevronLeft className="w-5 h-5" /> Previous Topic
            </button>
            <TopicCompletionButton
              isEligible={isEligible}
              isCompleted={isCompleted}
              timeRemaining={timeRemaining}
              isLoading={isCompleting}
              onComplete={handleCompleteTopic}
            />
          </div>
        </footer>
      </main>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center">
    <div className="w-20 h-20 bg-slate-800 rounded-3xl animate-pulse mb-6 border border-slate-700 flex items-center justify-center">
      <Star className="w-10 h-10 text-slate-600" />
    </div>
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Synchronizing Academy Assets</span>
      <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-[#D4AF37] w-1/2 animate-[loading_2s_infinite]" />
      </div>
    </div>
  </div>
);