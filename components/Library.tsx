
import React, { useState } from 'react';
import {
  Search,
  Upload,
  Plus,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Video,
  Image as ImageIcon,
  FileText,
  File,
  Sparkles,
  Download,
  Trash2,
  ExternalLink,
  HardDrive,
  Clock,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../lib/ToastContext';

interface Asset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'pdf' | 'template';
  size: string;
  date: string;
  usageCount: number;
  thumbnail?: string;
}

export const Library: React.FC = () => {
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('All Assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', name: 'VR_Intro_Tutorial.mp4', type: 'video', size: '1.2 GB', date: 'Oct 12, 2024', usageCount: 4, thumbnail: 'https://picsum.photos/seed/vid1/400/250' },
    { id: '2', name: 'Hero_Image_VR.png', type: 'image', size: '2.4 MB', date: 'Oct 15, 2024', usageCount: 2, thumbnail: 'https://picsum.photos/seed/img1/400/250' },
    { id: '3', name: 'Curriculum_Template.pdf', type: 'pdf', size: '450 KB', date: 'Oct 18, 2024', usageCount: 12 },
    { id: '4', name: 'Lesson_3_Assets.zip', type: 'template', size: '12 MB', date: 'Oct 20, 2024', usageCount: 0 },
    { id: '5', name: 'Oculus_Interaction_Guide.pdf', type: 'pdf', size: '3.1 MB', date: 'Oct 22, 2024', usageCount: 3 },
    { id: '6', name: 'Skybox_Panorama_01.jpg', type: 'image', size: '4.2 MB', date: 'Oct 23, 2024', usageCount: 1, thumbnail: 'https://picsum.photos/seed/sky/400/250' },
  ]);

  const stats = [
    { label: 'Total Storage', value: '42.8 GB', icon: <HardDrive className="w-4 h-4" /> },
    { label: 'Total Assets', value: '1,420', icon: <File className="w-4 h-4" /> },
    { label: 'Recently Added', value: '12', icon: <Clock className="w-4 h-4" /> },
  ];

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: "A futuristic VR headset floating in a digital void, educational illustration style, 4k, professional." }]
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const newAsset: Asset = {
            id: `ai-${Date.now()}`,
            name: `AI_Generated_Asset_${assets.length + 1}.png`,
            type: 'image',
            size: '1.2 MB',
            date: 'Today',
            usageCount: 0,
            thumbnail: `data:image/png;base64,${base64Data}`
          };
          setAssets([newAsset, ...assets]);
          break;
        }
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      addToast({
        title: 'AI Synthesis Failed',
        description: 'AI image generation failed. Ensure your API key is active.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resource Library</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and deploy educational assets across all programs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Generate
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
            <Upload className="w-4 h-4" />
            Upload Resources
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-lg font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Categories */}
        <div className="col-span-2 space-y-1">
          {['All Assets', 'Videos', 'Images', 'Documents', 'Templates', 'Archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              {tab}
              {tab === 'All Assets' && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">{assets.length}</span>}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="col-span-7 space-y-6">
          {/* Controls */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources by name or type..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 ml-2">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Asset Browser */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`bg-white rounded-xl border-2 transition-all cursor-pointer group overflow-hidden ${selectedAssetId === asset.id ? 'border-blue-500 ring-4 ring-blue-50/50 shadow-lg' : 'border-transparent shadow-sm hover:border-slate-300'
                    }`}
                >
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    {asset.thumbnail ? (
                      <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {asset.type === 'video' ? <Video className="w-10 h-10" /> :
                          asset.type === 'pdf' ? <FileText className="w-10 h-10" /> :
                            <File className="w-10 h-10" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white rounded-lg text-slate-900 shadow-xl hover:scale-110 transition-transform"><Download className="w-4 h-4" /></button>
                      <button className="p-2 bg-white rounded-lg text-slate-900 shadow-xl hover:scale-110 transition-transform"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{asset.name}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{asset.size} • {asset.type}</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Used in {asset.usageCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modified</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {asset.type === 'video' ? <Video className="w-4 h-4 text-red-500" /> :
                            asset.type === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-500" /> :
                              <FileText className="w-4 h-4 text-blue-500" />}
                          <span className="text-sm font-bold text-slate-700">{asset.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">{asset.size}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{asset.type}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{asset.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel Sidebar */}
        <div className="col-span-3">
          {selectedAsset ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-8 space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Asset Details</h3>
                <button onClick={() => setSelectedAssetId(null)} className="text-slate-300 hover:text-slate-500"><Plus className="w-4 h-4 rotate-45" /></button>
              </div>

              <div className="aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                {selectedAsset.thumbnail ? (
                  <img src={selectedAsset.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300 bg-slate-100">
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-xs font-medium">No Visual Preview</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 truncate">{selectedAsset.name}</h4>
                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">{selectedAsset.size} • {selectedAsset.type}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Date Modified</span>
                  <span className="text-slate-900 font-bold">{selectedAsset.date}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Usage</span>
                  <span className="text-blue-600 font-bold">Used in {selectedAsset.usageCount} Lessons</span>
                </div>
              </div>

              <div className="space-y-2 pt-6">
                <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Download Asset
                </button>
                <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" /> Open in Full View
                </button>
                <button className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Asset
                </button>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mt-4 flex gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-[10px] text-blue-600 leading-relaxed italic">
                  Deleting this asset will break references in {selectedAsset.usageCount} lesson blocks.
                  Proceed with caution.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center sticky top-8">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                <File className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-500">No Asset Selected</h3>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Select a file from the library to view detailed metadata and usage history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
