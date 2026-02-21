import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon, Download, Share2 } from 'lucide-react';
import { normalizeUrl } from '../../lib/apiClient';

interface Photo {
  id: string;
  url: string;
  caption?: string;
}

interface TopicPhotoBlockProps {
  images: Photo[];
}

export const TopicPhotoBlock: React.FC<TopicPhotoBlockProps> = ({ images }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % images.length);
  }, [selectedIndex, images.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
  }, [selectedIndex, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Label */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
            <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Institutional Asset Matrix</h4>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Reference Gallery • {images.length} Items</p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-square rounded-[2rem] overflow-hidden border border-white/5 bg-[#121214] cursor-pointer hover:border-[#D4AF37]/40 transition-all duration-500 shadow-2xl"
          >
            {/* Image Component */}
            <img
              src={normalizeUrl(image.url) || `https://picsum.photos/seed/${image.id}/800/800`}
              alt={image.caption || "Gallery Image"}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />

            {/* Interactive Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1 italic">Authorized Asset</p>
                  <p className="text-xs font-bold text-white truncate">
                    {image.caption || `IMG_REF_${index + 1}`}
                  </p>
                </div>
                <div className="p-3 bg-[#D4AF37] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform">
                  <Maximize2 className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>

            {/* Metadata Badge */}
            <div className="absolute top-6 left-6 opacity-40 group-hover:opacity-100 transition-opacity">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                ID: {typeof image.id === 'string' ? image.id.toUpperCase().slice(0, 8) : 'ASSET'}
              </span>
            </div>

            {/* Aesthetic Scanline effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
          </div>
        ))}
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="absolute inset-0 bg-[#07070A]/98 backdrop-blur-3xl" />

          {/* Top Controls */}
          <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Intelligence Viewer</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Asset {selectedIndex + 1} of {images.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedIndex(null)}
                className="p-4 bg-white/5 hover:bg-red-500/20 rounded-2xl border border-white/10 text-slate-400 hover:text-red-500 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={handlePrev}
            className="absolute left-10 top-1/2 -translate-y-1/2 p-6 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-all group z-10 hidden md:block"
          >
            <ChevronLeft className="w-10 h-10 group-hover:-translate-x-2 transition-transform" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-6 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-all group z-10 hidden md:block"
          >
            <ChevronRight className="w-10 h-10 group-hover:translate-x-2 transition-transform" />
          </button>

          {/* Main Content Area */}
          <div
            className="relative w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full max-h-[80vh] relative rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(212,175,55,0.15)] group/viewer">
              <img
                src={normalizeUrl(images[selectedIndex].url) || `https://picsum.photos/seed/${images[selectedIndex].id}/1200/1200`}
                alt={images[selectedIndex].caption}
                className="w-full h-full object-contain bg-black/40 animate-in zoom-in-95 duration-500"
              />

              {/* Floating Caption */}
              {images[selectedIndex].caption && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8">
                  <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl text-center space-y-2">
                    <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.5em] italic">Annotated Analysis</span>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">
                      {images[selectedIndex].caption}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Dots */}
            <div className="mt-12 flex items-center gap-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${selectedIndex === i ? 'w-12 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'w-3 bg-white/10 hover:bg-white/20'}`}
                />
              ))}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-white/20 text-[9px] font-black uppercase tracking-[0.5em]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>Terminal Secure View</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>Revision 4.2-A</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span>DFX-CORE-LOG</span>
          </div>
        </div>
      )}
    </div>
  );
};
