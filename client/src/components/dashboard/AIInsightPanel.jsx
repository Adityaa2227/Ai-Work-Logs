import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot } from 'lucide-react';

const AIInsightPanel = ({ insight }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (!insight) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-gradient-to-r from-violet-900/50 to-indigo-900/50 p-1 rounded-3xl"
        >
            <div className="bg-card/80 backdrop-blur-xl p-6 rounded-[22px] border border-white/10 relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accentHover flex items-center justify-center shadow-lg shadow-accent/30">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-lg text-text">AI Weekly Insight</h3>
                        <span className="ml-auto text-xs text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/20">
                            {new Date(insight.generatedAt).toLocaleDateString()}
                        </span>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none">
                        <div className="text-muted leading-relaxed whitespace-pre-wrap">
                            {isExpanded ? insight.content : (
                                <>
                                    {insight.content.split('\n').slice(0, 3).join('\n')}
                                    {insight.content.split('\n').length > 3 && '...'}
                                </>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-4 text-sm font-medium text-violet-400 hover:text-violet-300 flex items-center gap-2 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isExpanded ? 'Show Less' : 'View Full Analysis'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AIInsightPanel;
