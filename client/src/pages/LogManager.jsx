import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogs, deleteLog } from '../services/logService';
import api from '../services/api';
import LogForm from '../components/LogForm';
import ReadOnlyLogView from '../components/ReadOnlyLogView';
import WeeklyLogs from '../components/WeeklyLogs';
import MonthlyLogs from '../components/MonthlyLogs';
import { Plus, Edit, Trash, Search, Calendar, ChevronRight, ChevronLeft, CalendarDays, SparkleIcon, FileText, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useCompany } from '../context/CompanyContext';

const formatDate = (dateString) => {
    const logDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (logDate.toDateString() === today.toDateString()) return 'Today';
    if (logDate.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return logDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
};

// Skeleton card component
const SkeletonCard = () => (
    <div className="skeleton-card p-6 space-y-4">
        <div className="flex justify-between items-start">
            <div>
                <div className="skeleton h-5 w-24 rounded-lg mb-2" />
                <div className="skeleton h-4 w-16 rounded-md" />
            </div>
        </div>
        <div className="space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-4 w-full rounded" />
        </div>
        <div className="space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
            <div className="skeleton h-3 w-3/5 rounded" />
        </div>
    </div>
);

const LogManager = () => {
    const { selectedCompany, openGlobalForm } = useCompany();
    const [activeTab, setActiveTab] = useState('daily');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['logs', search, selectedCompany?._id, page],
        queryFn: () => getLogs({ search, company: selectedCompany?._id, limit: 12, page }),
        enabled: !!selectedCompany,
        keepPreviousData: true
    });

    const { data: pendingDates } = useQuery({
        queryKey: ['pendingLogs', selectedCompany?._id],
        queryFn: async () => {
            const res = await api.get(`/logs/pending?company=${selectedCompany._id}`);
            return res.data;
        },
        enabled: !!selectedCompany
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLog,
        onSuccess: () => {
            queryClient.invalidateQueries(['logs']);
            toast.success('Log entry deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete log');
        }
    });



    const handleDelete = (id) => {
        toast.warning('Are you sure you want to delete this log?', {
            action: {
                label: 'Delete',
                onClick: () => deleteMutation.mutate(id)
            },
        });
    };

    const handleEdit = (log) => {
        openGlobalForm({ editingLog: log });
    };

    const handleView = (log) => {
        openGlobalForm({ viewingLog: log });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.06 }
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Work Logs</h1>
                    <p className="text-muted mt-1">Manage and track your daily engineering progress.</p>
                </div>
                {activeTab === 'daily' && (
                    <button
                        onClick={() => openGlobalForm()}
                        className="bg-accent text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-accent/20 hover:bg-accentHover hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Entry</span>
                        <kbd className="hidden md:inline-flex ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">Ctrl+M</kbd>
                    </button>
                )}
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        activeTab === 'daily'
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'text-muted hover:text-text hover:bg-white/5'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    Daily Logs
                </button>
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        activeTab === 'weekly'
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'text-muted hover:text-text hover:bg-white/5'
                    }`}
                >
                    <CalendarDays className="w-4 h-4" />
                    Weekly Summaries
                </button>
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        activeTab === 'monthly'
                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                            : 'text-muted hover:text-text hover:bg-white/5'
                    }`}
                >
                    <SparkleIcon className="w-4 h-4" />
                    Monthly Summaries
                </button>
            </div>

            {/* Daily Tab Content */}
            {activeTab === 'daily' && (
                <>
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search logs by project, task, or tech stack..."
                            className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-accent/20 focus:border-accent focus:outline-none transition-all shadow-sm text-text placeholder:text-muted"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Pending Logs Strip */}
                    {!isLoading && (
                        pendingDates?.length > 0 ? (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 overflow-hidden mb-6 shadow-inner">
                                <div className="flex items-center gap-2 text-orange-500 font-semibold min-w-max">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>Pending Logs</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0 w-full items-center">
                                    {pendingDates.map((dateStr, i) => {
                                        const d = new Date(dateStr);
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => openGlobalForm({ date: dateStr })}
                                                className="px-3 py-1.5 text-xs font-medium bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-lg transition-colors border border-orange-500/30 whitespace-nowrap"
                                            >
                                                Missed: {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 mb-6 shadow-inner">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                <span className="text-emerald-400 font-medium text-sm">All logs are completely up to date! Great job!</span>
                            </div>
                        )
                    )}

                    {/* List */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : data?.logs?.length === 0 ? (
                        /* Empty State */
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-card rounded-3xl border border-border border-dashed"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                                <FileText className="w-8 h-8 text-accent" />
                            </div>
                            <h3 className="text-xl font-semibold text-text mb-2">No logs yet</h3>
                            <p className="text-muted mb-6 max-w-md mx-auto">
                                Start tracking your internship progress by creating your first work log entry.
                            </p>
                            <button
                                onClick={() => openGlobalForm()}
                                className="bg-accent text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-accent/20 hover:bg-accentHover transition-all inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Entry
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <motion.div 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {data?.logs?.map((log) => (
                                    <motion.div
                                        key={log._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => handleView(log)}
                                        className="glass rounded-2xl p-6 group border border-border hover:border-accent/40 transition-all flex flex-col h-full bg-card shadow-lg cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-800">
                                            <div>
                                                <h3 className="text-lg font-bold text-accent font-mono mb-1">
                                                    {formatDate(log.date)}
                                                </h3>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                                    log.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                    log.status === 'No Work' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(log); }} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-accent transition-colors">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(log._id); }} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition-colors">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {log.status === 'Available' ? (
                                            <div className="flex-1 space-y-3 text-sm text-text">
                                                {/* Project badge */}
                                                {log.project && (
                                                    <span className="inline-block text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                                                        {log.project}
                                                    </span>
                                                )}
                                                <div>
                                                    <span className="text-muted font-semibold uppercase tracking-wider block text-xs mb-1">Task:</span>
                                                    <p className="font-medium text-text line-clamp-2">{log.task}</p>
                                                </div>

                                                <div>
                                                    <span className="text-muted font-semibold uppercase tracking-wider block text-xs mb-1">Work Done:</span>
                                                    <ul className="list-disc list-outside ml-4 space-y-0.5 text-muted">
                                                        {log.workDone.slice(0, 3).map((wd, i) => (
                                                            <li key={i} className="line-clamp-1 text-xs">{wd}</li>
                                                        ))}
                                                        {log.workDone.length > 3 && (
                                                            <li className="text-accent text-xs cursor-pointer">+{log.workDone.length - 3} more...</li>
                                                        )}
                                                    </ul>
                                                </div>

                                                {/* Card footer metadata */}
                                                <div className="flex items-center gap-3 pt-2 mt-auto border-t border-white/5 text-xs text-muted">
                                                    {log.techStack && log.techStack.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                            {log.techStack.slice(0, 2).join(', ')}{log.techStack.length > 2 ? ` +${log.techStack.length - 2}` : ''}
                                                        </span>
                                                    )}
                                                    {log.learnings && log.learnings.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Lightbulb className="w-3 h-3 text-amber-400" />
                                                            {log.learnings.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1">
                                                <span className="text-muted font-semibold uppercase tracking-wider block text-xs mb-2">Reason / Update:</span>
                                                <p className="text-muted italic">"{log.noWorkReason}"</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination Controls */}
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button
                                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-surface border border-border text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-muted font-medium">
                                    Page <span className="text-text">{page}</span> of <span className="text-text">{data?.pages || 1}</span>
                                </span>
                                <button
                                    onClick={() => {
                                        if (!data?.pages || page >= data.pages) return;
                                        setPage((old) => old + 1);
                                    }}
                                    disabled={!data?.pages || page >= data.pages}
                                    className="p-2 rounded-lg bg-surface border border-border text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Weekly Summaries View */}
            {activeTab === 'weekly' && <WeeklyLogs />}

            {/* Monthly Summaries View */}
            {activeTab === 'monthly' && <MonthlyLogs />}
        </div>
    );
};

export default LogManager;
