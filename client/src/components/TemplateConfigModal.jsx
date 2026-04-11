import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Check, X, Plus, Trash } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';

const TemplateConfigModal = ({ isOpen, onClose }) => {
    const { selectedCompany, updateCompany } = useCompany();
    const defaultTemplate = {
        visibleFields: { filesTouched: true, blockers: true, learnings: true, impact: true },
        customFields: []
    };

    const template = selectedCompany?.logTemplate || defaultTemplate;
    const [visibleFields, setVisibleFields] = useState(template.visibleFields || defaultTemplate.visibleFields);
    const [customFields, setCustomFields] = useState(template.customFields || []);
    const [newField, setNewField] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        updateCompany({
            id: selectedCompany._id,
            data: { logTemplate: { visibleFields, customFields } }
        });
        onClose();
    };

    const toggleField = (field) => {
        setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const addCustomField = () => {
        if (newField.trim() && !customFields.includes(newField.trim())) {
            setCustomFields([...customFields, newField.trim()]);
            setNewField('');
        }
    };

    const removeCustomField = (field) => {
        setCustomFields(customFields.filter(f => f !== field));
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0f0f11] rounded-3xl p-8 w-full max-w-lg shadow-2xl relative z-10 border border-border"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl">
                                <Settings className="w-5 h-5 text-orange-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Form Template</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-surface rounded-full hover:bg-border transition-colors text-muted hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Standard Fields Toggles */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Visible Optional Fields</h3>
                            <div className="space-y-2">
                                {Object.keys(defaultTemplate.visibleFields).map((field) => (
                                    <div key={field} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                                        <span className="text-text capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <button 
                                            onClick={() => toggleField(field)}
                                            className={`w-11 h-6 rounded-full transition-colors relative ${visibleFields[field] ? 'bg-orange-500' : 'bg-surface border border-border'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${visibleFields[field] ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Fields */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Custom Fields</h3>
                            
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    placeholder="e.g. Code Reviews Done"
                                    value={newField}
                                    onChange={e => setNewField(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCustomField()}
                                    className="flex-1 p-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm text-text"
                                />
                                <button 
                                    onClick={addCustomField}
                                    className="px-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                                {customFields.map((field) => (
                                    <div key={field} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                                        <span className="text-text text-sm">{field}</span>
                                        <button 
                                            onClick={() => removeCustomField(field)}
                                            className="text-muted hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {customFields.length === 0 && (
                                    <div className="text-center p-4 border border-dashed border-border rounded-xl text-muted text-sm">
                                        No custom fields added yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleSave}
                            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium shadow-lg hover:bg-orange-600 flex items-center justify-center gap-2 transition-all mt-4"
                        >
                            <Check className="w-5 h-5" />
                            Save Template
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TemplateConfigModal;
