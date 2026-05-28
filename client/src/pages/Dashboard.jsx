import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEngineeringStats, getLogs, getDailyInsight } from '../services/logService';
import { 
    CheckCircle, GitPullRequest, Server, Briefcase, Plus, Sparkles, 
    ArrowRight, Brain, AlertTriangle, Shield,
    Code, Terminal, Lightbulb, Activity, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PPOCoach from '../components/PPOCoach';

const MetricTile = ({ label, value, sub, icon: Icon, accent = 'accent', delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay }}
        className="bg-card border border-border rounded-lg p-3.5 flex items-center gap-3 hover:border-zinc-600 transition-colors"
    >
        <div className={`p-2 rounded-md bg-${accent}/10 shrink-0`}>
            <Icon className={`w-4 h-4 text-${accent}`} />
        </div>
        <div className="min-w-0">
            <span className="text-xs text-muted block">{label}</span>
            <span className="text-lg font-semibold text-text font-mono leading-tight block">{value}</span>
            {sub && <span className="text-[11px] text-muted block mt-0.5 truncate">{sub}</span>}
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { selectedCompany } = useCompany();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user?.username || 'engineer';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['engineeringStats', selectedCompany?._id],
        queryFn: () => getEngineeringStats(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['recentLogs', selectedCompany?._id],
        queryFn: () => getLogs({ limit: 5, company: selectedCompany?._id }),
        enabled: !!selectedCompany
    });

    const { data: dailyInsight } = useQuery({
        queryKey: ['dailyInsight', selectedCompany?._id],
        queryFn: () => getDailyInsight(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    const isLoading = statsLoading || logsLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-7 w-56 rounded" />
                <div className="skeleton h-4 w-40 rounded mt-1" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-card p-4 h-20 rounded-lg" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 skeleton-card h-64 rounded-lg" />
                    <div className="skeleton-card h-64 rounded-lg" />
                </div>
            </div>
        );
    }

    const activityTimeline = stats?.activityTimeline || [];
    const recentLogs = logsData?.logs || [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'deployed': return 'badge-success';
            case 'review': return 'badge-warning';
            case 'blocked': return 'badge-error';
            case 'in-progress': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-text">
                        {getGreeting()}, {username}
                    </h1>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                        <Terminal className="w-3 h-3" />
                        <span>Engineering Intelligence for {selectedCompany?.name || 'workspace'}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link 
                        to="/logs"
                        className="bg-accent hover:bg-accentHover text-white px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Entry</span>
                    </Link>
                    <Link
                        to="/manager-review"
                        className="bg-surface hover:bg-zinc-700 text-text border border-border px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>Reviews</span>
                    </Link>
                </div>
            </div>

            {/* AI Insight Banner */}
            {dailyInsight && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-accent/5 border border-accent/15 rounded-lg px-4 py-3 flex items-start gap-3"
                >
                    <Lightbulb className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <span className="text-xs font-medium text-accent block">Daily Engineering Tip</span>
                        <p className="text-sm text-text/80 mt-0.5 leading-relaxed">
                            {typeof dailyInsight === 'string' ? dailyInsight : dailyInsight?.tip || dailyInsight?.content || 'Keep improving your engineering craft.'}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Metric Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricTile 
                    label="Total Logs" 
                    value={stats?.totalLogs || 0} 
                    sub="contributions logged"
                    icon={CheckCircle} 
                    accent="accent"
                    delay={0.02}
                />
                <MetricTile 
                    label="PRs & Reviews" 
                    value={(stats?.weeklyPRsCreated || 0) + (stats?.weeklyPRsReviewed || 0)} 
                    sub={`${stats?.weeklyPRsCreated || 0} created / ${stats?.weeklyPRsReviewed || 0} reviewed`}
                    icon={GitPullRequest} 
                    accent="success"
                    delay={0.04}
                />
                <MetricTile 
                    label="Systems" 
                    value={stats?.systemsTouchedCount || 0} 
                    sub={`${stats?.technologiesUsedCount || 0} technologies`}
                    icon={Server} 
                    accent="accent"
                    delay={0.06}
                />
                <MetricTile 
                    label="Active Tickets" 
                    value={stats?.activeJiraCount || 0} 
                    sub="in-progress"
                    icon={Briefcase} 
                    accent="warning"
                    delay={0.08}
                />
            </div>

            {/* Two-column: Recent Logs + Tech Stack */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Recent Contributions */}
                <div className="xl:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
                            Recent Contributions
                        </h2>
                        <Link to="/logs" className="text-xs text-accent hover:text-accentHover flex items-center gap-1 transition-colors">
                            <span>View all</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="bg-card border border-border rounded-lg divide-y divide-border/30">
                        {recentLogs.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-muted">No contributions logged yet</p>
                                <Link to="/logs" className="text-xs text-accent hover:text-accentHover mt-1 inline-block">
                                    Create your first entry
                                </Link>
                            </div>
                        ) : (
                            recentLogs.map((log) => (
                                <div 
                                    key={log._id}
                                    className="px-4 py-3 flex items-start gap-3 hover:bg-surface/30 transition-colors"
                                >
                                    <div className="shrink-0 mt-0.5">
                                        <Clock className="w-3.5 h-3.5 text-muted" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[11px] font-mono text-muted">
                                                {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            {log.jiraTicket && (
                                                <span className="badge badge-info">{log.jiraTicket}</span>
                                            )}
                                            {log.workStatus && (
                                                <span className={`badge ${getStatusColor(log.workStatus)}`}>
                                                    {log.workStatus}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-text mt-0.5 line-clamp-1">{log.task}</p>
                                        {log.systemsModules && log.systemsModules.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1 text-[11px] text-muted">
                                                <Server className="w-3 h-3" />
                                                {log.systemsModules.slice(0, 3).join(' · ')}
                                            </div>
                                        )}
                                    </div>
                                    <Link 
                                        to="/logs"
                                        className="text-xs text-muted hover:text-accent transition-colors shrink-0"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Tech & Systems */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
                        Tech & Systems
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        {/* Systems */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">Systems</span>
                            {stats?.systemsTouched?.length === 0 ? (
                                <span className="text-xs text-zinc-600 italic">No systems yet</span>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {stats?.systemsTouched?.map((sys, i) => (
                                        <span key={i} className="pill-chip">{sys}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Technologies */}
                        <div className="space-y-2 border-t border-border/30 pt-3">
                            <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">Technologies</span>
                            {stats?.technologiesUsed?.length === 0 ? (
                                <span className="text-xs text-zinc-600 italic">No technologies yet</span>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {stats?.technologiesUsed?.map((tech, i) => (
                                        <span key={i} className="pill-chip">{tech}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Databases */}
                        {stats?.databasesTouched?.length > 0 && (
                            <div className="space-y-2 border-t border-border/30 pt-3">
                                <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">Databases</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {stats?.databasesTouched?.map((db, i) => (
                                        <span key={i} className="pill-chip">{db}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Two-column: Delivery Metrics + Blockers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Delivery Metrics */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Delivery Metrics
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[11px] text-muted block">Tests Written</span>
                                <span className="text-2xl font-semibold text-success font-mono">
                                    {stats?.activitiesSum?.testsWritten || 0}
                                </span>
                            </div>
                            <div className="space-y-2 border-l border-border/30 pl-4">
                                {[
                                    ['Bugs Fixed', stats?.activitiesSum?.bugsFixed || 0],
                                    ['Features', stats?.activitiesSum?.featuresImplemented || 0],
                                    ['PRs Authored', stats?.activitiesSum?.prsCreated || 0],
                                    ['Meetings', stats?.activitiesSum?.meetingsAttended || 0],
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between text-xs">
                                        <span className="text-muted">{label}</span>
                                        <span className="text-text font-mono font-medium">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blockers & Learnings */}
                <div className="space-y-3">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <Brain className="w-3 h-3" />
                        Blockers & Reflections
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                        <div className="flex gap-2.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                            <div>
                                <span className="text-[11px] font-medium text-muted block">Active Blockers</span>
                                <p className="text-xs text-text mt-0.5">
                                    {recentLogs.find(l => l.blockers)?.blockers || 'No active blockers logged recently.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2.5 border-t border-border/30 pt-3">
                            <Lightbulb className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <span className="text-[11px] font-medium text-muted block">Recent Learning</span>
                                <p className="text-xs text-text/80 mt-0.5 italic">
                                    "{recentLogs.find(l => l.learnings?.length > 0)?.learnings?.[0] || 'No learnings logged recently.'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted">
                    Quick Actions
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { to: '/logs', icon: Plus, label: 'Log Entry', sub: 'Daily standup', accent: 'accent' },
                        { to: '/manager-review', icon: Sparkles, label: 'PPO Report', sub: 'Generate review', accent: 'accent' },
                        { to: '/systems-timeline', icon: Server, label: 'Systems Map', sub: 'Service topology', accent: 'accent' },
                        { to: '/search', icon: Terminal, label: 'AI Search', sub: 'Query logs', accent: 'accent' },
                    ].map((action) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            className="bg-card border border-border rounded-lg p-3 hover:border-zinc-600 transition-colors group"
                        >
                            <action.icon className="w-4 h-4 text-muted group-hover:text-accent transition-colors mb-2" />
                            <span className="text-sm font-medium text-text block">{action.label}</span>
                            <span className="text-[11px] text-muted">{action.sub}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Activity Chart */}
            {activityTimeline.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <Activity className="w-3 h-3" />
                        14-Day Activity
                    </h2>

                    <div className="bg-card border border-border rounded-lg p-4 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={activityTimeline}
                                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#52525b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    fontFamily="JetBrains Mono"
                                />
                                <YAxis 
                                    stroke="#52525b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    fontFamily="JetBrains Mono"
                                />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: '#18181b', 
                                        borderColor: '#3f3f46', 
                                        borderRadius: '8px',
                                        fontSize: '11px'
                                    }}
                                    labelStyle={{ color: '#a1a1aa', fontSize: '11px', fontWeight: '500' }}
                                    itemStyle={{ fontSize: '11px' }}
                                />
                                <Legend 
                                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} 
                                    iconType="square"
                                    iconSize={8}
                                />
                                <Bar dataKey="featuresImplemented" name="Features" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="bugsFixed" name="Bugs" stackId="a" fill="#f87171" />
                                <Bar dataKey="prsCreated" name="PRs" stackId="a" fill="#34d399" />
                                <Bar dataKey="prsReviewed" name="Reviews" stackId="a" fill="#a78bfa" />
                                <Bar dataKey="testsWritten" name="Tests" stackId="a" fill="#22d3ee" />
                                <Bar dataKey="meetingsAttended" name="Meetings" stackId="a" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            {/* PPO Coach Overlay */}
            <PPOCoach />
        </div>
    );
};

export default Dashboard;
