import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useCompany } from '../context/CompanyContext';
import { toast } from 'sonner';

const Analytics = () => {
    const { selectedCompany } = useCompany();
    const [range, setRange] = useState({ from: '', to: '', type: 'custom' });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!range.from || !range.to) {
            toast.error('Please select date range');
            return;
        }
        if (!selectedCompany) {
            toast.error('Please select a company');
            return;
        }
        
        setLoading(true);
        try {
            const res = await api.post('/ai/generate', { 
                ...range, 
                company: selectedCompany._id,
                save: false // Don't save to DB, just analyzing
            });
            setReport(res.data);
            toast.success('Report generated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-text tracking-tight">AI Analytics</h1>
                <p className="text-muted mt-2">Generate deep insights and performance reviews powered by AI.</p>
            </header>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-border relative overflow-hidden"
            >
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-end">
                    <div className="flex-1 space-y-6 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-text">Generate Report</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted ml-1">From Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-muted w-5 h-5 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text"
                                        onChange={e => setRange({ ...range, from: e.target.value })} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted ml-1">To Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-muted w-5 h-5 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text"
                                        onChange={e => setRange({ ...range, to: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={clsx(
                            "px-8 py-3.5 rounded-xl font-medium shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 min-w-[160px] justify-center",
                            loading 
                                ? "bg-surface text-muted cursor-not-allowed shadow-none" 
                                : "bg-gradient-to-r from-accent to-accentHover text-white shadow-accent/20 hover:shadow-xl"
                        )}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Generate</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
            </motion.div>

            {report && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card p-10 rounded-3xl shadow-lg border border-border"
                >
                    <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-success/10 rounded-lg">
                                <Sparkles className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text">Performance Review</h2>
                                <p className="text-sm text-muted">Generated on {new Date(report.generatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                             <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Period</div>
                             <div className="text-sm font-medium text-text">
                                {new Date(range.from).toLocaleDateString()}  <ArrowRight className="inline w-3 h-3 mx-1 text-muted" />  {new Date(range.to).toLocaleDateString()}
                             </div>
                        </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none prose-headings:font-bold prose-h3:text-accent prose-p:text-muted prose-p:leading-relaxed">
                        <div className="whitespace-pre-wrap">{report.content}</div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Analytics;
