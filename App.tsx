
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  Layers,
  BarChart3,
  Activity,
  FileCode,
  LogOut,
  UserCircle,
  Users,
  CreditCard,
  Eye,
  ArrowLeft,
  Mail
} from 'lucide-react';
import { CourseData, ProgramStructure } from './types';
import { apiClient } from './lib/apiClient';
import { ToastProvider } from './lib/ToastContext';

// Dynamic imports for major components
const AdminBuilder = React.lazy(() => import('./pages/admin/builder/BuilderPage').then(m => ({ default: m.AdminBuilder })));
const StudentPortal = React.lazy(() => import('./components/StudentPortal/StudentPortal').then(m => ({ default: m.StudentPortal })));
const ProgramWeeksPage = React.lazy(() => import('./pages/admin/weeks/ProgramWeeksPage').then(m => ({ default: m.ProgramWeeksPage })));
const CohortManagementContainer = React.lazy(() => import('./pages/admin/cohorts/CohortManagementContainer').then(m => ({ default: m.CohortManagementContainer })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const StatsPage = React.lazy(() => import('./pages/admin/stats/StatsPage').then(m => ({ default: m.StatsPage })));
const SettingsPage = React.lazy(() => import('./pages/admin/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const EmailTemplatesPage = React.lazy(() => import('./pages/admin/emails/EmailTemplatesPage').then(m => ({ default: m.EmailTemplatesPage })));

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0b]">
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 border-4 border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Loading Module...</p>
    </div>
  </div>
);

const INITIAL_STRUCTURE: ProgramStructure = {
  id: 'prog-123',
  title: 'Forex Mastery Curriculum',
  status: 'published',
  thumbnailUrl: '',
  weeks: [
    {
      id: 'w0',
      cohortId: 'c1',
      number: 0,
      title: 'Week 0: Fundamentals of Forex',
      isFree: true,
      lockPolicy: { lockedByDefault: false, minCompletionPercent: 0, minCoinsToUnlockNextWeek: 0 },
      modules: [
        {
          id: 'm0',
          weekId: 'w0',
          title: 'Academy Orientation',
          order: 1,
          position: 1,
          lessons: []
        }
      ],
      lessons: []
    },
    {
      id: 'w1',
      cohortId: 'c1',
      number: 1,
      title: 'Week 1: Institutional Order Flow',
      isFree: false,
      lockPolicy: { lockedByDefault: true, minCompletionPercent: 90, minCoinsToUnlockNextWeek: 50 },
      modules: [
        {
          id: 'm1',
          weekId: 'w1',
          title: 'Market Structure',
          order: 1,
          position: 1,
          lessons: []
        }
      ],
      lessons: []
    },
    {
      id: 'w2',
      cohortId: 'c1',
      number: 2,
      title: 'Week 2: Related Forex Based Content',
      isFree: false,
      lockPolicy: { lockedByDefault: true, minCompletionPercent: 90, minCoinsToUnlockNextWeek: 50 },
      modules: [
        {
          id: 'm2',
          weekId: 'w2',
          title: 'Advanced Analysis',
          order: 1,
          position: 1,
          lessons: []
        }
      ],
      lessons: []
    }
  ]
};

const App: React.FC = () => {
  const [role, setRole] = useState<'administrator' | 'instructor' | 'student' | 'guest'>('guest');
  const [view, setView] = useState<'admin' | 'weeks' | 'dashboard' | 'stats' | 'settings' | 'cohorts'>('dashboard');
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false); // Track if admin is in preview mode
  const [originalRole, setOriginalRole] = useState<'administrator' | 'instructor' | null>(null); // Store original role

  // Simulation: Does the student have full access?
  const [hasPaid, setHasPaid] = useState(false);

  const [courseStructure, setCourseStructure] = useState<ProgramStructure>(INITIAL_STRUCTURE);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription status
  const checkSubscription = async () => {
    try {
      const response = await apiClient.get('/api/student/subscription/check');
      if (response && response.has_active_subscription) {
        setHasPaid(true);
      } else {
        setHasPaid(false);
      }
    } catch (err) {
      console.warn("Failed to check subscription status");
      setHasPaid(false);
    }
  };

  // Debug: Log role changes
  useEffect(() => {
    console.log('🔄 Role changed to:', role);
    console.log('🔄 User:', user);
  }, [role, user]);

  const fetchStructure = async (userRole?: string) => {
    try {
      setIsLoading(true);
      // Use appropriate endpoint based on role
      const endpoint = (userRole === 'administrator' || role === 'administrator')
        ? '/api/admin/courses/structure'
        : '/api/student/courses/authorized';

      const data = await apiClient.get(endpoint);
      if (data && data.weeks) {
        setCourseStructure(data as any);
      }
    } catch (err) {
      console.error("Failed to fetch curriculum structure:", err);
      // If admin endpoint fails, try student endpoint as fallback
      if (userRole === 'administrator' || role === 'administrator') {
        try {
          const fallbackData = await apiClient.get('/api/student/courses/authorized');
          if (fallbackData && fallbackData.weeks) {
            setCourseStructure(fallbackData as any);
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getAuthToken();
      console.log('🔍 Checking authentication...');
      console.log('🔍 Token exists:', !!token);

      if (token) {
        try {
          const userData = await apiClient.get('/api/auth/user');
          console.log('✅ User authenticated:', userData.user);
          console.log('✅ User role:', userData.user.role);
          console.log('✅ User email:', userData.user.email);
          console.log('✅ User name:', userData.user.name);

          setUser(userData.user);
          setRole(userData.user.role);

          if (userData.user.role === 'student') {
            await checkSubscription();
          }

          await fetchStructure(userData.user.role);
        } catch (err: any) {
          console.log('❌ Authentication failed:', err.message);
          // Only log unexpected errors (not 401 which means token expired)
          if (err.status !== 401) {
            console.error("Failed to fetch user data:", err);
          }
          // Token is invalid, clear it
          console.log('🧹 Clearing invalid token...');
          apiClient.removeAuthToken();
          setIsLoading(false);
        }
      } else {
        console.log('ℹ️ No token found, showing landing page');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = () => {
    apiClient.removeAuthToken();
    setRole('guest');
    setUser(null);
    setIsPreviewMode(false);
    setOriginalRole(null);
    setCourseStructure(INITIAL_STRUCTURE);
  };

  const enterPreviewMode = () => {
    if (role === 'administrator' || role === 'instructor') {
      setOriginalRole(role);
      setIsPreviewMode(true);
      setRole('student');
      fetchStructure('student');
    }
  };

  const exitPreviewMode = () => {
    if (originalRole) {
      setRole(originalRole);
      setIsPreviewMode(false);
      setOriginalRole(null);
      setView('admin'); // Return to course builder
      fetchStructure(originalRole);
    }
  };

  const studentCourseData: CourseData = {
    id: courseStructure.id,
    title: "Forex Mastery Pro",
    program: "Institutional Trading",
    shortDescription: "Professional-grade market execution training.",
    category: "Finance",
    skillLevel: "Advanced",
    duration: "12 Weeks",
    visibility: "Published",
    outcomes: [],
    prerequisites: [],
    linkedCohorts: [],
    weeks: courseStructure.weeks
  };

  const SidebarItem: React.FC<{ icon: any; label: string; active?: boolean; small?: boolean; onClick?: () => void }> = ({ icon: Icon, label, active, small, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all relative group ${active
        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-[1.02]'
        : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-black rounded-r-full" />}
      <Icon className={`${small ? 'w-4 h-4' : 'w-5 h-5'} ${active ? 'text-black' : 'text-slate-500 group-hover:text-[#D4AF37] transition-colors'}`} />
      <span className={`${small ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-widest`}>{label}</span>
    </button>
  );

  if (role === 'guest') {
    return (
      <ToastProvider>
        <React.Suspense fallback={<LoadingFallback />}>
          <LandingPage
            onStart={async (userRole, userData) => {
              setRole(userRole as 'administrator' | 'instructor' | 'student');
              setUser(userData);
              if (userRole === 'student') {
                await checkSubscription();
              }
              await fetchStructure(userRole);
            }}
            onLogin={async (userRole, userData) => {
              setRole(userRole as 'administrator' | 'instructor' | 'student');
              setUser(userData);
              if (userRole === 'student') {
                await checkSubscription();
              }
              await fetchStructure(userRole);
            }}
          />
        </React.Suspense>
      </ToastProvider>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Synchronizing Core Systems...</p>
        </div>
      </div>
    );
  }

  if (role === 'student') {
    return (
      <ToastProvider>
        {isPreviewMode && (
          <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-[#D4AF37] to-[#B8962E] px-6 py-3 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">
                Preview Mode Active - Viewing as Student
              </span>
            </div>
            <button
              onClick={exitPreviewMode}
              className="px-4 py-2 bg-black text-[#D4AF37] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black/80 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit Preview
            </button>
          </div>
        )}
        <div className={isPreviewMode ? 'pt-12' : ''}>
          <React.Suspense fallback={<LoadingFallback />}>
            <StudentPortal
              courseData={studentCourseData}
              hasPaid={hasPaid}
              onPurchase={() => setHasPaid(true)}
              onSignOut={handleSignOut}
              user={user}
              onBackToAdmin={isPreviewMode ? exitPreviewMode : undefined}
            />
          </React.Suspense>
        </div>
      </ToastProvider>
    );
  }

  // Admin/Instructor view
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0d1117] text-slate-200 selection:bg-[#D4AF37]/30 flex">
        <aside className="w-72 bg-[#161b22] border-r border-white/5 flex flex-col shrink-0 h-screen sticky top-0">
          <div className="p-8 mb-4">
            <div className="flex items-center gap-3">
              <img src="/Dreaties_Logo.png" alt="DrealtiesFX Academy Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-tighter">DrealtiesFx</h1>
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">LMS Admin</p>
              </div>
            </div>
            {user && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">{user.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 mt-8">LMS Management</p>
            <SidebarItem
              icon={LayoutDashboard}
              label="Main Dashboard"
              active={view === 'dashboard'}
              onClick={() => { setView('dashboard'); setSelectedCohortId(null); }}
            />
            <SidebarItem
              icon={SettingsIcon}
              label="Course Builder"
              active={view === 'admin'}
              onClick={() => { setView('admin'); setSelectedCohortId(null); }}
            />
            <SidebarItem
              icon={Users}
              label="Intakes & Enrollment"
              active={view === 'cohorts'}
              onClick={() => { setView('cohorts'); setSelectedCohortId(null); }}
            />
            <SidebarItem
              icon={BarChart3}
              label="Course Analytics"
              active={view === 'stats'}
              onClick={() => { setView('stats'); setSelectedCohortId(null); }}
            />
          </nav>

          <div className="p-6 border-t border-white/5 space-y-1">
            <SidebarItem
              icon={SettingsIcon}
              label="Settings"
              small
              active={view === 'settings'}
              onClick={() => { setView('settings'); setSelectedCohortId(null); }}
            />
            <SidebarItem icon={LogOut} label="Sign Out" small onClick={handleSignOut} />
          </div>
        </aside>

        <div className="flex-1 min-h-screen relative flex flex-col overflow-hidden">
          <React.Suspense fallback={<LoadingFallback />}>
            {view === 'dashboard' ? (
              <Dashboard onSelectCohort={(id) => { setView('cohorts'); setSelectedCohortId(id); }} />
            ) : view === 'stats' ? (
              <StatsPage />
            ) : view === 'settings' ? (
              <SettingsPage />
            ) : view === 'admin' ? (
              <AdminBuilder
                structure={courseStructure}
                onStructureUpdate={setCourseStructure}
                onPreviewLesson={(lesson) => {
                  // Use preview mode instead of switching accounts
                  enterPreviewMode();
                }}
              />
            ) : view === 'cohorts' ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                {!selectedCohortId ? (
                  <ProgramWeeksPage
                    programId={courseStructure.id}
                    onSelectCohort={id => {
                      setSelectedCohortId(id);
                    }}
                  />
                ) : (
                  <CohortManagementContainer
                    cohortId={selectedCohortId}
                    onBack={() => setSelectedCohortId(null)}
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <Dashboard />
              </div>
            )}
          </React.Suspense>
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;
