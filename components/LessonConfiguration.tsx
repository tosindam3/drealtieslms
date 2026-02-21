import React, { useState, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  Sparkles,
  Trash2,
  AlertCircle,
  // Fix: Added missing Image import as ImageIcon to resolve the error on line 258
  Image as ImageIcon
} from 'lucide-react';
import { Lesson, Week } from '../types';
import { GoogleGenAI } from '@google/genai';

interface LessonConfigurationProps {
  courseTitle: string;
  week: Week;
  lesson: Lesson;
  onCancel: () => void;
  onSave: (lesson: Lesson) => void;
}

export const LessonConfiguration: React.FC<LessonConfigurationProps> = ({ 
  courseTitle, 
  week, 
  lesson, 
  onCancel, 
  onSave 
}) => {
  const [formData, setFormData] = useState<Lesson>(lesson);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lessonTypes = [
    'Video Lesson',
    'Text Lesson',
    'Video + Text Lesson',
    'Image Lesson',
    'Mixed Lesson',
    'Resource Only'
  ];

  const handleGenerateThumbnail = async () => {
    setIsGeneratingImage(true);
    try {
      // Fix: Ensure a new client is created using the environment API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A cinematic, high-quality educational thumbnail for a VR development course lesson titled: "${formData.title}". Style: Professional, tech-oriented, futuristic.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          setFormData({ ...formData, thumbnailUrl: `data:image/png;base64,${base64Data}` });
          break;
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Ensure your API key supports image generation.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, thumbnailUrl: url });
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-[#f3f4f6] min-h-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm font-medium mb-6">
        <button onClick={onCancel} className="text-blue-600 hover:underline">{courseTitle}</button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-600">Week {week.number}</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-400">Lesson {formData.number}. {formData.title}</span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1e293b]">Lesson Configuration</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center overflow-hidden rounded-md border border-blue-600 shadow-sm">
            <button 
              onClick={() => onSave(formData)}
              className="px-8 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors border-r border-blue-500"
            >
              Save
            </button>
            <button className="px-2 py-2 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#1e293b]">{formData.title}</h2>
        <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider font-semibold">Lesson {formData.number}</p>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Main Content Form */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8">
            {/* Lesson Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lesson Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Lesson Type & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lesson Type</label>
                <div className="relative">
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 text-sm font-semibold appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white pr-10"
                  >
                    {lessonTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duration Estimate</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 text-sm font-semibold appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white pr-10"
                  >
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>1 hour</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Completion Requirements */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-[#1e293b]">Completion Requirements</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center h-5">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                  />
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-slate-700">Completion Rule:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-normal">Watch at least</span>
                    <div className="relative">
                      <select className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-md text-xs font-bold appearance-none bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none">
                        <option>90 %</option>
                        <option>100 %</option>
                        <option>50 %</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                    <span className="text-slate-500 font-normal">Video Watched</span>
                  </div>
                </div>
              </div>
              <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
                <ChevronDown className="w-3 h-3" /> Advanced Options
              </button>
            </div>

            {/* Lock Rules */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-[#1e293b]">Lock Rules</h3>
              <div className="flex items-center gap-3">
                <input 
                  id="lock-content"
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                />
                <label htmlFor="lock-content" className="text-sm text-slate-600 cursor-pointer select-none">
                  Lock this lesson until the student completes previous content
                </label>
              </div>
            </div>

            {/* Delete Option */}
            <div className="pt-6 border-t border-slate-100">
              <button className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-2">
                Delete Lesson
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel - Thumbnail */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1e293b]">Thumbnail</h3>
              <button 
                onClick={handleGenerateThumbnail}
                disabled={isGeneratingImage}
                className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingImage ? 'animate-pulse' : ''}`} />
                {isGeneratingImage ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-[16/9] rounded-lg overflow-hidden group cursor-pointer border border-slate-100 mb-4 bg-slate-50 flex items-center justify-center"
            >
              {formData.thumbnailUrl ? (
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Lesson Thumbnail" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="text-slate-300 flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs font-medium">No Thumbnail</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 text-[#1e293b] shadow-lg">
                  <Upload className="w-4 h-4" /> {formData.thumbnailUrl ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <p>Recommended size: 800 x 450px. This image will represent the lesson in the student dashboard.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h4 className="text-sm font-bold text-blue-800 mb-2">Content Tip</h4>
            <p className="text-xs text-blue-600 leading-relaxed">
              Including a clear thumbnail helps students quickly identify the lesson content and improves engagement rates by up to 25%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
