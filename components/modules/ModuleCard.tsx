
import React from 'react';
import { GripVertical, Edit3, Trash2, Box, Layers, Image as ImageIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Module } from '../../types';
import { normalizeUrl } from '../../lib/apiClient';

interface ModuleCardProps {
  module: Module;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onEdit, onClone, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#121214] border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-700 transition-all ${isDragging ? 'shadow-2xl ring-1 ring-[#D4AF37]/30' : 'shadow-sm'}`}
    >
      <div className="flex items-center">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-4 cursor-grab text-slate-700 hover:text-slate-400 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Thumbnail Preview */}
        <div className="w-20 h-14 bg-slate-900 border-x border-slate-800 shrink-0 flex items-center justify-center relative overflow-hidden">
          {module.thumbnailUrl ? (
            <img 
              src={normalizeUrl(module.thumbnailUrl)} 
              className="w-full h-full object-cover" 
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          {!module.thumbnailUrl && <ImageIcon className="w-5 h-5 text-slate-800" />}
          <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Content */}
        <div className="flex-1 px-6">
          <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">
            {module.title}
          </h4>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> {module.lessons?.length || 0} Lessons
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-800" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Position: {module.position}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            title="Edit Module"
            className="p-2 text-slate-500 hover:text-[#D4AF37] hover:bg-white/5 rounded-lg transition-all"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onClone}
            title="Clone Module"
            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete Module"
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
