import React from 'react';
import { Calendar, FileText, Coffee, Briefcase, AlertCircle, Lightbulb, Zap, ArrowRight } from 'lucide-react';

const ReadOnlyLogView = ({ log }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const Section = ({ icon: Icon, label, children, required = false }) => (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                {Icon && <Icon className="w-4 h-4 text-accent/70" />}
                <span>{label}</span>
                {required && <span className="text-error">*</span>}
            </div>
            <div className="bg-surface/50 border border-border rounded-xl p-4">
                {children}
            </div>
        </div>
    );

    const ListSection = ({ icon, label, items }) => {
        if (!items || items.length === 0) return null;
        return (
            <Section icon={icon} label={label}>
                <ul className="list-disc list-inside space-y-1.5 text-text">
                    {items.map((item, i) => (
                        <li key={i} className="leading-relaxed">{item}</li>
                    ))}
                </ul>
            </Section>
        );
    };

    return (
        <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${
                    log.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    log.status === 'No Work' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                    {log.status}
                </span>
            </div>

            {/* Date */}
            <Section icon={Calendar} label="Log Date" required>
                <p className="text-text font-medium">{formatDate(log.date)}</p>
            </Section>

            {log.status !== 'Available' ? (
                <Section icon={Coffee} label="Reason / Update" required>
                    <p className="text-text leading-relaxed">{log.noWorkReason}</p>
                </Section>
            ) : (
                <>
                    {/* Task */}
                    <Section icon={Briefcase} label="Task / Ticket" required>
                        <p className="text-text font-medium leading-relaxed">{log.task}</p>
                    </Section>

                    {/* Project and Tech Stack */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section icon={FileText} label="Project Name" required>
                            <p className="text-text font-medium">{log.project}</p>
                        </Section>
                        {log.techStack && log.techStack.length > 0 && (
                            <Section icon={Zap} label="Tech Stack">
                                <div className="flex flex-wrap gap-2">
                                    {log.techStack.map((tech, i) => (
                                        <span key={i} className="px-2 py-1 bg-accent/10 text-accent rounded-lg text-sm border border-accent/20">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>

                    {/* Work Done */}
                    <ListSection icon={FileText} label="Work Done" items={log.workDone} />

                    {/* Files and Blockers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ListSection icon={FileText} label="Files Touched" items={log.filesTouched} />
                        {log.blockers && (
                            <Section icon={AlertCircle} label="Blockers">
                                <p className="text-text leading-relaxed">{log.blockers}</p>
                            </Section>
                        )}
                    </div>

                    {/* Learnings and Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ListSection icon={Lightbulb} label="Learnings" items={log.learnings} />
                        <ListSection icon={Zap} label="Impact / Outcome" items={log.impact} />
                    </div>

                    {/* Next Day Plan */}
                    {log.nextPlan && (
                        <Section icon={ArrowRight} label="Next Day Plan" required>
                            <p className="text-text leading-relaxed">{log.nextPlan}</p>
                        </Section>
                    )}
                </>
            )}
        </div>
    );
};

export default ReadOnlyLogView;
