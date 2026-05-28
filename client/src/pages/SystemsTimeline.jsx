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
            <div className="space-y-8 max-w-5xl mx-auto">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-4 w-64 rounded mt-2" />
                <div className="space-y-6 pt-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton-card h-40" />
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
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-muted hover:text-text transition-colors p-1.5 bg-card border border-border/80 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
                            <Server className="w-7 h-7 text-accent" />
                            <span>Systems Architecture Timeline</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Mapping your microservice and backend infrastructure footprint</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Timeline Stream */}
            {timelineData?.length === 0 ? (
                <div className="bg-card border border-border border-dashed p-16 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-accent/15 flex items-center justify-center rounded-2xl mx-auto">
                        <Server className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-text">No systems modules registered yet</h3>
                    <p className="text-muted text-xs max-w-md mx-auto">
                        Create daily logs and specify "Systems/Modules Touched" in the advanced fields to construct your architecture footprint!
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
                    {timelineData?.map((log, idx) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                            className="relative"
                        >
                            {/* Marker Icon on Timeline */}
                            <div className="absolute -left-[45px] top-1.5 p-2 bg-slate-900 border-2 border-accent rounded-full text-accent shadow-md shadow-accent/15 z-10">
                                <Cpu className="w-4 h-4" />
                            </div>

                            {/* Contribution Card */}
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
                                        {log.jiraTicket && (
                                            <span className="text-[10px] px-2 py-0.5 bg-accent/15 border border-accent/20 text-accent rounded font-mono">
                                                {log.jiraTicket}
                                            </span>
                                        )}
                                        {log.prNumber && (
                                            <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded font-mono flex items-center gap-1">
                                                <GitPullRequest className="w-3 h-3" />
                                                PR {log.prNumber}
                                            </span>
                                        )}
                                        {log.complexity && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${
                                                log.complexity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                                Complexity: {log.complexity}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Standup Focus</span>
                                    <h3 className="text-sm font-semibold text-text leading-snug">{log.task}</h3>
                                </div>

                                {/* Systems Touched Pills */}
                                <div className="space-y-1.5 border-t border-border/30 pt-3.5">
                                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Systems Footprint</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {log.systemsModules?.map((sys, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-accent/15 border border-accent/25 text-accent font-semibold text-xs rounded-lg">
                                                {sys}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tech & Databases */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/30 pt-3.5">
                                    {log.technologiesUsed && log.technologiesUsed.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-muted uppercase block">Technologies</span>
                                            <div className="flex flex-wrap gap-1">
                                                {log.technologiesUsed.map((tech, i) => (
                                                    <span key={i} className="text-text bg-surface px-1.5 py-0.5 rounded text-[10px] border border-border">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {log.workDone && log.workDone.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-bold text-muted uppercase block">Factual Achievements</span>
                                            <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-muted leading-relaxed">
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
