import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Undo,
    Redo,
    Type,
    Maximize,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Highlighter,
    Underline as UnderlineIcon,
    Palette,
    Image as ImageIcon,
    Link as LinkIcon,
    Table as TableIcon
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt('Enter image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const url = window.prompt('Enter URL');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800 bg-[#121214] rounded-t-2xl">
            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    icon={Bold}
                    title="Bold"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    icon={Italic}
                    title="Italic"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    icon={UnderlineIcon}
                    title="Underline"
                />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    icon={Heading1}
                    title="Heading 1"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    icon={Heading2}
                    title="Heading 2"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    icon={Heading3}
                    title="Heading 3"
                />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    icon={List}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    icon={ListOrdered}
                    title="Ordered List"
                />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    icon={AlignLeft}
                    title="Align Left"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    icon={AlignCenter}
                    title="Align Center"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    icon={AlignRight}
                    title="Align Right"
                />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    icon={Quote}
                    title="Blockquote"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    active={editor.isActive('highlight')}
                    icon={Highlighter}
                    title="Highlight"
                />
                <ToolbarButton
                    onClick={setLink}
                    active={editor.isActive('link')}
                    icon={LinkIcon}
                    title="Link"
                />
                <ToolbarButton
                    onClick={addImage}
                    icon={ImageIcon}
                    title="Add Image"
                />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    icon={TableIcon}
                    title="Insert Table"
                />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-800 pr-1 py-1">
                <select
                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    className="bg-black/40 border border-slate-800 rounded px-2 py-1 text-[10px] font-black text-[#D4AF37] outline-none"
                >
                    <option value="#FFFFFF">White</option>
                    <option value="#D4AF37">Gold</option>
                    <option value="#94A3B8">Slate</option>
                    <option value="#EF4444">Red</option>
                    <option value="#10B981">Emerald</option>
                </select>
            </div>

            <div className="flex items-center gap-1 ml-auto py-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon={Undo}
                    title="Undo"
                    disabled={!editor.can().undo()}
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon={Redo}
                    title="Redo"
                    disabled={!editor.can().redo()}
                />
            </div>
        </div>
    );
};

const ToolbarButton = ({ onClick, active, icon: Icon, title, disabled }: any) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-2 rounded-lg transition-all ${active
            ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]'
            : 'text-slate-500 hover:text-[#D4AF37] hover:bg-white/5 border border-transparent'
            } ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
    >
        <Icon className="w-4 h-4" />
    </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: true,
            }),
            TextStyle,
            Color,
            Underline,
            Image.configure({
                allowBase64: true,
            }),
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#D4AF37] underline decoration-[#D4AF37]/50 underline-offset-4 hover:text-white transition-all',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-fixed w-full border border-slate-800 rounded-lg overflow-hidden my-6',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none min-h-[300px] outline-none p-6 text-slate-300 font-medium leading-relaxed custom-scrollbar',
            },
        },
    });

    // Update content when it changes externally (e.g. from state)
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="w-full bg-[#0a0a0b] border border-slate-800 rounded-2xl shadow-inner focus-within:border-[#D4AF37]/40 transition-all overflow-hidden flex flex-col">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto max-h-[500px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
