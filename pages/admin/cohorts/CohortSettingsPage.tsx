import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Users,
  Calendar,
  ShieldCheck,
  Zap,
  Settings,
  Trash2,
  UserPlus,
  MoreHorizontal,
  Search,
  Filter,
  Activity,
  Lock,
  Globe,
  Mail,
  ChevronDown,
  Trophy,
  AlertCircle,
  Clock,
  Info,
  CreditCard
} from 'lucide-react';
import { EmailTemplatesPage } from '../emails/EmailTemplatesPage';
import { Cohort } from '../../../types';
import { apiClient } from '../../../lib/apiClient';
import { useToast } from '../../../lib/ToastContext';

interface CohortSettingsPageProps {
  cohortId: string;
  onBack: () => void;
  isNested?: boolean;
}

export const CohortSettingsPage: React.FC<CohortSettingsPageProps> = ({ cohortId, onBack, isNested = false }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'identity' | 'enrollment' | 'faculty' | 'sync' | 'emails'>('identity');
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [unenrolledStudents, setUnenrolledStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Cohort & {
    approvalMode: 'auto' | 'manual',
    accessType: 'open' | 'invite' | 'paid',
    instructors: string[],
    dripEnabled: boolean,
    certificationEnabled: boolean
  }>({
    id: cohortId,
    name: 'May 2024 Alpha',
    studentCount: 38,
    maxStudents: 50,
    startDate: '2024-05-10',
    endDate: '2024-07-04',
    approvalMode: 'manual',
    accessType: 'paid',
    instructors: [],
    dripEnabled: true,
    certificationEnabled: false
  });

  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [instructorSearch, setInstructorSearch] = useState('');

  const fetchEnrollmentData = async () => {
    try {
      const [enrolledRes, unenrolledRes] = await Promise.all([
        apiClient.get(`/api/admin/cohorts/${cohortId}/students`),
        apiClient.get(`/api/admin/cohorts/${cohortId}/unenrolled`)
      ]);
      if (enrolledRes && enrolledRes.students) setEnrolledStudents(enrolledRes.students);
      if (unenrolledRes && unenrolledRes.users) setUnenrolledStudents(unenrolledRes.users);
    } catch (err) {
      console.error("Failed to fetch enrollment data:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'enrollment') {
      fetchEnrollmentData();
    }
  }, [activeTab, cohortId]);

  useEffect(() => {
    const fetchCohortData = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.get(`/api/cohorts/${cohortId}`);
        if (data && data.cohort) {
          const cohort = data.cohort;
          setFormData({
            id: cohort.id,
            name: cohort.name,
            studentCount: cohort.enrolled_count || 0,
            maxStudents: cohort.capacity || 50,
            startDate: cohort.start_date || '',
            endDate: cohort.end_date || '',
            approvalMode: cohort.settings?.approval_mode || 'manual',
            accessType: cohort.settings?.access_type || 'paid',
            instructors: cohort.settings?.instructors || [],
            dripEnabled: cohort.settings?.drip_enabled ?? true,
            certificationEnabled: cohort.settings?.certification_enabled ?? false
          });
        }
      } catch (err) {
        console.error("Failed to fetch cohort settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCohortData();

    const fetchAvailableInstructors = async () => {
      try {
        const res = await apiClient.get('/api/admin/instructors');
        if (res && res.instructors) setAvailableInstructors(res.instructors);
      } catch (err) {
        console.error("Failed to fetch instructors:", err);
      }
    };
    fetchAvailableInstructors();
  }, [cohortId]);

  const handleDeleteCohort = async () => {
    if (!confirm("CRITICAL ACTION: Are you sure you want to permanently delete this cohort? This cannot be undone and all student progress data will be destroyed.")) return;

    setIsLoading(true);
    try {
      await apiClient.delete(`/api/admin/cohorts/${cohortId}`);
      addToast({
        title: 'Intake Deleted',
        description: 'The intake and all associated records have been removed.',
        type: 'success'
      });
      onBack();
    } catch (err: any) {
      console.error("Deletion failed:", err);
      addToast({
        title: 'Removal Failed',
        description: err.message || 'The system encountered an error during deletion.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (userId: string) => {
    setEnrollingId(userId);
    try {
      await apiClient.post(`/api/admin/cohorts/${cohortId}/enroll`, { user_id: userId });
      await fetchEnrollmentData();
      setFormData(prev => ({ ...prev, studentCount: prev.studentCount + 1 }));
      addToast({
        title: 'Student Enrolled',
        description: 'Student successfully added to the cohort.',
        type: 'success'
      });
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      addToast({
        title: 'Enrollment Error',
        description: err.message || 'Failed to enroll student in this cohort.',
        type: 'error'
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this student from the cohort?")) return;
    setRemovingId(userId);
    try {
      await apiClient.delete(`/api/admin/cohorts/${cohortId}/users/${userId}`);
      await fetchEnrollmentData();
      setFormData(prev => ({ ...prev, studentCount: Math.max(0, prev.studentCount - 1) }));
      addToast({
        title: 'Student Removed',
        description: 'Student successfully removed from the cohort.',
        type: 'success'
      });
    } catch (err: any) {
      console.error("Removal failed:", err);
      addToast({
        title: 'Removal Error',
        description: err.message || 'Failed to remove student from cohort.',
        type: 'error'
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Structure data for backend settings JSON
      const payload = {
        name: formData.name,
        capacity: formData.maxStudents,
        start_date: formData.startDate,
        end_date: formData.endDate,
        settings: {
          approval_mode: formData.approvalMode,
          access_type: formData.accessType,
          instructors: formData.instructors,
          drip_enabled: formData.dripEnabled,
          certification_enabled: formData.certificationEnabled
        }
      };

      await apiClient.patch(`/api/admin/cohorts/${cohortId}`, payload);
      addToast({
        title: 'Settings Saved',
        description: 'Cohort configurations updated successfully.',
        type: 'success'
      });
    } catch (err) {
      console.error("Failed to save cohort settings:", err);
      addToast({
        title: 'Save Failed',
        description: 'Failed to update cohort settings. Please verify inputs.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0b] text-slate-300 font-['Inter'] selection:bg-[#D4AF37]/30">
      {!isNested && (
        <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0 bg-[#121214]/50 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={onBack} className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] hover:text-white transition-colors flex items-center gap-2 group">
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Intakes
            </button>
            <div className="h-4 w-px bg-white/5 mx-2" />
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Active Intake</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Intake Settings</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Managing: {formData.name}</p>
            </div>
            <button
              onClick={handleSave}
              className="px-10 py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#D4AF37]/20 hover:bg-[#B8962E] transition-all active:scale-95 flex items-center gap-3"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Nav */}
        <aside className="w-80 border-r border-white/5 bg-[#121214] p-8 space-y-2 shrink-0">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 pl-4">Settings Categories</p>
          <NavButton
            id="identity"
            label="Basic Information"
            icon={Globe}
            active={activeTab === 'identity'}
            onClick={() => setActiveTab('identity')}
          />
          <NavButton
            id="enrollment"
            label="Student Roster"
            icon={Users}
            active={activeTab === 'enrollment'}
            onClick={() => setActiveTab('enrollment')}
          />
          <NavButton
            id="faculty"
            label="Instructors & Staff"
            icon={ShieldCheck}
            active={activeTab === 'faculty'}
            onClick={() => setActiveTab('faculty')}
          />
          <NavButton
            id="sync"
            label="Course Delivery"
            icon={Activity}
            active={activeTab === 'sync'}
            onClick={() => setActiveTab('sync')}
          />
          <NavButton
            id="emails"
            label="Communication"
            icon={Mail}
            active={activeTab === 'emails'}
            onClick={() => setActiveTab('emails')}
          />

          <div className="pt-10 border-t border-white/5 mt-8 px-4">
            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4 group text-center">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Delete Intake
              </h4>
              <p className="text-[9px] text-slate-600 font-bold uppercase leading-relaxed tracking-wider">
                Permanently remove this intake and all associated records.
              </p>
              <button
                onClick={handleDeleteCohort}
                className="w-full py-2.5 bg-red-500/10 text-red-500 text-[9px] font-black uppercase rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"
              >
                Delete Intake Records
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/20">
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">

            {activeTab === 'identity' && (
              <div className="space-y-10">
                <SectionHeader title="General Information" desc="Configure basic details and scheduling for this intake." />

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Intake Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-sm font-black text-white outline-none focus:border-[#D4AF37]/50 shadow-inner"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Privacy Setting</label>
                    <div className="relative group">
                      <select className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-[#D4AF37] outline-none appearance-none">
                        <option>Public Enrollment</option>
                        <option>Private (Invite Only)</option>
                        <option>Hidden (Internal)</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Start Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-black text-white outline-none focus:border-blue-500/40"
                      />
                      <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">End Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-black text-white outline-none focus:border-blue-500/40"
                      />
                      <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'enrollment' && (
              <div className="space-y-10">
                <SectionHeader title="Student Roster" desc="Manage active student participation and intake for this session." />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* ENROLLED STUDENTS */}
                  <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-8 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enrolled Units ({enrolledStudents.length})</h4>
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {enrolledStudents.length > 0 ? (
                        enrolledStudents.map((student) => (
                          <div key={student.user.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group border-l-2 border-l-blue-500">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black text-xs">
                                {student.user.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">{student.user.name}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{student.user.email}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemove(student.user.id)}
                              disabled={removingId === student.user.id}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {removingId === student.user.id ? (
                                <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-[10px] font-black text-slate-700 uppercase tracking-[.3em]">No students enrolled.</div>
                      )}
                    </div>
                  </div>

                  {/* UNENROLLED STUDENTS / SEARCH */}
                  <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-8 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Candidates</h4>
                      <Search className="w-4 h-4 text-slate-600" />
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="SEARCH STUDENTS..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 p-4 pl-12 rounded-xl text-[10px] font-black text-white outline-none focus:border-blue-500/40 uppercase tracking-widest shadow-inner"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {unenrolledStudents
                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                                {student.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">{student.name}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{student.email}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleEnroll(student.id)}
                              disabled={enrollingId === student.id}
                              className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg font-black text-[9px] uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {enrollingId === student.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  Processing
                                </>
                              ) : (
                                'Add to Roster'
                              )}
                            </button>
                          </div>
                        ))
                      }
                      {unenrolledStudents.length === 0 && (
                        <div className="py-12 text-center text-[10px] font-black text-slate-700 uppercase tracking-[.3em]">All units processed or none found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faculty' && (
              <div className="space-y-10">
                <SectionHeader title="Staff & Instructors" desc="Assign faculty and support staff to guide this intake." />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-8 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Instructors</h4>
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    </div>

                    <div className="space-y-3">
                      {formData.instructors.length > 0 ? (
                        formData.instructors.map((instructorEmail) => {
                          const instructor = availableInstructors.find(i => i.email === instructorEmail);
                          return (
                            <div key={instructorEmail} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group border-l-2 border-l-[#D4AF37]">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37] font-black text-xs">
                                  {instructor?.name.charAt(0) || instructorEmail.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-white uppercase tracking-wider">{instructor?.name || 'Loading...'}</span>
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{instructorEmail}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setFormData({ ...formData, instructors: formData.instructors.filter(e => e !== instructorEmail) })}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-red-500/10 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center text-[10px] font-black text-slate-700 uppercase tracking-[.3em]">No instructors assigned.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-8 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Faculty</h4>
                      <Search className="w-4 h-4 text-slate-600" />
                    </div>

                    <input
                      type="text"
                      placeholder="SEARCH FACULTY..."
                      value={instructorSearch}
                      onChange={e => setInstructorSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 p-4 rounded-xl text-[10px] font-black text-white outline-none focus:border-[#D4AF37]/40 uppercase tracking-widest"
                    />

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {availableInstructors
                        .filter(i => !formData.instructors.includes(i.email))
                        .filter(i => i.name.toLowerCase().includes(instructorSearch.toLowerCase()) || i.email.toLowerCase().includes(instructorSearch.toLowerCase()))
                        .map((instructor) => (
                          <div key={instructor.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-[#D4AF37]/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                                {instructor.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">{instructor.name}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{instructor.email}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setFormData({ ...formData, instructors: [...formData.instructors, instructor.email] })}
                              className="px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg font-black text-[9px] uppercase tracking-widest border border-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-black transition-all"
                            >
                              Assign
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-10">
                <SectionHeader title="Course Delivery" desc="Configure how content is transmitted and certified." />

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Drip Content Unlocking</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Unlock weeks based on relative timing.</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enable Drip Schedule</span>
                      <button
                        onClick={() => setFormData({ ...formData, dripEnabled: !formData.dripEnabled })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${formData.dripEnabled ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.dripEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Course Certification</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Auto-issue certificates on completion.</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Certification</span>
                      <button
                        onClick={() => setFormData({ ...formData, certificationEnabled: !formData.certificationEnabled })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${formData.certificationEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.certificationEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synchronous Sessions</h4>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-3">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Live Classes</span>
                      <p className="text-2xl font-black text-white italic tracking-tighter uppercase">Enabled</p>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-3">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Recordings</span>
                      <p className="text-2xl font-black text-white italic tracking-tighter uppercase">High Def</p>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl text-center space-y-3">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">AI Oversight</span>
                      <p className="text-2xl font-black text-[#D4AF37] italic tracking-tighter uppercase">Active</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'emails' && (
              <div className="space-y-10">
                <EmailTemplatesPage isNested={true} />
              </div>
            )}
          </div>
        </main>
      </div>

      {isNested && (
        <footer className="h-16 border-t border-white/5 bg-[#121214] px-12 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
            <span>Intake ID: {String(cohortId).slice(-8).toUpperCase()}</span>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#D4AF37] text-black rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-2xl hover:bg-[#B8962E] transition-all"
          >
            Save Changes
          </button>
        </footer>
      )}
    </div>
  );
};

const NavButton: React.FC<{ id: string, label: string, icon: any, active: boolean, onClick: () => void }> = ({ label, icon: Icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group border ${active
      ? 'bg-white/5 text-white border-white/10 shadow-lg'
      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-transparent'
      }`}
  >
    <div className="flex items-center gap-4">
      <Icon className={`w-4 h-4 ${active ? 'text-[#D4AF37]' : 'text-slate-600 group-hover:text-slate-400'}`} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
  </button>
);

const SectionHeader: React.FC<{ title: string, desc: string }> = ({ title, desc }) => (
  <div className="border-b border-white/5 pb-8">
    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h2>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{desc}</p>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex items-center justify-center bg-[#0a0a0b]">
    <div className="flex flex-col items-center gap-8">
      <div className="w-20 h-20 border-[8px] border-[#D4AF37]/10 border-t-[#D4AF37] rounded-full animate-spin shadow-[0_0_50px_rgba(212,175,55,0.1)]" />
      <span className="text-[12px] font-black text-[#D4AF37] uppercase tracking-[0.8em] animate-pulse">Loading Settings...</span>
    </div>
  </div>
);
