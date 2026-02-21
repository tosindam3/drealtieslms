import React, { useState, useEffect } from 'react';
import {
  Home,
  Map as MapIcon,
  Calculator,
  Calendar,
  User,
  Trophy,
  Settings,
  LogOut,
  Bell,
  Hexagon,
  Zap,
  LayoutDashboard,
  LogOut as LogOutIcon,
  ShieldAlert,
  CreditCard,
  Lock,
  ArrowRight,
  ChevronRight,
  Building2,
  Globe,
  Smartphone,
  CheckCircle2,
  Copy,
  ArrowLeft,
  ShieldCheck,
  Wallet,
  Info,
  Loader2,
  Shield,
  Menu,
  MessageSquare,
  X as XIcon
} from 'lucide-react';
import { CourseData, Lesson } from '../../types';
import { StudentDashboard } from './StudentDashboard';
import { StudentCourseView } from './StudentCourseView';
import { StudentRoadmap } from './StudentRoadmap';
import { LotCalculator } from './LotCalculator';
import { MarketCalendar } from './MarketCalendar';
import { StudentProfile } from './StudentProfile';
import { StudentLeaderboard } from './StudentLeaderboard';
import { StudentCommunity } from './StudentCommunity';
import { apiClient, normalizeUrl } from '../../lib/apiClient';
import { useToast } from '../../lib/ToastContext';

interface StudentPortalProps {
  onSignOut: () => void;
  courseData: CourseData;
  hasPaid: boolean;
  onPurchase: () => void;
  user?: any;
  onBackToAdmin?: () => void;
}

type PaymentChannel = 'paystack' | 'stripe' | 'bank' | null;

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onSignOut,
  courseData: propCourseData,
  hasPaid,
  onPurchase,
  user,
  onBackToAdmin
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Roadmap' | 'Calculator' | 'Calendar' | 'Profile' | 'Leaderboard' | 'Community'>('Community');
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [courseData, setCourseData] = useState<CourseData>(propCourseData);
  const [initialLessonId, setInitialLessonId] = useState<string | undefined>(undefined);
  const [initialTopicId, setInitialTopicId] = useState<string | undefined>(undefined);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Flow State
  const [paymentStep, setPaymentStep] = useState<'choice' | 'processing' | 'bank_details'>('choice');
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchAuthorizedCourse = async () => {
      try {
        const response = await apiClient.get('/api/student/courses/authorized');
        if (response) {
          setCourseData(response as any);
        }
      } catch (err) {
        console.warn("Using fallback props course data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuthorizedCourse();
  }, []);

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'Roadmap', icon: MapIcon, label: 'Course Roadmap' },
    { id: 'Calculator', icon: Calculator, label: 'Lot Calculator' },
    { id: 'Calendar', icon: Calendar, label: 'Market Calendar' },
    { id: 'Community', icon: MessageSquare, label: 'Community' },
    { id: 'Profile', icon: User, label: 'Profile' },
    { id: 'Leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  const handleLaunchLesson = (course: CourseData, lessonId?: string) => {
    const lesson = course.weeks.flatMap(w => w.modules).flatMap(m => m.lessons).find(l => l.id === lessonId);
    const week = course.weeks.find(w => w.modules.some(m => m.lessons.some(l => l.id === lessonId)));

    if (hasPaid || lesson?.isFree || week?.isFree) {
      setSelectedCourse(course);
      setInitialLessonId(lessonId);
      setInitialTopicId(undefined);
    } else {
      setShowPaywall(true);
    }
  };

  const handleLaunchTopic = (course: CourseData, lessonId: string, topicId: string) => {
    const lesson = course.weeks.flatMap(w => w.modules).flatMap(m => m.lessons).find(l => l.id === lessonId);
    const week = course.weeks.find(w => w.modules.some(m => m.lessons.some(l => l.id === lessonId)));

    if (hasPaid || lesson?.isFree || week?.isFree) {
      setSelectedCourse(course);
      setInitialLessonId(lessonId);
      setInitialTopicId(topicId);
    } else {
      setShowPaywall(true);
    }
  };

  const handlePaymentSelect = async (channel: PaymentChannel) => {
    setSelectedChannel(channel);

    if (channel === 'bank') {
      setPaymentStep('bank_details');
    } else {
      setPaymentStep('processing');
      try {
        // In a real production app, you would initialize the Paystack/Stripe checkout here
        // and only call verify upon a successful client-side callback.
        // For this implementation, we simulate the success callback and verify on the backend.
        const response = await apiClient.post('/api/payments/verify', {
          reference: `TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          channel,
          amount: 129,
          plan_name: 'Premium Institutional Access'
        });

        if (response) {
          addToast({
            title: 'Upgrade Successful',
            description: 'Institutional access granted. Welcome to the elite tier.',
            type: 'success'
          });
          onPurchase();
          setShowPaywall(false);
          resetPaymentState();
        }
      } catch (err) {
        addToast({
          title: 'Payment Verification Failed',
          description: 'We could not verify your transaction. Please contact support.',
          type: 'error'
        });
        resetPaymentState();
      }
    }
  };

  const handleConfirmBankTransfer = async () => {
    try {
      await apiClient.post('/api/student/payments/bank-transfer', {
        amount: 250000, // Example NGN amount
        reference: `BNK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });

      addToast({
        title: 'Transfer Received',
        description: 'Confirmation received. Our team will verify and activate your access shortly.',
        type: 'success'
      });
      setShowPaywall(false);
      resetPaymentState();
    } catch (err) {
      addToast({
        title: 'Process Failed',
        description: 'Could not log your transfer. Please try again.',
        type: 'error'
      });
    }
  };

  const resetPaymentState = () => {
    setPaymentStep('choice');
    setSelectedChannel(null);
  };

  // Check if user is the admin preview account
  const isAdminPreview = user?.email === 'admin.student@drealtiesfx.com' || user?.email === 'student.admin@drealtiesfx.com';

  if (isLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0b]">
      <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
    </div>
  );

  if (selectedCourse) {
    return (
      <StudentCourseView
        course={selectedCourse}
        initialLessonId={initialLessonId}
        initialTopicId={initialTopicId}
        hasPaid={hasPaid}
        onPurchase={onPurchase}
        onBack={() => { setSelectedCourse(null); setInitialTopicId(undefined); }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-slate-300 overflow-hidden font-['Inter'] relative">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[160] w-72 bg-[#121214] border-r border-white/5 flex flex-col shrink-0 transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col gap-2 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Dreaties_Logo.png" alt="DrealtiesFX Academy Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-lg font-black tracking-tighter text-white uppercase">DrealtiesFx</h1>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] -mt-1">Academy Pro</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 pt-10 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6">Student Access</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group ${activeTab === item.id ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-black' : 'group-hover:text-[#D4AF37] transition-colors'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-black rounded-r-full" />
              )}
            </button>
          ))}

          <div className="pt-10 border-t border-white/5 mt-8 px-4 space-y-4">
            {isAdminPreview && onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all group"
              >
                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Admin</span>
              </button>
            )}

            {!hasPaid && (
              <button
                onClick={() => setShowPaywall(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all group"
              >
                <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Upgrade to Full Access</span>
              </button>
            )}

            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all group"
            >
              <LogOutIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0a0a0b]">
        {/* Top Header */}
        <header className="h-20 lg:h-24 border-b border-white/5 px-6 lg:px-12 flex items-center justify-between shrink-0 bg-[#121214]/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">DrealtiesFx Global Access</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`w-2 h-2 rounded-full ${hasPaid ? 'bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                <p className="text-[10px] lg:text-xs font-black text-white uppercase tracking-widest">
                  {hasPaid ? 'Full Institutional Access' : 'Foundation Level Access'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-10">
            {!hasPaid && (
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Locked Modules: 7</span>
              </div>
            )}

            <button className="relative p-2.5 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full border border-white/5 group">
              <Bell className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full border-2 border-[#121214]"></span>
            </button>

            <div className="flex items-center gap-3 lg:gap-5 lg:pl-8 lg:border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-white uppercase tracking-widest">{user?.name || 'Student User'}</p>
                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">
                  {hasPaid ? 'Premium Member' : 'Registered Student'}
                </p>
              </div>
              <img
                src={normalizeUrl(user?.avatar_url) || `https://i.pravatar.cc/150?u=${user?.id || 'default'}`}
                alt="Profile"
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl ring-2 ring-white/5 shadow-2xl"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'Roadmap' ? (
            <StudentRoadmap
              courseData={courseData}
              hasPaid={hasPaid}
              onLaunchLesson={(lessonId) => handleLaunchLesson(courseData, lessonId)}
            />
          ) : activeTab === 'Dashboard' ? (
            <StudentDashboard
              course={courseData}
              user={user}
              onCourseSelect={() => setActiveTab('Roadmap')}
              onLaunchTopic={(lId, tId) => handleLaunchTopic(courseData, lId, tId)}
            />
          ) : activeTab === 'Leaderboard' ? (
            <StudentLeaderboard
              onContinue={() => setActiveTab('Dashboard')}
              onViewProfile={(userId) => setActiveTab('Profile')}
            />
          ) : activeTab === 'Profile' ? (
            <StudentProfile />
          ) : activeTab === 'Calculator' ? (
            <LotCalculator />
          ) : activeTab === 'Calendar' ? (
            <MarketCalendar />
          ) : activeTab === 'Community' ? (
            <StudentCommunity user={user} />
          ) : (
            <div className="flex items-center justify-center h-full opacity-20">
              <Zap className="w-32 h-32 animate-pulse" />
            </div>
          )}
        </main>
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#07070A]/95 backdrop-blur-2xl" onClick={() => { setShowPaywall(false); resetPaymentState(); }} />
          <div className="relative w-full max-w-2xl bg-[#121214] border border-[#D4AF37]/30 rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.2)]">

            <div className="p-10 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
                  <Wallet className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Institutional Upgrade</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Authorization Tier: Professional</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPaywall(false); resetPaymentState(); }}
                className="p-3 text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="p-12">
              {paymentStep === 'choice' && (
                <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                  <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Select Payment Method</h3>
                    <p className="text-slate-500 text-sm font-medium italic">All transactions are secured via institutional-grade encryption.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <PaymentOption
                      id="paystack"
                      name="Paystack"
                      desc="Cards, USSD, and Bank Account (Instant)"
                      icon={Smartphone}
                      onClick={() => handlePaymentSelect('paystack')}
                    />
                    <PaymentOption
                      id="stripe"
                      name="Stripe"
                      desc="International Cards & Apple Pay (USD)"
                      icon={Globe}
                      onClick={() => handlePaymentSelect('stripe')}
                    />
                    <PaymentOption
                      id="bank"
                      name="Bank Transfer"
                      desc="Manual Local Bank Transfer (Nigeria Only)"
                      icon={Building2}
                      onClick={() => handlePaymentSelect('bank')}
                    />
                  </div>

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">End-to-End Encryption Active</span>
                    </div>
                    <span className="text-2xl font-black text-white italic tracking-tighter">$129.00 USD</span>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                  <div className="w-24 h-24 border-[6px] border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin shadow-[0_0_30px_rgba(212,175,55,0.1)]" />
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">Initializing Gateway</h4>
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] animate-pulse">Redirecting to {selectedChannel?.toUpperCase()} Secure Port...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'bank_details' && (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <button
                    onClick={() => setPaymentStep('choice')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Options
                  </button>

                  <div className="bg-black/40 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Name</span>
                        <span className="text-xs font-black text-white uppercase">GTBank (Guaranty Trust Bank)</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-black text-[#D4AF37] tracking-tighter italic">0123456789</span>
                          <button className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"><Copy className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Name</span>
                        <span className="text-xs font-black text-white uppercase">DrealtiesFx Academy Ltd</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToast({
                        title: 'Transfer Received',
                        description: 'Confirmation received. Our team will verify and activate your access shortly.',
                        type: 'success'
                      });
                      setShowPaywall(false);
                      resetPaymentState();
                    }}
                    className="w-full py-6 bg-[#D4AF37] text-black text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl hover:bg-[#B8962E] transition-all active:scale-95"
                  >
                    Confirm Transfer Sent
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentOption: React.FC<{
  id: string;
  name: string;
  desc: string;
  icon: any;
  onClick: () => void
}> = ({ name, desc, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-6 p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-[#D4AF37]/40 hover:bg-white/5 transition-all group relative overflow-hidden"
  >
    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-slate-500 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-all shadow-inner">
      <Icon className="w-6 h-6" />
    </div>
    <div className="text-left flex-1">
      <h4 className="text-lg font-black text-white italic tracking-tighter uppercase">{name}</h4>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{desc}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-[#D4AF37] transition-all group-hover:translate-x-1" />
  </button>
);
