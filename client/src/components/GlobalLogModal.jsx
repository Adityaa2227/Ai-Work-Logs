import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import LogForm from './LogForm';
import ReadOnlyLogView from './ReadOnlyLogView';

const GlobalLogModal = () => {
    const { isGlobalFormOpen, closeGlobalForm, globalFormPreset } = useCompany();
    const queryClient = useQueryClient();

    if (!isGlobalFormOpen) return null;

    const isViewing = globalFormPreset?.viewingLog;
    const isEditing = globalFormPreset?.editingLog;
    const isNew = !isViewing && !isEditing;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={closeGlobalForm}
                />

                {/* Main workspace modal */}
                <motion.div 
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
                    className="relative z-10 w-full max-w-7xl bg-card border border-border/60 shadow-2xl flex flex-col max-h-[96vh] rounded-xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 px-5 md:px-6 py-3 border-b border-border/50 shrink-0 bg-zinc-950/25">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-text tracking-tight">
                                {isViewing ? 'Entry Details' : isEditing ? 'Edit Entry' : 'New Log Entry'}
                            </h2>
                            <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
                                {isViewing
                                    ? 'Review the captured work, systems, outcomes, and notes for this day.'
                                    : 'Dump your raw notes first, let AI structure the log, then quickly review the familiar fields before saving.'}
                            </p>
                        </div>
                        <button 
                            onClick={closeGlobalForm} 
                            className="p-2 rounded-md hover:bg-surface text-muted hover:text-text transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0 px-4 md:px-6 py-3 overflow-hidden">
                        {isViewing ? (
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                <ReadOnlyLogView log={globalFormPreset.viewingLog} />
                            </div>
                        ) : (
                            <LogForm 
                                log={isEditing ? globalFormPreset.editingLog : null} 
                                presetDate={isNew ? globalFormPreset?.date : null}
                                onSuccess={() => { 
                                    closeGlobalForm(); 
                                    queryClient.invalidateQueries({ queryKey: ['logs'] }); 
                                    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); 
                                    queryClient.invalidateQueries({ queryKey: ['analyticsCharts'] });
                                }} 
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GlobalLogModal;
