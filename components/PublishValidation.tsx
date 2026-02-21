
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Settings, 
  Mail, 
  Info,
  Loader2,
  ExternalLink,
  HelpCircle
} from 'lucide-react';

interface PublishValidationProps {
  onCancel: () => void;
  onSave?: (status: string) => void;
}

export const PublishValidation: React.FC<PublishValidationProps> = ({ onCancel, onSave }) => {
  const [sessionName, setSessionName] = useState('May 2024 Cohort');
  const [startDate, setStartDate] = useState('May 10, 2024');
  const [endDate, setEndDate] = useState('July 4, 2024');
  const [dripMode, setDripMode] = useState<'Strict' | 'Flexible'>('Strict');
  const [isValidating, setIsValidating] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published'>('idle');
  
  const [checks, setChecks] = useState({
    weeklyContent: true,
    lessonContent: true,
    noOrphans: true
  });

  const handlePublish = () => {
    setPublishStatus('publishing');
    setTimeout(() => {
      setPublishStatus('published');
      onSave?.('Published');
    }, 1200);
  };

  const handleSaveOnly = () => {
    onSave?.('Draft');
  };

  const runValidation = () => {
    setIsValidating(true);
    setTimeout(() => setIsValidating(false), 1000);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-[#f3f4f6] min-h-full text-[#1e293b]">
      <div className="flex items-center gap-2 text-sm font-medium mb-6">
        <button onClick={onCancel} className="text-blue-600 hover:underline">VR Game Development Mastery</button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-400">Publish & Validation</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1e293b]">Publish & Validation</h1>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 rounded-md border border-slate-200">Cancel</button>
          <button 
            onClick={handlePublish}
            disabled={publishStatus === 'publishing'}
            className="px-8 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm flex items-center gap-2"
          >
            {publishStatus === 'publishing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-9">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#1e293b] mb-8">Validation Report</h2>
            <div className="border border-slate-100 rounded-xl p-8 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Name</label>
                  <input type="text" value={sessionName} onChange={(e) => setSessionName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-800 font-medium outline-none shadow-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-10 pt-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">Enrollment Checks</h4>
                  <div className="space-y-3">
                    <ValidationItem checked={checks.weeklyContent} label="Every week has at" badge="least 500" loading={isValidating} />
                    <ValidationItem checked={checks.lessonContent} label="All lessons have content" loading={isValidating} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-mono tracking-wider bg-slate-50 px-3 py-1 rounded">POST /api/admin/publish</p>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1e293b]">Final Step</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Ensure all validation checks are green before pushing to students.</p>
            <button onClick={handlePublish} className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md">Publish Changes</button>
            <button onClick={handleSaveOnly} className="w-full py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50">Save as Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ValidationItem: React.FC<{ checked: boolean; label: string; badge?: string; loading?: boolean }> = ({ checked, label, badge, loading }) => (
  <div className="flex items-center gap-3 group">
    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
      loading ? 'border-slate-200' : checked ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-slate-300'
    }`}>
      {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" /> : checked && <CheckCircle2 className="w-3 h-3 text-white" />}
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${checked ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
      {badge && <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded border border-slate-200 uppercase">{badge}</span>}
    </div>
  </div>
);
