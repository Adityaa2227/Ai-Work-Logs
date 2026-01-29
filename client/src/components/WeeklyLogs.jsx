import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWeeklySummaries, updateSummary } from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { Calendar, Sparkles, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const WeeklyLogs = () => {
    const { selectedCompany } = useCompany();
    const [expandedWeek, setExpandedWeek] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const queryClient = useQueryClient();

    const { data: summaries, isLoading } = useQuery({
        queryKey: ['weeklySummaries', selectedCompany?._id],
        queryFn: () => getWeeklySummaries(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, content }) => updateSummary(id, content),
        onSuccess: () => {
            queryClient.invalidateQueries(['weeklySummaries']);
            setEditingId(null);
            toast.success('Summary updated successfully');
        },
        onError: () => {
            toast.error('Failed to update summary');
        }
    });

    const handleEditStart = (e, summary) => {
        e.stopPropagation();
        setEditingId(summary._id);
        setEditContent(summary.content);
        // Ensure the week is expanded when editing
        setExpandedWeek(summary._id);
    };

    const handleSave = (e, id) => {
        e.stopPropagation();
        updateMutation.mutate({ id, content: editContent });
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setEditingId(null);
        setEditContent('');
    };

    const formatDateRange = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })} – ${end.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!summaries || summaries.length === 0) {
        return (
            <div className="text-center py-16">
                <Sparkles className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text mb-2">No Weekly Summaries Yet</h3>
                <p className="text-muted">Weekly summaries are automatically generated when you create a Sunday log.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {summaries.map((summary) => (
                <motion.div
                    key={summary._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl overflow-hidden border border-white/5"
                >
                    <div
                        onClick={() => !editingId && setExpandedWeek(expandedWeek === summary._id ? null : summary._id)}
                        className={`w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors text-left cursor-pointer ${editingId ? 'cursor-default' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text">
                                    Week {summary.weekNumber}, {summary.year}
                                </h3>
                                <p className="text-sm text-muted">
                                    {formatDateRange(summary.startDate, summary.endDate)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted">
                                Generated {new Date(summary.generatedAt).toLocaleDateString()}
                            </span>
                            
                            {editingId === summary._id ? (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => handleSave(e, summary._id)}
                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                                        title="Save"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleCancel}
                                        className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20"
                                        title="Cancel"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={(e) => handleEditStart(e, summary)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-muted hover:text-text transition-colors"
                                    title="Edit Summary"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}

                            {expandedWeek === summary._id ? (
                                <ChevronUp className="w-5 h-5 text-muted" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-muted" />
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedWeek === summary._id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-white/5"
                            >
                                <div className="p-6">
                                    {editingId === summary._id ? (
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full h-96 bg-surface border border-border rounded-xl p-4 text-text font-mono text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none resize-none leading-relaxed"
                                            placeholder="Edit summary content..."
                                        />
                                    ) : (
                                        <div className="prose prose-invert max-w-none">
                                            <div className="whitespace-pre-wrap text-text leading-relaxed font-sans">
                                                {summary.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};

export default WeeklyLogs;
