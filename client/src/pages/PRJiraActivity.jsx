import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPRActivities, createPRActivity, updatePRActivity, deletePRActivity, getPRStats } from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
    GitPullRequest, Plus, Search, Calendar, Briefcase, 
    AlertCircle, CheckCircle, RefreshCw, Trash2, Edit2, 
    Terminal, ArrowLeft, Grid, Filter, CheckCircle2, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PRJiraActivity = () => {
    const { selectedCompany } = useCompany();
    const queryClient = useQueryClient();
    
    // Filters state
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [sprint, setSprint] = useState('');
    const [page, setPage] = useState(1);
    
    // Add / Edit Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formState, setFormState] = useState({
        type: 'pr-created',
        title: '',
        description: '',
        ticketId: '',
        prNumber: '',
        status: 'open',
        reviewFeedback: '',
        sprint: '',
        date: new Date().toISOString().split('T')[0]
    });

    // 1. Fetch activities
    const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
        queryKey: ['prActivities', selectedCompany?._id, type, status, sprint, search, page],
        queryFn: () => getPRActivities({ 
            company: selectedCompany?._id, 
            type, 
            status, 
            sprint, 
            search, 
            page, 
            limit: 15 
        }),
        enabled: !!selectedCompany
    });

    // 2. Fetch stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['prStats', selectedCompany?._id],
        queryFn: () => getPRStats(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    // 3. Create mutation
    const createMutation = useMutation({
        mutationFn: createPRActivity,
        onSuccess: () => {
            queryClient.invalidateQueries(['prActivities']);
            queryClient.invalidateQueries(['prStats']);
            queryClient.invalidateQueries(['engineeringStats']);
            toast.success('Activity saved successfully');
            closeModal();
        },
        onError: () => {
            toast.error('Failed to save activity');
        }
    });

    // 4. Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updatePRActivity(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['prActivities']);
            queryClient.invalidateQueries(['prStats']);
            queryClient.invalidateQueries(['engineeringStats']);
            toast.success('Activity updated successfully');
            closeModal();
        },
        onError: () => {
            toast.error('Failed to update activity');
        }
    });

    // 5. Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deletePRActivity,
        onSuccess: () => {
            queryClient.invalidateQueries(['prActivities']);
            queryClient.invalidateQueries(['prStats']);
            queryClient.invalidateQueries(['engineeringStats']);
            toast.success('Activity removed successfully');
        },
        onError: () => {
            toast.error('Failed to delete activity');
        }
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setFormState({
            type: 'pr-created',
            title: '',
            description: '',
            ticketId: '',
            prNumber: '',
            status: 'open',
            reviewFeedback: '',
            sprint: '',
            date: new Date().toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormState({
            type: item.type,
            title: item.title,
            description: item.description || '',
            ticketId: item.ticketId || '',
            prNumber: item.prNumber || '',
            status: item.status,
            reviewFeedback: item.reviewFeedback || '',
            sprint: item.sprint || '',
            date: item.date.split('T')[0]
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            ...formState,
            company: selectedCompany?._id
        };

        if (editingItem) {
            updateMutation.mutate({ id: editingItem._id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id) => {
        toast.warning('Are you sure you want to delete this activity record?', {
            action: {
                label: 'Confirm Delete',
                onClick: () => deleteMutation.mutate(id)
            }
        });
    };

    const getTypeLabel = (t) => {
        switch (t) {
            case 'pr-created': return 'PR Authored';
            case 'pr-reviewed': return 'PR Reviewed';
            case 'pr-merged': return 'PR Merged';
            case 'jira-ticket': return 'Jira Ticket';
            case 'blocker': return 'Blocker';
            default: return t;
        }
    };

    const getStatusBadgeClass = (s) => {
        switch (s) {
            case 'merged':
            case 'approved':
            case 'closed':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'in-review':
            case 'open':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'blocked':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const inputClasses = "w-full p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-text text-xs hover:border-border/80 font-sans";

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-muted hover:text-text transition-colors p-1.5 bg-card border border-border/80 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2">
                            <GitPullRequest className="w-7 h-7 text-accent" />
                            <span>PR & Jira Intelligence Board</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Manual repository and ticketing activity log (PayPal scope compliant)</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="bg-accent hover:bg-accentHover text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-lg shadow-accent/15 cursor-pointer self-start md:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Log Activity</span>
                </button>
            </header>

            {/* Row 1 — Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">PRs Authored</span>
                    <h3 className="text-2xl font-black text-text font-mono leading-none">{stats?.totalPRsCreated || 0}</h3>
                    <span className="text-[10px] text-muted block mt-0.5">{stats?.totalPRsMerged || 0} merged successfully</span>
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">PRs Reviewed</span>
                    <h3 className="text-2xl font-black text-emerald-400 font-mono leading-none">{stats?.totalPRsReviewed || 0}</h3>
                    <span className="text-[10px] text-muted block mt-0.5">Architectural review contributions</span>
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Jira Tickets</span>
                    <h3 className="text-2xl font-black text-cyan-400 font-mono leading-none">{stats?.totalTickets || 0}</h3>
                    <span className="text-[10px] text-muted block mt-0.5">{stats?.completedTickets || 0} tickets completed</span>
                </div>
                <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Active Blockers</span>
                    <h3 className="text-2xl font-black text-rose-400 font-mono leading-none">{stats?.activeBlockers || 0}</h3>
                    <span className="text-[10px] text-muted block mt-0.5">{stats?.blockedTickets || 0} blocked tickets pending</span>
                </div>
            </div>

            {/* Row 2 — Filters bar */}
            <div className="bg-card border border-border/60 p-4 rounded-2xl flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search ticket ID, PR #, or title..."
                        className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-text text-xs placeholder:text-muted/40"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                {/* Type select */}
                <select
                    className="p-2 bg-surface border border-border rounded-xl text-text text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                    value={type}
                    onChange={(e) => { setType(e.target.value); setPage(1); }}
                >
                    <option value="">All Types</option>
                    <option value="pr-created">PR Authored</option>
                    <option value="pr-reviewed">PR Reviewed</option>
                    <option value="pr-merged">PR Merged</option>
                    <option value="jira-ticket">Jira Ticket</option>
                    <option value="blocker">Blocker</option>
                </select>

                {/* Status select */}
                <select
                    className="p-2 bg-surface border border-border rounded-xl text-text text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open / Active</option>
                    <option value="in-review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="merged">Merged / Closed</option>
                    <option value="blocked">Blocked</option>
                </select>

                {/* Sprint search */}
                <input
                    type="text"
                    placeholder="Sprint filter"
                    className="p-2 w-28 bg-surface border border-border rounded-xl text-text text-xs focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none placeholder:text-muted/40"
                    value={sprint}
                    onChange={(e) => { setSprint(e.target.value); setPage(1); }}
                />
            </div>

            {/* Row 3 — Activities Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg">
                {activitiesLoading ? (
                    <div className="p-16 text-center space-y-4">
                        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full mx-auto" />
                        <span className="text-xs text-muted block">Querying repositories log...</span>
                    </div>
                ) : activitiesData?.activities?.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                        <GitPullRequest className="w-10 h-10 text-muted mx-auto" />
                        <h4 className="text-sm font-bold text-text">No matching logs found</h4>
                        <p className="text-xs text-muted max-w-sm mx-auto">
                            Add a new PR authored, reviewed, or Jira ticket record using the "Log Activity" button above!
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/80 bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
                                    <th className="py-3 px-5">Date</th>
                                    <th className="py-3 px-5">Type</th>
                                    <th className="py-3 px-5">Identifiers</th>
                                    <th className="py-3 px-5">Title & Description</th>
                                    <th className="py-3 px-5">Sprint</th>
                                    <th className="py-3 px-5">Status</th>
                                    <th className="py-3 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activitiesData?.activities?.map((item) => (
                                    <tr key={item._id} className="border-b border-border/30 hover:bg-surface/20 text-xs transition-colors">
                                        <td className="py-4 px-5 font-mono text-accent/80 font-bold whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="py-4 px-5">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                                item.type.startsWith('pr-') 
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                                    : item.type === 'jira-ticket' 
                                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                                {getTypeLabel(item.type)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                                                {item.ticketId && (
                                                    <span className="text-text font-bold uppercase tracking-tight">
                                                        Jira: {item.ticketId}
                                                    </span>
                                                )}
                                                {item.prNumber && (
                                                    <span className="text-teal-400 font-bold uppercase tracking-tight">
                                                        PR: #{item.prNumber.replace('#', '')}
                                                    </span>
                                                )}
                                                {!item.ticketId && !item.prNumber && <span className="text-muted font-bold italic">N/A</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 max-w-sm">
                                            <div className="space-y-0.5">
                                                <h4 className="font-semibold text-text leading-tight">{item.title}</h4>
                                                {item.description && (
                                                    <p className="text-[10px] text-muted line-clamp-1 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 whitespace-nowrap font-mono text-[10px] text-muted">
                                            {item.sprint || <span className="italic font-sans text-xs">N/A</span>}
                                        </td>
                                        <td className="py-4 px-5 whitespace-nowrap">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1 text-muted hover:text-accent hover:bg-surface rounded transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-1 text-muted hover:text-rose-500 hover:bg-surface rounded transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal dialog */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border/80 bg-surface/30">
                                <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                                    <GitPullRequest className="w-4 h-4 text-accent" />
                                    <span>{editingItem ? 'Edit Logged Activity' : 'Log PR/Jira Activity'}</span>
                                </h3>
                                <button onClick={closeModal} className="text-muted hover:text-text">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className={inputClasses}
                                            value={formState.date}
                                            onChange={e => setFormState({ ...formState, date: e.target.value })}
                                        />
                                    </div>
                                    {/* Type */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">Activity Type</label>
                                        <select
                                            className={inputClasses}
                                            value={formState.type}
                                            onChange={e => setFormState({ ...formState, type: e.target.value })}
                                        >
                                            <option value="pr-created">PR Authored</option>
                                            <option value="pr-reviewed">PR Reviewed</option>
                                            <option value="pr-merged">PR Merged</option>
                                            <option value="jira-ticket">Jira Ticket</option>
                                            <option value="blocker">Blocker</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Jira Ticket */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">Jira Ticket ID</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. PAY-1234"
                                            className={inputClasses}
                                            value={formState.ticketId}
                                            onChange={e => setFormState({ ...formState, ticketId: e.target.value })}
                                        />
                                    </div>
                                    {/* PR Number */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">PR Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. #456"
                                            className={inputClasses}
                                            value={formState.prNumber}
                                            onChange={e => setFormState({ ...formState, prNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Sprint */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">Sprint</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sprint 3"
                                            className={inputClasses}
                                            value={formState.sprint}
                                            onChange={e => setFormState({ ...formState, sprint: e.target.value })}
                                        />
                                    </div>
                                    {/* Status */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">Status</label>
                                        <select
                                            className={inputClasses}
                                            value={formState.status}
                                            onChange={e => setFormState({ ...formState, status: e.target.value })}
                                        >
                                            <option value="open">Open</option>
                                            <option value="in-review">In Review</option>
                                            <option value="approved">Approved</option>
                                            <option value="merged">Merged</option>
                                            <option value="closed">Closed</option>
                                            <option value="blocked">Blocked</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Activity Title / Focus</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Refactor BNPL Webhook client payload timeout handler"
                                        className={inputClasses}
                                        value={formState.title}
                                        onChange={e => setFormState({ ...formState, title: e.target.value })}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase">Detailed Technical Notes</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Handled downstream retry timeouts, added resilience retry scheduler..."
                                        className="w-full p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-text text-xs hover:border-border/80 resize-y min-h-[50px] font-sans"
                                        value={formState.description}
                                        onChange={e => setFormState({ ...formState, description: e.target.value })}
                                    />
                                </div>

                                {/* Review Feedback (Optional) */}
                                {formState.type.startsWith('pr-') && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-muted uppercase">Code Reviewer Feedback / PR discussions</label>
                                        <textarea
                                            rows="2"
                                            placeholder="Discussed payload structure changes with senior team reviewers, optimized locks..."
                                            className="w-full p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-text text-xs hover:border-border/80 resize-y min-h-[50px] font-sans"
                                            value={formState.reviewFeedback}
                                            onChange={e => setFormState({ ...formState, reviewFeedback: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-muted hover:text-text cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-4 py-2 bg-accent hover:bg-accentHover text-white rounded-xl text-xs font-bold shadow-lg shadow-accent/15 cursor-pointer"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Activity'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PRJiraActivity;
