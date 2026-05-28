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
            <div className="fixed inset-0 z-[100] flex justify-end">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={closeGlobalForm}
                />

                {/* Slide-over Panel */}
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                    className="relative z-10 w-full max-w-2xl bg-card border-l border-border/50 shadow-2xl flex flex-col h-full"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-5 py-3.5 border-b border-border/50 shrink-0">
                        <div>
                            <h2 className="text-base font-semibold text-text">
                                {isViewing ? 'Entry Details' : isEditing ? 'Edit Entry' : 'New Log Entry'}
                            </h2>
                            <p className="text-xs text-muted mt-0.5">
                                {isViewing ? 'Review your work log details' : 'Capture your engineering progress'}
                            </p>
                        </div>
                        <button 
                            onClick={closeGlobalForm} 
                            className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-text transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0 px-5 py-4 overflow-hidden">
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
