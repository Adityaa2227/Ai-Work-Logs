import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogs } from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { motion } from 'framer-motion';
import { 
    GraduationCap, Calendar, Lightbulb, Brain, Server, 
    Code, Terminal, ArrowLeft, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LearningTimeline = () => {
    const { selectedCompany } = useCompany();

    const { data: logsData, isLoading } = useQuery({
        queryKey: ['learningLogs', selectedCompany?._id],
        queryFn: () => getLogs({ company: selectedCompany?._id, limit: 100 }), // retrieve all logs in range
        enabled: !!selectedCompany
    });

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="skeleton h-6 w-48 rounded bg-zinc-800" />
                <div className="skeleton h-4 w-64 rounded bg-zinc-800 mt-2" />
                <div className="space-y-4 pt-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-28 rounded-lg bg-zinc-800" />
                    ))}
                </div>
            </div>
        );
    }

    const logs = logsData?.logs || [];
    // Filter out logs that don't have learnings AND don't have reflections
    const learningLogs = logs.filter(l => 
        (l.learnings && l.learnings.length > 0) || 
        (l.reflection && (l.reflection.biggestLearning || l.reflection.biggestBlocker || l.reflection.whatConfusedMe))
    );

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-muted hover:text-text transition-colors text-sm flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </Link>
                    <span className="text-border">/</span>
                    <h1 className="text-xl font-semibold text-text">Learning Timeline</h1>
                </div>
                <span className="text-xs text-muted font-mono">
                    {learningLogs.length} entries
                </span>
            </header>

            {/* Timeline Stream */}
            {learningLogs.length === 0 ? (
                <div className="bg-card border border-border border-dashed p-10 rounded-lg text-center space-y-3">
                    <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg mx-auto">
                        <GraduationCap className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-text">No learning records found</h3>
                    <p className="text-muted text-xs max-w-md mx-auto">
                        Log daily entries with "Technical Learnings" or complete "Reflections" in the advanced fields to populate your growth timeline.
                    </p>
                    <Link
                        to="/logs"
                        className="bg-accent hover:bg-accentHover text-white px-3 py-1.5 rounded-lg font-medium inline-block text-sm transition-colors"
                    >
                        Log standup
                    </Link>
                </div>
            ) : (
                <div className="relative border-l border-border ml-2 pl-6 py-2 space-y-4">
                    {learningLogs.map((log, idx) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="relative"
                        >
                            {/* Marker */}
                            <div className="absolute -left-[33px] top-2 p-1.5 bg-bg border border-border rounded-full text-accent z-10">
                                <GraduationCap className="w-3 h-3" />
                            </div>

                            {/* Learning Card */}
                            <div className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-zinc-600 transition-colors">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-accent font-mono flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(log.date)}
                                    </span>
                                    {log.sprint && (
                                        <span className="text-[11px] px-1.5 py-0.5 bg-surface border border-border text-muted rounded font-medium">
                                            {log.sprint}
                                        </span>
                                    )}
                                    {log.project && (
                                        <span className="text-[11px] px-1.5 py-0.5 bg-surface border border-border text-muted rounded font-medium">
                                            {log.project}
                                        </span>
                                    )}
                                </div>

                                {/* Core Learnings list */}
                                {log.learnings && log.learnings.length > 0 && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted flex items-center gap-1">
                                            <Lightbulb className="w-3.5 h-3.5 text-accent" />
                                            <span>Technical Learnings</span>
                                        </span>
                                        <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-text leading-relaxed">
                                            {log.learnings.map((learning, i) => (
                                                <li key={i}>{learning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Reflections block */}
                                {log.reflection && (log.reflection.biggestLearning || log.reflection.biggestBlocker || log.reflection.whatConfusedMe) && (
                                    <div className="border-t border-border pt-3 space-y-2">
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted flex items-center gap-1">
                                            <Brain className="w-3.5 h-3.5 text-accent" />
                                            <span>Daily Reflection</span>
                                        </span>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                            {log.reflection.biggestLearning && (
                                                <div className="bg-surface border border-border p-3 rounded-lg space-y-1">
                                                    <span className="text-xs font-medium uppercase tracking-wider text-accent block">Mastered</span>
                                                    <p className="text-text text-sm leading-relaxed">{log.reflection.biggestLearning}</p>
                                                </div>
                                            )}
                                            {log.reflection.biggestBlocker && (
                                                <div className="bg-surface border border-border p-3 rounded-lg space-y-1">
                                                    <span className="text-xs font-medium uppercase tracking-wider text-rose-400 block">Blocker</span>
                                                    <p className="text-text text-sm leading-relaxed">{log.reflection.biggestBlocker}</p>
                                                </div>
                                            )}
                                            {log.reflection.whatConfusedMe && (
                                                <div className="bg-surface border border-border p-3 rounded-lg space-y-1">
                                                    <span className="text-xs font-medium uppercase tracking-wider text-amber-400 block">Confusion</span>
                                                    <p className="text-text text-sm leading-relaxed">{log.reflection.whatConfusedMe}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Systems & Tech Tags */}
                                {(log.systemsModules?.length > 0 || log.technologiesUsed?.length > 0) && (
                                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted">
                                        {log.systemsModules?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Server className="w-3 h-3 text-accent" />
                                                <div className="flex gap-1">
                                                    {log.systemsModules.map((s, i) => (
                                                        <span key={i} className="text-text font-medium">{s}{i < log.systemsModules.length - 1 ? ',' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {log.technologiesUsed?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Code className="w-3 h-3 text-emerald-400" />
                                                <div className="flex gap-1">
                                                    {log.technologiesUsed.map((t, i) => (
                                                        <span key={i} className="text-emerald-400 font-mono font-medium">{t}{i < log.technologiesUsed.length - 1 ? ',' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LearningTimeline;
