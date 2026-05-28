import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLog, updateLog, getSuggestions, getLatestLog, structureRawNotes, getImageKitAuthParams } from '../services/logService';
import { 
    Save, Calendar, FileText, Coffee, Briefcase, AlertCircle, Lightbulb, 
    Zap, ArrowRight, ChevronDown, ChevronUp, Sparkles, Terminal, 
    Database, Server, Shield, Brain, GitPullRequest, Code, Settings, Bug,
    Image, Trash2, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import TemplateConfigModal from './TemplateConfigModal';

// Redesigned InputGroup to match professional engineering context
const InputGroup = ({ label, icon: Icon, children, required = false, collapsible = false, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (collapsible) {
        return (
            <div className="border border-border/40 rounded-xl bg-card/20 p-4 space-y-3 transition-all duration-200">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-text/80 hover:text-accent transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-accent" />}
                        <span>{label}</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-visible"
                        >
                            <div className="pt-2 border-t border-border/20 space-y-4">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 w-full">
            <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
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
    
    // Collapsed/Show More state for Sections 5-9
    const [showMore, setShowMore] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isStructuring, setIsStructuring] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState(log?.images || []);

    // Schema matching state
    const [rawNotes, setRawNotes] = useState(log?.rawNotes || '');
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

    const mutation = useMutation({
        mutationFn: (data) => log ? updateLog(log._id, data) : createLog(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['logs']);
            queryClient.invalidateQueries(['engineeringStats']);
            queryClient.invalidateQueries(['systemsTimeline']);
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
        toast.promise(structureRawNotes(rawNotes), {
            loading: 'Senior Engineer AI parsing raw notes...',
            success: (parsed) => {
                setIsStructuring(false);
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
                    
                    // Show extra fields so the user sees all parsed intelligence
                    setShowMore(true);
                    return 'Raw notes successfully converted into engineering metrics!';
                }
                return 'Parsed notes loaded.';
            },
            error: (err) => {
                setIsStructuring(false);
                console.error(err);
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

    const inputClasses = "w-full p-3 premium-input font-sans text-sm";
    const textareaClasses = "w-full p-3 premium-input min-h-[90px] resize-y font-sans text-sm";
    const monoTextareaClasses = "w-full p-3 premium-input min-h-[95px] resize-y font-mono text-xs text-teal-400 bg-slate-950/60";

    const PREDEFINED_TECH = ['Spring Boot', 'Kafka', 'Redis', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'gRPC', 'Java', 'Node.js'];
    const PREDEFINED_SYSTEMS = ['Payment Orchestrator', 'BNPL service', 'Webhook handler', 'caching Engine', 'Checkout flow', 'API gateway'];
    const PREDEFINED_DBS = ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'DynamoDB'];
    const PREDEFINED_INFRA = ['Docker', 'Kubernetes', 'AWS S3', 'LocalStack', 'GitHub Actions'];

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[82vh] overflow-y-auto px-1 pr-2 scrollbar-thin">
            {/* Status Switcher */}
            <div className="flex justify-between items-center bg-card/40 p-1.5 rounded-xl border border-border/50">
                <div className="flex flex-1 gap-1">
                    {['Available', 'No Work', 'Leave', 'Holiday'].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        disabled={readOnly}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                            status === s 
                            ? 'bg-accent text-white shadow-md shadow-accent/15' 
                            : 'text-muted hover:text-text hover:bg-surface/50'
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
                        className="px-3 text-[10px] font-bold uppercase bg-surface border border-border rounded-lg text-muted hover:text-accent hover:border-accent/40 transition-colors mx-2 py-1.5 flex items-center gap-1"
                    >
                        <Settings className="w-3 h-3" />
                        <span>Fields</span>
                    </button>
                )}
            </div>

            {/* Date Field */}
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

            <AnimatePresence mode="wait">
                {status !== 'Available' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key="no-work"
                    >
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
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="work"
                        className="space-y-6"
                    >
                        {/* SECTION 1: QUICK RAW NOTES (TOP FLIGHT AI ENGINE) */}
                        {!readOnly && (
                            <div className="border border-teal-500/20 bg-teal-500/[0.02] p-5 rounded-2xl space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-25">
                                    <Terminal className="w-20 h-20 text-teal-400" />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Fast Raw Notes Dump</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAIStructure}
                                        disabled={isStructuring || !rawNotes.trim()}
                                        className="bg-teal-500/10 hover:bg-teal-500 hover:text-slate-950 border border-teal-500/30 text-teal-400 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isStructuring ? (
                                            <>
                                                <div className="animate-spin h-3 w-3 border-2 border-teal-400/30 border-t-teal-400 rounded-full" />
                                                <span>Structuring...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Brain className="w-3.5 h-3.5" />
                                                <span>AI Parse & Auto-fill</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <textarea
                                    disabled={readOnly}
                                    placeholder="Paste terminal logs, git commit messages, slack updates, or messy bullet points here. The AI will structure them perfectly below!"
                                    className={monoTextareaClasses}
                                    value={rawNotes}
                                    onChange={e => setRawNotes(e.target.value)}
                                />
                                <p className="text-[10px] text-muted">
                                    💡 <strong>Pro-Tip:</strong> Type/paste messy notes and click "AI Parse". Sections below will auto-complete instantly.
                                </p>
                            </div>
                        )}

                        {/* SECTION 2: ENGINEERING METADATA */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <InputGroup label="Sprint / Week" icon={Calendar}>
                                <input
                                    type="text"
                                    disabled={readOnly}
                                    placeholder="e.g. Sprint 3"
                                    className={inputClasses}
                                    value={formData.sprint}
                                    onChange={e => setFormData({ ...formData, sprint: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup label="Jira Ticket" icon={Briefcase}>
                                <input
                                    type="text"
                                    disabled={readOnly}
                                    placeholder="e.g. PAY-1234"
                                    className={inputClasses}
                                    value={formData.jiraTicket}
                                    onChange={e => setFormData({ ...formData, jiraTicket: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup label="PR Number" icon={GitPullRequest}>
                                <input
                                    type="text"
                                    disabled={readOnly}
                                    placeholder="e.g. #456"
                                    className={inputClasses}
                                    value={formData.prNumber}
                                    onChange={e => setFormData({ ...formData, prNumber: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup label="Work Status" icon={Zap}>
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

                        {/* SECTION 3: SYSTEMS & TECHNOLOGIES */}
                        <div className="space-y-4 border-t border-border/20 pt-4">
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-accent mb-2">Systems & Architectures</h4>
                            
                            {/* Systems Touched */}
                            <InputGroup label="Systems & Modules Touched" icon={Server}>
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
                            <InputGroup label="Technologies Used" icon={Code}>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputGroup label="APIs Created/Modified" icon={Code}>
                                    <input
                                        type="text"
                                        disabled={readOnly}
                                        placeholder="e.g. POST /payments/refund"
                                        className={inputClasses}
                                        value={formData.apisModified}
                                        onChange={e => setFormData({ ...formData, apisModified: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Databases Touched" icon={Database}>
                                    {!readOnly && (
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                            {PREDEFINED_DBS.map(db => (
                                                <button
                                                    key={db}
                                                    type="button"
                                                    onClick={() => handleAddChip('databasesTouched', db)}
                                                    className={`pill-chip ${
                                                        isChipActive('databasesTouched', db) ? 'pill-chip-active' : ''
                                                    }`}
                                                >
                                                    {db}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        disabled={readOnly}
                                        placeholder="e.g. PostgreSQL, Redis"
                                        className={inputClasses}
                                        value={formData.databasesTouched}
                                        onChange={e => setFormData({ ...formData, databasesTouched: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Infrastructure Services" icon={Server}>
                                    {!readOnly && (
                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                            {PREDEFINED_INFRA.map(inf => (
                                                <button
                                                    key={inf}
                                                    type="button"
                                                    onClick={() => handleAddChip('infraServices', inf)}
                                                    className={`pill-chip ${
                                                        isChipActive('infraServices', inf) ? 'pill-chip-active' : ''
                                                    }`}
                                                >
                                                    {inf}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                        </div>

                        {/* SECTION 4: TASKS & DETAILS */}
                        <div className="space-y-4 border-t border-border/20 pt-4">
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-accent mb-2">Work Description & Scope</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Core Project Scope" icon={FileText} required>
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
                                <InputGroup label="Primary Standup Task Description" icon={Briefcase} required>
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
                            </div>

                            <InputGroup label="Work Done Today (One bullet point per line)" icon={FileText} required>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {template.visibleFields.blockers && (
                                    <InputGroup label="Blockers & Challenges" icon={AlertCircle}>
                                        <textarea
                                            rows="3"
                                            disabled={readOnly}
                                            placeholder="e.g. Sandbox database locks or timeout issues on downstream payment retry mock..."
                                            className={textareaClasses}
                                            value={formData.blockers}
                                            onChange={e => setFormData({ ...formData, blockers: e.target.value })}
                                        />
                                    </InputGroup>
                                )}
                                {template.visibleFields.learnings && (
                                    <InputGroup label="Technical Learnings" icon={Lightbulb}>
                                        <textarea
                                            rows="3"
                                            disabled={readOnly}
                                            placeholder="e.g. Learned transaction lock boundaries in PostgreSQL when doing concurrent updates..."
                                            className={textareaClasses}
                                            value={formData.learnings}
                                            onChange={e => setFormData({ ...formData, learnings: e.target.value })}
                                        />
                                    </InputGroup>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {template.visibleFields.impact && (
                                    <InputGroup label="System Impact today" icon={Zap}>
                                        <textarea
                                            rows="3"
                                            disabled={readOnly}
                                            placeholder="e.g. Reduced callback failures by 35% using exponential backoff retry schedules..."
                                            className={textareaClasses}
                                            value={formData.impact}
                                            onChange={e => setFormData({ ...formData, impact: e.target.value })}
                                        />
                                    </InputGroup>
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
                            </div>
                        </div>

                        {/* EXPANDABLE SECTIONS 5-9: ENRICHED DEVELOPMENT INTELLIGENCE */}
                        <div className="border-t border-border/20 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowMore(!showMore)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-card/30 hover:bg-card/65 border border-border/60 rounded-xl text-xs font-bold uppercase tracking-wider text-muted hover:text-text transition-all duration-150 cursor-pointer"
                            >
                                <span>{showMore ? 'Collapse Advanced Metrics' : 'Show Advanced Enriched Metrics'}</span>
                                {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <AnimatePresence>
                                {showMore && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden space-y-6 pt-6"
                                    >
                                        {/* SECTION 5: ACTIVITY TRACKING */}
                                        <div className="border border-border/40 rounded-xl p-4 bg-card/10 space-y-4">
                                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                                                <Bug className="w-3.5 h-3.5" />
                                                <span>Section 5: Daily Activity Tracking & Metrics</span>
                                            </h5>

                                            {/* Counters */}
                                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                                {[
                                                    { field: 'bugsFixed', label: 'Bugs Fixed' },
                                                    { field: 'featuresImplemented', label: 'Features Done' },
                                                    { field: 'prsCreated', label: 'PRs Created' },
                                                    { field: 'prsReviewed', label: 'PRs Reviewed' },
                                                    { field: 'meetingsAttended', label: 'Meetings' },
                                                    { field: 'testsWritten', label: 'Tests Written' }
                                                ].map(item => (
                                                    <div key={item.field} className="bg-surface/50 border border-border/40 p-2.5 rounded-lg text-center space-y-1">
                                                        <span className="text-[10px] font-bold text-muted uppercase block">{item.label}</span>
                                                        <div className="flex items-center justify-center gap-2">
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
                                                                className="text-xs font-black text-muted hover:text-rose-500 w-5 h-5 flex items-center justify-center bg-card rounded"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-sm font-extrabold text-text font-mono">
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
                                                                className="text-xs font-black text-muted hover:text-emerald-500 w-5 h-5 flex items-center justify-center bg-card rounded"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Booleans Toggles */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                                                {[
                                                    { field: 'debugging', label: 'Debugging Session' },
                                                    { field: 'architectureDiscussion', label: 'System Design Talk' },
                                                    { field: 'codeReview', label: 'Code Reviewing' },
                                                    { field: 'deployment', label: 'Prod Deployment' }
                                                ].map(item => (
                                                    <label 
                                                        key={item.field}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                                                            formData.activities[item.field]
                                                                ? 'bg-accent/15 border-accent/40 text-accent'
                                                                : 'bg-surface/30 border-border/50 text-muted hover:text-text'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            disabled={readOnly}
                                                            checked={formData.activities[item.field] || false}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                activities: {
                                                                    ...formData.activities,
                                                                    [item.field]: e.target.checked
                                                                }
                                                            })}
                                                            className="sr-only"
                                                        />
                                                        <span>{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* SECTION 6: OWNERSHIP & COMPLEXITY */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputGroup label="Ownership & Collaboration Level" icon={Shield}>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {[
                                                        { val: 'assisted', label: 'Assisted' },
                                                        { val: 'pair-programmed', label: 'Pair Programmed' },
                                                        { val: 'independent', label: 'Independent' },
                                                        { val: 'led-discussion', label: 'Led Discussion' }
                                                    ].map(item => (
                                                        <button
                                                            key={item.val}
                                                            type="button"
                                                            disabled={readOnly}
                                                            onClick={() => setFormData({ ...formData, ownershipLevel: item.val })}
                                                            className={`p-2.5 rounded-lg border text-center text-xs font-semibold tracking-wide transition-all ${
                                                                formData.ownershipLevel === item.val
                                                                    ? 'bg-accent/20 border-accent/50 text-accent font-bold'
                                                                    : 'bg-card border-border text-muted hover:text-text'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </InputGroup>

                                            <InputGroup label="Task Complexity" icon={Brain}>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { val: 'low', label: 'Low Complexity' },
                                                        { val: 'medium', label: 'Medium' },
                                                        { val: 'high', label: 'High Complexity' }
                                                    ].map(item => (
                                                        <button
                                                            key={item.val}
                                                            type="button"
                                                            disabled={readOnly}
                                                            onClick={() => setFormData({ ...formData, complexity: item.val })}
                                                            className={`p-2.5 rounded-lg border text-center text-xs font-semibold tracking-wide transition-all ${
                                                                formData.complexity === item.val
                                                                    ? 'bg-accent/20 border-accent/50 text-accent font-bold'
                                                                    : 'bg-card border-border text-muted hover:text-text'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </InputGroup>
                                        </div>

                                        {/* SECTION 7: DETAILED SYSTEM IMPACT */}
                                        <div className="border border-border/40 rounded-xl p-4 bg-card/10 space-y-4">
                                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5" />
                                                <span>Section 7: Specific System Impact Narratives</span>
                                            </h5>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputGroup label="What exactly changed in codebase?">
                                                    <input
                                                        type="text"
                                                        disabled={readOnly}
                                                        placeholder="e.g. Added exp backoff webhook client queue"
                                                        className={inputClasses}
                                                        value={formData.engineeringImpact.whatChanged}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            engineeringImpact: { ...formData.engineeringImpact, whatChanged: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Why did this change matter?">
                                                    <input
                                                        type="text"
                                                        disabled={readOnly}
                                                        placeholder="e.g. Prevents server crashing when webhooks error out"
                                                        className={inputClasses}
                                                        value={formData.engineeringImpact.whyItMattered}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            engineeringImpact: { ...formData.engineeringImpact, whyItMattered: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Downstream system problem solved">
                                                    <input
                                                        type="text"
                                                        disabled={readOnly}
                                                        placeholder="e.g. Prevents redundant queue payload locking"
                                                        className={inputClasses}
                                                        value={formData.engineeringImpact.problemSolved}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            engineeringImpact: { ...formData.engineeringImpact, problemSolved: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Team blocker removed by you">
                                                    <input
                                                        type="text"
                                                        disabled={readOnly}
                                                        placeholder="e.g. Wrote mock endpoints helping frontend test"
                                                        className={inputClasses}
                                                        value={formData.engineeringImpact.blockerRemoved}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            engineeringImpact: { ...formData.engineeringImpact, blockerRemoved: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                            </div>
                                        </div>

                                        {/* SECTION 8: RIGOROUS TESTING */}
                                        <div className="border border-border/40 rounded-xl p-4 bg-card/10 space-y-4">
                                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                                                <Shield className="w-3.5 h-3.5" />
                                                <span>Section 8: Engineering Testing & Safety Rigor</span>
                                            </h5>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputGroup label="Testing Types Verified">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {['unit', 'integration', 'e2e', 'manual'].map(t => {
                                                            const active = formData.testing.testingType?.includes(t);
                                                            return (
                                                                <button
                                                                    key={t}
                                                                    type="button"
                                                                    disabled={readOnly}
                                                                    onClick={() => {
                                                                        const current = formData.testing.testingType || [];
                                                                        const updated = current.includes(t)
                                                                            ? current.filter(x => x !== t)
                                                                            : [...current, t];
                                                                        setFormData({
                                                                            ...formData,
                                                                            testing: { ...formData.testing, testingType: updated }
                                                                        });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-colors ${
                                                                        active
                                                                            ? 'bg-accent/25 border-accent/40 text-accent'
                                                                            : 'bg-card border-border text-muted hover:text-text'
                                                                    }`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </InputGroup>
                                                <InputGroup label="Unit Coverage details">
                                                    <input
                                                        type="text"
                                                        disabled={readOnly}
                                                        placeholder="e.g. Added 9 unit tests using Mockito (92% line coverage)"
                                                        className={inputClasses}
                                                        value={formData.testing.coverageNotes}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            testing: { ...formData.testing, coverageNotes: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                            </div>
                                            <InputGroup label="Brief summary of tests added/changed">
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    placeholder="e.g. Added retry queue validation unit tests and regression mocks..."
                                                    className={inputClasses}
                                                    value={formData.testing.testsAdded}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        testing: { ...formData.testing, testsAdded: e.target.value }
                                                    })}
                                                />
                                            </InputGroup>
                                        </div>

                                        {/* SECTION 9: REFLECTIONS */}
                                        <div className="border border-border/40 rounded-xl p-4 bg-card/10 space-y-4">
                                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                                                <Brain className="w-3.5 h-3.5" />
                                                <span>Section 9: Daily Engineering Reflections</span>
                                            </h5>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <InputGroup label="Biggest Technical Learning today">
                                                    <textarea
                                                        rows="2"
                                                        disabled={readOnly}
                                                        placeholder="What concept did you master today?"
                                                        className={textareaClasses}
                                                        value={formData.reflection.biggestLearning}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            reflection: { ...formData.reflection, biggestLearning: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Biggest Engineering Blocker today">
                                                    <textarea
                                                        rows="2"
                                                        disabled={readOnly}
                                                        placeholder="What was your main architectural roadblock?"
                                                        className={textareaClasses}
                                                        value={formData.reflection.biggestBlocker}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            reflection: { ...formData.reflection, biggestBlocker: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                                <InputGroup label="What confused me about internal systems">
                                                    <textarea
                                                        rows="2"
                                                        disabled={readOnly}
                                                        placeholder="Any internal systems logic that was confusing?"
                                                        className={textareaClasses}
                                                        value={formData.reflection.whatConfusedMe}
                                                        onChange={e => setFormData({
                                                            ...formData,
                                                            reflection: { ...formData.reflection, whatConfusedMe: e.target.value }
                                                        })}
                                                    />
                                                </InputGroup>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* SECTION 10: IMAGE ATTACHMENTS */}
                        <div className="border border-border/40 rounded-xl p-4 bg-card/10 space-y-4 mt-6">
                            <h5 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-accent" />
                                <span>Optional Log Attachments / Screenshots</span>
                            </h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted mb-3 leading-relaxed">
                                        Upload any architecture diagrams, metric graphs, PR screenshots, or benchmark graphs related to this work log.
                                    </p>
                                    {!readOnly && (
                                        <label className="flex flex-col items-center justify-center border border-dashed border-border/60 hover:border-accent/60 bg-surface rounded-xl p-6 cursor-pointer hover:bg-card/20 transition-all group">
                                            <Upload className="w-6 h-6 text-muted group-hover:text-accent mb-2 transition-colors" />
                                            <span className="text-xs font-semibold text-text/80 group-hover:text-accent transition-colors">
                                                {isUploading ? 'Uploading...' : 'Click to upload screenshot'}
                                            </span>
                                            <span className="text-[10px] text-muted/60 mt-1">PNG, JPG, GIF up to 5MB</span>
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
                                </div>

                                {/* Image Previews */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-muted uppercase block">Attached Images ({images.length})</span>
                                    {images.length === 0 ? (
                                        <div className="border border-border/20 rounded-xl p-6 flex flex-col items-center justify-center bg-card/5 text-muted/40 h-[106px]">
                                            <Image className="w-6 h-6 mb-1 opacity-20" />
                                            <span className="text-xs">No screenshots attached</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1">
                                            {images.map((imgUrl, idx) => (
                                                <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/40 aspect-video bg-slate-950">
                                                    <img
                                                        src={imgUrl}
                                                        alt={`Attachment ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {!readOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(idx)}
                                                            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-rose-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save Log Button */}
            {!readOnly && (
                <div className="pt-2 sticky bottom-0 bg-slate-900/90 py-4 border-t border-border/20 backdrop-blur-sm z-10">
                    <button
                        type="submit"
                        disabled={mutation.isPending || isStructuring}
                        className="w-full bg-accent text-white py-3.5 rounded-xl font-bold shadow-lg shadow-accent/15 hover:bg-accent/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
                    >
                        {mutation.isPending ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                <span>Saving Contribution Log...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Engineering Log</span>
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
