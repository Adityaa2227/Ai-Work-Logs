import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { Building2, Plus, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CompanySwitcher = () => {
    const { companies, selectedCompany, selectCompany, createCompany } = useCompany();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (newCompanyName.trim()) {
            createCompany(newCompanyName);
            setIsCreating(false);
            setNewCompanyName('');
            setIsOpen(false);
        }
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-surface/50 hover:bg-surface border border-border rounded-xl p-3 flex items-center justify-between transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-muted font-medium">Workspace</p>
                        <p className="text-sm font-bold text-text truncate max-w-[120px]">
                            {selectedCompany?.name || 'Select Company'}
                        </p>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-[60] overflow-hidden"
                        >
                            {!isCreating ? (
                                <>
                                    <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
                                        {companies?.map(c => (
                                            <button
                                                key={c._id}
                                                onClick={() => { selectCompany(c); setIsOpen(false); }}
                                                className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                                                    selectedCompany?._id === c._id ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface hover:text-text'
                                                }`}
                                            >
                                                <span className="truncate">{c.name}</span>
                                                {selectedCompany?._id === c._id && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t border-border">
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="w-full flex items-center gap-2 p-2 rounded-lg text-sm text-muted hover:bg-surface hover:text-text transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Company</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleCreate} className="p-3 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        autoFocus
                                        className="w-full bg-surface border border-border rounded-lg p-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent"
                                        value={newCompanyName}
                                        onChange={(e) => setNewCompanyName(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-accent hover:bg-accentHover text-white text-xs py-1.5 rounded-md font-medium transition-colors"
                                        >
                                            Create
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="flex-1 bg-surface hover:bg-border text-text text-xs py-1.5 rounded-md font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompanySwitcher;
