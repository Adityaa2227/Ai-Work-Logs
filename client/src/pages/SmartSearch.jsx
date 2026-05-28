import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiSearchLogs, searchLogs } from '../services/logService';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
    Search, Terminal, ArrowLeft, Brain, Calendar, 
    Server, Code, HelpCircle, ChevronRight, Briefcase, GitPullRequest, RefreshCw
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
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    const getComplexityColor = (comp) => {
        switch (comp) {
            case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    const suggestionsList = [
        "What did I work on related to Kafka in Sprint 3?",
        "Show my independent payment webhook modifications that are blocked",
        "Toughest bugs fixed this month",
        "Summarize all Redis caching optimizations",
        "Show all unit testing and coverage logs"
    ];

    const inputClasses = "w-full pl-10 pr-28 py-2.5 bg-card border border-border rounded-lg focus:ring-1 focus:ring-accent/30 focus:border-accent outline-none text-text text-sm placeholder:text-muted/40 font-sans";

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
                    <h1 className="text-xl font-semibold text-text">Smart Search</h1>
                </div>
            </header>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                    <input
                        type="text"
                        disabled={isSearching}
                        placeholder="e.g. Find all Spring Boot work where complexity is high..."
                        className={inputClasses}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {/* Search Controls */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setSearchType(searchType === 'ai' ? 'text' : 'ai')}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                searchType === 'ai' 
                                    ? 'bg-accent/10 border-accent/20 text-accent' 
                                    : 'bg-surface border-border text-muted hover:text-text'
                            }`}
                            title="Toggle AI Natural Language parsing vs basic Text search"
                        >
                            {searchType === 'ai' ? 'AI' : 'Text'}
                        </button>

                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="bg-accent hover:bg-accentHover text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSearching ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                                <span>Search</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Suggestion tags */}
                <div className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-accent" />
                        <span>Example Queries</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {suggestionsList.map((sug, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSuggestionClick(sug)}
                                className="text-xs px-2 py-1 bg-card border border-border text-muted hover:text-text rounded-lg transition-colors text-left flex items-center gap-1 hover:border-zinc-600"
                            >
                                <ChevronRight className="w-3 h-3 text-accent shrink-0" />
                                <span>{sug}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </form>

            {/* Results */}
            <AnimatePresence mode="wait">
                {isSearching ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-12 text-center space-y-3"
                    >
                        <div className="animate-spin h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full mx-auto" />
                        <span className="text-xs text-muted block font-mono">
                            Translating query into filter...
                        </span>
                    </motion.div>
                ) : results ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Search Interpretation bar */}
                        <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-accent" />
                                <span className="text-text font-medium">{interpretation}</span>
                            </div>
                            <span className="font-mono text-accent">{results.length} matches</span>
                        </div>

                        {/* Results list */}
                        {results.length === 0 ? (
                            <div className="bg-card border border-border border-dashed p-10 rounded-lg text-center text-xs text-muted">
                                No logs matched this query. Try a broader search.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {results.map((log) => (
                                    <div 
                                        key={log._id}
                                        className="bg-card border border-border rounded-lg p-3 space-y-2 hover:border-zinc-600 transition-colors"
                                    >
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs text-accent font-mono">
                                                {formatDate(log.date)}
                                            </span>
                                            {log.sprint && (
                                                <span className="text-[11px] px-1.5 py-0.5 bg-surface border border-border text-muted rounded font-medium font-mono">
                                                    {log.sprint}
                                                </span>
                                            )}
                                            {log.jiraTicket && (
                                                <span className="text-[11px] px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded font-mono">
                                                    {log.jiraTicket}
                                                </span>
                                            )}
                                            {log.prNumber && (
                                                <span className="text-[11px] px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded font-mono">
                                                    PR #{log.prNumber}
                                                </span>
                                            )}
                                            {log.workStatus && (
                                                <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${getStatusColor(log.workStatus)}`}>
                                                    {log.workStatus}
                                                </span>
                                            )}
                                            {log.complexity && (
                                                <span className={`text-[11px] px-1.5 py-0.5 rounded border font-medium ${getComplexityColor(log.complexity)}`}>
                                                    {log.complexity}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-medium text-text leading-snug">{log.task}</h3>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                                            {log.systemsModules && log.systemsModules.length > 0 && (
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <Server className="w-3 h-3 text-accent" />
                                                    {log.systemsModules.map((s, i) => (
                                                        <span key={i} className="text-text bg-surface px-1.5 py-0.5 rounded text-[11px] border border-border">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {log.technologiesUsed && log.technologiesUsed.length > 0 && (
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <Code className="w-3 h-3 text-emerald-400" />
                                                    {log.technologiesUsed.map((t, i) => (
                                                        <span key={i} className="text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded text-[11px] border border-emerald-500/10 font-mono">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {log.workDone && log.workDone.length > 0 && (
                                            <div className="border-t border-border pt-2 mt-1">
                                                <span className="text-xs font-medium uppercase tracking-wider text-muted block mb-1">Achievements</span>
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
                    <div className="bg-card border border-border border-dashed p-10 rounded-lg text-center text-xs text-muted">
                        Enter a natural language query to semantic-search your contribution logs using AI.
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SmartSearch;
