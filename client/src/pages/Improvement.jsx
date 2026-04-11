import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { RefreshCw, TrendingUp, Lightbulb, BookOpen } from 'lucide-react';
import { getLatestFeedback, generateFeedback } from '../services/feedbackService';
import { useCompany } from '../context/CompanyContext';

const Improvement = () => {
    const { selectedCompany } = useCompany();
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (selectedCompany) fetchFeedback();
    }, [selectedCompany]);

    const fetchFeedback = async () => {
        if (!selectedCompany) return;
        try {
            setLoading(true);
            const data = await getLatestFeedback(selectedCompany._id);
            setFeedback(data);
        } catch (error) {
            console.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedCompany) return;
        try {
            setGenerating(true);
            const data = await generateFeedback(selectedCompany._id);
            setFeedback(data);
        } catch (error) {
            console.error('Failed to generate feedback');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text mb-2">Self-Improvement</h1>
                    <p className="text-muted">AI-powered mentorship to help you grow faster as an engineer.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accentHover transition-all shadow-lg shadow-accent/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Analyzing...' : 'Analyze Now'}
                </button>
            </header>

            {loading ? (
                <div className="space-y-4">
                    <div className="skeleton-card p-6">
                        <div className="skeleton h-6 w-40 rounded-lg mb-4" />
                        <div className="space-y-3">
                            <div className="skeleton h-4 w-full rounded" />
                            <div className="skeleton h-4 w-4/5 rounded" />
                            <div className="skeleton h-4 w-3/5 rounded" />
                            <div className="skeleton h-4 w-full rounded" />
                            <div className="skeleton h-4 w-2/3 rounded" />
                        </div>
                    </div>
                </div>
            ) : feedback ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 gap-6"
                >
                    {/* Main Feedback Card */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="bg-gradient-to-r from-surface to-card p-6 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-text">Latest Review</h2>
                                    <p className="text-xs text-muted">Generated {new Date(feedback.generatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 prose prose-slate max-w-none dark:prose-invert">
                            <ReactMarkdown
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-text mb-4 pb-2 border-b border-border" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-accent mt-8 mb-4 flex items-center gap-2" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-text mt-6 mb-3" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-2 text-muted" {...props} />,
                                    p: ({node, ...props}) => <p className="text-muted leading-relaxed mb-3" {...props} />,
                                    strong: ({node, ...props}) => <strong className="text-text font-semibold" {...props} />,
                                }}
                            >
                                {feedback.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20 bg-card rounded-3xl border border-border border-dashed"
                >
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                        <BookOpen className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-text mb-2">No feedback yet</h3>
                    <p className="text-muted mb-6 max-w-md mx-auto">
                        Click "Analyze Now" to get personalized AI feedback on your work patterns, strengths, and areas to improve.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-accent text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-accent/20 hover:bg-accentHover transition-all inline-flex items-center gap-2"
                    >
                        <Lightbulb className="w-5 h-5" />
                        Start Analysis
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default Improvement;
