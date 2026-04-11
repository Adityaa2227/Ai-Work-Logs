import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createLog, updateLog, getSuggestions, getLatestLog } from '../services/logService';
import { Save, Calendar, FileText, Coffee, Briefcase, AlertCircle, Lightbulb, Zap, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import TemplateConfigModal from './TemplateConfigModal';

// InputGroup defined outside to maintain focus stability
const InputGroup = ({ label, icon: Icon, children, required = false, collapsible = false, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (collapsible) {
        return (
            <div className="space-y-1.5">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-sm font-semibold text-muted flex items-center gap-2 group hover:text-text transition-colors w-full"
                >
                    {Icon && <Icon className="w-4 h-4 text-accent/70" />}
                    {label}
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted flex items-center gap-2 group-focus-within:text-accent transition-colors">
                {Icon && <Icon className="w-4 h-4 text-accent/70" />}
                {label} {required && <span className="text-error">*</span>}
            </label>
            {children}
        </div>
    );
};

const LogForm = ({ log, onSuccess, readOnly = false, presetDate = null }) => {
    const { selectedCompany } = useCompany();
    const [status, setStatus] = useState(log?.status || 'Available');
    const [formData, setFormData] = useState({
        date: log ? log.date.split('T')[0] : (presetDate ? new Date(presetDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        project: log?.project || '',
        task: log?.task || '',
        workDone: log?.workDone?.join('\n') || '',
        filesTouched: log?.filesTouched?.join('\n') || '',
        techStack: log?.techStack?.join('\n') || '',
        blockers: log?.blockers || '',
        learnings: log?.learnings?.join('\n') || '',
        impact: log?.impact?.join('\n') || '',
        nextPlan: log?.nextPlan || '',
        noWorkReason: log?.noWorkReason || '',
        customFields: log?.customFields || {}
    });
    
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

    const defaultTemplate = {
        visibleFields: { filesTouched: true, blockers: true, learnings: true, impact: true },
        customFields: []
    };
    
    const template = selectedCompany?.logTemplate || defaultTemplate;

    // Fetch suggestions for autocomplete
    const { data: suggestions } = useQuery({
        queryKey: ['suggestions', selectedCompany?._id],
        queryFn: () => getSuggestions(selectedCompany?._id),
        enabled: !!selectedCompany && !readOnly
    });

    // Fetch latest log for auto-fill (only when creating new log)
    const { data: latestLog } = useQuery({
        queryKey: ['latestLog', selectedCompany?._id],
        queryFn: () => getLatestLog(selectedCompany?._id),
        enabled: !!selectedCompany && !log && !readOnly
    });

    // Auto-fill from yesterday's nextPlan when creating new log
    useEffect(() => {
        if (latestLog && !log && !readOnly && latestLog.nextPlan) {
            setFormData(prev => ({
                ...prev,
                task: prev.task || latestLog.nextPlan,
                project: prev.project || latestLog.project || ''
            }));
        }
    }, [latestLog, log, readOnly]);

    const mutation = useMutation({
        mutationFn: (data) => log ? updateLog(log._id, data) : createLog(data),
        onSuccess: () => {
            toast.success(log ? 'Log updated successfully' : 'Log created successfully');
            onSuccess();
        },
        onError: () => {
            toast.error('Failed to save log');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            date: formData.date,
            status,
            noWorkReason: status !== 'Available' ? formData.noWorkReason : '',
            project: status === 'Available' ? formData.project : '',
            task: status === 'Available' ? formData.task : '',
            workDone: status === 'Available' ? formData.workDone.split('\n').filter(l => l.trim()) : [],
            filesTouched: status === 'Available' ? formData.filesTouched.split('\n').filter(l => l.trim()) : [],
            techStack: status === 'Available' ? formData.techStack.split(',').map(t => t.trim()).filter(Boolean) : [],
            blockers: status === 'Available' ? formData.blockers : '',
            learnings: status === 'Available' ? formData.learnings.split('\n').filter(l => l.trim()) : [],
            impact: status === 'Available' ? formData.impact.split('\n').filter(l => l.trim()) : [],
            nextPlan: status === 'Available' ? formData.nextPlan : '',
            customFields: status === 'Available' ? formData.customFields : {},
            hours: 0
        };

        mutation.mutate(payload);
    };

    // Quick tech stack chip click
    const handleTechChipClick = (tech) => {
        const current = formData.techStack.split(',').map(t => t.trim()).filter(Boolean);
        if (current.includes(tech)) {
            // Remove it
            setFormData({ ...formData, techStack: current.filter(t => t !== tech).join(', ') });
        } else {
            // Add it
            setFormData({ ...formData, techStack: [...current, tech].join(', ') });
        }
    };

    const currentTechStack = formData.techStack.split(',').map(t => t.trim()).filter(Boolean);

    const inputClasses = "w-full p-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-muted/50 text-text hover:border-border/80";
    const textareaClasses = `${inputClasses} min-h-[100px] resize-y`;

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center bg-surface p-2 rounded-xl border border-border">
                <div className="flex flex-1 gap-2 p-1">
                    {['Available', 'No Work', 'Leave', 'Holiday'].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        disabled={readOnly}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            status === s 
                            ? '!bg-orange-500 !text-white shadow-lg shadow-orange-500/20 ring-2 ring-orange-500 ring-offset-1' 
                            : 'text-muted hover:text-text hover:bg-card'
                        } ${readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                        {s}
                    </button>
                ))}
                </div>
                {!readOnly && (
                    <button 
                        type="button"
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="px-4 text-xs font-semibold uppercase bg-card border border-border rounded-lg text-muted hover:text-orange-400 hover:border-orange-500/50 transition-colors mx-2 py-1.5"
                    >
                        Configure Template
                    </button>
                )}
            </div>

            <InputGroup label="Log Date" icon={Calendar} required>
                <input
                    type="date"
                    required
                    disabled={readOnly}
                    className={inputClasses}
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
            </InputGroup>

            <AnimatePresence mode="wait">
                {status !== 'Available' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="no-work"
                    >
                        <InputGroup label="Reason / Update" icon={Coffee} required>
                            <textarea
                                required
                                disabled={readOnly}
                                placeholder="Why was there no work today? (e.g. Waiting for access, Weekend, Sick Leave)"
                                className={textareaClasses}
                                value={formData.noWorkReason}
                                onChange={e => setFormData({ ...formData, noWorkReason: e.target.value })}
                            />
                        </InputGroup>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="work"
                        className="space-y-6"
                    >
                        <InputGroup label="Task / Ticket" icon={Briefcase} required>
                            <input
                                type="text"
                                required
                                disabled={readOnly}
                                placeholder="e.g. Build 'How to Apply' page"
                                className={inputClasses}
                                value={formData.task}
                                onChange={e => setFormData({ ...formData, task: e.target.value })}
                            />
                            {!log && latestLog?.nextPlan && formData.task === latestLog.nextPlan && (
                                <p className="text-xs text-accent/70 mt-1 ml-1">
                                    ✨ Auto-filled from yesterday's plan
                                </p>
                            )}
                        </InputGroup>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <InputGroup label="Project Name" icon={FileText} required>
                                <input
                                    type="text"
                                    required
                                    disabled={readOnly}
                                    list="projects-list"
                                    placeholder="e.g. Bihar Film Policy Portal"
                                    className={inputClasses}
                                    value={formData.project}
                                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                                />
                                {!readOnly && suggestions?.projects && (
                                    <datalist id="projects-list">
                                        {suggestions.projects.map((p, i) => <option key={i} value={p} />)}
                                    </datalist>
                                )}
                            </InputGroup>
                            <InputGroup label="Tech Stack" icon={Zap}>
                                {/* Quick chips from suggestions */}
                                {!readOnly && suggestions?.techStacks && suggestions.techStacks.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {suggestions.techStacks.slice(0, 10).map((tech, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleTechChipClick(tech)}
                                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                                    currentTechStack.includes(tech)
                                                        ? 'bg-accent/20 border-accent/40 text-accent'
                                                        : 'bg-surface border-border text-muted hover:text-text hover:border-border/80'
                                                }`}
                                            >
                                                {tech}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    disabled={readOnly}
                                    placeholder="e.g. react, nodejs, tailwind"
                                    className={inputClasses}
                                    value={formData.techStack}
                                    onChange={e => setFormData({ ...formData, techStack: e.target.value })}
                                />
                            </InputGroup>
                        </div>

                        <InputGroup label="Work Done (Bullet points)" icon={FileText} required>
                            <textarea
                                required
                                disabled={readOnly}
                                rows="5"
                                placeholder="- Implemented feature X&#10;- Fixed bug Y"
                                className={textareaClasses}
                                value={formData.workDone}
                                onChange={e => setFormData({ ...formData, workDone: e.target.value })}
                            ></textarea>
                        </InputGroup>

                        {/* Collapsible optional fields (Template Based) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {template.visibleFields.filesTouched && (
                                <InputGroup label="Files Touched" icon={FileText} collapsible defaultOpen={!!formData.filesTouched}>
                                    <textarea
                                        rows="3"
                                        disabled={readOnly}
                                        placeholder="src/components/Header.jsx&#10;src/api.js"
                                        className={textareaClasses}
                                        value={formData.filesTouched}
                                        onChange={e => setFormData({ ...formData, filesTouched: e.target.value })}
                                    />
                                </InputGroup>
                            )}
                            {template.visibleFields.blockers && (
                                <InputGroup label="Blockers" icon={AlertCircle} collapsible defaultOpen={!!formData.blockers}>
                                    <textarea
                                        rows="3"
                                        disabled={readOnly}
                                        placeholder="Issues faced..."
                                        className={textareaClasses}
                                        value={formData.blockers}
                                        onChange={e => setFormData({ ...formData, blockers: e.target.value })}
                                    />
                                </InputGroup>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {template.visibleFields.learnings && (
                                 <InputGroup label="Learnings" icon={Lightbulb}>
                                    <textarea
                                        rows="3"
                                        disabled={readOnly}
                                        placeholder="- Learned how to use React Query..."
                                        className={textareaClasses}
                                        value={formData.learnings}
                                        onChange={e => setFormData({ ...formData, learnings: e.target.value })}
                                    />
                                </InputGroup>
                            )}
                            {template.visibleFields.impact && (
                                 <InputGroup label="Impact / Outcome" icon={Zap} collapsible defaultOpen={!!formData.impact}>
                                    <textarea
                                        rows="3"
                                        disabled={readOnly}
                                        placeholder="- Improved load time by 20%..."
                                        className={textareaClasses}
                                        value={formData.impact}
                                        onChange={e => setFormData({ ...formData, impact: e.target.value })}
                                    />
                                </InputGroup>
                            )}
                        </div>

                        {/* Dynamic Custom Fields */}
                        {template.customFields.length > 0 && (
                            <div className="grid grid-cols-1 gap-6 border-t border-border/50 pt-6 mt-6">
                                {template.customFields.map((field) => (
                                    <InputGroup key={field} label={field} icon={FileText}>
                                        <textarea
                                            rows="2"
                                            disabled={readOnly}
                                            placeholder={`Enter ${field.toLowerCase()}...`}
                                            className={textareaClasses}
                                            value={formData.customFields[field] || ''}
                                            onChange={e => setFormData({ 
                                                ...formData, 
                                                customFields: { ...formData.customFields, [field]: e.target.value } 
                                            })}
                                        />
                                    </InputGroup>
                                ))}
                            </div>
                        )}
                        <InputGroup label="Next Day Plan" icon={ArrowRight} required>
                            <input
                                type="text"
                                required
                                disabled={readOnly}
                                placeholder="What will you work on tomorrow?"
                                className={inputClasses}
                                value={formData.nextPlan}
                                onChange={e => setFormData({ ...formData, nextPlan: e.target.value })}
                            />
                        </InputGroup>
                    </motion.div>
                )}
            </AnimatePresence>

            {!readOnly && (
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-accent text-white py-3.5 rounded-xl font-medium shadow-lg shadow-accent/20 hover:bg-indigo-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Save Log</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </form>
        
        <TemplateConfigModal 
            isOpen={isTemplateModalOpen} 
            onClose={() => setIsTemplateModalOpen(false)} 
        />
        </>
    );
};

export default LogForm;
