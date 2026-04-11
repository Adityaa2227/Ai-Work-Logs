import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={closeGlobalForm}
                />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 scrollbar-hide border border-orange-500/20"
                >
                    <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                        <div>
                            <h2 className="text-2xl font-bold font-mono tracking-tight text-white">
                                {isViewing ? 'Entry Details' : isEditing ? 'Edit Entry' : 'New Log Entry'}
                            </h2>
                            <p className="text-orange-400 text-sm mt-1 font-medium">
                                {isViewing ? 'Review your work log details.' : 'Capture your progress and learnings.'}
                            </p>
                        </div>
                        <button onClick={closeGlobalForm} className="p-2 bg-surface rounded-full hover:bg-border transition-colors group border border-border">
                            <svg className="w-5 h-5 text-muted group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {isViewing ? (
                        <ReadOnlyLogView log={globalFormPreset.viewingLog} />
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
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GlobalLogModal;
