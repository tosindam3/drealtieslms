import React from 'react';
import { normalizeUrl } from '../../lib/apiClient';

interface RichTextRendererProps {
    content: string;
    className?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = "" }) => {
    if (!content) return null;

    // Normalize images in HTML content
    const normalizedContent = content.replace(
        /<img\s+[^>]*src="([^"]+)"[^>]*>/g,
        (match, src) => {
            if (src.startsWith('http') || src.startsWith('data:')) return match;
            return match.replace(src, normalizeUrl(src));
        }
    );

    return (
        <div
            className={`prose prose-invert max-w-none leading-relaxed text-slate-300 font-medium 
        prose-h1:text-4xl prose-h1:font-black prose-h1:italic prose-h1:tracking-tighter prose-h1:uppercase prose-h1:text-white
        prose-h2:text-3xl prose-h2:font-black prose-h2:italic prose-h2:tracking-tighter prose-h2:uppercase prose-h2:text-white
        prose-h3:text-xl prose-h3:font-black prose-h3:uppercase prose-h3:text-white/80
        prose-p:text-lg prose-p:text-slate-400
        prose-strong:text-[#D4AF37] prose-strong:font-black
        prose-ul:space-y-2 prose-ol:space-y-2
        prose-li:text-slate-400
        prose-blockquote:border-[#D4AF37] prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:rounded-2xl prose-blockquote:italic
        prose-img:rounded-3xl prose-img:border prose-img:border-slate-800 prose-img:shadow-2xl
        ${className}`}
            dangerouslySetInnerHTML={{ __html: normalizedContent }}
        />
    );
};
