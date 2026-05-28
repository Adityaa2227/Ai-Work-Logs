import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSystemsTimeline } from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { motion } from 'framer-motion';
import { 
    Server, Calendar, Cpu, GitPullRequest, Code, 
    ArrowLeft, ChevronRight, Terminal, BookOpen, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SystemsTimeline = () => {
    const { selectedCompany } = useCompany();

    const { data: timelineData, isLoading } = useQuery({
        queryKey: ['systemsTimeline', selectedCompany?._id],
        queryFn: () => getSystemsTimeline(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="skeleton h-6 w-48 rounded bg-zinc-800" />
                <div className="skeleton h-4 w-64 rounded bg-zinc-800 mt-2" />
                <div className="space-y-4 pt-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-lg bg-zinc-800" />
                    ))}
                </div>
            </div>
        );
    }

    // Format date in timeline
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

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
                    <h1 className="text-xl font-semibold text-text">Systems Timeline</h1>
                </div>
                <span className="text-xs text-muted font-mono">
                    {timelineData?.length || 0} entries
                </span>
            </header>

            {/* Timeline Stream */}
            {timelineData?.length === 0 ? (
                <div className="bg-card border border-border border-dashed p-10 rounded-lg text-center space-y-3">
                    <div className="w-10 h-10 bg-accent/10 flex items-center justify-center rounded-lg mx-auto">
                        <Server className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-text">No systems modules registered</h3>
                    <p className="text-muted text-xs max-w-md mx-auto">
                        Create daily logs and specify "Systems/Modules Touched" in the advanced fields to build your architecture footprint.
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
                    {timelineData?.map((log, idx) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="relative"
                        >
                            {/* Marker */}
                            <div className="absolute -left-[33px] top-2 p-1.5 bg-bg border border-border rounded-full text-accent z-10">
                                <Cpu className="w-3 h-3" />
                            </div>

                            {/* Contribution Card */}
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
                                    {log.jiraTicket && (
                                        <span className="text-[11px] px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded font-mono">
                                            {log.jiraTicket}
                                        </span>
                                    )}
                                    {log.prNumber && (
                                        <span className="text-[11px] px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded font-mono flex items-center gap-0.5">
                                            <GitPullRequest className="w-3 h-3" />
                                            PR {log.prNumber}
                                        </span>
                                    )}
                                    {log.complexity && (
                                        <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${
                                            log.complexity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                        }`}>
                                            {log.complexity}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-xs font-medium uppercase tracking-wider text-muted block mb-0.5">Task</span>
                                    <h3 className="text-sm font-medium text-text leading-snug">{log.task}</h3>
                                </div>

                                {/* Systems Touched */}
                                <div className="border-t border-border pt-3">
                                    <span className="text-xs font-medium uppercase tracking-wider text-muted block mb-1.5">Systems Footprint</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {log.systemsModules?.map((sys, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium rounded">
                                                {sys}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tech & Databases */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-3">
                                    {log.technologiesUsed && log.technologiesUsed.length > 0 && (
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-muted block mb-1">Technologies</span>
                                            <div className="flex flex-wrap gap-1">
                                                {log.technologiesUsed.map((tech, i) => (
                                                    <span key={i} className="text-text bg-surface px-1.5 py-0.5 rounded text-[11px] border border-border font-mono">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {log.workDone && log.workDone.length > 0 && (
                                        <div>
                                            <span className="text-xs font-medium uppercase tracking-wider text-muted block mb-1">Achievements</span>
                                            <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-muted">
                                                {log.workDone.slice(0, 2).map((wd, i) => (
                                                    <li key={i} className="line-clamp-1">{wd}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SystemsTimeline;
