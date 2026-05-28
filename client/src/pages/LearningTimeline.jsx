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
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-4 w-64 rounded mt-2" />
                <div className="space-y-6 pt-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton-card h-36" />
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
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-muted hover:text-text transition-colors p-1.5 bg-card border border-border/80 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
                            <GraduationCap className="w-8 h-8 text-accent" />
                            <span>Technical Learning & Growth Timeline</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Chronological footprint of conceptual mastery and backend skill progression</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Timeline Stream */}
            {learningLogs.length === 0 ? (
                <div className="bg-card border border-border border-dashed p-16 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-accent/10 flex items-center justify-center rounded-2xl mx-auto">
                        <GraduationCap className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-text">No learning records found</h3>
                    <p className="text-muted text-xs max-w-md mx-auto">
                        Log daily entries with "Technical Learnings" or complete the "Reflections" in the advanced fields to populate your growth timeline!
                    </p>
                    <Link
                        to="/logs"
                        className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold inline-block text-xs uppercase tracking-wide hover:shadow-lg transition-all"
                    >
                        Log standup
                    </Link>
                </div>
            ) : (
                <div className="relative border-l-2 border-border/60 ml-3 pl-8 py-4 space-y-8">
                    {learningLogs.map((log, idx) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="relative"
                        >
                            {/* Marker Icon on Timeline */}
                            <div className="absolute -left-[44px] top-1.5 p-1.5 bg-slate-900 border-2 border-accent rounded-full text-accent shadow-md shadow-accent/10 z-10">
                                <GraduationCap className="w-3.5 h-3.5" />
                            </div>

                            {/* Learning Card */}
                            <div className="bg-card border border-border/60 hover:border-accent/40 rounded-2xl p-5 space-y-4 shadow-lg hover:shadow-xl transition-all duration-200">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-accent font-mono flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(log.date)}
                                        </span>
                                        {log.sprint && (
                                            <span className="text-[10px] px-2 py-0.5 bg-surface border border-border text-muted rounded font-bold uppercase tracking-wider">
                                                {log.sprint}
                                            </span>
                                        )}
                                        {log.project && (
                                            <span className="text-[10px] px-2 py-0.5 bg-surface border border-border text-muted rounded font-semibold">
                                                Project: {log.project}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Core Learnings list */}
                                {log.learnings && log.learnings.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                                            <Lightbulb className="w-3.5 h-3.5 text-accent" />
                                            <span>Technical Learnings</span>
                                        </span>
                                        <ul className="list-disc list-outside ml-4 space-y-1.5 text-xs text-text leading-relaxed">
                                            {log.learnings.map((learning, i) => (
                                                <li key={i}>{learning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Reflections block */}
                                {log.reflection && (log.reflection.biggestLearning || log.reflection.biggestBlocker || log.reflection.whatConfusedMe) && (
                                    <div className="border-t border-border/30 pt-3 space-y-2.5">
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                                            <Brain className="w-3.5 h-3.5 text-accent" />
                                            <span>Daily Growth Reflection</span>
                                        </span>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                            {log.reflection.biggestLearning && (
                                                <div className="bg-surface/50 border border-border/40 p-3 rounded-xl space-y-1">
                                                    <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">Mastered Today</span>
                                                    <p className="text-text font-medium leading-relaxed">{log.reflection.biggestLearning}</p>
                                                </div>
                                            )}
                                            {log.reflection.biggestBlocker && (
                                                <div className="bg-surface/50 border border-border/40 p-3 rounded-xl space-y-1">
                                                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block">Key Blocker</span>
                                                    <p className="text-text font-medium leading-relaxed">{log.reflection.biggestBlocker}</p>
                                                </div>
                                            )}
                                            {log.reflection.whatConfusedMe && (
                                                <div className="bg-surface/50 border border-border/40 p-3 rounded-xl space-y-1">
                                                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">Confusions</span>
                                                    <p className="text-text font-medium leading-relaxed">{log.reflection.whatConfusedMe}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Systems & Tech Tags */}
                                {(log.systemsModules?.length > 0 || log.technologiesUsed?.length > 0) && (
                                    <div className="flex flex-wrap items-center gap-3 border-t border-border/30 pt-3 text-xs text-muted">
                                        {log.systemsModules?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Server className="w-3.5 h-3.5 text-accent" />
                                                <div className="flex gap-1">
                                                    {log.systemsModules.map((s, i) => (
                                                        <span key={i} className="text-text font-semibold">{s}{i < log.systemsModules.length - 1 ? ',' : ''}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {log.technologiesUsed?.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Code className="w-3.5 h-3.5 text-emerald-400" />
                                                <div className="flex gap-1">
                                                    {log.technologiesUsed.map((t, i) => (
                                                        <span key={i} className="text-emerald-400 font-mono font-bold">{t}{i < log.technologiesUsed.length - 1 ? ',' : ''}</span>
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
