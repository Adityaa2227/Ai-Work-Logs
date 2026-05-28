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
                return 'badge-success';
            case 'in-review':
            case 'open':
                return 'badge-info';
            case 'blocked':
                return 'badge-error';
            default:
                return 'bg-zinc-500/10 text-zinc-400';
        }
    };

    const getTypeBadgeClass = (t) => {
        if (t.startsWith('pr-')) return 'badge-info';
        if (t === 'jira-ticket') return 'bg-cyan-500/10 text-cyan-400';
        return 'badge-error';
    };

    const inputClasses = "w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-text text-sm font-sans transition-colors";

    return (
        <div className="space-y-5 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-muted hover:text-text transition-colors text-sm flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </Link>
                    <span className="text-border">/</span>
                    <div className="flex items-center gap-2">
                        <GitPullRequest className="w-4 h-4 text-accent" />
                        <h1 className="text-xl font-semibold text-text">PR & Jira Activity</h1>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="bg-accent hover:bg-accentHover text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>Log Activity</span>
                </button>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'PRs Authored', value: stats?.totalPRsCreated || 0, sub: `${stats?.totalPRsMerged || 0} merged`, color: 'text-text' },
                    { label: 'PRs Reviewed', value: stats?.totalPRsReviewed || 0, sub: 'Review contributions', color: 'text-emerald-400' },
                    { label: 'Jira Tickets', value: stats?.totalTickets || 0, sub: `${stats?.completedTickets || 0} completed`, color: 'text-cyan-400' },
                    { label: 'Active Blockers', value: stats?.activeBlockers || 0, sub: `${stats?.blockedTickets || 0} blocked`, color: 'text-rose-400' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-lg p-3">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted">{stat.label}</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className={`text-lg font-semibold font-mono ${stat.color}`}>{stat.value}</span>
                            <span className="text-[11px] text-muted">{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search ticket ID, PR #, or title..."
                        className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-text text-sm placeholder:text-muted/50 transition-colors"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <select
                    className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-text text-sm focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none transition-colors"
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

                <select
                    className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-text text-sm focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none transition-colors"
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

                <input
                    type="text"
                    placeholder="Sprint..."
                    className="px-2.5 py-1.5 w-24 bg-surface border border-border rounded-lg text-text text-sm focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-muted/50 transition-colors"
                    value={sprint}
                    onChange={(e) => { setSprint(e.target.value); setPage(1); }}
                />
            </div>

            {/* Activities Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                {activitiesLoading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton bg-zinc-800 h-4 w-16 rounded" />
                                <div className="skeleton bg-zinc-800 h-4 w-20 rounded" />
                                <div className="skeleton bg-zinc-800 h-4 w-24 rounded" />
                                <div className="skeleton bg-zinc-800 h-4 flex-1 rounded" />
                                <div className="skeleton bg-zinc-800 h-4 w-16 rounded" />
                            </div>
                        ))}
                    </div>
                ) : activitiesData?.activities?.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                        <GitPullRequest className="w-8 h-8 text-muted/50 mx-auto" />
                        <p className="text-sm font-medium text-text">No activity logs found</p>
                        <p className="text-xs text-muted">
                            Log a PR, review, or Jira ticket using the button above.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-surface/40">
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted">Date</th>
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted">Type</th>
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted">Identifiers</th>
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted">Title</th>
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted">Sprint</th>
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted">Status</th>
                                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activitiesData?.activities?.map((item) => (
                                    <tr key={item._id} className="border-b border-border/30 hover:bg-surface/30 text-sm transition-colors">
                                        <td className="py-2.5 px-4 font-mono text-xs text-muted whitespace-nowrap">
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${getTypeBadgeClass(item.type)}`}>
                                                {getTypeLabel(item.type)}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-0.5 font-mono text-xs">
                                                {item.ticketId && (
                                                    <span className="text-text">
                                                        {item.ticketId}
                                                    </span>
                                                )}
                                                {item.prNumber && (
                                                    <span className="text-accent">
                                                        #{item.prNumber.replace('#', '')}
                                                    </span>
                                                )}
                                                {!item.ticketId && !item.prNumber && <span className="text-muted">--</span>}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 max-w-xs">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium text-text leading-tight truncate">{item.title}</p>
                                                {item.description && (
                                                    <p className="text-xs text-muted line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 whitespace-nowrap font-mono text-xs text-muted">
                                            {item.sprint || '--'}
                                        </td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">
                                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${getStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-muted hover:text-accent hover:bg-surface rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-1.5 text-muted hover:text-rose-400 hover:bg-surface rounded-lg transition-colors"
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

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-card border border-border rounded-lg w-full max-w-lg overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                                    <GitPullRequest className="w-4 h-4 text-accent" />
                                    {editingItem ? 'Edit Activity' : 'Log Activity'}
                                </h3>
                                <button onClick={closeModal} className="p-1 text-muted hover:text-text rounded-lg hover:bg-surface transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className={inputClasses}
                                            value={formState.date}
                                            onChange={e => setFormState({ ...formState, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Activity Type</label>
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

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Jira Ticket ID</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. PAY-1234"
                                            className={inputClasses}
                                            value={formState.ticketId}
                                            onChange={e => setFormState({ ...formState, ticketId: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">PR Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. #456"
                                            className={inputClasses}
                                            value={formState.prNumber}
                                            onChange={e => setFormState({ ...formState, prNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Sprint</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sprint 3"
                                            className={inputClasses}
                                            value={formState.sprint}
                                            onChange={e => setFormState({ ...formState, sprint: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Status</label>
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

                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted">Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Refactor BNPL webhook timeout handler"
                                        className={inputClasses}
                                        value={formState.title}
                                        onChange={e => setFormState({ ...formState, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted">Description</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Technical notes..."
                                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-text text-sm resize-y min-h-[48px] font-sans transition-colors"
                                        value={formState.description}
                                        onChange={e => setFormState({ ...formState, description: e.target.value })}
                                    />
                                </div>

                                {formState.type.startsWith('pr-') && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium uppercase tracking-wider text-muted">Review Feedback</label>
                                        <textarea
                                            rows="2"
                                            placeholder="Code review discussion notes..."
                                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-text text-sm resize-y min-h-[48px] font-sans transition-colors"
                                            value={formState.reviewFeedback}
                                            onChange={e => setFormState({ ...formState, reviewFeedback: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="bg-surface hover:bg-zinc-700 text-text text-sm font-medium px-3 py-1.5 rounded-lg border border-border transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="bg-accent hover:bg-accentHover text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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
