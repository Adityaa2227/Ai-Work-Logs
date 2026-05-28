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
            toast.success('AI Contribution Report generated successfully!');
        },
        onError: (err) => {
            console.error(err);
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

    const inputClasses = "w-full p-2.5 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-text text-xs hover:border-border/80";

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Link to="/" className="text-muted hover:text-text transition-colors p-1.5 bg-card border border-border/80 rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
                            <Sparkles className="w-7 h-7 text-teal-400" />
                            <span>Manager Review & PPO Mode</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Synthesize internship contributions into industry-standard promotion review portfolios</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Layout Split: Left config / Right preview */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left side: Configuration panel */}
                <div className="space-y-6">
                    <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-lg">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Generate Contribution Dossier</span>
                        </h3>

                        {/* Report type select */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Review Dossier Category</label>
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

                        {/* Sprint input (Only for sprint summary) */}
                        {reportType === 'sprint' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Sprint Identifier</label>
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
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">From Date</label>
                                <input
                                    type="date"
                                    className={inputClasses}
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">To Date</label>
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
                            className="w-full bg-accent hover:bg-accentHover text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wide shadow-md shadow-accent/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-150"
                        >
                            {generateMutation.isPending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>AI Engineering Synthesis...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                                    <span>Synthesize Dossier</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Saved reviews stream */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted">
                            Saved Review Portfolios
                        </h4>

                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
                            {reportsLoading ? (
                                <div className="skeleton-card p-4 h-16" />
                            ) : savedReports?.length === 0 ? (
                                <div className="bg-card/30 border border-border/40 p-4 rounded-xl text-center text-xs text-muted">
                                    No compiled portfolios saved.
                                </div>
                            ) : (
                                savedReports?.map(report => (
                                    <button
                                        key={report._id}
                                        onClick={() => setActiveReport(report)}
                                        className={`w-full text-left p-3.5 border rounded-xl transition-all flex items-center justify-between gap-3 bg-card ${
                                            activeReport?._id === report._id 
                                                ? 'border-accent shadow-md shadow-accent/5' 
                                                : 'border-border/60 hover:border-border hover:bg-surface/50'
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-mono font-bold text-accent block uppercase tracking-wider">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs font-bold text-text leading-tight block">
                                                {getTypeDisplay(report.type)}
                                            </span>
                                            <span className="text-[10px] text-muted block font-medium">
                                                {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side: Report preview area */}
                <div className="xl:col-span-2 space-y-4">
                    <AnimatePresence mode="wait">
                        {activeReport ? (
                            <motion.div
                                key={activeReport._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl"
                            >
                                {/* Report Control Bar */}
                                <div className="bg-surface/60 border-b border-border/80 p-4 flex flex-wrap items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                                            Previewing Portfolio
                                        </span>
                                        <h3 className="text-sm font-extrabold text-text leading-tight">
                                            {getTypeDisplay(activeReport.type)}
                                        </h3>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 bg-card hover:bg-surface border border-border/80 text-muted hover:text-text rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                            title="Copy markdown to clipboard"
                                        >
                                            <Copy className="w-4 h-4" />
                                            <span>Copy Markdown</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="p-2 bg-accent hover:bg-accentHover text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-accent/15"
                                            title="Download PDF document"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Download PDF</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Report Content */}
                                <div className="p-6 md:p-8 prose prose-invert prose-slate max-w-none text-text text-sm leading-relaxed max-h-[66vh] overflow-y-auto scrollbar-thin">
                                    <ReactMarkdown>{activeReport.content}</ReactMarkdown>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card/20 border border-border border-dashed p-20 rounded-2xl text-center space-y-4 min-h-[50vh] flex flex-col items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-accent/10 flex items-center justify-center rounded-2xl text-accent">
                                    <Sparkles className="w-8 h-8 text-teal-400 animate-pulse" />
                                </div>
                                <h3 className="text-base font-bold text-text">Review portfolio preview vacant</h3>
                                <p className="text-muted text-xs max-w-sm mx-auto leading-relaxed">
                                    Use the left configuration panel to select dates and synthesize a professional internship review portfolio, or select a saved portfolio from below!
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
