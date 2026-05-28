import React from 'react';
import { 
    Calendar, FileText, Coffee, Briefcase, AlertCircle, Lightbulb, 
    Zap, ArrowRight, GitPullRequest, Shield, Server, Database, Code, CheckCircle2, Image
} from 'lucide-react';

const ReadOnlyLogView = ({ log }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const Section = ({ icon: Icon, label, children, required = false, badge = null }) => (
        <div className="space-y-1.5 w-full">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted">
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
                    <span>{label}</span>
                    {required && <span className="text-rose-500 font-bold">*</span>}
                </div>
                {badge}
            </div>
            <div className="bg-surface/30 border border-border/60 rounded-xl p-3.5 text-sm">
                {children}
            </div>
        </div>
    );

    const ListSection = ({ icon, label, items }) => {
        if (!items || items.length === 0) return null;
        return (
            <Section icon={icon} label={label}>
                <ul className="list-disc list-outside ml-4 space-y-1 text-text">
                    {items.map((item, i) => (
                        <li key={i} className="leading-relaxed">{item}</li>
                    ))}
                </ul>
            </Section>
        );
    };

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
            {/* Header Badges */}
            <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                    log.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    log.status === 'No Work' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                    {log.status}
                </span>

                {log.workStatus && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                        log.workStatus === 'deployed' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 
                        log.workStatus === 'review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        log.workStatus === 'blocked' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                        Status: {log.workStatus}
                    </span>
                )}

                {log.sprint && (
                    <span className="text-[10px] px-2.5 py-1 bg-surface border border-border/80 text-muted rounded-full font-bold uppercase tracking-wider">
                        {log.sprint}
                    </span>
                )}

                {log.complexity && (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                        log.complexity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        log.complexity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                        Complexity: {log.complexity}
                    </span>
                )}

                {log.ownershipLevel && (
                    <span className="text-[10px] px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-bold uppercase tracking-wider">
                        Ownership: {log.ownershipLevel}
                    </span>
                )}
            </div>

            {/* Date */}
            <Section icon={Calendar} label="Contribution Date" required>
                <p className="text-text font-semibold">{formatDate(log.date)}</p>
            </Section>

            {log.status !== 'Available' ? (
                <Section icon={Coffee} label="Reason / Update" required>
                    <p className="text-text leading-relaxed whitespace-pre-wrap">{log.noWorkReason}</p>
                </Section>
            ) : (
                <>
                    {/* Task and Jira/PR */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Section 
                            icon={Briefcase} 
                            label="Work Description" 
                            required
                            badge={log.jiraTicket && <span className="font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded text-[10px] border border-accent/25">{log.jiraTicket}</span>}
                        >
                            <p className="text-text font-medium leading-relaxed">{log.task}</p>
                        </Section>

                        <Section 
                            icon={FileText} 
                            label="Core Project" 
                            required
                            badge={log.prNumber && <span className="font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded text-[10px] border border-teal-500/25">PR {log.prNumber}</span>}
                        >
                            <p className="text-text font-medium">{log.project}</p>
                        </Section>
                    </div>

                    {/* Systems, Tech & API */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {log.systemsModules && log.systemsModules.length > 0 && (
                            <Section icon={Server} label="Systems / Modules">
                                <div className="flex flex-wrap gap-1">
                                    {log.systemsModules.map((sys, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs border border-accent/20 font-semibold">
                                            {sys}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {log.technologiesUsed && log.technologiesUsed.length > 0 && (
                            <Section icon={Code} label="Technologies Used">
                                <div className="flex flex-wrap gap-1">
                                    {log.technologiesUsed.map((tech, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs border border-emerald-500/20 font-semibold">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {log.apisModified && log.apisModified.length > 0 && (
                            <Section icon={Code} label="APIs Modified/Created">
                                <div className="flex flex-wrap gap-1">
                                    {log.apisModified.map((api, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20 font-mono">
                                            {api}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>

                    {/* Work Done Today */}
                    <ListSection icon={CheckCircle2} label="Development Achievements (Work Done)" items={log.workDone} />

                    {/* Databases & Infra */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.databasesTouched && log.databasesTouched.length > 0 && (
                            <Section icon={Database} label="Databases Touched">
                                <div className="flex flex-wrap gap-1">
                                    {log.databasesTouched.map((db, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded text-xs border border-yellow-500/20 font-semibold">
                                            {db}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}
                        {log.infraServices && log.infraServices.length > 0 && (
                            <Section icon={Server} label="Infrastructure & Services">
                                <div className="flex flex-wrap gap-1">
                                    {log.infraServices.map((infra, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs border border-purple-500/20 font-semibold">
                                            {infra}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>

                    {/* Files Touched and Blockers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ListSection icon={FileText} label="Files Modified (Codebase)" items={log.filesTouched} />
                        {log.blockers && (
                            <Section icon={AlertCircle} label="System Blockers & Challenges">
                                <p className="text-text leading-relaxed whitespace-pre-wrap">{log.blockers}</p>
                            </Section>
                        )}
                    </div>

                    {/* Learnings and Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ListSection icon={Lightbulb} label="Technical Learnings" items={log.learnings} />
                        <ListSection icon={Zap} label="Operational Impact" items={log.impact} />
                    </div>

                    {/* Activities Stats Summary */}
                    {log.activities && Object.values(log.activities).some(v => v > 0 || v === true) && (
                        <div className="border-t border-border/40 pt-4 mt-4">
                            <Section icon={Shield} label="Factual Engineering Metrics (Counters)">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    {log.activities.bugsFixed > 0 && (
                                        <div className="bg-card/45 border border-border/55 p-2 rounded-lg">
                                            <span className="text-[10px] font-bold text-muted uppercase">Bugs Fixed</span>
                                            <p className="text-lg font-black text-rose-400 font-mono">{log.activities.bugsFixed}</p>
                                        </div>
                                    )}
                                    {log.activities.featuresImplemented > 0 && (
                                        <div className="bg-card/45 border border-border/55 p-2 rounded-lg">
                                            <span className="text-[10px] font-bold text-muted uppercase">Features Done</span>
                                            <p className="text-lg font-black text-emerald-400 font-mono">{log.activities.featuresImplemented}</p>
                                        </div>
                                    )}
                                    {log.activities.prsCreated > 0 && (
                                        <div className="bg-card/45 border border-border/55 p-2 rounded-lg">
                                            <span className="text-[10px] font-bold text-muted uppercase">PRs Created</span>
                                            <p className="text-lg font-black text-indigo-400 font-mono">{log.activities.prsCreated}</p>
                                        </div>
                                    )}
                                    {log.activities.testsWritten > 0 && (
                                        <div className="bg-card/45 border border-border/55 p-2 rounded-lg">
                                            <span className="text-[10px] font-bold text-muted uppercase">Tests Written</span>
                                            <p className="text-lg font-black text-teal-400 font-mono">{log.activities.testsWritten}</p>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </div>
                    )}

                    {/* Testing safety details */}
                    {log.testing && (log.testing.testsAdded || log.testing.coverageNotes) && (
                        <Section icon={Shield} label="Testing Rigor & Coverage">
                            <div className="space-y-2">
                                {log.testing.testsAdded && (
                                    <p className="text-text leading-relaxed"><strong>Tests Added:</strong> {log.testing.testsAdded}</p>
                                )}
                                {log.testing.coverageNotes && (
                                    <p className="text-text leading-relaxed"><strong>Coverage:</strong> {log.testing.coverageNotes}</p>
                                )}
                                {log.testing.testingType && log.testing.testingType.length > 0 && (
                                    <div className="flex gap-1.5 mt-1.5">
                                        {log.testing.testingType.map((t, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded text-[10px] border border-teal-500/20 font-bold uppercase">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Next Day Plan */}
                    {log.nextPlan && (
                        <Section icon={ArrowRight} label="Next Day Plan" required>
                            <p className="text-text leading-relaxed">{log.nextPlan}</p>
                        </Section>
                    )}

                    {/* Attached Screenshots / Images */}
                    {log.images && log.images.length > 0 && (
                        <Section icon={Image} label="Log Attachments / Screenshots">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {log.images.map((imgUrl, idx) => (
                                    <a
                                        key={idx}
                                        href={imgUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative rounded-lg overflow-hidden border border-border/40 aspect-video hover:border-accent/40 bg-slate-950 transition-all block group"
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Attachment ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </Section>
                    )}
                </>
            )}
        </div>
    );
};

export default ReadOnlyLogView;
