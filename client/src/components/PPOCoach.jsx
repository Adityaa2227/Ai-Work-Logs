import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { Brain, Send, User, ChevronUp, ChevronDown, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const PPOCoach = () => {
    const { selectedCompany } = useCompany();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);

    const { data: history = [], isLoading } = useQuery({
        queryKey: ['ppo-history', selectedCompany?._id],
        queryFn: async () => {
            const res = await api.get(`/ppo/history?company=${selectedCompany._id}`);
            return res.data;
        },
        enabled: !!selectedCompany
    });

    const mutation = useMutation({
        mutationFn: async (msg) => {
            const res = await api.post('/ppo/message', { company: selectedCompany._id, message: msg });
            return res.data;
        },
        onMutate: async (newMsg) => {
            await queryClient.cancelQueries(['ppo-history', selectedCompany?._id]);
            const previous = queryClient.getQueryData(['ppo-history', selectedCompany?._id]);
            if (newMsg) {
                queryClient.setQueryData(['ppo-history', selectedCompany?._id], old => [...(old || []), { _id: 'temp', role: 'user', content: newMsg }]);
            }
            return { previous };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ppo-history', selectedCompany?._id]);
        },
        onError: (err, newMsg, context) => {
            if (err.response?.data?.quotaSafeguard) {
                toast.info(err.response.data.message || 'Coach response was safely queued.');
                queryClient.invalidateQueries(['ppo-history', selectedCompany?._id]);
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to communicate with coach');
            queryClient.setQueryData(['ppo-history', selectedCompany?._id], context.previous);
        }
    });

    useEffect(() => {
        if (messagesEndRef.current && isExpanded) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history, isExpanded]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() && !history.length) return;
        
        mutation.mutate(message);
        setMessage('');
    };

    if (!selectedCompany) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isExpanded && (
                <div className="bg-card border border-teal-500/30 rounded-2xl shadow-2xl mb-4 w-80 md:w-96 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="bg-teal-500/10 border-b border-teal-500/20 p-4 flex items-center gap-3">
                        <div className="bg-teal-500/20 p-2 rounded-xl">
                            <Trophy className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                                PPO Coach <Sparkles className="w-3 h-3" />
                            </h3>
                            <p className="text-[10px] text-muted">Daily AI Mentorship & Tracking</p>
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto max-h-96 space-y-4 bg-zinc-950/50">
                        {history.length === 0 && !mutation.isPending && (
                            <div className="text-center text-muted text-xs p-4">
                                No history yet. Click below to start your first daily review!
                            </div>
                        )}
                        
                        {history.map((msg, idx) => (
                            <div key={msg._id || idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-teal-500/20 text-teal-400'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                                </div>
                                <div className={`p-3 rounded-xl text-xs max-w-[80%] whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'bg-indigo-500/10 text-slate-300 rounded-tr-none' : 'bg-teal-500/10 text-teal-50 rounded-tl-none border border-teal-500/20'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {mutation.isPending && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 animate-pulse">
                                    <Brain className="w-4 h-4 text-teal-400" />
                                </div>
                                <div className="p-3 rounded-xl bg-teal-500/10 rounded-tl-none flex items-center gap-2 border border-teal-500/20 w-16">
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-75" />
                                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t border-teal-500/20 bg-card/50 flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={history.length === 0 ? "Click send to get daily review..." : "Tell coach what extra you did..."}
                            className="flex-1 bg-zinc-900/50 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 placeholder:text-muted"
                        />
                        <button
                            type="submit"
                            disabled={mutation.isPending || (!message.trim() && history.length > 0)}
                            className="bg-teal-500 text-slate-950 p-2 rounded-xl hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full font-bold shadow-lg shadow-teal-500/20 transition-all ${isExpanded ? 'bg-card border border-teal-500/30 text-teal-400' : 'bg-teal-500 text-slate-950 hover:bg-teal-400'}`}
            >
                <Trophy className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">{isExpanded ? 'Close Coach' : 'PPO Coach'}</span>
                {isExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
            </button>
        </div>
    );
};

export default PPOCoach;
