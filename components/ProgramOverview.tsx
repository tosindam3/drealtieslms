
import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Plus,
  Edit2,
  MoreHorizontal,
  FileBox,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CourseData, LearningOutcome, Prerequisite } from '../types';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../lib/ToastContext';

interface ProgramOverviewProps {
  data: CourseData;
  onChange: (data: CourseData) => void;
  onPreview?: () => void;
}

export const ProgramOverview: React.FC<ProgramOverviewProps> = ({ data, onChange, onPreview }) => {
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIImprove = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Improve this course description to be more engaging and professional for a high-end VR Game Development mastery course: "${data.shortDescription}"`,
        config: {
          systemInstruction: "You are a professional curriculum designer and marketing expert. Provide only the improved text.",
          temperature: 0.7,
        }
      });

      const text = response.text;
      if (text) {
        onChange({ ...data, shortDescription: text });
      }
    } catch (error) {
      console.error('Error improving description:', error);
      addToast({
        title: 'AI Generation Error',
        description: 'Failed to generate AI improvement. Please check your console.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Program Overview</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <span className="text-slate-900 font-medium">{data.title}</span>
            <span className="text-slate-300">|</span>
            <span>Program: {data.program}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPreview}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Preview
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
            Save
          </button>
          <div className="flex items-center overflow-hidden rounded-md border border-blue-600">
            <button className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors border-r border-blue-500">
              Publish
            </button>
            <button className="px-2 py-2 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column (Images/Lists) */}
        <div className="col-span-3 space-y-6">
          <div className="relative rounded-lg overflow-hidden group cursor-pointer">
            <img
              src="https://picsum.photos/seed/vr/600/400"
              alt="Cover"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button className="bg-white/90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Cover Image
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-slate-900 font-bold mb-4">Learning Outcomes</h3>
            <ul className="space-y-4">
              {data.outcomes.map((outcome) => (
                <li key={outcome.id} className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 leading-snug">{outcome.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-slate-900 font-bold mb-4">Prerequisites</h3>
            <ul className="space-y-4 mb-6">
              {data.prerequisites.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 leading-snug">{item.text}</span>
                </li>
              ))}
            </ul>
            <button className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
              <Plus className="w-4 h-4" /> Add Prerequisite
            </button>
          </div>
        </div>

        {/* Center Column (Form) */}
        <div className="col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Program Title</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Short Description</label>
                <button
                  onClick={handleAIImprove}
                  disabled={isGenerating}
                  className="text-xs flex items-center gap-1 text-purple-600 font-bold hover:text-purple-700 disabled:opacity-50"
                >
                  <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? 'AI Generating...' : 'Improve with AI'}
                </button>
              </div>
              <textarea
                rows={4}
                value={data.shortDescription}
                onChange={(e) => onChange({ ...data, shortDescription: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category / Skill Level</label>
                <div className="relative">
                  <select
                    value={`${data.category} | ${data.skillLevel}`}
                    onChange={(e) => {
                      const [cat, skill] = e.target.value.split(' | ');
                      onChange({ ...data, category: cat, skillLevel: skill });
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-700 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>Game Development | Intermediate</option>
                    <option>Game Development | Beginner</option>
                    <option>Game Development | Advanced</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Duration</label>
                <div className="relative">
                  <select
                    value={data.duration}
                    onChange={(e) => onChange({ ...data, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-700 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>8 weeks</option>
                    <option>12 weeks</option>
                    <option>16 weeks</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visibility Status</label>
              <div className="relative">
                <select
                  value={data.visibility}
                  onChange={(e) => onChange({ ...data, visibility: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-700 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Private</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Linked Cohorts Bottom (Read Only) */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">Linked Cohorts (Read-only)</h3>
            <div className="space-y-3">
              {data.linkedCohorts.map((cohort) => (
                <div key={cohort.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 border border-slate-200 rounded-md">
                      <FileBox className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">{cohort.name} – <span className="text-slate-500 font-normal">{cohort.studentCount}/{cohort.maxStudents} students</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Status/Links) */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-slate-900 font-bold mb-4">Program Status</h3>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-slate-900 font-bold">Draft</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">Not Published</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Visible to instructors</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Cohorts linked</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-slate-900 font-bold mb-4">Linked Cohorts <span className="text-xs font-normal text-slate-400 ml-1">(Read-only)</span></h3>
            <div className="space-y-4">
              {data.linkedCohorts.map(cohort => (
                <div key={cohort.id} className="p-4 border border-slate-100 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-800 font-semibold text-sm">{cohort.name}</span>
                    <span className="text-xs text-slate-400">{cohort.studentCount}/{cohort.maxStudents} students</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-0"></div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-blue-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                <Plus className="w-4 h-4" /> Link Another Cohort
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-slate-900 font-bold mb-4">Status</h3>
            <div className="relative">
              <select
                value={data.visibility}
                onChange={(e) => onChange({ ...data, visibility: e.target.value as any })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-700 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Draft</option>
                <option>Published</option>
                <option>Private</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick Stats Helper */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg shadow-blue-500/20">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Instructor Mode
            </h4>
            <p className="text-xs text-blue-100 mb-4 leading-relaxed">
              You are currently editing this program. Changes are saved as draft automatically.
            </p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
              View Guide <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
