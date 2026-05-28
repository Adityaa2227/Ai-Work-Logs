import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiSearchLogs, searchLogs } from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
    Search, Terminal, ArrowLeft, Brain, Calendar, 
    Server, Code, HelpCircle, ChevronRight, Briefcase, GitPullRequest 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SmartSearch = () => {
    const { selectedCompany } = useCompany();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Results state
    const [results, setResults] = useState(null);
    const [interpretation, setInterpretation] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchType, setSearchType] = useState('ai'); // 'ai' or 'text'

    const searchMutation = useMutation({
        mutationFn: async () => {
            setIsSearching(true);
            if (searchType === 'ai') {
                return aiSearchLogs(selectedCompany?._id, searchQuery);
            } else {
                return searchLogs({ company: selectedCompany?._id, q: searchQuery });
            }
        },
        onSuccess: (data) => {
            setIsSearching(false);
            setResults(data.results || data.results || []);
            setInterpretation(data.interpretation || `Search results for keyword: "${searchQuery}"`);
            toast.success(`Found ${data.results?.length || 0} matching contribution entries`);
        },
        onError: (err) => {
            setIsSearching(false);
            console.error(err);
            toast.error('Search failed. Please try a different query.');
        }
    });

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast.warning('Please enter a query first.');
            return;
        }
        searchMutation.mutate();
    };

    const handleSuggestionClick = (queryText) => {
        setSearchQuery(queryText);
        setSearchType('ai');
        // Trigger search directly
        setIsSearching(true);
        toast.promise(aiSearchLogs(selectedCompany?._id, queryText), {
            loading: 'Senior Engineer AI parsing query...',
            success: (data) => {
                setIsSearching(false);
                setResults(data.results || []);
                setInterpretation(data.interpretation || `Search results for: "${queryText}"`);
                return `Found ${data.results?.length || 0} matching entries!`;
            },
            error: () => {
                setIsSearching(false);
                return 'Search failed.';
            }
        });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'deployed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'review': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'blocked': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'in-progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getComplexityColor = (comp) => {
        switch (comp) {
            case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const suggestionsList = [
        "What did I work on related to Kafka in Sprint 3?",
        "Show my independent payment webhook modifications that are blocked",
        "Toughest bugs fixed this month",
        "Summarize all Redis caching optimizations",
        "Show all unit testing and coverage logs"
    ];

    const inputClasses = "w-full pl-11 pr-32 py-4 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none text-text text-sm hover:border-border/80 placeholder:text-muted/40 font-sans shadow-lg";

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
                            <Brain className="w-7 h-7 text-accent animate-pulse" />
                            <span>AI Smart Search & Recall</span>
                        </h1>
                        <p className="text-muted text-xs font-semibold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-accent" />
                            <span>Semantic search queries translated directly into MongoDB query filters</span>
                        </p>
                    </div>
                </div>
            </header>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                        type="text"
                        disabled={isSearching}
                        placeholder="e.g. Find all Spring Boot work where complexity is high and status is completed..."
                        className={inputClasses}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {/* Search Controls */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {/* Toggle switch between AI and Text */}
                        <button
                            type="button"
                            onClick={() => setSearchType(searchType === 'ai' ? 'text' : 'ai')}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors ${
                                searchType === 'ai' 
                                    ? 'bg-teal-500/10 border-teal-500/25 text-teal-400' 
                                    : 'bg-surface border-border text-muted hover:text-text'
                            }`}
                            title="Toggle AI Natural Language parsing vs basic Text search"
                        >
                            {searchType === 'ai' ? 'AI Search' : 'Text Match'}
                        </button>

                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="bg-accent hover:bg-accentHover text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-accent/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSearching ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <span>Search</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* AI suggestion tags */}
                <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-accent" />
                        <span>Example Queries (Click to search)</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {suggestionsList.map((sug, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSuggestionClick(sug)}
                                className="text-xs px-3 py-1.5 bg-card/60 hover:bg-card border border-border/80 text-muted hover:text-text rounded-xl transition-all text-left flex items-center gap-1 font-medium hover:border-accent/40"
                            >
                                <ChevronRight className="w-3 h-3 text-accent" />
                                <span>{sug}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </form>

            {/* Results Preview */}
            <AnimatePresence mode="wait">
                {isSearching ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-16 text-center space-y-4"
                    >
                        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full mx-auto" />
                        <span className="text-xs text-muted block font-bold font-mono text-teal-400 animate-pulse">
                            Translating query into MongoDB JSON filter object...
                        </span>
                    </motion.div>
                ) : results ? (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Search Interpretation bar */}
                        <div className="bg-card border border-border/60 rounded-xl p-3 px-4 flex items-center justify-between text-xs font-mono text-muted">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-accent" />
                                <span className="font-semibold text-text">{interpretation}</span>
                            </div>
                            <span className="font-bold text-accent font-mono">{results.length} matches found</span>
                        </div>

                        {/* Logs list */}
                        {results.length === 0 ? (
                            <div className="bg-card/20 border border-border border-dashed p-16 rounded-2xl text-center text-xs text-muted">
                                No logs matched this query filter. Try a broader search criteria.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.map((log) => (
                                    <div 
                                        key={log._id}
                                        className="bg-card border border-border/60 hover:border-accent/40 rounded-xl p-4 space-y-3 shadow hover:shadow-lg transition-all"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-accent font-mono">
                                                {formatDate(log.date)}
                                            </span>
                                            {log.sprint && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-surface border border-border text-muted rounded font-bold uppercase tracking-wider font-mono">
                                                    {log.sprint}
                                                </span>
                                            )}
                                            {log.jiraTicket && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-accent/15 border border-accent/20 text-accent rounded font-mono">
                                                    {log.jiraTicket}
                                                </span>
                                            )}
                                            {log.prNumber && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded font-mono">
                                                    PR #{log.prNumber}
                                                </span>
                                            )}
                                            {log.workStatus && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getStatusColor(log.workStatus)}`}>
                                                    {log.workStatus}
                                                </span>
                                            )}
                                            {log.complexity && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase ${getComplexityColor(log.complexity)}`}>
                                                    {log.complexity}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-semibold text-text leading-snug">{log.task}</h3>

                                        {log.systemsModules && log.systemsModules.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
                                                <Server className="w-3 h-3 text-accent" />
                                                <span>Systems:</span>
                                                {log.systemsModules.map((s, i) => (
                                                    <span key={i} className="text-text bg-surface px-1.5 py-0.5 rounded text-[10px] border border-border">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {log.technologiesUsed && log.technologiesUsed.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
                                                <Code className="w-3 h-3 text-emerald-400" />
                                                <span>Tech:</span>
                                                {log.technologiesUsed.map((t, i) => (
                                                    <span key={i} className="text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/10 font-mono font-bold">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {log.workDone && log.workDone.length > 0 && (
                                            <div className="space-y-1 border-t border-border/30 pt-2.5 mt-2.5">
                                                <span className="text-[9px] font-bold text-muted uppercase block">Factual Achievements</span>
                                                <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-muted">
                                                    {log.workDone.slice(0, 2).map((wd, i) => (
                                                        <li key={i} className="line-clamp-1">{wd}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="bg-card/10 border border-border border-dashed p-16 rounded-2xl text-center space-y-4 text-xs text-muted">
                        Enter a natural language request like "Show my Kafka work in payment orchestrator" to semantic-search your logs using AI!
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartSearch;
