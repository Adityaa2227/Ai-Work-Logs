import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogs, deleteLog } from '../services/logService';
import api from '../services/api';
import LogForm from '../components/LogForm';
import ReadOnlyLogView from '../components/ReadOnlyLogView';
import WeeklyLogs from '../components/WeeklyLogs';
import MonthlyLogs from '../components/MonthlyLogs';
import { Plus, Edit, Trash, Search, Calendar, ChevronRight, ChevronLeft, CalendarDays, SparkleIcon, FileText, Lightbulb, AlertCircle, CheckCircle, Clock, Server } from 'lucide-react';
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

    const tabs = [
        { id: 'daily', label: 'Daily', icon: Calendar },
        { id: 'weekly', label: 'Weekly', icon: CalendarDays },
        { id: 'monthly', label: 'Monthly', icon: SparkleIcon },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-text">Work Logs</h1>
                    <p className="text-xs text-muted mt-0.5">Manage and track your engineering contributions</p>
                </div>
                {activeTab === 'daily' && (
                    <button
                        onClick={() => openGlobalForm()}
                        className="bg-accent hover:bg-accentHover text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Entry</span>
                        <kbd className="hidden md:inline-flex ml-1 text-[10px] bg-white/20 px-1 py-0.5 rounded font-mono">⌘M</kbd>
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-0.5 bg-card border border-border rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            activeTab === tab.id
                                ? 'bg-surface text-text'
                                : 'text-muted hover:text-text'
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Daily Tab Content */}
            {activeTab === 'daily' && (
                <>
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-sm text-text placeholder:text-muted/50 transition-colors"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Pending Logs Strip */}
                    {!isLoading && (
                        pendingDates?.length > 0 ? (
                            <div className="bg-warning/5 border border-warning/15 rounded-lg px-4 py-2.5 flex flex-col md:flex-row md:items-center gap-3">
                                <div className="flex items-center gap-1.5 text-warning text-sm font-medium shrink-0">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Pending</span>
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                                    {pendingDates.map((dateStr, i) => {
                                        const d = new Date(dateStr);
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => openGlobalForm({ date: dateStr })}
                                                className="px-2 py-1 text-[11px] font-medium bg-warning/10 hover:bg-warning/20 text-warning rounded transition-colors border border-warning/20 whitespace-nowrap"
                                            >
                                                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-success/5 border border-success/15 rounded-lg px-4 py-2.5 flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-success" />
                                <span className="text-success text-sm font-medium">All logs up to date</span>
                            </div>
                        )
                    )}

                    {/* Log Entries */}
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="skeleton-card p-4 h-16 rounded-lg" />
                            ))}
                        </div>
                    ) : data?.logs?.length === 0 ? (
                        <div className="bg-card border border-border border-dashed rounded-lg p-12 text-center">
                            <FileText className="w-8 h-8 text-muted/40 mx-auto mb-3" />
                            <p className="text-sm font-medium text-text mb-1">No logs yet</p>
                            <p className="text-xs text-muted mb-4">Start tracking your engineering work</p>
                            <button
                                onClick={() => openGlobalForm()}
                                className="bg-accent hover:bg-accentHover text-white text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Create First Entry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Dense List View */}
                            <div className="bg-card border border-border rounded-lg divide-y divide-border/30">
                                {data?.logs?.map((log) => (
                                    <div
                                        key={log._id}
                                        onClick={() => handleView(log)}
                                        className="px-4 py-3 flex items-start gap-3 hover:bg-surface/30 transition-colors cursor-pointer group"
                                    >
                                        {/* Date column */}
                                        <div className="shrink-0 w-20">
                                            <span className="text-sm font-mono font-medium text-accent">
                                                {formatDate(log.date)}
                                            </span>
                                            <span className={`block mt-0.5 text-[11px] px-1.5 py-0.5 rounded font-medium w-fit ${
                                                log.status === 'Available' ? 'badge-success' : 
                                                log.status === 'No Work' ? 'badge-warning' :
                                                'badge-error'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {log.status === 'Available' ? (
                                                <>
                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                        {log.project && (
                                                            <span className="text-[11px] px-1.5 py-0.5 rounded font-medium badge-info">
                                                                {log.project}
                                                            </span>
                                                        )}
                                                        {log.jiraTicket && (
                                                            <span className="text-[11px] font-mono text-accent">
                                                                {log.jiraTicket}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text line-clamp-1">{log.task}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted">
                                                        {log.workDone && log.workDone.length > 0 && (
                                                            <span>{log.workDone.length} item{log.workDone.length > 1 ? 's' : ''}</span>
                                                        )}
                                                        {log.techStack && log.techStack.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-accent" />
                                                                {log.techStack.slice(0, 2).join(', ')}
                                                                {log.techStack.length > 2 && ` +${log.techStack.length - 2}`}
                                                            </span>
                                                        )}
                                                        {log.learnings && log.learnings.length > 0 && (
                                                            <span className="flex items-center gap-0.5">
                                                                <Lightbulb className="w-3 h-3 text-warning" />
                                                                {log.learnings.length}
                                                            </span>
                                                        )}
                                                        {log.systemsModules && log.systemsModules.length > 0 && (
                                                            <span className="flex items-center gap-0.5">
                                                                <Server className="w-3 h-3" />
                                                                {log.systemsModules.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted italic">"{log.noWorkReason}"</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEdit(log); }} 
                                                className="p-1.5 text-muted hover:text-accent hover:bg-surface rounded-md transition-colors"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(log._id); }} 
                                                className="p-1.5 text-muted hover:text-error hover:bg-surface rounded-md transition-colors"
                                            >
                                                <Trash className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-center items-center gap-3 pt-2">
                                <button
                                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-md bg-card border border-border text-muted disabled:opacity-30 hover:bg-surface transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-muted font-mono">
                                    {page} / {data?.pages || 1}
                                </span>
                                <button
                                    onClick={() => {
                                        if (!data?.pages || page >= data.pages) return;
                                        setPage((old) => old + 1);
                                    }}
                                    disabled={!data?.pages || page >= data.pages}
                                    className="p-1.5 rounded-md bg-card border border-border text-muted disabled:opacity-30 hover:bg-surface transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
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
