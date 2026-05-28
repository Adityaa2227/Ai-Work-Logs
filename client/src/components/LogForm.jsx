import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLog, updateLog, getSuggestions, getLatestLog, structureRawNotes, getImageKitAuthParams } from '../services/logService';
import { 
    Save, Calendar, FileText, Coffee, Briefcase, AlertCircle, Lightbulb, 
    Zap, ArrowRight, ChevronRight, ChevronLeft, Sparkles, Terminal, 
    Database, Server, Shield, Brain, GitPullRequest, Code, Settings, Bug,
    Image, Trash2, Upload, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '../context/CompanyContext';
import TemplateConfigModal from './TemplateConfigModal';

// Redesigned InputGroup to match professional engineering context
const InputGroup = ({ label, icon: Icon, children, required = false, themeColor = 'text-accent' }) => {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
                {Icon && <Icon className={`w-3.5 h-3.5 ${themeColor}`} />}
                <span>{label}</span>
                {required && <span className="text-rose-500 font-bold">*</span>}
            </label>
            {children}
        </div>
    );
};

const LogForm = ({ log, onSuccess, readOnly = false, presetDate = null }) => {
    const { selectedCompany } = useCompany();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState(log?.status || 'Available');
    
    // Multi-tab active tab state
    const [activeTab, setActiveTab] = useState(log ? 'core' : 'ai'); // 'ai', 'core', 'system', 'metrics', 'safety'
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isStructuring, setIsStructuring] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState(log?.images || []);

    // Schema matching state
    const [rawNotes, setRawNotes] = useState(log?.rawNotes || '');
    const [formData, setFormData] = useState({
        date: log ? log.date.split('T')[0] : (presetDate ? new Date(presetDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        project: log?.project || 'Fineract',
        task: log?.task || '',
        workDone: log?.workDone?.join('\n') || '',
        filesTouched: log?.filesTouched?.join('\n') || '',
        techStack: log?.techStack?.join('\n') || '',
        blockers: log?.blockers || '',
        learnings: log?.learnings?.join('\n') || '',
        impact: log?.impact?.join('\n') || '',
        nextPlan: log?.nextPlan || '',
        noWorkReason: log?.noWorkReason || '',
        customFields: log?.customFields || {},

        // NEW ENGINEERING METADATA
        sprint: log?.sprint || '',
        jiraTicket: log?.jiraTicket || '',
        prNumber: log?.prNumber || '',
        workStatus: log?.workStatus || '',
        systemsModules: log?.systemsModules?.join(', ') || '',
        apisModified: log?.apisModified?.join(', ') || '',
        technologiesUsed: log?.technologiesUsed?.join(', ') || '',
        databasesTouched: log?.databasesTouched?.join(', ') || '',
        infraServices: log?.infraServices?.join(', ') || '',

        // ACTIVITIES (Counters / Booleans)
        activities: log?.activities || {
            bugsFixed: 0,
            featuresImplemented: 0,
            prsCreated: 0,
            prsReviewed: 0,
            meetingsAttended: 0,
            testsWritten: 0,
            debugging: false,
            architectureDiscussion: false,
            codeReview: false,
            deployment: false
        },

        // OWNERSHIP & COMPLEXITY
        ownershipLevel: log?.ownershipLevel || '',
        complexity: log?.complexity || '',

        // ENGINEERING IMPACT
        engineeringImpact: log?.engineeringImpact || {
            whatChanged: '',
            whyItMattered: '',
            problemSolved: '',
            blockerRemoved: ''
        },

        // REFLECTION
        reflection: log?.reflection || {
            biggestLearning: '',
            biggestBlocker: '',
            whatConfusedMe: ''
        },

        // TESTING
        testing: log?.testing || {
            testsAdded: '',
            testingType: [],
            coverageNotes: ''
        }
    });

    const defaultTemplate = {
        visibleFields: { filesTouched: true, blockers: true, learnings: true, impact: true },
        customFields: []
    };
    
    const template = selectedCompany?.logTemplate || defaultTemplate;

    // Fetch suggestions
    const { data: suggestions } = useQuery({
        queryKey: ['suggestions', selectedCompany?._id],
        queryFn: () => getSuggestions(selectedCompany?._id),
        enabled: !!selectedCompany && !readOnly
    });

    // Auto-fill from yesterday's nextPlan
    const { data: latestLog } = useQuery({
        queryKey: ['latestLog', selectedCompany?._id],
        queryFn: () => getLatestLog(selectedCompany?._id),
        enabled: !!selectedCompany && !log && !readOnly
    });

    useEffect(() => {
        if (latestLog && !log && !readOnly && latestLog.nextPlan) {
            setFormData(prev => ({
                ...prev,
                task: prev.task || latestLog.nextPlan,
                project: prev.project || latestLog.project || ''
            }));
        }
    }, [latestLog, log, readOnly]);

    useEffect(() => {
        if (!latestLog || log || readOnly) return;

        setFormData(prev => ({
            ...prev,
            systemsModules: prev.systemsModules || latestLog.systemsModules?.join(', ') || '',
            apisModified: prev.apisModified || latestLog.apisModified?.join(', ') || '',
            technologiesUsed: prev.technologiesUsed || latestLog.technologiesUsed?.join(', ') || latestLog.techStack?.join(', ') || '',
            databasesTouched: prev.databasesTouched || latestLog.databasesTouched?.join(', ') || '',
            infraServices: prev.infraServices || latestLog.infraServices?.join(', ') || '',
            sprint: prev.sprint || latestLog.sprint || ''
        }));
    }, [latestLog, log, readOnly]);

    const mutation = useMutation({
        mutationFn: (data) => log ? updateLog(log._id, data) : createLog(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logs'] });
            queryClient.invalidateQueries({ queryKey: ['engineeringStats'] });
            queryClient.invalidateQueries({ queryKey: ['systemsTimeline'] });
            toast.success(log ? 'Work log updated successfully' : 'Work log saved successfully');
            onSuccess();
        },
        onError: (err) => {
            console.error(err);
            toast.error('Failed to save log');
        }
    });

    // Handles triggering Gemini AI notes structuring
    const handleAIStructure = async () => {
        if (!rawNotes.trim()) {
            toast.warning('Please enter some raw notes first.');
            return;
        }

        setIsStructuring(true);
        toast.promise(structureRawNotes(rawNotes, selectedCompany?._id), {
            loading: 'Senior Engineer AI parsing raw notes...',
            success: (parsed) => {
                setIsStructuring(false);
                if (parsed?.quotaSafeguard) {
                    return parsed.message || 'AI parsing was safely queued. Please complete this log manually for now.';
                }
                if (parsed) {
                    setFormData(prev => ({
                        ...prev,
                        project: parsed.project || prev.project,
                        task: parsed.task || prev.task,
                        workDone: Array.isArray(parsed.workDone) ? parsed.workDone.join('\n') : (parsed.workDone || prev.workDone),
                        filesTouched: Array.isArray(parsed.filesTouched) ? parsed.filesTouched.join('\n') : (parsed.filesTouched || prev.filesTouched),
                        techStack: Array.isArray(parsed.techStack) ? parsed.techStack.join(', ') : (parsed.techStack || prev.techStack),
                        blockers: parsed.blockers || prev.blockers,
                        learnings: Array.isArray(parsed.learnings) ? parsed.learnings.join('\n') : (parsed.learnings || prev.learnings),
                        impact: Array.isArray(parsed.impact) ? parsed.impact.join('\n') : (parsed.impact || prev.impact),
                        nextPlan: parsed.nextPlan || prev.nextPlan,
                        sprint: parsed.sprint || prev.sprint,
                        jiraTicket: parsed.jiraTicket || prev.jiraTicket,
                        prNumber: parsed.prNumber || prev.prNumber,
                        workStatus: parsed.workStatus || prev.workStatus,
                        systemsModules: Array.isArray(parsed.systemsModules) ? parsed.systemsModules.join(', ') : (parsed.systemsModules || prev.systemsModules),
                        apisModified: Array.isArray(parsed.apisModified) ? parsed.apisModified.join(', ') : (parsed.apisModified || prev.apisModified),
                        technologiesUsed: Array.isArray(parsed.technologiesUsed) ? parsed.technologiesUsed.join(', ') : (parsed.technologiesUsed || prev.technologiesUsed),
                        databasesTouched: Array.isArray(parsed.databasesTouched) ? parsed.databasesTouched.join(', ') : (parsed.databasesTouched || prev.databasesTouched),
                        infraServices: Array.isArray(parsed.infraServices) ? parsed.infraServices.join(', ') : (parsed.infraServices || prev.infraServices),
                        ownershipLevel: parsed.ownershipLevel || prev.ownershipLevel,
                        complexity: parsed.complexity || prev.complexity,
                        activities: parsed.activities || prev.activities,
                        engineeringImpact: parsed.engineeringImpact || prev.engineeringImpact,
                        reflection: parsed.reflection || prev.reflection,
                        testing: {
                            ...prev.testing,
                            ...parsed.testing,
                            testingType: parsed.testing?.testingType || prev.testing.testingType
                        }
                    }));
                    
                    // Switch to core tab to let user review parsed content
                    setActiveTab('core');
                    return 'AI structured your logs! Review tabs for structured data.';
                }
                return 'Parsed notes loaded.';
            },
            error: (err) => {
                setIsStructuring(false);
                console.error(err);
                if (err.response?.data?.quotaSafeguard) {
                    return err.response.data.message || 'AI parsing was safely queued. Please complete this log manually for now.';
                }
                return 'AI parsing failed. Please complete manually.';
            }
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setIsUploading(true);
        const toastId = toast.loading('Uploading image to ImageKit...');

        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    toast.error('Only image files are allowed', { id: toastId });
                    setIsUploading(false);
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    toast.error('Image size must be less than 5MB', { id: toastId });
                    setIsUploading(false);
                    return;
                }

                // Get auth signature
                const authData = await getImageKitAuthParams();

                const uploadForm = new FormData();
                uploadForm.append('file', file);
                uploadForm.append('fileName', file.name);
                uploadForm.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
                uploadForm.append('signature', authData.signature);
                uploadForm.append('expire', authData.expire);
                uploadForm.append('token', authData.token);

                const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                    method: 'POST',
                    body: uploadForm
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || 'Upload failed');
                }

                const result = await response.json();
                setImages(prev => [...prev, result.url]);
            }
            toast.success('Images uploaded successfully!', { id: toastId });
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error(`Image upload failed: ${error.message}`, { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove) => {
        setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
        toast.info('Image removed from log.');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Map form state to clean schema arrays
        const cleanArray = (str) => str.split('\n').map(s => s.trim()).filter(Boolean);
        const cleanCommaArray = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
            date: formData.date,
            status,
            noWorkReason: status !== 'Available' ? formData.noWorkReason : '',
            
            // Available fields
            project: status === 'Available' ? formData.project : '',
            task: status === 'Available' ? formData.task : '',
            workDone: status === 'Available' ? cleanArray(formData.workDone) : [],
            filesTouched: status === 'Available' ? cleanArray(formData.filesTouched) : [],
            techStack: status === 'Available' ? cleanCommaArray(formData.technologiesUsed || formData.techStack) : [],
            blockers: status === 'Available' ? formData.blockers : '',
            learnings: status === 'Available' ? cleanArray(formData.learnings) : [],
            impact: status === 'Available' ? cleanArray(formData.impact) : [],
            nextPlan: status === 'Available' ? formData.nextPlan : '',
            customFields: status === 'Available' ? formData.customFields : {},
            
            // Engineering enriched fields
            rawNotes: status === 'Available' ? rawNotes : '',
            sprint: status === 'Available' ? formData.sprint : '',
            jiraTicket: status === 'Available' ? formData.jiraTicket : '',
            prNumber: status === 'Available' ? formData.prNumber : '',
            workStatus: status === 'Available' ? formData.workStatus : '',
            systemsModules: status === 'Available' ? cleanCommaArray(formData.systemsModules) : [],
            apisModified: status === 'Available' ? cleanCommaArray(formData.apisModified) : [],
            technologiesUsed: status === 'Available' ? cleanCommaArray(formData.technologiesUsed || formData.techStack) : [],
            databasesTouched: status === 'Available' ? cleanCommaArray(formData.databasesTouched) : [],
            infraServices: status === 'Available' ? cleanCommaArray(formData.infraServices) : [],
            
            activities: status === 'Available' ? formData.activities : {},
            ownershipLevel: status === 'Available' ? formData.ownershipLevel : '',
            complexity: status === 'Available' ? formData.complexity : '',
            
            engineeringImpact: status === 'Available' ? formData.engineeringImpact : {},
            reflection: status === 'Available' ? formData.reflection : {},
            testing: status === 'Available' ? formData.testing : {},
            images: status === 'Available' ? images : []
        };

        mutation.mutate(payload);
    };

    // Quick chip selectors
    const handleAddChip = (field, value) => {
        const current = formData[field].split(',').map(t => t.trim()).filter(Boolean);
        if (current.includes(value)) {
            setFormData({ ...formData, [field]: current.filter(t => t !== value).join(', ') });
        } else {
            setFormData({ ...formData, [field]: [...current, value].join(', ') });
        }
    };

    const isChipActive = (field, value) => {
        return formData[field].split(',').map(t => t.trim()).filter(Boolean).includes(value);
    };

    // Dynamic Tab Completion Indicators
    const getTabState = (tab) => {
        if (status !== 'Available') return 'valid';
        if (tab === 'ai') return rawNotes.trim() ? 'valid' : 'empty';
        
        if (tab === 'core') {
            const hasRequired = formData.date && formData.project.trim() && formData.task.trim() && formData.workDone.trim() && formData.nextPlan.trim();
            return hasRequired ? 'valid' : 'invalid';
        }
        
        if (tab === 'system') {
            const hasSystems = formData.systemsModules.trim() || formData.technologiesUsed.trim() || formData.apisModified.trim();
            return hasSystems ? 'valid' : 'empty';
        }
        
        if (tab === 'metrics') {
            const hasMetrics = formData.sprint.trim() || formData.jiraTicket.trim() || formData.prNumber.trim() || formData.workStatus;
            return hasMetrics ? 'valid' : 'empty';
        }
        
        if (tab === 'safety') {
            const hasSafety = formData.blockers.trim() || formData.learnings.trim() || images.length > 0;
            return hasSafety ? 'valid' : 'empty';
        }
        
        return 'empty';
    };

    const renderTabIndicator = (tab) => {
        const state = getTabState(tab);
        if (state === 'valid') {
            return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
        }
        if (state === 'invalid') {
            return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />;
        }
        return <div className="w-1.5 h-1.5 rounded-full bg-muted/40 shrink-0" />;
    };

    // Tab categories matching color themes
    const tabThemeClasses = {
        ai: {
            active: 'border-teal-500/50 text-teal-400 bg-teal-500/5',
            glow: 'theme-glow-teal',
            accent: 'text-teal-400',
            bg: 'bg-teal-500'
        },
        core: {
            active: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/5',
            glow: 'theme-glow-indigo',
            accent: 'text-indigo-400',
            bg: 'bg-indigo-500'
        },
        system: {
            active: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5',
            glow: 'theme-glow-emerald',
            accent: 'text-emerald-400',
            bg: 'bg-emerald-500'
        },
        metrics: {
            active: 'border-amber-500/50 text-amber-400 bg-amber-500/5',
            glow: 'theme-glow-amber',
            accent: 'text-amber-400',
            bg: 'bg-amber-500'
        },
        safety: {
            active: 'border-rose-500/50 text-rose-400 bg-rose-500/5',
            glow: 'theme-glow-rose',
            accent: 'text-rose-400',
            bg: 'bg-rose-500'
        }
    };

    const currentTheme = tabThemeClasses[activeTab] || tabThemeClasses.core;

    const inputClasses = "w-full p-3 min-h-11 premium-input font-sans text-sm transition-colors border border-border/40 focus:border-indigo-400/40 bg-zinc-900/40";
    const textareaClasses = "w-full p-3 premium-input min-h-[104px] resize-y font-sans text-sm transition-colors border border-border/40 focus:border-indigo-400/40 bg-zinc-900/40 leading-relaxed";
    const monoTextareaClasses = "w-full p-4 premium-input min-h-[430px] resize-y font-mono text-sm text-teal-300 bg-slate-950/90 border border-teal-500/20 focus:border-teal-500/40 focus:ring-0 leading-relaxed";

    const PREDEFINED_TECH = ['Spring Boot', 'Kafka', 'Redis', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'gRPC', 'Java', 'Node.js'];
    const PREDEFINED_SYSTEMS = ['Payment Orchestrator', 'BNPL service', 'Webhook handler', 'caching Engine', 'Checkout flow', 'API gateway'];
    const PREDEFINED_DBS = ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'DynamoDB'];
    const PREDEFINED_INFRA = ['Docker', 'Kubernetes', 'AWS S3', 'LocalStack', 'GitHub Actions'];

    // Wizard Nav controls
    const tabList = ['ai', 'core', 'system', 'metrics', 'safety'];
    const tabLabels = {
        ai: '🤖 Fast AI',
        core: '💻 Core Log',
        system: '⚙️ Systems',
        metrics: '📊 Agile',
        safety: '🛡️ Retro'
    };

    const cleanTabLabels = {
        ai: 'AI Dump',
        core: 'Core',
        system: 'Systems',
        metrics: 'Agile',
        safety: 'Retro'
    };

    const handleNextTab = () => {
        const idx = tabList.indexOf(activeTab);
        if (idx < tabList.length - 1) {
            setActiveTab(tabList[idx + 1]);
        }
    };

    const handlePrevTab = () => {
        const idx = tabList.indexOf(activeTab);
        if (idx > 0) {
            setActiveTab(tabList[idx - 1]);
        }
    };

    const requiredReady = Boolean(formData.project.trim() && formData.task.trim() && formData.workDone.trim() && formData.nextPlan.trim());
    const parsedSignalCount = [
        formData.project,
        formData.task,
        formData.workDone,
        formData.systemsModules,
        formData.technologiesUsed,
        formData.jiraTicket,
        formData.nextPlan
    ].filter(value => String(value || '').trim()).length;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Status Switcher removed per user request */}

            {status !== 'Available' ? (
                <div className="space-y-4 pt-2">
                    <InputGroup label="Reason / Standup Update" icon={Coffee} required>
                        <textarea
                            required
                            disabled={readOnly}
                            placeholder="Details regarding leave, holiday, or waiting on requirements..."
                            className={textareaClasses}
                            value={formData.noWorkReason}
                            onChange={e => setFormData({ ...formData, noWorkReason: e.target.value })}
                        />
                    </InputGroup>
                    <InputGroup label="Contribution Date" icon={Calendar} required>
                        <input
                            type="date"
                            required
                            disabled={readOnly}
                            className={inputClasses}
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </InputGroup>
                    
                    {!readOnly && (
                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="w-full bg-accent text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-accent/90 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Out of Office Status</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    {/* Modern Top Horizontal Wizard Navigation */}
                    <div className="grid grid-cols-5 border border-border/40 bg-zinc-950/30 rounded-lg p-1 mb-3 shrink-0 gap-1">
                        {tabList.map((tab) => {
                            const isCurrent = activeTab === tab;
                            const theme = tabThemeClasses[tab];
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={`min-w-0 py-2 px-1.5 rounded-md flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border border-transparent ${
                                        isCurrent 
                                            ? theme.active
                                            : 'text-muted hover:text-text hover:bg-surface/30'
                                    }`}
                                >
                                    {renderTabIndicator(tab)}
                                    <span className="truncate">{cleanTabLabels[tab]}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Tab Panels (Inner scroll container - strictly single scrollbar) */}
                    <div className="overflow-y-auto pr-1 max-h-[calc(100vh-170px)] pb-3">
                            <div
                                key={activeTab}
                                className="p-4 md:p-5 rounded-lg border border-border/35 bg-zinc-950/20"
                            >
                                {/* PANEL 1: AI PARSING DUMP */}
                                {activeTab === 'ai' && (
                                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_360px] gap-4">
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
                                                        <Sparkles className="w-4 h-4 text-teal-300" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-text">Dump your whole day here</h3>
                                                        <p className="text-[11px] text-muted mt-0.5">Terminal notes, standup text, commits, tickets, blockers, tomorrow plan.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAIStructure}
                                                    disabled={isStructuring || !rawNotes.trim()}
                                                    className="bg-teal-400 hover:bg-teal-300 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                                >
                                                    {isStructuring ? (
                                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                                                    ) : (
                                                        <Brain className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>{isStructuring ? 'Structuring...' : 'Structure with AI'}</span>
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <textarea
                                                    disabled={readOnly}
                                                    placeholder={'Paste everything here...\n\nExample:\n- worked on FINERACT callback retry handler\n- PAY-1234, PR #456\n- changed paymentCallbackController.js and retryWorker.js\n- added tests for 429 timeout retry\n- blocker: sandbox webhook was flaky\n- tomorrow: finish integration test and raise PR'}
                                                    className={monoTextareaClasses}
                                                    value={rawNotes}
                                                    onChange={e => setRawNotes(e.target.value)}
                                                />
                                                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[9px] font-bold text-teal-400/50 uppercase select-none">
                                                    <Terminal className="w-3 h-3" />
                                                    <span>{rawNotes.length} chars</span>
                                                </div>
                                            </div>
                                        </div>

                                        <aside className="space-y-3">
                                            <div className="bg-card border border-border rounded-lg p-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Auto-fill readiness</span>
                                                    <span className={`badge ${requiredReady ? 'badge-success' : 'badge-warning'}`}>
                                                        {requiredReady ? 'Ready' : 'Needs review'}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                    <div className="bg-surface/40 rounded-md p-2 border border-border/30">
                                                        <span className="text-muted block text-[10px] uppercase">Signals</span>
                                                        <span className="text-text font-mono text-lg">{parsedSignalCount}/7</span>
                                                    </div>
                                                    <div className="bg-surface/40 rounded-md p-2 border border-border/30">
                                                        <span className="text-muted block text-[10px] uppercase">Work items</span>
                                                        <span className="text-text font-mono text-lg">{formData.workDone.split('\n').filter(Boolean).length}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
                                                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Current extract</span>
                                                {[
                                                    ['Project', formData.project],
                                                    ['Task', formData.task],
                                                    ['Ticket', formData.jiraTicket],
                                                    ['Systems', formData.systemsModules],
                                                    ['Next', formData.nextPlan]
                                                ].map(([label, value]) => (
                                                    <div key={label} className="border-b border-border/20 last:border-0 pb-2 last:pb-0">
                                                        <span className="text-[10px] text-muted uppercase block">{label}</span>
                                                        <span className="text-xs text-text line-clamp-2">{value || 'Not filled yet'}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('core')}
                                                    className="px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-text hover:border-zinc-500 transition-colors"
                                                >
                                                    Review Core
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('system')}
                                                    className="px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-text hover:border-zinc-500 transition-colors"
                                                >
                                                    Review Systems
                                                </button>
                                            </div>
                                        </aside>
                                    </div>
                                )}

                                {/* PANEL 2: CORE LOGS */}
                                {activeTab === 'core' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                                            <Code className="w-4 h-4 text-indigo-400" />
                                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Required Contribution Info</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputGroup label="Contribution Date" icon={Calendar} required themeColor="text-indigo-400">
                                                <input
                                                    type="date"
                                                    required
                                                    disabled={readOnly}
                                                    className={inputClasses}
                                                    value={formData.date}
                                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="Core Project Scope" icon={FileText} required themeColor="text-indigo-400">
                                                <input
                                                    type="text"
                                                    required
                                                    disabled={readOnly}
                                                    placeholder="e.g. Payment Callback Service Integration"
                                                    className={inputClasses}
                                                    value={formData.project}
                                                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                                                />
                                            </InputGroup>
                                        </div>

                                        <InputGroup label="Primary Standup Task Description" icon={Briefcase} required themeColor="text-indigo-400">
                                            <input
                                                type="text"
                                                required
                                                disabled={readOnly}
                                                placeholder="e.g. Refactor payment retry queue callback logic"
                                                className={inputClasses}
                                                value={formData.task}
                                                onChange={e => setFormData({ ...formData, task: e.target.value })}
                                            />
                                        </InputGroup>

                                        <InputGroup label="Work Done Today (One bullet point per line)" icon={FileText} required themeColor="text-indigo-400">
                                            <textarea
                                                required
                                                disabled={readOnly}
                                                rows="4"
                                                placeholder="- Refactored callback controller to handle 429 webhook retries&#10;- Wrote unit tests for RetryWebhookProcessor handling Mock timeouts"
                                                className={textareaClasses}
                                                value={formData.workDone}
                                                onChange={e => setFormData({ ...formData, workDone: e.target.value })}
                                            />
                                        </InputGroup>

                                        <InputGroup label="Next Day Plan" icon={ArrowRight} required themeColor="text-indigo-400">
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
                                    </div>
                                )}

                                {/* PANEL 3: SYSTEMS & TECH */}
                                {activeTab === 'system' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                                            <Server className="w-4 h-4 text-emerald-400" />
                                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Architectural Context</h3>
                                        </div>

                                        {/* Systems Touched */}
                                        <InputGroup label="Systems & Modules Touched" icon={Server} themeColor="text-emerald-400">
                                            {!readOnly && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {PREDEFINED_SYSTEMS.map(sys => (
                                                        <button
                                                            key={sys}
                                                            type="button"
                                                            onClick={() => handleAddChip('systemsModules', sys)}
                                                            className={`pill-chip ${
                                                                isChipActive('systemsModules', sys) ? 'pill-chip-active' : ''
                                                            }`}
                                                        >
                                                            {sys}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                disabled={readOnly}
                                                placeholder="e.g. Webhook handler, Payment retry module (comma separated)"
                                                className={inputClasses}
                                                value={formData.systemsModules}
                                                onChange={e => setFormData({ ...formData, systemsModules: e.target.value })}
                                            />
                                        </InputGroup>

                                        {/* Technologies Used */}
                                        <InputGroup label="Technologies Used" icon={Code} themeColor="text-emerald-400">
                                            {!readOnly && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {PREDEFINED_TECH.map(tech => (
                                                        <button
                                                            key={tech}
                                                            type="button"
                                                            onClick={() => handleAddChip('technologiesUsed', tech)}
                                                            className={`pill-chip ${
                                                                isChipActive('technologiesUsed', tech) ? 'pill-chip-active' : ''
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
                                                placeholder="e.g. Spring Boot, Kafka, Redis (comma separated)"
                                                className={inputClasses}
                                                value={formData.technologiesUsed}
                                                onChange={e => setFormData({ ...formData, technologiesUsed: e.target.value })}
                                            />
                                        </InputGroup>

                                        {/* APIs Modified, Databases, Infra */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <InputGroup label="APIs Created/Modified" icon={Code} themeColor="text-emerald-400">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. POST /payments/refund"
                                                    className={inputClasses}
                                                    value={formData.apisModified}
                                                    onChange={e => setFormData({ ...formData, apisModified: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="Databases" icon={Database} themeColor="text-emerald-400">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. PostgreSQL, Redis"
                                                    className={inputClasses}
                                                    value={formData.databasesTouched}
                                                    onChange={e => setFormData({ ...formData, databasesTouched: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="Infrastructure Services" icon={Server} themeColor="text-emerald-400">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. Docker, AWS S3"
                                                    className={inputClasses}
                                                    value={formData.infraServices}
                                                    onChange={e => setFormData({ ...formData, infraServices: e.target.value })}
                                                />
                                            </InputGroup>
                                        </div>

                                        <InputGroup label="Files Touched (One path per line)" icon={FileText} themeColor="text-emerald-400">
                                            <textarea
                                                disabled={readOnly}
                                                rows="2"
                                                placeholder="e.g. server/src/controllers/paymentController.js"
                                                className={textareaClasses}
                                                value={formData.filesTouched}
                                                onChange={e => setFormData({ ...formData, filesTouched: e.target.value })}
                                            />
                                        </InputGroup>
                                    </div>
                                )}

                                {/* PANEL 4: DEVELOMENT METRICS */}
                                {activeTab === 'metrics' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                                            <Zap className="w-4 h-4 text-amber-400" />
                                            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Agile & Development Velocity</h3>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <InputGroup label="Sprint / Week" icon={Calendar} themeColor="text-amber-400">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. Sprint 3"
                                                    className={inputClasses}
                                                    value={formData.sprint}
                                                    onChange={e => setFormData({ ...formData, sprint: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="Jira Ticket" icon={Briefcase} themeColor="text-amber-400">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. PAY-1234"
                                                    className={inputClasses}
                                                    value={formData.jiraTicket}
                                                    onChange={e => setFormData({ ...formData, jiraTicket: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="PR Number" icon={GitPullRequest} themeColor="text-amber-400">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. #456"
                                                    className={inputClasses}
                                                    value={formData.prNumber}
                                                    onChange={e => setFormData({ ...formData, prNumber: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="Work Status" icon={Zap} themeColor="text-amber-400">
                                                <select
                                                    disabled={readOnly}
                                                    className={inputClasses}
                                                    value={formData.workStatus}
                                                    onChange={e => setFormData({ ...formData, workStatus: e.target.value })}
                                                >
                                                    <option value="">Select Status</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="blocked">Blocked</option>
                                                    <option value="review">In Review</option>
                                                    <option value="deployed">Deployed</option>
                                                </select>
                                            </InputGroup>
                                        </div>

                                        {/* Counters */}
                                        <div className="border border-border/20 rounded-lg p-4 bg-zinc-950/20 space-y-4">
                                            <span className="text-xs font-bold text-muted uppercase block tracking-wider">Metrics Counters</span>
                                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                                                {[
                                                    { field: 'bugsFixed', label: 'Bugs Fixed' },
                                                    { field: 'featuresImplemented', label: 'Features Done' },
                                                    { field: 'prsCreated', label: 'PRs Created' },
                                                    { field: 'prsReviewed', label: 'PRs Reviewed' },
                                                    { field: 'meetingsAttended', label: 'Meetings' },
                                                    { field: 'testsWritten', label: 'Tests Written' }
                                                ].map(item => (
                                                    <div key={item.field} className="bg-surface/30 border border-border/30 p-3 rounded-lg text-center space-y-2 min-h-[96px] flex flex-col justify-center">
                                                        <span className="text-[11px] font-bold text-muted uppercase block leading-tight">{item.label}</span>
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button
                                                                type="button"
                                                                disabled={readOnly}
                                                                onClick={() => setFormData({
                                                                    ...formData,
                                                                    activities: {
                                                                        ...formData.activities,
                                                                        [item.field]: Math.max(0, (formData.activities[item.field] || 0) - 1)
                                                                    }
                                                                })}
                                                                className="text-base font-black text-muted hover:text-rose-500 w-8 h-8 flex items-center justify-center bg-card border border-border/40 rounded-md disabled:opacity-40"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-xl font-extrabold text-text font-mono min-w-6 text-center">
                                                                {formData.activities[item.field] || 0}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={readOnly}
                                                                onClick={() => setFormData({
                                                                    ...formData,
                                                                    activities: {
                                                                        ...formData.activities,
                                                                        [item.field]: (formData.activities[item.field] || 0) + 1
                                                                    }
                                                                })}
                                                                className="text-base font-black text-muted hover:text-emerald-500 w-8 h-8 flex items-center justify-center bg-card border border-border/40 rounded-md disabled:opacity-40"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Complexity and Toggles */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputGroup label="Complexity" icon={Brain} themeColor="text-amber-400">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['low', 'medium', 'high'].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            disabled={readOnly}
                                                            onClick={() => setFormData({ ...formData, complexity: val })}
                                                            className={`py-1.5 rounded-lg border text-center text-[10px] font-bold uppercase transition-all ${
                                                                formData.complexity === val
                                                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                                                    : 'bg-card border-border text-muted hover:text-text'
                                                            }`}
                                                        >
                                                            {val}
                                                        </button>
                                                    ))}
                                                </div>
                                            </InputGroup>

                                            <InputGroup label="Ownership Level" icon={Shield} themeColor="text-amber-400">
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {['assisted', 'independent', 'pair-programmed', 'led-discussion'].map(val => (
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            disabled={readOnly}
                                                            onClick={() => setFormData({ ...formData, ownershipLevel: val })}
                                                            className={`py-1.5 px-1 rounded-lg border text-center text-[9px] font-bold uppercase truncate transition-all ${
                                                                formData.ownershipLevel === val
                                                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                                                    : 'bg-card border-border text-muted hover:text-text'
                                                            }`}
                                                        >
                                                            {val.replace('-', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </InputGroup>
                                        </div>
                                    </div>
                                )}

                                {/* PANEL 5: SAFETY, learnings, SCREENSHOTS */}
                                {activeTab === 'safety' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                                            <AlertCircle className="w-4 h-4 text-rose-400" />
                                            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest">Retrospectives & Blockers</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputGroup label="Blockers & Challenges" icon={AlertCircle} themeColor="text-rose-400">
                                                <textarea
                                                    rows="2"
                                                    disabled={readOnly}
                                                    placeholder="e.g. Sandbox database locks or timeout issues on downstream systems"
                                                    className={textareaClasses}
                                                    value={formData.blockers}
                                                    onChange={e => setFormData({ ...formData, blockers: e.target.value })}
                                                />
                                            </InputGroup>
                                            <InputGroup label="Technical Learnings" icon={Lightbulb} themeColor="text-rose-400">
                                                <textarea
                                                    rows="2"
                                                    disabled={readOnly}
                                                    placeholder="e.g. Learned transaction lock boundaries in PostgreSQL..."
                                                    className={textareaClasses}
                                                    value={formData.learnings}
                                                    onChange={e => setFormData({ ...formData, learnings: e.target.value })}
                                                />
                                            </InputGroup>
                                        </div>

                                        {/* Image Attachments */}
                                        <div className="border border-border/20 rounded-lg p-3 bg-zinc-950/20 space-y-3">
                                            <span className="text-[10px] font-bold text-muted uppercase block tracking-wider">Metric Graphs & Screenshots</span>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {!readOnly && (
                                                    <label className="flex flex-col items-center justify-center border border-dashed border-border/50 hover:border-rose-400/40 bg-zinc-900/40 rounded-lg p-4 cursor-pointer hover:bg-card/20 transition-all group shrink-0">
                                                        <Upload className="w-4 h-4 text-muted group-hover:text-rose-400 mb-1 transition-colors" />
                                                        <span className="text-[10px] font-bold text-text/80 group-hover:text-rose-400 transition-colors">
                                                            {isUploading ? 'Uploading...' : 'Click to Upload Screenshot'}
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            disabled={isUploading}
                                                            onChange={handleImageUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-muted uppercase block">Attached Images ({images.length})</span>
                                                    {images.length === 0 ? (
                                                        <div className="text-[10px] text-muted/65 italic pt-2">No screenshots attached to this contribution.</div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 gap-1.5 max-h-[75px] overflow-y-auto">
                                                            {images.map((imgUrl, idx) => (
                                                                <div key={idx} className="relative group rounded overflow-hidden border border-border/40 aspect-video bg-slate-950">
                                                                    <img
                                                                        src={imgUrl}
                                                                        alt={`Attachment ${idx + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {!readOnly && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveImage(idx)}
                                                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>

                    {/* Navigation Wizard Footer (Sticky control panel) */}
                    <div className="flex justify-between items-center pt-3 border-t border-border/20 bg-card shrink-0 gap-3">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handlePrevTab}
                                disabled={tabList.indexOf(activeTab) === 0}
                                className="px-3 py-2 text-xs font-bold bg-surface border border-border/50 rounded-lg text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextTab}
                                disabled={tabList.indexOf(activeTab) === tabList.length - 1}
                                className="px-3 py-2 text-xs font-bold bg-surface border border-border/50 rounded-lg text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {!readOnly && activeTab === 'ai' && (
                            <button
                                type="button"
                                onClick={handleAIStructure}
                                disabled={isStructuring || !rawNotes.trim()}
                                className="flex-1 py-2 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isStructuring ? (
                                    <>
                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                                        <span>Structuring Log...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-3.5 h-3.5" />
                                        <span>Structure and Review</span>
                                    </>
                                )}
                            </button>
                        )}

                        {!readOnly && activeTab !== 'ai' && (
                            <button
                                type="submit"
                                disabled={mutation.isPending || isStructuring}
                                className={`flex-1 py-2 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-white ${currentTheme.bg} hover:opacity-90 shadow-md`}
                            >
                                {mutation.isPending ? (
                                    <>
                                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                        <span>Saving Contribution...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save Engineering Log</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            )}

            <TemplateConfigModal 
                isOpen={isTemplateModalOpen} 
                onClose={() => setIsTemplateModalOpen(false)} 
            />
        </div>
    );
};

export default LogForm;
