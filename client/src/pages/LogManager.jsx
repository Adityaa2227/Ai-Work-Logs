import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogs, deleteLog } from '../services/logService';
import LogForm from '../components/LogForm';
import ReadOnlyLogView from '../components/ReadOnlyLogView';
import WeeklyLogs from '../components/WeeklyLogs';
import MonthlyLogs from '../components/MonthlyLogs';
import { Plus, Edit, Trash, Search, Calendar, Clock, Code, FileText, ChevronRight, CalendarDays, SparkleIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useCompany } from '../context/CompanyContext';

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
};

const LogManager = () => {
    const { selectedCompany } = useCompany();
    const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [viewingLog, setViewingLog] = useState(null);
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['logs', search, selectedCompany?._id],
        queryFn: () => getLogs({ search, company: selectedCompany?._id }),
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
        setEditingLog(log);
        setViewingLog(null);
        setIsFormOpen(true);
    };

    const handleView = (log) => {
        setViewingLog(log);
        setEditingLog(null);
        setIsFormOpen(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
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
                        onClick={() => { setEditingLog(null); setIsFormOpen(true); }}
                        className="bg-accent text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-accent/20 hover:bg-accentHover hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Entry</span>
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

            {/* Conditional Content Based on Active Tab */}
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

            {/* List */}
            {isLoading ? (
                 <div className="flex bg-card/50 h-[60vh] items-center justify-center rounded-3xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                 </div>
            ) : (
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
                                        {/* Status Badge */}
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
                                    <div className="flex-1 space-y-4 text-sm text-text">
                                        <div>
                                            <span className="text-muted font-semibold uppercase tracking-wider block text-xs mb-1">Task / Ticket:</span>
                                            <p className="font-medium text-text line-clamp-2">{log.task}</p>
                                        </div>

                                        <div>
                                            <span className="text-muted font-semibold uppercase tracking-wider block text-xs mb-1">Work Done:</span>
                                            <ul className="list-disc list-outside ml-4 space-y-1 text-muted">
                                                {log.workDone.slice(0, 3).map((wd, i) => (
                                                    <li key={i} className="line-clamp-2">{wd}</li>
                                                ))}
                                                {log.workDone.length > 3 && (
                                                    <li className="text-accent text-xs cursor-pointer">+{log.workDone.length - 3} more...</li>
                                                )}
                                            </ul>
                                        </div>

                                        {log.learnings && log.learnings.length > 0 && (
                                            <div>
                                                <span className="text-muted font-semibold uppercase tracking-wider block text-xs mb-1">Learnings:</span>
                                                <p className="text-muted line-clamp-2">{log.learnings.join(', ')}</p>
                                            </div>
                                        )}
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
            )}
                </>
            )}

            {/* Weekly Summaries View */}
            {activeTab === 'weekly' && <WeeklyLogs />}

            {/* Monthly Summaries View */}
            {activeTab === 'monthly' && <MonthlyLogs />}

            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsFormOpen(false)}
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 scrollbar-hide border border-border"
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-text">
                                        {viewingLog ? 'View Entry' : editingLog ? 'Edit Entry' : 'New Log Entry'}
                                    </h2>
                                    <p className="text-muted text-sm mt-1">
                                        {viewingLog ? 'Review your work log details.' : 'Capture your progress and learnings.'}
                                    </p>
                                </div>
                                <button onClick={() => setIsFormOpen(false)} className="p-2 bg-surface rounded-full hover:bg-border transition-colors group">
                                    <svg className="w-5 h-5 text-muted group-hover:text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            {viewingLog ? (
                                <ReadOnlyLogView log={viewingLog} />
                            ) : (
                                <LogForm 
                                    log={editingLog} 
                                    onSuccess={() => { 
                                        setIsFormOpen(false); 
                                        setEditingLog(null); 
                                        setViewingLog(null); 
                                        queryClient.invalidateQueries({ queryKey: ['logs'] }); 
                                    }} 
                                />
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LogManager;
