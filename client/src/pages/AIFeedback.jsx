import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLatestFeedback, generateFeedback } from '../services/feedbackService';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { 
    Brain, Sparkles, RefreshCw, Terminal, ArrowLeft, 
    Shield, Code, AlertTriangle, Lightbulb, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AIFeedback = () => {
    const { selectedCompany } = useCompany();
    const queryClient = useQueryClient();

    // 1. Fetch latest feedback
    const { data: feedback, isLoading, isError } = useQuery({
        queryKey: ['latestFeedback', selectedCompany?._id],
        queryFn: () => getLatestFeedback(selectedCompany?._id),
        enabled: !!selectedCompany,
        retry: false
    });

    // 2. Mutation to generate feedback
    const generateMutation = useMutation({
        mutationFn: () => generateFeedback(selectedCompany?._id),
        onSuccess: () => {
            queryClient.invalidateQueries(['latestFeedback']);
            toast.success('Staff Engineer critique updated!');
        },
        onError: (err) => {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to generate critique.');
        }
    });

    const handleGenerate = () => {
        toast.promise(generateMutation.mutateAsync(), {
            loading: 'Staff Engineer reviewing your logs from the last 7 days...',
            success: 'Analysis completed successfully!',
            error: 'Failed to complete review.'
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-4 w-64 rounded mt-2" />
                <div className="space-y-6 pt-6">
                    <div className="skeleton-card h-40" />
                    <div className="skeleton-card h-64" />
                </div>
            </div>
        );
    }

    // Default checklist parser or highlight gaps from feedback content
    const getChecklistItems = (content) => {
        if (!content) return [];
        // Basic parser for lists
        const lines = content.split('\n');
        const items = [];
        lines.forEach(line => {
            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                const text = line.replace(/^[\s\-\*]+/, '').trim();
                if (text.length > 5 && items.length < 5) {
                    items.push(text);
                }
            }
        });
        return items;
    };

    const checklistItems = getChecklistItems(feedback?.content);

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-muted hover:text-text transition-colors p-1.5 bg-card border border-border/80 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
                            <Brain className="w-7 h-7 text-teal-400 animate-pulse" />
                            <span>Staff Engineer AI Mentor & Critique</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Honest architectural critique and improvement challenges based on your contribution stream</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !selectedCompany}
                    className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-teal-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start md:self-auto"
                >
                    {generateMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                        <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                    )}
                    <span>Review logs (7d)</span>
                </button>
            </header>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Summary & Actions Checklist */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-lg border border-teal-500/10">
                        <div className="flex items-center gap-2 text-teal-400">
                            <Shield className="w-5 h-5" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider">
                                Growth Checklist
                            </h3>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                            These items are synthesized from gaps identified in your recent logs by our Staff Engineer model. Use them to guide your coding today!
                        </p>
                        
                        <div className="space-y-3 pt-2">
                            {checklistItems.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted italic">
                                    No critique items loaded. Generate review above to populate checklist.
                                </div>
                            ) : (
                                checklistItems.map((item, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-start gap-2.5 bg-surface/40 p-3 rounded-xl border border-border/50 hover:border-teal-500/20 transition-all cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                                        <span className="text-xs text-text/90 font-medium leading-relaxed">
                                            {item.length > 70 ? item.slice(0, 70) + '...' : item}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Architectural Tips Panel */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-accent">
                            <Code className="w-4 h-4" />
                            <h3 className="text-xs font-extrabold uppercase tracking-wider">
                                Staff Quality Standards
                            </h3>
                        </div>
                        <div className="space-y-3 text-xs leading-relaxed text-muted">
                            <div className="flex gap-2">
                                <span className="text-accent font-bold">1.</span>
                                <p><strong>Factual logs:</strong> State exact modules touched, tests added, and files modified.</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-accent font-bold">2.</span>
                                <p><strong>Defensive coding:</strong> Highlight validation steps and edge-case handling in descriptions.</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-accent font-bold">3.</span>
                                <p><strong>System Impact:</strong> Connect daily tasks back to overall transaction reliability and latency goals.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Critique Markdown Rendering */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence mode="wait">
                        {feedback ? (
                            <motion.div
                                key={feedback._id || 'feedback'}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-teal-500/15"
                            >
                                {/* Critique Metadata Header */}
                                <div className="bg-gradient-to-r from-teal-950/40 to-slate-900 border-b border-border/80 p-5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block font-mono">
                                            Mentor Review Active
                                        </span>
                                        <h3 className="text-sm font-extrabold text-text">
                                            Architectural Assessment Dossier
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-muted font-mono font-bold bg-surface px-2.5 py-1 rounded-lg border border-border">
                                        Last generated: {new Date(feedback.generatedAt || feedback.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Critique Content */}
                                <div className="p-6 md:p-8 prose prose-invert prose-slate max-w-none text-text text-sm leading-relaxed max-h-[66vh] overflow-y-auto scrollbar-thin">
                                    <ReactMarkdown>{feedback.content}</ReactMarkdown>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card/20 border border-border border-dashed p-20 rounded-2xl text-center space-y-4 min-h-[50vh] flex flex-col items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-teal-500/10 flex items-center justify-center rounded-2xl text-teal-400">
                                    <Brain className="w-8 h-8 text-teal-400 animate-pulse" />
                                </div>
                                <h3 className="text-base font-bold text-text">No Assessment Dossier Generated</h3>
                                <p className="text-muted text-xs max-w-sm mx-auto leading-relaxed">
                                    Click "Review logs" in the top right to generate a Staff Engineer critique of your work logs from the last 7 days.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
};

export default AIFeedback;
