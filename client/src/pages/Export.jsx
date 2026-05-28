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
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload(format)}
            className="flex flex-col items-center p-8 rounded-3xl border transition-all duration-350 bg-card border-border/80 hover:border-accent/40 hover:shadow-xl w-full text-left group cursor-pointer"
        >
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-115 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">{label}</h3>
            <p className="text-xs text-muted text-center leading-relaxed">{desc}</p>
            <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 text-accent">
                <span>Download Now</span>
                <Download className="w-4 h-4 ml-1.5" />
            </div>
        </motion.button>
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <header className="space-y-2">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-muted hover:text-text transition-colors p-1.5 bg-card border border-border/80 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
                            <Download className="w-7 h-7 text-accent" />
                            <span>Export Contribution Logs</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Download raw standup and development data in manager-ready formats</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Date Selection */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card p-2 rounded-2xl shadow-sm border border-border inline-flex items-center gap-2"
                >
                    <div className="flex items-center gap-2 px-3 border-r border-border">
                        <Calendar className="w-4 h-4 text-muted" />
                        <span className="text-xs font-bold uppercase tracking-wider text-text">Range</span>
                    </div>
                    <input 
                        type="date" 
                        className="p-2 rounded-xl text-xs font-semibold text-text bg-transparent hover:bg-surface focus:bg-surface outline-none transition-colors"
                        onChange={e => setRange({ ...range, from: e.target.value })} 
                    />
                    <span className="text-muted">-</span>
                    <input 
                        type="date" 
                        className="p-2 rounded-xl text-xs font-semibold text-text bg-transparent hover:bg-surface focus:bg-surface outline-none transition-colors"
                        onChange={e => setRange({ ...range, to: e.target.value })} 
                    />
                </motion.div>

                {/* Data Summary */}
                {stats && (
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-surface rounded-xl border border-border text-xs"
                    >
                        <Info className="w-4 h-4 text-accent" />
                        <span className="text-muted font-medium">
                            {range.from || range.to ? 'Filtered range export context' : (
                                <><span className="text-text font-bold">{stats.totalLogs}</span> total logged entries across <span className="text-text font-bold">{stats.systemsTouchedCount || 0}</span> architecture systems</>
                            )}
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ExportOption 
                    format="pdf" 
                    label="PDF Report Bundle" 
                    icon={FileText} 
                    color="bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    desc="Comprehensive structured PDF report detailing all contributions, work descriptions, and impact metrics."
                />
                <ExportOption 
                    format="xlsx" 
                    label="Excel Spreadsheet" 
                    icon={FileSpreadsheet} 
                    color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    desc="Excel spreadsheet dataset. Perfect for performance reviews, sorting, and manual filtering."
                />
                <ExportOption 
                    format="csv" 
                    label="CSV Raw Dataset" 
                    icon={Table} 
                    color="bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                    desc="Comma-separated format. Ideal for importing data into third-party analysis or database systems."
                />
            </div>
        </div>
    );
};

export default Export;
