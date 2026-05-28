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
        onSuccess: (data) => {
            queryClient.invalidateQueries(['latestFeedback']);
            if (data?.quotaSafeguard) {
                toast.info(data.message || 'AI quota safeguard activated. Your critique was safely queued.');
                return;
            }
            toast.success('Staff Engineer critique updated!');
        },
        onError: (err) => {
            console.error(err);
            if (err.response?.data?.quotaSafeguard) {
                toast.info(err.response.data.message || 'AI quota safeguard activated. Your critique was safely queued.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to generate critique.');
        }
    });

    const handleGenerate = () => {
        toast.promise(generateMutation.mutateAsync(), {
            loading: 'Staff Engineer reviewing your logs from the last 7 days...',
            success: (data) => data?.quotaSafeguard ? (data.message || 'AI quota safeguard activated. Your critique was safely queued.') : 'Analysis completed successfully!',
            error: (err) => err.response?.data?.quotaSafeguard ? (err.response.data.message || 'AI quota safeguard activated. Your critique was safely queued.') : 'Failed to complete review.'
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="skeleton h-6 w-48 rounded bg-zinc-800" />
                <div className="skeleton h-4 w-64 rounded bg-zinc-800 mt-2" />
                <div className="space-y-4 pt-4">
                    <div className="skeleton h-32 rounded-lg bg-zinc-800" />
                    <div className="skeleton h-52 rounded-lg bg-zinc-800" />
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
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-muted hover:text-text transition-colors text-sm flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </Link>
                    <span className="text-border">/</span>
                    <h1 className="text-xl font-semibold text-text">AI Mentor Critique</h1>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !selectedCompany}
                    className="bg-accent hover:bg-accentHover text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {generateMutation.isPending ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Review logs (7d)</span>
                </button>
            </header>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Left Side: Summary & Actions Checklist */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent" />
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                                Growth Checklist
                            </h3>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                            Synthesized from gaps identified in your recent logs. Use these to guide your work.
                        </p>
                        
                        <div className="space-y-2">
                            {checklistItems.length === 0 ? (
                                <div className="text-center py-4 text-xs text-muted">
                                    No items loaded. Generate review above to populate.
                                </div>
                            ) : (
                                checklistItems.map((item, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-start gap-2 bg-surface p-2.5 rounded-lg border border-border hover:border-zinc-600 transition-colors"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                                        <span className="text-xs text-text leading-relaxed">
                                            {item.length > 70 ? item.slice(0, 70) + '...' : item}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quality Standards Panel */}
                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Code className="w-4 h-4 text-accent" />
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                                Quality Standards
                            </h3>
                        </div>
                        <div className="space-y-2.5 text-xs text-muted leading-relaxed">
                            <div className="flex gap-2">
                                <span className="text-accent font-mono font-medium">1.</span>
                                <p><span className="text-text font-medium">Factual logs:</span> State exact modules touched, tests added, and files modified.</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-accent font-mono font-medium">2.</span>
                                <p><span className="text-text font-medium">Defensive coding:</span> Highlight validation steps and edge-case handling.</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-accent font-mono font-medium">3.</span>
                                <p><span className="text-text font-medium">System impact:</span> Connect tasks to reliability and latency goals.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Critique */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {feedback ? (
                            <motion.div
                                key={feedback._id || 'feedback'}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-card border border-border rounded-lg overflow-hidden"
                            >
                                {/* Critique Metadata Header */}
                                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-accent/10 text-accent">
                                            Active Review
                                        </span>
                                        <h3 className="text-sm font-semibold text-text mt-1">
                                            Architectural Assessment
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-muted font-mono bg-surface px-2 py-1 rounded-lg border border-border">
                                        {new Date(feedback.generatedAt || feedback.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Critique Content */}
                                <div className="p-5 prose prose-invert prose-sm max-w-none text-text text-sm leading-relaxed max-h-[66vh] overflow-y-auto scrollbar-hide">
                                    <ReactMarkdown>{feedback.content}</ReactMarkdown>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card border border-border border-dashed rounded-lg p-12 text-center space-y-3 min-h-[50vh] flex flex-col items-center justify-center"
                            >
                                <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg">
                                    <Brain className="w-5 h-5 text-accent" />
                                </div>
                                <h3 className="text-sm font-semibold text-text">No assessment generated</h3>
                                <p className="text-muted text-xs max-w-sm mx-auto leading-relaxed">
                                    Click "Review logs (7d)" to generate a Staff Engineer critique of your recent work logs.
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
