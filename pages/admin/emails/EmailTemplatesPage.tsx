
import React, { useState, useEffect } from 'react';
import {
    Mail,
    Save,
    Send,
    Users,
    Info,
    Search,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Palette,
    Plus,
    Trash,
    X,
    RefreshCcw,
    Edit3,
    Image as ImageIcon,
    MousePointer2,
    Type as TypeIcon
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useToast } from '../../../lib/ToastContext';
import { RichTextEditor } from '../../../components/common/RichTextEditor';

interface EmailTemplate {
    id: number;
    slug: string;
    name: string;
    subject: string;
    body: string;
    placeholders: string[];
    settings?: {
        header_color?: string;
        logo_url?: string;
        show_button?: boolean;
        button_label?: string;
        button_url?: string;
        button_color?: string;
        button_text_color?: string;
        footer_disclaimer?: string;
    };
}

interface EmailTemplatesPageProps {
    isNested?: boolean;
}

export const EmailTemplatesPage: React.FC<EmailTemplatesPageProps> = ({ isNested = false }) => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestSending, setIsTestSending] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [newTemplate, setNewTemplate] = useState({
        slug: '',
        name: '',
        subject: 'New Template Subject',
        body: '<p>New Template Body</p>',
        placeholders: ['user_name', 'app_name']
    });
    const { addToast } = useToast();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const data = await apiClient.get('/api/admin/email-templates');
            setTemplates(data.templates);
            if (data.templates.length > 0 && !selectedTemplate) {
                setSelectedTemplate(data.templates[0]);
            }
        } catch (err: any) {
            addToast({
                title: 'Fetch Failed',
                description: err.message || 'Could not load email templates.',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        try {
            await apiClient.put(`/api/admin/email-templates/${selectedTemplate.slug}`, {
                slug: selectedTemplate.slug,
                name: selectedTemplate.name,
                subject: selectedTemplate.subject,
                body: selectedTemplate.body,
                settings: selectedTemplate.settings,
                placeholders: selectedTemplate.placeholders
            });
            addToast({ title: 'Template Saved', description: 'Changes have been committed to the database.', type: 'success' });
            // Update local list
            setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));
        } catch (err: any) {
            addToast({ title: 'Save Failed', description: err.message || 'Could not save template.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        if (!newTemplate.slug || !newTemplate.name) {
            addToast({ title: 'Validation Error', description: 'Slug and Name are required.', type: 'error' });
            return;
        }
        setIsCreating(true);
        try {
            const data = await apiClient.post('/api/admin/email-templates', newTemplate);
            addToast({ title: 'Template Created', description: 'Next configuration phase active.', type: 'success' });
            setTemplates(prev => [...prev, data.template]);
            setSelectedTemplate(data.template);
            setShowCreateModal(false);
            setNewTemplate({
                slug: '',
                name: '',
                subject: 'New Template Subject',
                body: '<p>New Template Body</p>',
                placeholders: ['user_name', 'app_name']
            });
        } catch (err: any) {
            addToast({ title: 'Creation Failed', description: err.message || 'Could not create template.', type: 'error' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;
        if (!window.confirm(`Are you sure you want to delete "${selectedTemplate.name}"? This will break any logic relying on the slug "${selectedTemplate.slug}".`)) return;

        setIsDeleting(true);
        try {
            await apiClient.delete(`/api/admin/email-templates/${selectedTemplate.slug}`);
            addToast({ title: 'Template Removed', description: 'The template has been decommissioned.', type: 'success' });
            const updatedTemplates = templates.filter(t => t.id !== selectedTemplate.id);
            setTemplates(updatedTemplates);
            setSelectedTemplate(updatedTemplates.length > 0 ? updatedTemplates[0] : null);
        } catch (err: any) {
            addToast({ title: 'Deletion Failed', description: err.message || 'Could not delete template.', type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleTestSend = async () => {
        if (!selectedTemplate || !testEmail) return;
        setIsTestSending(true);
        try {
            await apiClient.post(`/api/admin/email-templates/${selectedTemplate.slug}/test`, {
                email: testEmail
            });
            addToast({ title: 'Test Sent', description: `Template rendered and sent to ${testEmail}`, type: 'success' });
        } catch (err: any) {
            addToast({ title: 'Test Failed', description: err.message || 'Test email could not be sent.', type: 'error' });
        } finally {
            setIsTestSending(false);
        }
    };

    const handleBroadcast = async () => {
        if (!selectedTemplate) return;
        if (!window.confirm(`Are you sure you want to broadcast "${selectedTemplate.name}" to ALL active students? This action cannot be undone.`)) return;

        setIsBroadcasting(true);
        try {
            const response = await apiClient.post(`/api/admin/email-templates/${selectedTemplate.slug}/broadcast`, {});
            addToast({
                title: 'Broadcast Initialized',
                description: response.message || `Successfully executed broadcast for students.`,
                type: 'success'
            });
        } catch (err: any) {
            addToast({ title: 'Broadcast Failed', description: err.message || 'Broadcast could not be initialized.', type: 'error' });
        } finally {
            setIsBroadcasting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0d1117]">
                <div className="flex flex-col items-center gap-6">
                    <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em]">Loading Email Templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex-1 flex flex-col overflow-hidden bg-[#0d1117] ${isNested ? 'bg-transparent' : ''}`}>
            {/* HEADER */}
            {!isNested && (
                <header className="h-40 px-12 flex flex-col justify-center border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Automated Communications</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
                            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                            <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Email System Active</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Email Templates</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Architecting institutional messaging and automated workflows.</p>
                        </div>
                        <div className="flex gap-4">
                            {selectedTemplate && (
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-3 px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash className="w-5 h-5" />}
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !selectedTemplate}
                                className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-2lx shadow-[#D4AF37]/10 hover:bg-[#B8962E] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Template
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* TEMPLATE LIST */}
                <aside className={`w-80 border-r border-white/5 bg-[#121214] p-8 flex flex-col ${isNested ? 'bg-transparent' : ''}`}>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 pl-4">Template Catalog</p>
                    <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pb-20">
                        {templates.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${selectedTemplate?.id === t.id
                                    ? 'bg-white/5 text-white border border-white/10 shadow-lg'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <Mail className={`w-4 h-4 ${selectedTemplate?.id === t.id ? 'text-[#D4AF37]' : 'text-slate-600 group-hover:text-slate-400'}`} />
                                    <div className="text-left">
                                        <span className="text-[10px] font-black uppercase tracking-widest block">{t.name}</span>
                                        <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">Event Key: {t.slug}</span>
                                    </div>
                                </div>
                                {selectedTemplate?.id === t.id && <ChevronRight className="w-4 h-4 text-[#D4AF37]" />}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-6 flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:bg-white/10 hover:border-[#D4AF37]/50 transition-all group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        New Template
                    </button>
                </aside>

                {/* EDITOR AREA */}
                <div className={`flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/20 ${isNested ? 'p-8' : ''}`}>
                    {isNested && (
                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <Mail className="w-8 h-8 text-[#D4AF37]" />
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Notification Settings</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customizing Course & Enrollment Emails</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !selectedTemplate}
                                className="flex items-center gap-3 px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#B8962E] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Template
                            </button>
                        </div>
                    )}
                    {selectedTemplate ? (
                        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">

                            {/* SUBJECT & METADATA */}
                            <section className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1 bg-[#D4AF37]" />
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Email Header Details</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Display Name</label>
                                            <input
                                                type="text"
                                                value={selectedTemplate.name}
                                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-xs font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Event Key (Slug)</label>
                                            <input
                                                type="text"
                                                value={selectedTemplate.slug}
                                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, slug: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 px-6 py-4 rounded-2xl text-xs font-mono text-blue-400 outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Subject Line</label>
                                        <input
                                            type="text"
                                            value={selectedTemplate.subject}
                                            onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 px-8 py-5 rounded-2xl text-base font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner transition-all"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-4 h-4 text-[#D4AF37]" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Available Placeholders</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const p = prompt("Enter new placeholder name:");
                                                    if (p && !selectedTemplate.placeholders.includes(p)) {
                                                        setSelectedTemplate({ ...selectedTemplate, placeholders: [...selectedTemplate.placeholders, p] });
                                                    }
                                                }}
                                                className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest hover:underline"
                                            >
                                                Add Placeholder
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTemplate.placeholders.map((p) => (
                                                <div key={p} className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded text-[10px] font-mono text-[#D4AF37]">
                                                    {`{{${p}}}`}
                                                    <button onClick={() => setSelectedTemplate({ ...selectedTemplate, placeholders: selectedTemplate.placeholders.filter(x => x !== p) })}>
                                                        <X className="w-3 h-3 text-red-400 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* BODY EDITOR */}
                            <section className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1 bg-blue-500" />
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Email Body Content</h3>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-b from-[#D4AF37]/20 to-transparent rounded-[2.5rem] blur opacity-50 transition-opacity duration-1000" />
                                    <RichTextEditor
                                        content={selectedTemplate.body}
                                        onChange={(content) => setSelectedTemplate({ ...selectedTemplate, body: content })}
                                        placeholder="Describe the mission parameters..."
                                    />
                                </div>
                            </section>

                            {/* LAYOUT SETTINGS */}
                            <section className="space-y-10 pt-12 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1 bg-emerald-500" />
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-widest">Layout & Branding</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* HEADER CONFIG */}
                                    <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2rem] space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                                <Palette className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Header Styling</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Accent Color</label>
                                                <div className="flex gap-4">
                                                    <input
                                                        type="color"
                                                        className="w-12 h-12 rounded-xl bg-black/40 border border-white/5 p-1 cursor-pointer"
                                                        value={selectedTemplate.settings?.header_color || '#0d1117'}
                                                        onChange={(e) => setSelectedTemplate({
                                                            ...selectedTemplate,
                                                            settings: { ...selectedTemplate.settings, header_color: e.target.value }
                                                        })}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-black/40 border border-white/5 px-4 rounded-xl text-xs font-mono text-slate-300"
                                                        value={selectedTemplate.settings?.header_color || '#0d1117'}
                                                        onChange={(e) => setSelectedTemplate({
                                                            ...selectedTemplate,
                                                            settings: { ...selectedTemplate.settings, header_color: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Academy Logo (URL)</label>
                                                <div className="relative">
                                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        placeholder="https://cloud.storage/logo.png"
                                                        className="w-full bg-black/40 border border-white/5 px-12 py-4 rounded-xl text-xs text-white"
                                                        value={selectedTemplate.settings?.logo_url || ''}
                                                        onChange={(e) => setSelectedTemplate({
                                                            ...selectedTemplate,
                                                            settings: { ...selectedTemplate.settings, logo_url: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTION TRIGGER CONFIG */}
                                    <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2rem] space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                                    <MousePointer2 className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Call to Action Button</h4>
                                            </div>
                                            <button
                                                onClick={() => setSelectedTemplate({
                                                    ...selectedTemplate,
                                                    settings: { ...selectedTemplate.settings, show_button: !selectedTemplate.settings?.show_button }
                                                })}
                                                className={`w-12 h-6 rounded-full relative transition-all ${selectedTemplate.settings?.show_button ? 'bg-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedTemplate.settings?.show_button ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className={`space-y-4 transition-all duration-300 ${selectedTemplate.settings?.show_button ? 'opacity-100 scale-100' : 'opacity-30 scale-95 pointer-events-none grayscale'}`}>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Call Label</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-xl text-xs text-white"
                                                        value={selectedTemplate.settings?.button_label || 'Get Started'}
                                                        onChange={(e) => setSelectedTemplate({
                                                            ...selectedTemplate,
                                                            settings: { ...selectedTemplate.settings, button_label: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Color Sync</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            className="w-10 h-10 rounded-lg bg-black/40 border border-white/5 p-0.5 cursor-pointer"
                                                            value={selectedTemplate.settings?.button_color || '#D4AF37'}
                                                            onChange={(e) => setSelectedTemplate({
                                                                ...selectedTemplate,
                                                                settings: { ...selectedTemplate.settings, button_color: e.target.value }
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Navigation Path (URL)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-xl text-xs text-white"
                                                    placeholder="https://academy.pro/dashboard"
                                                    value={selectedTemplate.settings?.button_url || ''}
                                                    onChange={(e) => setSelectedTemplate({
                                                        ...selectedTemplate,
                                                        settings: { ...selectedTemplate.settings, button_url: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DISCLAIMER / FOOTER */}
                                <div className="bg-[#161b22] border border-white/5 p-8 rounded-[2rem] space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-500/10 rounded-xl">
                                            <TypeIcon className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Email Footer</h4>
                                    </div>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/5 px-8 py-6 rounded-2xl text-[11px] font-bold text-slate-400 outline-none focus:border-slate-500/40 italic"
                                        placeholder="Institutional disclaimer, security warnings, and compliance text..."
                                        value={selectedTemplate.settings?.footer_disclaimer || ''}
                                        onChange={(e) => setSelectedTemplate({
                                            ...selectedTemplate,
                                            settings: { ...selectedTemplate.settings, footer_disclaimer: e.target.value }
                                        })}
                                    />
                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest text-right">Standard copyright footer will be appended automatically.</p>
                                </div>
                            </section>

                            {/* ACTIONS BEYOND SAVE */}
                            <section className="grid md:grid-cols-2 gap-8 pt-12 border-t border-white/5">
                                {/* TEST SYSTEM */}
                                <div className="bg-[#161b22] border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                                            <Send className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Send Test Email</h4>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                            Deploy a single rendering to a verified email address for visual audit.
                                        </p>
                                        <div className="flex gap-4">
                                            <input
                                                type="email"
                                                placeholder="test@drealtiesfx.com"
                                                value={testEmail}
                                                onChange={(e) => setTestEmail(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/5 px-6 py-4 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500/50"
                                            />
                                            <button
                                                onClick={handleTestSend}
                                                disabled={isTestSending || !testEmail}
                                                className="px-8 py-4 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                                            >
                                                {isTestSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ping'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                                </div>

                                {/* BROADCAST SYSTEM */}
                                <div className="bg-[#161b22] border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-red-500/10 rounded-2xl">
                                            <Users className="w-5 h-5 text-red-400" />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Broadcast to All Students</h4>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                            Execute global broadcast to all authorized academy participants via the queue engine.
                                        </p>
                                        <button
                                            onClick={handleBroadcast}
                                            disabled={isBroadcasting}
                                            className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Initialize Broadcast'}
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[60px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                                </div>
                            </section>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30">
                            <Mail className="w-20 h-20 text-slate-500" />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.5em]">Select a template to start editing</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
                    <div className="w-full max-w-xl bg-[#161b22] border border-white/10 rounded-[3rem] p-12 space-y-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl">
                                    <Mail className="w-6 h-6 text-[#D4AF37]" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Initialize Template</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Constructing New Communication Protocol</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-3">Template Identity (Name)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Welcome Email"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-sm font-black text-white outline-none focus:border-[#D4AF37]/40 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-3">Event Binding Key (Slug)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. student-welcomed"
                                    value={newTemplate.slug}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    className="w-full bg-black/40 border border-white/5 px-6 py-4 rounded-2xl text-xs font-mono text-[#D4AF37] outline-none focus:border-[#D4AF37]/40 shadow-inner"
                                />
                                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1 pl-3 italic">Use this key in system event listeners.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-4 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all"
                            >
                                Abort Initialization
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isCreating || !newTemplate.name || !newTemplate.slug}
                                className="flex-1 py-4 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#B8962E] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Commit Protocol
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
