import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Table, FileSpreadsheet, Calendar, Download, Info, ArrowLeft, Terminal } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { getEngineeringStats } from '../services/logService';
import { Link } from 'react-router-dom';

const Export = () => {
    const { selectedCompany } = useCompany();
    const [range, setRange] = useState({ from: '', to: '' });

    // Fetch stats for the data summary
    const { data: stats } = useQuery({
        queryKey: ['engineeringStats', selectedCompany?._id],
        queryFn: () => getEngineeringStats(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    const handleDownload = (format) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        if (format === 'pdf') {
             // Export bundle containing logs as PDF
             let url = `${API_URL}/api/logs/export/bundle?company=${selectedCompany?._id}&v=${Date.now()}`;
             if (range.from) url += `&from=${range.from}`;
             if (range.to) url += `&to=${range.to}`;
             window.open(url, '_top');
             return;
        }

        let url = `${API_URL}/api/logs/export?format=${format}&company=${selectedCompany?._id}`;
        if (range.from) url += `&from=${range.from}`;
        if (range.to) url += `&to=${range.to}`;
        window.open(url, '_blank');
    };

    const ExportOption = ({ format, label, icon: Icon, color, desc }) => (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload(format)}
            className="flex flex-col items-start p-4 rounded-lg border transition-colors bg-card border-border hover:border-zinc-600 w-full text-left group cursor-pointer"
        >
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-text mb-1">{label}</h3>
            <p className="text-xs text-muted leading-relaxed">{desc}</p>
            <div className="mt-3 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Download</span>
            </div>
        </motion.button>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-muted hover:text-text transition-colors text-sm flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </Link>
                    <span className="text-border">/</span>
                    <h1 className="text-xl font-semibold text-text">Export Logs</h1>
                </div>
            </header>

            {/* Date Range + Summary */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-lg inline-flex items-center gap-2 p-1.5"
                >
                    <div className="flex items-center gap-1.5 px-2 border-r border-border">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted">Range</span>
                    </div>
                    <input 
                        type="date" 
                        className="p-1.5 rounded-lg text-xs text-text bg-transparent hover:bg-surface focus:bg-surface outline-none transition-colors font-mono"
                        onChange={e => setRange({ ...range, from: e.target.value })} 
                    />
                    <span className="text-muted text-xs">to</span>
                    <input 
                        type="date" 
                        className="p-1.5 rounded-lg text-xs text-text bg-transparent hover:bg-surface focus:bg-surface outline-none transition-colors font-mono"
                        onChange={e => setRange({ ...range, to: e.target.value })} 
                    />
                </motion.div>

                {/* Data Summary */}
                {stats && (
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg border border-border text-xs"
                    >
                        <Info className="w-3.5 h-3.5 text-accent" />
                        <span className="text-muted">
                            {range.from || range.to ? 'Filtered range export' : (
                                <><span className="text-text font-mono font-medium">{stats.totalLogs}</span> entries across <span className="text-text font-mono font-medium">{stats.systemsTouchedCount || 0}</span> systems</>
                            )}
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Export Format Options */}
            <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">Export Formats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ExportOption 
                        format="pdf" 
                        label="PDF Report Bundle" 
                        icon={FileText} 
                        color="bg-rose-500/10 text-rose-400" 
                        desc="Structured PDF report with contributions, descriptions, and impact metrics."
                    />
                    <ExportOption 
                        format="xlsx" 
                        label="Excel Spreadsheet" 
                        icon={FileSpreadsheet} 
                        color="bg-emerald-500/10 text-emerald-400" 
                        desc="Excel dataset for performance reviews, sorting, and manual filtering."
                    />
                    <ExportOption 
                        format="csv" 
                        label="CSV Raw Dataset" 
                        icon={Table} 
                        color="bg-amber-500/10 text-amber-400" 
                        desc="Comma-separated format for importing into third-party analysis tools."
                    />
                </div>
            </div>
        </div>
    );
};

export default Export;
