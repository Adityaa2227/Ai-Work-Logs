import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    generatePPOReviewReport, 
    generateLearningReport, 
    generateContributionReport, 
    generateSprintSummary,
    getSavedReviews
} from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { 
    Sparkles, Calendar, BookOpen, Shield, Server, 
    Download, Copy, RefreshCw, Terminal, ArrowLeft,
    CheckCircle, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagerReview = () => {
    const { selectedCompany } = useCompany();
    const queryClient = useQueryClient();

    // Generation state
    const [reportType, setReportType] = useState('ppo-review');
    const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days ago default
    const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
    const [sprint, setSprint] = useState('');
    
    // View state
    const [activeReport, setActiveReport] = useState(null);

    // 1. Fetch saved reports
    const { data: savedReports, isLoading: reportsLoading } = useQuery({
        queryKey: ['savedReviews', selectedCompany?._id, reportType],
        queryFn: () => getSavedReviews(selectedCompany?._id, reportType),
        enabled: !!selectedCompany
    });

    // 2. Report generator mutations
    const generateMutation = useMutation({
        mutationFn: async () => {
            if (reportType === 'ppo-review') {
                return generatePPOReviewReport(selectedCompany?._id, from, to);
            } else if (reportType === 'learning') {
                return generateLearningReport(selectedCompany?._id, from, to);
            } else if (reportType === 'contribution') {
                return generateContributionReport(selectedCompany?._id, from, to);
            } else if (reportType === 'sprint') {
                return generateSprintSummary(selectedCompany?._id, sprint, from, to);
            }
        },
        onSuccess: (newReport) => {
            queryClient.invalidateQueries(['savedReviews']);
            setActiveReport(newReport);
            if (newReport?.quotaSafeguard) {
                toast.info(newReport.message || 'AI quota safeguard activated. Your request was safely handled.');
                return;
            }
            toast.success('AI Contribution Report generated successfully!');
        },
        onError: (err) => {
            console.error(err);
            if (err.response?.data?.quotaSafeguard) {
                toast.info(err.response.data.message || 'AI quota safeguard activated. Your request was safely handled.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to generate report using AI. Verify logs exist in range.');
        }
    });

    const handleCopy = () => {
        if (!activeReport?.content) return;
        navigator.clipboard.writeText(activeReport.content);
        toast.success('Report markdown copied to clipboard');
    };

    const handleDownloadPDF = () => {
        if (!activeReport) return;
        // Point to backend PDF export endpoint
        const url = `${api.defaults.baseURL}/logs/export/summaries?type=${activeReport.type}&company=${selectedCompany?._id}`;
        window.open(url, '_blank');
        toast.success('Downloading professional PDF report...');
    };

    const getTypeDisplay = (type) => {
        switch (type) {
            case 'ppo-review': return 'PPO Self-Review Portfolio';
            case 'sprint': return 'Sprint Summary';
            case 'contribution-report': return 'Contribution Intelligence Report';
            case 'custom':
            case 'learning': 
                return 'Technical Growth Report';
            default: return type;
        }
    };

    const inputClasses = "w-full px-3 py-2 bg-surface border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-text text-sm transition-colors";

    return (
        <div className="space-y-5 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/" className="text-muted hover:text-text transition-colors text-sm flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </Link>
                    <span className="text-border">/</span>
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <h1 className="text-xl font-semibold text-text">Manager Review & Reports</h1>
                    </div>
                </div>
            </header>

            {/* Layout: Left config / Right preview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                
                {/* Left: Configuration Panel */}
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                            Generate Report
                        </h3>

                        {/* Report type */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted">Report Type</label>
                            <select
                                className={inputClasses}
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                            >
                                <option value="ppo-review">PPO Self-Review Portfolio</option>
                                <option value="learning">Technical Growth & Learning Report</option>
                                <option value="contribution">Contribution Intelligence Report</option>
                                <option value="sprint">Sprint Summary Report</option>
                            </select>
                        </div>

                        {/* Sprint input */}
                        {reportType === 'sprint' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted">Sprint Identifier</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sprint 3"
                                    className={inputClasses}
                                    value={sprint}
                                    onChange={(e) => setSprint(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Date range */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted">From</label>
                                <input
                                    type="date"
                                    className={inputClasses}
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted">To</label>
                                <input
                                    type="date"
                                    className={inputClasses}
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending || (reportType === 'sprint' && !sprint)}
                            className="w-full bg-accent hover:bg-accentHover text-white text-sm font-medium py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 transition-colors"
                        >
                            {generateMutation.isPending ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Generate Report</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Saved Reports List */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                            Saved Reports
                        </h4>

                        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto scrollbar-hide">
                            {reportsLoading ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton bg-zinc-800 h-14 rounded-lg" />
                                    ))}
                                </div>
                            ) : savedReports?.length === 0 ? (
                                <div className="bg-card border border-border rounded-lg p-4 text-center text-sm text-muted">
                                    No saved reports yet.
                                </div>
                            ) : (
                                savedReports?.map(report => (
                                    <button
                                        key={report._id}
                                        onClick={() => setActiveReport(report)}
                                        className={`w-full text-left px-3 py-2.5 border rounded-lg transition-colors flex items-center justify-between gap-2 bg-card ${
                                            activeReport?._id === report._id 
                                                ? 'border-accent/60 bg-accent/5' 
                                                : 'border-border hover:border-zinc-600 hover:bg-surface/40'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <span className="text-xs font-medium text-text block truncate">
                                                {getTypeDisplay(report.type)}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-mono text-muted">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-border">·</span>
                                                <span className="text-[11px] text-muted">
                                                    {new Date(report.startDate).toLocaleDateString()} – {new Date(report.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Report Preview */}
                <div className="xl:col-span-2">
                    <AnimatePresence mode="wait">
                        {activeReport ? (
                            <motion.div
                                key={activeReport._id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="bg-card border border-border rounded-lg overflow-hidden"
                            >
                                {/* Report Header Bar */}
                                <div className="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <span className="text-xs font-medium uppercase tracking-wider text-muted">
                                            Report Preview
                                        </span>
                                        <h3 className="text-sm font-semibold text-text mt-0.5">
                                            {getTypeDisplay(activeReport.type)}
                                        </h3>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="bg-surface hover:bg-zinc-700 text-text text-sm font-medium px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
                                            title="Copy markdown"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="bg-accent hover:bg-accentHover text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                            title="Download PDF"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>PDF</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Report Content */}
                                <div className="p-6 prose-engineering max-w-none text-sm leading-relaxed max-h-[66vh] overflow-y-auto scrollbar-hide">
                                    <ReactMarkdown>{activeReport.content}</ReactMarkdown>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card border border-border border-dashed rounded-lg p-12 text-center space-y-3 min-h-[50vh] flex flex-col items-center justify-center"
                            >
                                <div className="w-10 h-10 bg-surface flex items-center justify-center rounded-lg text-muted">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-medium text-text">No report selected</p>
                                <p className="text-xs text-muted max-w-xs mx-auto">
                                    Configure and generate a report using the panel on the left, or select a previously saved report.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ManagerReview;
