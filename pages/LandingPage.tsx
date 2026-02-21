import React, { useState, useEffect } from 'react';
import {
  Zap,
  ChevronRight,
  ShieldCheck,
  Target,
  Calculator,
  Layers,
  ArrowUpRight,
  TrendingUp as TrendingIcon,
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageSquare,
  HelpCircle,
  Plus,
  Minus,
  Star,
  Lock,
  Globe,
  Radio,
  Clock,
  LayoutGrid,
  Bot,
  AlertTriangle,
  Calendar,
  X,
  User,
  Shield,
  ArrowLeft,
  Loader2,
  Menu
} from 'lucide-react';
import { TradingConsole } from '../components/landing/TradingConsole';
import { apiClient } from '../lib/apiClient';
import { useToast } from '../lib/ToastContext';

export const LandingPage: React.FC<{
  onStart: (role: string, userData: any) => void;
  onLogin: (role: string, userData: any) => void
}> = ({ onStart, onLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  // Auth Modal State
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  // Animation state
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset_token');
    const email = urlParams.get('email');

    if (token && email) {
      setResetToken(token);
      setResetEmail(email);
      setAuthMode('reset-password');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);


  const faqs = [
    { q: "Is this suitable for absolute beginners?", a: "Yes. Our 8-week cohort starts with the absolute fundamentals of market structure before moving into advanced institutional order flow." },
    { q: "Do I need a large capital to start?", a: "No. We teach you how to manage risk on any account size, including strategies for passing prop firm challenges with six-figure funding." },
    { q: "Are the sessions live or recorded?", a: "Both. We have weekly live mentorship sessions, and all material is recorded in HD for lifetime access in your student terminal." },
    { q: "What is the DrealtiesFX proprietary engine?", a: "It is our custom-built risk and technical analysis suite provided to all Elite members to remove emotional guesswork from trading." }
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data: any = {};

      if (authMode === 'forgot-password') {
        data.email = formData.get('email');
        await apiClient.post('/api/password/email', data);
        addToast({
          title: 'Reset link sent',
          description: 'If an account exists, you will receive a reset link shortly.',
          type: 'success'
        });
        setAuthMode('login');
        return;
      }

      if (authMode === 'reset-password') {
        data.email = resetEmail;
        data.token = resetToken;
        data.password = formData.get('password');
        data.password_confirmation = formData.get('password_confirmation');

        await apiClient.post('/api/password/reset', data);
        addToast({
          title: 'Password reset successful',
          description: 'Your password has been updated. You can now log in.',
          type: 'success'
        });
        setAuthMode('login');
        return;
      }

      data.email = formData.get('email');
      data.password = formData.get('password');

      if (authMode === 'register') {
        data.name = formData.get('name');
        data.password_confirmation = formData.get('password');
      }

      console.log('🔐 Attempting authentication:', authMode);
      console.log('🔐 Email:', data.email);

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await apiClient.post(endpoint, data);

      console.log('✅ Authentication successful');
      console.log('✅ Response:', response);

      // Store the authentication token
      if (response.token) {
        apiClient.setAuthToken(response.token);
        console.log('✅ Token stored');
      }

      // Extract user data and role from response
      const userData = response.user;
      const userRole = userData?.role || 'student';

      console.log('✅ User data:', userData);
      console.log('✅ User role:', userRole);
      console.log('✅ User email:', userData.email);
      console.log('✅ User name:', userData.name);

      // Close modal and redirect with role and user data
      setAuthMode(null);
      if (authMode === 'login') {
        console.log('🚀 Calling onLogin with role:', userRole);
        onLogin(userRole, userData);
      } else {
        console.log('🚀 Calling onStart with role:', userRole);
        onStart(userRole, userData);
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      addToast({ title: 'Authentication Failed', description: error.message || 'Authentication failed. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as HTMLFormElement).email.value;
    setIsSubmitting(true);
    try {
      // Reusing contact endpoint for newsletter or a dedicated one if exists
      await apiClient.post('/api/contact', {
        name: 'Newsletter Subscriber',
        email: email,
        subject: 'Newsletter Subscription',
        message: 'Student subscribed to newsletter from landing page.'
      });
      addToast({ title: 'Subscribed', description: "Thank you for subscribing! We'll keep you updated.", type: 'success' });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      addToast({ title: 'Subscription Failed', description: err.message || 'Could not subscribe at this time.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
      };

      await apiClient.post('/api/contact', data);

      addToast({ title: 'Message Sent', description: "We've received your message and will respond shortly.", type: 'success' });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      addToast({ title: 'Submission Failed', description: err.message || 'Could not send message. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="bg-[#07070A] text-slate-300 font-['Inter'] selection:bg-[#D4AF37]/30 scroll-smooth overflow-x-hidden">
      <style>{`
        @keyframes slowRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.1); }
        }
        @keyframes shimmerFlare {
          0%, 100% { opacity: 0.8; filter: blur(8px) brightness(1.2); }
          50% { opacity: 1; filter: blur(16px) brightness(1.5); }
        }
        @keyframes textGradientSlide {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .animate-slow-rotate { animation: slowRotate 30s linear infinite; }
        .animate-pulse-glow { animation: pulseGlow 6s ease-in-out infinite; }
        .animate-shimmer-flare { animation: shimmerFlare 3s ease-in-out infinite; }
        
        .animate-gradient-gold {
          background: linear-gradient(
            to right, 
            #D4AF37 20%, 
            #FBF2C4 40%, 
            #FFF 50%, 
            #FBF2C4 60%, 
            #D4AF37 80%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGradientSlide 4s linear infinite;
        }

        .btn-gold-slide {
          position: relative;
          overflow: hidden;
          z-index: 1;
          transition: all 0.3s ease-in-out;
        }
        .btn-gold-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transition: left 0.6s;
          z-index: -1;
        }
        .btn-gold-slide:hover::before {
          left: 100%;
        }
        .btn-gold-slide:hover {
          background: #E5C158;
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(212, 175, 55, 0.5);
        }
      `}</style>

      {/* NAVIGATION */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${isScrolled ? 'bg-[#07070A]/95 backdrop-blur-xl border-white/5 py-4' : 'bg-transparent border-transparent py-8'
        } px-6 md:px-12`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/Dreaties_Logo.png" alt="DrealtiesFX Academy Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-black text-white italic tracking-tighter uppercase">DrealtiesFX <span className="font-normal text-slate-500 ml-0.5 tracking-normal lowercase">Academy</span></span>
            </div>

            <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              <a href="#home" className="hover:text-[#D4AF37] transition-colors">HOME</a>
              <a href="#about" className="hover:text-[#D4AF37] transition-colors">ABOUT</a>
              <a href="#contact" className="hover:text-[#D4AF37] transition-colors">CONTACT</a>
              <a href="#pricing" className="hover:text-[#D4AF37] transition-colors">PRICE</a>
              <a href="#calculator" className="hover:text-[#D4AF37] transition-colors text-[#D4AF37] border-b border-[#D4AF37]">LOTSIZE CALCULATOR</a>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setAuthMode('login')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Log in</button>
              <button onClick={() => setAuthMode('register')} className="btn-gold-slide px-8 py-3 bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl transition-all">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[73px] bg-[#07070A]/98 backdrop-blur-2xl z-50 animate-in slide-in-from-top duration-300 border-t border-white/5">
            <div className="flex flex-col p-8 space-y-8 text-center">
              <div className="flex flex-col space-y-6 text-xs font-black uppercase tracking-[0.3em] text-slate-400">
                <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="py-4 border-b border-white/5 hover:text-[#D4AF37]">HOME</a>
                <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="py-4 border-b border-white/5 hover:text-[#D4AF37]">ABOUT</a>
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="py-4 border-b border-white/5 hover:text-[#D4AF37]">CONTACT</a>
                <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="py-4 border-b border-white/5 hover:text-[#D4AF37]">PRICE</a>
                <a href="#calculator" onClick={() => setIsMobileMenuOpen(false)} className="py-4 border-b border-white/5 text-[#D4AF37]">LOTSIZE CALCULATOR</a>
              </div>

              <div className="flex flex-col gap-4 pt-8">
                <button onClick={() => { setAuthMode('login'); setIsMobileMenuOpen(false); }} className="w-full py-5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white">Log in</button>
                <button onClick={() => { setAuthMode('register'); setIsMobileMenuOpen(false); }} className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest">Get Started</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-screen flex flex-col items-center pt-48 md:pt-64 px-6 text-center overflow-hidden">
        {/* Raised z-index of content to z-50 to ensure it's above the background overlays */}
        <div
          data-animate
          id="hero-content"
          className={`max-w-5xl space-y-10 relative z-50 opacity-0 ${visibleSections.has('hero-content') ? 'animate-zoom-in' : ''}`}
        >
          <h1 className="text-4xl md:text-7xl font-thin text-white italic tracking-tight leading-[1.1] uppercase">
            Master Forex Trading <br className="hidden md:block" />
            <span className="font-black not-italic text-white">
              for Self Empowerment, <span className="animate-gradient-gold">Without Guesswork</span>
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto uppercase tracking-[0.2em]">
            Join a structured, mentor-led, 8-week cohort program designed to take you from foundation to
            institutional professional through live execution and mathematical precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            {/* Get Started Button */}
            <button
              onClick={() => setAuthMode('register')}
              className="btn-gold-slide w-full sm:w-auto px-12 py-5 bg-[#D4AF37] text-black rounded-full font-black text-[11px] uppercase tracking-[0.25em] shadow-[0_20px_50px_rgba(212,175,55,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
            {/* Learn More Button */}
            <a
              href="#about"
              className="w-full sm:w-auto px-12 py-5 bg-white/10 border border-white/20 text-white rounded-full font-black text-[11px] uppercase tracking-[0.25em] hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer relative z-50"
            >
              Learn More <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* THE VIEWPOINT ORB / PORTAL - GOLD THEME */}
        <div className="absolute bottom-[-15%] md:bottom-[-25%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] aspect-square pointer-events-none select-none z-20">
          <div className="absolute inset-0 bg-black rounded-full shadow-[0_-120px_350px_rgba(212,175,55,0.4),inset_0_20px_150px_rgba(212,175,55,0.2)] overflow-hidden animate-pulse-glow">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#D4AF37]/20 to-transparent blur-[80px]" />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] opacity-40 animate-slow-rotate">
            {[...Array(36)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-[2px] h-1/2 bg-gradient-to-t from-[#D4AF37]/80 via-[#D4AF37]/20 to-transparent origin-bottom"
                style={{ transform: `translate(-50%, -100%) rotate(${i * 10}deg)` }}
              />
            ))}
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full blur-[10px] shadow-[0_0_60px_#fff,0_0_180px_#D4AF37] opacity-100 animate-shimmer-flare" />
        </div>

        {/* Decorative Overlay - Added pointer-events-none to prevent blocking button clicks */}
        <div className="absolute bottom-0 left-0 w-full h-[40vh] bg-gradient-to-t from-[#07070A] to-transparent z-40 pointer-events-none" />
      </section>

      {/* CORE FEATURES / ABOUT */}
      <section id="about" className="py-32 px-6 md:px-12 relative border-t border-white/5 bg-black/40 z-50">
        <div className="max-w-7xl mx-auto space-y-24">
          <div
            data-animate
            id="about-header"
            className={`text-center max-w-3xl mx-auto space-y-4 opacity-0 ${visibleSections.has('about-header') ? 'animate-zoom-in' : ''}`}
          >
            <h2 className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.5em]">The Academy Pillars</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Institutional Execution. <br /> Zero Noise.</h3>
          </div>
          <div
            data-animate
            id="features-grid"
            className={`grid md:grid-cols-3 gap-10 opacity-0 ${visibleSections.has('features-grid') ? 'animate-zoom-in animate-delay-200' : ''}`}
          >
            <FeatureCard
              icon={TrendingIcon}
              title="Liquidity Architecture"
              desc="We don't look at patterns. We look at capital. Learn where big banks place orders and how to ride the momentum."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Risk Engineering"
              desc="Mathematical safety is our priority. Every student is trained in a proprietary 1:3 RR execution protocol."
            />
            <FeatureCard
              icon={Layers}
              title="8-Week Sync"
              desc="A structured journey from Week 0 foundation to Week 8 live market participation with professional mentors."
            />
          </div>
        </div>
      </section>

      {/* MEET YOUR MENTOR SECTION */}
      <section className="py-32 px-6 md:px-12 bg-[#07070A] relative overflow-hidden z-50 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div
            data-animate
            id="mentor-section"
            className={`grid lg:grid-cols-2 gap-20 items-center opacity-0 ${visibleSections.has('mentor-section') ? 'animate-zoom-in' : ''}`}
          >
            {/* Mentor Image Slot */}
            <div className="relative group order-2 lg:order-1">
              <div className="absolute -inset-4 bg-[#D4AF37]/20 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-2xl">
                {/* Mentor Image */}
                <img
                  src="/mentor-promise-peter.png"
                  alt="Promise Peter - Founder & Lead Mentor"
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                {/* Decorative glow */}
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
              </div>
            </div>

            {/* Biography Content */}
            <div className="space-y-10 order-1 lg:order-2">
              <div className="space-y-4">
                <h2 className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.5em]">The Visionary</h2>
                <h3 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">Meet Your Mentor: <br /> <span className="text-[#D4AF37]">Promise Peter</span></h3>
              </div>

              <div className="space-y-6 text-slate-400 font-medium leading-relaxed italic text-sm md:text-base border-l-2 border-[#D4AF37]/30 pl-8">
                <p>
                  Mr. Promise Peter's journey into the world of forex trading began with a burning desire to break free from financial limitations. Raised in modest circumstances, he always believed there was more to life than just surviving. In his early years, he stumbled across forex trading while searching for opportunities that could offer true financial independence.
                </p>
                <p>
                  With no mentor, limited resources, and frequent internet challenges, he began teaching himself through free content, late-night chart studies, and endless demo accounts. His early days were tough—marked by blown accounts, emotional stress, and moments of doubt.
                </p>
                <p>
                  But what set Promise apart was his unwavering determination. While others gave up, he dug deeper, learning from every loss and refining his strategy. Over time, he discovered the power of trading techniques, which changed his results and mindset completely.
                </p>
                <p>
                  With experience came mastery, and with mastery came a mission: to help others avoid the painful trial-and-error path he endured. That mission birthed DrealtiesFX Academy, a platform where traders are taught with precision, mentorship, and a results-driven system. Today, <span className="text-white font-black not-italic">Promise Peter</span> is not only a successful trader but a mentor dedicated to building the next generation of financially free traders.
                </p>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/40 to-transparent" />
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Founder & Lead Mentor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROFESSIONAL LOT SIZE CALCULATOR SECTION */}
      <section id="calculator" className="py-40 px-6 md:px-12 bg-[#0a0a0c] z-50 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto">
          {/* Section Header */}
          <div
            data-animate
            id="calculator-header"
            className={`flex items-center justify-between mb-12 px-4 text-center md:text-left flex-col md:flex-row items-center gap-6 opacity-0 ${visibleSections.has('calculator-header') ? 'animate-zoom-in' : ''}`}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Professional Lot Size Calculator</h2>
                <div className="px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Live Terminal</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Institutional position sizing and professional risk management.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Global Rank: 0 XP
              </button>
            </div>
          </div>

          <div
            data-animate
            id="trading-console"
            className={`opacity-0 ${visibleSections.has('trading-console') ? 'animate-zoom-in animate-delay-300' : ''}`}
          >
            <TradingConsole />
          </div>

          {/* Institutional Calendar Link/Summary */}
          <div className="mt-12 bg-[#121214] border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <Calendar className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Institutional Calendar</h3>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CalendarItem time="14:30" currency="USD" label="CPI m/m" />
              <CalendarItem time="16:00" currency="EUR" label="ECB Press Conference" />
              <CalendarItem time="17:45" currency="USD" label="Consumer Sentiment" />
              <CalendarItem time="18:30" currency="CAD" label="BOC Gov Speaking" />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-40 px-6 md:px-12 bg-black z-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div
            data-animate
            id="pricing-header"
            className={`text-center space-y-6 opacity-0 ${visibleSections.has('pricing-header') ? 'animate-zoom-in' : ''}`}
          >
            <h2 className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.5em]">Enrollment Tiers</h2>
            <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter">Invest in your Tomorrow.</h3>
          </div>

          <div
            data-animate
            id="pricing-grid"
            className={`grid md:grid-cols-3 gap-8 opacity-0 ${visibleSections.has('pricing-grid') ? 'animate-zoom-in animate-delay-200' : ''}`}
          >
            <PriceCard
              tier="Foundation"
              price="FREE"
              desc="Perfect for testing the waters and learning the absolute basics."
              features={["Week 0 Access", "Introductory Lessons", "Public Market Calendar", "Community Forum Access"]}
              btnText="Start for Free"
              onClick={() => setAuthMode('register')}
            />
            <PriceCard
              tier="Elite"
              price="$70"
              desc="The full 8-week institutional cohort with live mentorship."
              features={["Full 8-Week Curriculum", "Weekly Live Webinars", "Proprietary Risk Engine", "Certification of Completion", "Prop-Firm Prep Guide"]}
              recommended
              btnText="Secure Access"
              onClick={() => setAuthMode('register')}
            />
            <PriceCard
              tier="Institutional"
              price="$200"
              desc="One-on-one mentorship and priority strategic consulting."
              features={["Everything in Elite", "Weekly 1-on-1 Strategy Calls", "Custom Algorithmic Tools", "Direct WhatsApp Access", "Account Funding Evaluation"]}
              btnText="Book Application"
              onClick={() => setAuthMode('register')}
            />
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION SECTION */}
      <section className="py-32 px-6 md:px-12 bg-[#0a0a0c] z-50 relative overflow-hidden">
        <div
          data-animate
          id="subscription-section"
          className={`max-w-5xl mx-auto bg-[#121214] border border-white/5 rounded-[3rem] p-16 md:p-24 text-center space-y-10 relative shadow-2xl opacity-0 ${visibleSections.has('subscription-section') ? 'animate-zoom-in' : ''}`}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">Join the Academy.</h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
              Stay updated with weekly market recaps, institutional reports, and exclusive cohort discounts.
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubscribe}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto"
          >
            <input
              name="email"
              id="newsletter-email"
              type="email"
              required
              placeholder="Enter your professional email"
              className="w-full bg-black/40 border border-white/10 px-8 py-5 rounded-full text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold-slide w-full sm:w-auto px-10 py-5 bg-[#D4AF37] text-black rounded-full font-black text-[10px] uppercase tracking-widest whitespace-nowrap disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'Subscribe'}
            </button>
          </form>

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-[60px]" />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-40 px-6 md:px-12 bg-black z-50">
        <div className="max-w-4xl mx-auto space-y-16">
          <div
            data-animate
            id="faq-header"
            className={`text-center space-y-4 opacity-0 ${visibleSections.has('faq-header') ? 'animate-zoom-in' : ''}`}
          >
            <HelpCircle className="w-12 h-12 text-[#D4AF37] mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Frequently Asked.</h2>
          </div>

          <div
            data-animate
            id="faq-items"
            className={`space-y-4 opacity-0 ${visibleSections.has('faq-items') ? 'animate-zoom-in animate-delay-200' : ''}`}
          >
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-[#121214] border border-white/5 rounded-3xl overflow-hidden transition-all">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-8 flex items-center justify-between text-left group"
                >
                  <span className="text-sm font-black text-white uppercase tracking-widest group-hover:text-[#D4AF37] transition-colors">{faq.q}</span>
                  {activeFaq === idx ? <Minus className="w-5 h-5 text-[#D4AF37]" /> : <Plus className="w-5 h-5 text-slate-700 group-hover:text-white" />}
                </button>
                {activeFaq === idx && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-slate-500 text-sm font-medium leading-relaxed italic">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-40 px-6 md:px-12 bg-[#0a0a0c] z-50 border-t border-white/5">
        <div
          data-animate
          id="contact-section"
          className={`max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 opacity-0 ${visibleSections.has('contact-section') ? 'animate-zoom-in' : ''}`}
        >
          <div className="space-y-8">
            <h2 className="text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.5em]">Direct Interface</h2>
            <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter">Get in Touch.</h3>
            <p className="text-lg text-slate-500 font-medium italic leading-relaxed max-w-md">
              Have specific questions about institutional trading or our academy structure? Our mentors are ready to respond.
            </p>

            <div className="space-y-6 pt-10">
              <ContactItem icon={Mail} label="Professional Email" value="ops@drealtiesfx.com" />
              <ContactItem icon={MessageSquare} label="Official WhatsApp" value="+234-800-ALPHA-FX" />
              <ContactItem icon={Globe} label="Region" value="Global Access Node" />
            </div>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="bg-[#121214] border border-white/10 p-12 rounded-[3.5rem] shadow-2xl space-y-8"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-2">Full Name</label>
                <input name="name" id="contact-name" required type="text" className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-white outline-none focus:border-[#D4AF37]/50" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-2">Email</label>
                <input name="email" id="contact-email" required type="email" className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-white outline-none focus:border-[#D4AF37]/50" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-2">Topic of Interest</label>
              <select name="subject" id="contact-subject" className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-500 outline-none focus:text-white">
                <option>Mentorship Inquiry</option>
                <option>Corporate Partnership</option>
                <option>Technical Support</option>
                <option>Prop Firm Questions</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-2">Message Payload</label>
              <textarea name="message" id="contact-message" required rows={5} className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-white outline-none focus:border-[#D4AF37]/50 resize-none" />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold-slide w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Transmitting...' : 'Initialize Communication'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-24 px-6 md:px-12 border-t border-white/5 bg-[#07070A] text-center space-y-12 z-50 relative">
        <div className="flex flex-col items-center gap-6">
          <img src="/Dreaties_Logo.png" alt="DrealtiesFX Academy Logo" className="w-12 h-12 object-contain" />
          <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">DrealtiesFX Academy</h4>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-12 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#calculator" className="hover:text-white transition-colors">Lotsize Calculator</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-[9px] text-slate-800 font-bold uppercase tracking-[0.4em]">
          © 2026 DREALITIESFX ACADEMY. TRADING INVOLSES SUBSTANTIAL RISK OF LOSS.
        </p>
      </footer>

      {/* AUTH OVERLAY MODAL */}
      {authMode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#07070A]/95 backdrop-blur-2xl" onClick={() => setAuthMode(null)} />
          <div className="relative w-full max-w-xl bg-[#121214] border border-[#D4AF37]/30 rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.2)] animate-in zoom-in-95 duration-500">

            <div className="p-10 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
                  <Shield className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                    {authMode === 'login' ? 'Login' :
                      authMode === 'register' ? 'Register' :
                        authMode === 'forgot-password' ? 'Reset Request' : 'New Password'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                    {authMode === 'forgot-password' || authMode === 'reset-password' ? 'Account Security' : 'Account Tier: Professional'}
                  </p>
                </div>
              </div>
              <button onClick={() => setAuthMode(null)} className="p-3 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-12 space-y-8">
              {authMode === 'register' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Full Name</label>
                  <div className="relative">
                    <input name="name" type="text" required placeholder="Enter your full name" className="w-full bg-black/40 border border-white/10 px-8 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all pl-14" />
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
                  {authMode === 'forgot-password' ? 'Verified Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={authMode === 'reset-password' ? resetEmail || '' : ''}
                    readOnly={authMode === 'reset-password'}
                    placeholder="name@example.com"
                    className={`w-full bg-black/40 border border-white/10 px-8 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all pl-14 ${authMode === 'reset-password' ? 'opacity-50' : ''}`}
                  />
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                </div>
              </div>

              {(authMode === 'login' || authMode === 'register' || authMode === 'reset-password') && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
                    {authMode === 'reset-password' ? 'New Password' : 'Password'}
                  </label>
                  <div className="relative">
                    <input name="password" type="password" required placeholder="••••••••" className="w-full bg-black/40 border border-white/10 px-8 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all pl-14" />
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                  </div>
                  {authMode === 'login' && (
                    <div className="flex justify-end pr-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot-password')}
                        className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {authMode === 'reset-password' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Confirm New Password</label>
                  <div className="relative">
                    <input name="password_confirmation" type="password" required placeholder="••••••••" className="w-full bg-black/40 border border-white/10 px-8 py-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all pl-14" />
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold-slide w-full py-6 bg-[#D4AF37] text-black rounded-2xl font-black text-xs font-black uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                  authMode === 'login' ? 'Login' :
                    authMode === 'register' ? 'Create Account' :
                      authMode === 'forgot-password' ? 'Send Reset Link' : 'Update Password'
                )}
              </button>

              <div className="pt-6 border-t border-white/5 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-[#D4AF37] transition-colors"
                >
                  {authMode === 'forgot-password' || authMode === 'reset-password' ? "Wait, I remember my password! Back to Login" :
                    authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Log in"}
                </button>
              </div>
            </form>

            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: any; title: string; desc: string }> = ({ icon: Icon, title, desc }) => (
  <div className="p-12 bg-[#121214] border border-white/5 rounded-[3rem] group hover:border-[#D4AF37]/30 transition-all shadow-xl hover:-translate-y-2">
    <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-10 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">{title}</h3>
    <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider italic">{desc}</p>
  </div>
);

const PriceCard: React.FC<{
  tier: string;
  price: string;
  desc: string;
  features: string[];
  recommended?: boolean;
  btnText: string;
  onClick: () => void;
}> = ({ tier, price, desc, features, recommended, btnText, onClick }) => (
  <div className={`p-12 rounded-[3.5rem] border flex flex-col justify-between transition-all group ${recommended ? 'bg-[#121214] border-[#D4AF37] shadow-2xl scale-105 z-10' : 'bg-[#0b0b0d] border-white/5 hover:border-white/20'
    }`}>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${recommended ? 'text-[#D4AF37]' : 'text-slate-600'}`}>{tier}</span>
        {recommended && <span className="px-3 py-1 bg-[#D4AF37] text-black text-[8px] font-black uppercase tracking-widest rounded-full">POPULAR</span>}
      </div>
      <div className="space-y-1">
        <h4 className="text-6xl font-black text-white italic tracking-tighter">{price}</h4>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{price === 'FREE' ? 'Registration' : 'One-time Payment'}</p>
      </div>
      <p className="text-sm font-medium text-slate-400 italic leading-relaxed">{desc}</p>
      <div className="space-y-4 pt-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <CheckCircle2 className={`w-4 h-4 ${recommended ? 'text-[#D4AF37]' : 'text-slate-700'}`} />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{f}</span>
          </div>
        ))}
      </div>
    </div>
    <button
      onClick={onClick}
      className={`btn-gold-slide w-full mt-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${recommended ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-white hover:bg-white/10'
        }`}
    >
      {btnText}
    </button>
  </div>
);

const CalendarItem: React.FC<{ time: string; currency: string; label: string }> = ({ time, currency, label }) => (
  <div className="p-6 bg-black/30 border border-white/5 rounded-2xl group hover:border-[#D4AF37]/30 transition-all">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{time}</span>
      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase rounded">High</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white uppercase">
        {currency}
      </div>
      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-tight group-hover:text-white transition-colors">{label}</p>
    </div>
  </div>
);

const ContactItem: React.FC<{ icon: any; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-6 group">
    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-[#D4AF37] transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-white uppercase tracking-widest mt-0.5">{value}</p>
    </div>
  </div>
);
