import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEngineeringStats, getLogs, getDailyInsight } from '../services/logService';
import { 
    CheckCircle, GitPullRequest, Server, Briefcase, Plus, Sparkles, 
    Calendar, ArrowRight, Brain, AlertTriangle, Shield, CheckCircle2,
    Code, Database, Terminal, FileText, Lightbulb
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AIInsightPanel from '../components/dashboard/AIInsightPanel';

const StatCard = ({ title, value, subvalue, icon: Icon, color, delay, glowClass }) => (
    <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className={`glass-panel glass-panel-hover rounded-2xl p-5 flex items-start gap-4 border border-border/80 ${glowClass}`}
    >
        <div className={`p-3 rounded-xl ${color} text-white shadow-lg shadow-indigo-500/10`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">{title}</span>
            <span className="text-2xl font-black text-text font-mono leading-none block">{value}</span>
            {subvalue && <span className="text-xs text-muted block mt-0.5">{subvalue}</span>}
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { selectedCompany } = useCompany();

    // Get user details
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user?.username || 'intern';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // 1. Fetch Engineering Enriched Statistics
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['engineeringStats', selectedCompany?._id],
        queryFn: () => getEngineeringStats(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    // 2. Fetch Recent Logs for contribution stream
    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['recentLogs', selectedCompany?._id],
        queryFn: () => getLogs({ limit: 4, company: selectedCompany?._id }),
        enabled: !!selectedCompany
    });

    // 3. Fetch AI Daily Technical tip
    const { data: dailyInsight } = useQuery({
        queryKey: ['dailyInsight', selectedCompany?._id],
        queryFn: () => getDailyInsight(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    const isLoading = statsLoading || logsLoading;

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                <div className="skeleton h-10 w-72 rounded-xl" />
                <div className="skeleton h-5 w-48 rounded-lg mt-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-card p-6 h-28" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 skeleton-card h-80" />
                    <div className="skeleton-card h-80" />
                </div>
            </div>
        );
    }

    const activityTimeline = stats?.activityTimeline || [];
    const recentLogs = logsData?.logs || [];

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

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header / Greetings */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl font-bold text-text tracking-tight flex items-center gap-2">
                        <span>{getGreeting()}, {username}</span>
                        <span className="animate-pulse">💻</span>
                    </h1>
                    <p className="text-muted mt-1 font-medium flex items-center gap-1.5 text-xs">
                        <Terminal className="w-3.5 h-3.5 text-accent" />
                        <span>Backend SWE Contribution Intelligence for {selectedCompany?.name || 'PayPal'}</span>
                    </p>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                >
                    <Link 
                        to="/logs"
                        className="bg-accent hover:bg-accentHover text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-accent/15 hover:shadow-xl hover:-translate-y-0.5 transition-all text-xs flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Log standup</span>
                    </Link>
                    <Link
                        to="/manager-review"
                        className="bg-card text-text border border-border px-4 py-2 rounded-xl font-bold hover:bg-surface hover:-translate-y-0.5 transition-all text-xs flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span>Manager Mode</span>
                    </Link>
                </motion.div>
            </header>

            {/* AI Daily Coaching Tip */}
            {dailyInsight && (
                <AIInsightPanel insight={dailyInsight} />
            )}

            {/* Row 1 — Engineering Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Logs" 
                    value={stats?.totalLogs || 0} 
                    subvalue="Internship contributions"
                    icon={CheckCircle} 
                    color="bg-accent" 
                    delay={0.05} 
                    glowClass="hover:shadow-indigo-500/10 hover:border-indigo-500/30"
                />
                <StatCard 
                    title="PRs & Reviews" 
                    value={(stats?.weeklyPRsCreated || 0) + (stats?.weeklyPRsReviewed || 0)} 
                    subvalue={`${stats?.weeklyPRsCreated || 0} created / ${stats?.weeklyPRsReviewed || 0} reviewed (7d)`}
                    icon={GitPullRequest} 
                    color="bg-emerald-500" 
                    delay={0.1} 
                    glowClass="hover:shadow-emerald-500/10 hover:border-emerald-500/30"
                />
                <StatCard 
                    title="Systems Touched" 
                    value={stats?.systemsTouchedCount || 0} 
                    subvalue={`${stats?.technologiesUsedCount || 0} tech stacks leveraged`}
                    icon={Server} 
                    color="bg-cyan-500" 
                    delay={0.15} 
                    glowClass="hover:shadow-cyan-500/10 hover:border-cyan-500/30"
                />
                <StatCard 
                    title="Active Standup Tickets" 
                    value={stats?.activeJiraCount || 0} 
                    subvalue="In-progress Jira tickets"
                    icon={Briefcase} 
                    color="bg-amber-500" 
                    delay={0.20} 
                    glowClass="hover:shadow-amber-500/10 hover:border-amber-500/30"
                />
            </div>

            {/* Row 2 — Two-column layout (Contributions & Technologies) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Recent contributions */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-text/80 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-accent" />
                            <span>Recent Technical Contributions</span>
                        </h2>
                        <Link to="/logs" className="text-xs text-accent hover:underline flex items-center gap-1">
                            <span>View all logs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentLogs.length === 0 ? (
                            <div className="bg-card border border-border border-dashed p-10 rounded-2xl text-center space-y-3">
                                <h4 className="text-sm font-bold text-muted">No contributions logged yet.</h4>
                                <p className="text-xs text-muted">Log your first standup update to start compile stats!</p>
                            </div>
                        ) : (
                            recentLogs.map((log, idx) => (
                                <motion.div 
                                    key={log._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    className="glass-panel hover:border-accent/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-lg"
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-accent font-mono">
                                                {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            {log.sprint && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-surface border border-border text-muted rounded font-bold uppercase tracking-wider">
                                                    {log.sprint}
                                                </span>
                                            )}
                                            {log.jiraTicket && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-accent/10 border border-accent/20 text-accent rounded font-mono">
                                                    {log.jiraTicket}
                                                </span>
                                            )}
                                            {log.workStatus && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${getStatusColor(log.workStatus)}`}>
                                                    {log.workStatus}
                                                </span>
                                            )}
                                            {log.complexity && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${getComplexityColor(log.complexity)}`}>
                                                    {log.complexity}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-semibold text-text leading-tight">{log.task}</h3>
                                        {log.systemsModules && log.systemsModules.length > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted flex-wrap">
                                                <Server className="w-3 h-3 text-accent" />
                                                <span>Systems:</span>
                                                {log.systemsModules.slice(0, 3).map((s, i) => (
                                                    <span key={i} className="text-text bg-surface px-1.5 py-0.5 rounded text-[10px] border border-border">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-border/30">
                                        <Link 
                                            to="/logs"
                                            className="px-3 py-1.5 bg-slate-800/40 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 text-xs font-bold rounded-lg transition-all border border-border cursor-pointer"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Technologies & Systems lists */}
                <div className="space-y-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text/80 flex items-center gap-2">
                        <Code className="w-4 h-4 text-accent" />
                        <span>Core Tech & Systems Mapping</span>
                    </h2>

                    <div className="glass-panel rounded-2xl p-5 space-y-5 shadow-lg">
                        {/* Top systems */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Systems Exposure</span>
                            {stats?.systemsTouched?.length === 0 ? (
                                <span className="text-xs text-muted block italic">No systems registered yet.</span>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {stats?.systemsTouched?.map((sys, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent font-semibold text-xs rounded-lg">
                                            {sys}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top tech */}
                        <div className="space-y-2 border-t border-border/30 pt-4">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Technologies Leveraged</span>
                            {stats?.technologiesUsed?.length === 0 ? (
                                <span className="text-xs text-muted block italic">No technologies registered yet.</span>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {stats?.technologiesUsed?.map((tech, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-lg">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Databases Touched */}
                        {stats?.databasesTouched?.length > 0 && (
                            <div className="space-y-2 border-t border-border/30 pt-4">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Databases Touched</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {stats?.databasesTouched?.map((db, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-semibold text-xs rounded-lg">
                                            {db}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3 — Two-column layout (Testing & Blockers) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Testing Progress */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text/80 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" />
                        <span>Internship Testing Rigor</span>
                    </h2>

                    <div className="glass-panel rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-lg">
                        <div className="space-y-2 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-muted uppercase block">Total Unit Tests Written</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-teal-400 font-mono leading-none">
                                    {stats?.activitiesSum?.testsWritten || 0}
                                </span>
                                <span className="text-xs text-muted">standalone tests</span>
                            </div>
                            <p className="text-xs text-muted mt-2">
                                Rigorous verification ensures stable features, preventing downstream integration regressions.
                            </p>
                        </div>
                        <div className="space-y-4 border-t md:border-t-0 md:border-l border-border/30 pt-4 md:pt-0 md:pl-6">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Factual Delivery Metrics</span>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-muted">Bugs Fixed</span>
                                    <span className="text-text font-mono">{stats?.activitiesSum?.bugsFixed || 0}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-muted">Features Implemented</span>
                                    <span className="text-text font-mono">{stats?.activitiesSum?.featuresImplemented || 0}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-muted">PRs Authored</span>
                                    <span className="text-text font-mono">{stats?.activitiesSum?.prsCreated || 0}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-muted">Standup Meetings</span>
                                    <span className="text-text font-mono">{stats?.activitiesSum?.meetingsAttended || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blockers & Reflections */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text/80 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-accent" />
                        <span>Factual Standup Blockers & Reflections</span>
                    </h2>

                    <div className="glass-panel rounded-2xl p-5 space-y-4 min-h-[140px] flex flex-col justify-center shadow-lg">
                        <div className="flex gap-3">
                            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg h-fit">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-muted uppercase block">Active Blocker History</span>
                                <p className="text-xs text-text font-semibold leading-snug">
                                    {recentLogs.find(l => l.blockers)?.blockers || 'No active blockers logged recently. Downstream sandbox integrations operating normally!'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 border-t border-border/30 pt-3">
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg h-fit">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-muted uppercase block">Recent Architectural Learning</span>
                                <p className="text-xs text-text/90 italic leading-snug">
                                    "{recentLogs.find(l => l.learnings?.length > 0)?.learnings?.[0] || 'Continuing master internal frameworks, sandbox database isolation models and transactional rate limits.'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 4 — Quick Actions */}
            <div className="space-y-4 border-t border-border/20 pt-6">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-accent/80">
                    Contribution Intelligence Quick Actions
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        to="/logs"
                        className="glass-panel glass-panel-hover rounded-xl p-4 text-center group flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-lg"
                    >
                        <Plus className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-text">Daily Log Entry</span>
                        <span className="text-[10px] text-muted">Document daily standup</span>
                    </Link>

                    <Link
                        to="/manager-review"
                        className="glass-panel glass-panel-hover rounded-xl p-4 text-center group flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-lg"
                    >
                        <Sparkles className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-text">PPO Portfolio</span>
                        <span className="text-[10px] text-muted">Generate review ready reports</span>
                    </Link>

                    <Link
                        to="/systems-timeline"
                        className="glass-panel glass-panel-hover rounded-xl p-4 text-center group flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-lg"
                    >
                        <Server className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-text">Systems Timeline</span>
                        <span className="text-[10px] text-muted">Map your services journey</span>
                    </Link>

                    <Link
                        to="/search"
                        className="glass-panel glass-panel-hover rounded-xl p-4 text-center group flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-lg"
                    >
                        <Terminal className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-text">AI Smart Search</span>
                        <span className="text-[10px] text-muted">Recall natural language query</span>
                    </Link>
                </div>
            </div>

            {/* Row 5 — Engineering Activity Chart (14 days timeline) */}
            {activityTimeline.length > 0 && (
                <div className="space-y-4 border-t border-border/20 pt-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text/80 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-accent" />
                        <span>14-Day Stacked Activity Delivery Metrics</span>
                    </h2>

                    <div className="glass-panel rounded-2xl p-5 h-80 w-full shadow-lg">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={activityTimeline}
                                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                                    itemStyle={{ fontSize: '11px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar dataKey="featuresImplemented" name="Features" stackId="a" fill="#10b981" />
                                <Bar dataKey="bugsFixed" name="Bugs Fixed" stackId="a" fill="#ef4444" />
                                <Bar dataKey="prsCreated" name="PRs Created" stackId="a" fill="#3b82f6" />
                                <Bar dataKey="prsReviewed" name="PRs Reviewed" stackId="a" fill="#8b5cf6" />
                                <Bar dataKey="testsWritten" name="Tests Written" stackId="a" fill="#06b6d4" />
                                <Bar dataKey="meetingsAttended" name="Meetings" stackId="a" fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
