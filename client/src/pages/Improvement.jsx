import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { RefreshCw, TrendingUp, AlertCircle, Lightbulb, Trophy } from 'lucide-react';
import { getLatestFeedback, generateFeedback } from '../services/feedbackService';

const Improvement = () => {
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const data = await getLatestFeedback();
            setFeedback(data);
        } catch (error) {
            console.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const data = await generateFeedback();
            setFeedback(data);
        } catch (error) {
            console.error('Failed to generate feedback');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text mb-2">Self-Improvement</h1>
                    <p className="text-muted">AI-powered mentorship to help you grow faster.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accentHover transition-colors disabled:opacity-70"
                >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Analyzing...' : 'Analyze Now'}
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
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
                                    li: ({node, ...props}) => <li className="mb-2" {...props} />,
                                    strong: ({node, ...props}) => <strong className="text-text font-semibold" {...props} />,
                                }}
                            >
                                {feedback.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <Lightbulb className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text">No feedback yet</h3>
                    <p className="text-muted mb-6">Click "Analyze Now" to get your first critique.</p>
                    <button
                        onClick={handleGenerate}
                        className="px-6 py-2 bg-accent text-white rounded-xl hover:bg-accentHover"
                    >
                        Start Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

export default Improvement;
