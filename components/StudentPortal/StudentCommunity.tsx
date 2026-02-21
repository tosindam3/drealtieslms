import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Send,
    ExternalLink,
    Users,
    Search,
    MoreVertical,
    MessageCircle,
    Globe,
    CheckCircle2,
    Loader2,
    Clock,
    User,
    ArrowRight
} from 'lucide-react';
import { apiClient, normalizeUrl } from '../../lib/apiClient';

interface Discussion {
    id: string;
    content: string;
    user: {
        id: string;
        name: string;
        avatar_url?: string;
    };
    created_at: string;
    replies?: Discussion[];
    is_instructor_only: boolean;
    is_resolved: boolean;
}

interface StudentCommunityProps {
    user: any;
}

export const StudentCommunity: React.FC<StudentCommunityProps> = ({ user }) => {
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [links, setLinks] = useState<{ telegram?: string; discord?: string; whatsapp?: string }>({});
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [activeCohort, setActiveCohort] = useState<string>('');
    const [replyTo, setReplyTo] = useState<Discussion | null>(null);

    const fetchCommunityData = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/community');
            if (response && response.community_links) {
                setLinks(response.community_links);
                setDiscussions(response.discussions.data || []);
                setActiveCohort(response.cohort_name || 'Your Cohort');
            }
        } catch (err) {
            console.error("Failed to fetch community data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunityData();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            const payload = {
                content: newMessage,
                parent_id: replyTo?.id || null,
            };

            const response = await apiClient.post('/api/community/discussions', payload);
            if (response && response.discussion) {
                // Play notification sound (High-quality notification pop)
                const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3');
                audio.volume = 0.5;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Autoplay was prevented
                        console.log("Sound play prevented");
                    });
                }

                if (replyTo) {
                    // Update discussions locally to show the reply
                    setDiscussions(prev => prev.map(d => {
                        if (d.id === replyTo.id) {
                            return { ...d, replies: [...(d.replies || []), response.discussion] };
                        }
                        return d;
                    }));
                } else {
                    setDiscussions(prev => [response.discussion, ...prev]);
                }
                setNewMessage('');
                setReplyTo(null);
            }
        } catch (err) {
            console.error("Failed to post message:", err);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] animate-pulse">
                <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Initializing Connection...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header with Hero-like feel */}
            <div className="mb-12 lg:mb-20">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                            <Globe className="w-3 h-3" />
                            Live Connectivity • {activeCohort}
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">Community Hub</h1>
                        <p className="text-slate-500 text-sm font-bold mt-4 uppercase italic tracking-widest opacity-80 max-w-xl leading-relaxed">
                            Connect with your institutional peers, engage in critical market discussions, and access direct mentorship channels.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {links.telegram && (
                            <SocialButton icon="telegram" url={links.telegram} />
                        )}
                        {links.discord && (
                            <SocialButton icon="discord" url={links.discord} />
                        )}
                        {links.whatsapp && (
                            <SocialButton icon="whatsapp" url={links.whatsapp} />
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Discussion Feed */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37]" />
                                <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">Community Discussions</h2>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    type="text"
                                    placeholder="Search discussions..."
                                    className="bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-[#D4AF37]/40 w-full sm:w-64"
                                />
                            </div>
                        </div>

                        <div className="space-y-8">
                            {discussions.length > 0 ? (
                                discussions.map(discussion => (
                                    <DiscussionItem
                                        key={discussion.id}
                                        discussion={discussion}
                                        onReply={(d) => {
                                            setReplyTo(d);
                                            document.getElementById('message-input')?.focus();
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                        <MessageSquare className="w-8 h-8 text-slate-700" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-500 uppercase italic tracking-tighter">No active discussions</h3>
                                    <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest mt-2 italic">Start the conversation by posting a message.</p>
                                </div>
                            )}
                        </div>

                        <div className="absolute top-0 right-0 w-1/4 h-full bg-gradient-to-l from-[#D4AF37]/5 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Post Message Box */}
                    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl ring-1 ring-white/5 relative group">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="shrink-0">
                                <img
                                    src={normalizeUrl(user?.avatar_url) || `https://i.pravatar.cc/150?u=${user?.id || 'default'}`}
                                    alt="You"
                                    className="w-10 h-10 rounded-xl border border-white/10 ring-2 ring-[#D4AF37]/20 object-cover"
                                />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">New Post</h3>
                        </div>

                        <form onSubmit={handleSendMessage} className="space-y-6">
                            {replyTo && (
                                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Replying to {replyTo.user.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate max-w-[200px] italic">{replyTo.content}</p>
                                    </div>
                                    <button type="button" onClick={() => setReplyTo(null)} className="text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest">Cancel</button>
                                </div>
                            )}

                            <textarea
                                id="message-input"
                                name="content"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Compose your message..."
                                className="w-full bg-black/60 border border-white/5 rounded-2xl p-6 text-[12px] font-medium text-slate-300 outline-none focus:border-[#D4AF37]/40 min-h-[150px] resize-none transition-all placeholder:text-slate-700 font-mono tracking-tight"
                                required
                            />

                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="w-full py-5 bg-[#D4AF37] hover:bg-[#B8962E] text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#D4AF37]/10 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {sending ? 'Posting...' : 'Post Message'}
                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </form>
                    </div>

                    {/* Institutional Support CTA */}
                    <div
                        onClick={() => {
                            if ((window as any).Tawk_API) {
                                (window as any).Tawk_API.toggle();
                            } else {
                                window.open('mailto:support@drealtiesfx.com', '_blank');
                            }
                        }}
                        className="bg-[#D4AF37] rounded-[2.5rem] p-10 text-black shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all"
                    >
                        <div className="relative z-10">
                            <MessageCircle className="w-10 h-10 text-black/40 mb-6" />
                            <h3 className="text-2xl font-black mb-3 italic tracking-tight uppercase leading-none">Instructor<br />Direct Support</h3>
                            <p className="text-black/70 text-[10px] font-black uppercase leading-relaxed mb-10 tracking-widest">
                                Priority access to mentor assistance for complex technical challenges.
                            </p>
                            <button className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] group/btn">
                                Initiate Mentorship <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 rounded-full group-hover:scale-125 transition-transform duration-1000"></div>
                    </div>

                    {/* Guidelines / FAQ */}
                    <div className="bg-black/20 border border-white/5 rounded-[2.5rem] p-8 shadow-inner">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Community Rules</h3>
                        <ul className="space-y-4">
                            <ProtocolItem text="Maintain high professional standards" />
                            <ProtocolItem text="Zero tolerance for toxic behavior" />
                            <ProtocolItem text="Critical analysis before posting" />
                            <ProtocolItem text="Respect intellectual property" />
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialButton: React.FC<{ icon: 'telegram' | 'discord' | 'whatsapp'; url: string }> = ({ icon, url }) => {
    const getColors = () => {
        switch (icon) {
            case 'telegram': return 'bg-[#0088cc]/10 text-[#0088cc] border-[#0088cc]/20';
            case 'discord': return 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20';
            case 'whatsapp': return 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20';
        }
    };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-6 py-3 rounded-2xl border ${getColors()} flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg`}
        >
            <ExternalLink className="w-4 h-4" />
            Join {icon}
        </a>
    );
}

const DiscussionItem: React.FC<{ discussion: Discussion; onReply: (d: Discussion) => void }> = ({ discussion, onReply }) => {
    const [showReplies, setShowReplies] = useState(false);

    return (
        <div className="group/item relative">
            <div className="flex gap-6">
                <div className="shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#161b22] border border-white/5 overflow-hidden ring-2 ring-transparent group-hover/item:ring-[#D4AF37]/30 transition-all">
                        <img
                            src={normalizeUrl(discussion.user.avatar_url) || `https://i.pravatar.cc/150?u=${discussion.user.id || 'default'}`}
                            alt={discussion.user.name}
                            className="w-full h-full object-cover transition-all duration-700"
                        />
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white uppercase tracking-widest">{discussion.user.name}</span>
                            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {new Date(discussion.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        {discussion.is_resolved && (
                            <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                        )}
                    </div>
                    <p className="text-[13px] text-slate-400 leading-relaxed font-medium italic opacity-90 group-hover/item:text-slate-200 transition-colors">
                        {discussion.content}
                    </p>
                    <div className="flex items-center gap-6 pt-2">
                        <button
                            onClick={() => onReply(discussion)}
                            className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-[#D4AF37] transition-all flex items-center gap-2"
                        >
                            Reply
                        </button>
                        {discussion.replies && discussion.replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2"
                            >
                                {showReplies ? 'Hide' : 'Show'} {discussion.replies.length} Replies
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showReplies && discussion.replies && (
                <div className="mt-8 ml-10 pl-10 border-l border-white/5 space-y-8 animate-in slide-in-from-left-2 duration-500">
                    {discussion.replies.map(reply => (
                        <div key={reply.id} className="flex gap-4">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-white/5">
                                <img
                                    src={normalizeUrl(reply.user.avatar_url) || `https://i.pravatar.cc/150?u=${reply.user.id || 'default'}`}
                                    alt={reply.user.name}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{reply.user.name}</span>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter opacity-50">• {new Date(reply.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 italic leading-relaxed">{reply.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const ProtocolItem: React.FC<{ text: string }> = ({ text }) => (
    <li className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest group cursor-default">
        <div className="w-1.5 h-1.5 bg-[#D4AF37]/20 rounded-full group-hover:bg-[#D4AF37] transition-all" />
        <span className="group-hover:text-slate-400 transition-colors">{text}</span>
    </li>
)
