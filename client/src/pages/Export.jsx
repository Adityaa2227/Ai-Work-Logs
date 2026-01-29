import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Table, FileSpreadsheet, Calendar, Download } from 'lucide-react';

const Export = () => {
    const [range, setRange] = useState({ from: '', to: '' });

    // const downloadFile helper removed

    const handleDownload = (format) => {
        if (format === 'pdf') {
             // Download ZIP Bundle containing 3 PDFs
             let url = `http://localhost:5000/api/logs/export/bundle?v=${Date.now()}`;
             if (range.from) url += `&from=${range.from}`;
             if (range.to) url += `&to=${range.to}`;
             window.open(url, '_top'); // _top or _blank
             return;
        }

        let url = `http://localhost:5000/api/logs/export?format=${format}`;
        if (range.from) url += `&from=${range.from}`;
        if (range.to) url += `&to=${range.to}`;
        window.open(url, '_blank');
    };

    const ExportOption = ({ format, label, icon: Icon, color, bg, desc }) => (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload(format)}
            className={`flex flex-col items-center p-8 rounded-3xl border transition-all duration-300 bg-card border-border hover:border-accent/40 hover:shadow-xl w-full text-left group`}
        >
            <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">{label}</h3>
            <p className="text-sm text-muted text-center leading-relaxed">{desc}</p>
            <div className="mt-6 flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 text-accent">
                <span>Download Now</span>
                <Download className="w-4 h-4 ml-2" />
            </div>
        </motion.button>
    );

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-3xl font-bold text-text tracking-tight">Export Data</h1>
                <p className="text-muted mt-2">Download your work logs in your preferred format.</p>
            </header>

            {/* Date Selection */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-2 rounded-2xl shadow-sm border border-border inline-flex items-center gap-2"
            >
                <div className="flex items-center gap-2 px-4 border-r border-border">
                    <Calendar className="w-5 h-5 text-muted" />
                    <span className="text-sm font-medium text-text">Filter Range</span>
                </div>
                <input 
                    type="date" 
                    className="p-2 rounded-xl text-sm font-medium text-text bg-transparent hover:bg-surface focus:bg-surface outline-none transition-colors"
                    onChange={e => setRange({ ...range, from: e.target.value })} 
                />
                <span className="text-muted">-</span>
                <input 
                    type="date" 
                    className="p-2 rounded-xl text-sm font-medium text-text bg-transparent hover:bg-surface focus:bg-surface outline-none transition-colors"
                    onChange={e => setRange({ ...range, to: e.target.value })} 
                />
            </motion.div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ExportOption 
                    format="pdf" 
                    label="PDF Report" 
                    icon={FileText} 
                    color="bg-rose-500" 
                    desc="Professional document suitable for sharing with managers or stakeholders."
                />
                <ExportOption 
                    format="xlsx" 
                    label="Excel Spreadsheet" 
                    icon={FileSpreadsheet} 
                    color="bg-emerald-500" 
                    desc="Comprehensive dataset ideal for detailed analysis and pivoting."
                />
                <ExportOption 
                    format="csv" 
                    label="CSV File" 
                    icon={Table} 
                    color="bg-indigo-500" 
                    desc="Raw data format perfect for importing into other tools or databases."
                />
            </div>
        </div>
    );
};

export default Export;
