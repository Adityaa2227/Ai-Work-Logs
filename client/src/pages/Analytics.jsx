import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChartData } from '../services/dashboardService';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Calendar, ArrowRight, Loader2, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { useCompany } from '../context/CompanyContext';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg shadow-xl">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-white">{payload[0].value}</p>
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const { selectedCompany } = useCompany();
    const [range, setRange] = useState({ from: '', to: '', type: 'custom' });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chartRange, setChartRange] = useState(30);

    // Fetch chart data for the visualizations
    const { data: chartData } = useQuery({
        queryKey: ['analyticsCharts', chartRange, selectedCompany?._id],
        queryFn: () => getChartData(chartRange, selectedCompany?._id),
        enabled: !!selectedCompany
    });

    // Day-of-week breakdown
    const getDayOfWeekData = () => {
        if (!chartData?.weeklyActivity) return [];
        const dayMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        chartData.weeklyActivity.forEach(item => {
            const day = new Date(item.date).getDay();
            dayMap[dayNames[day]] += item.logs;
        });
        return dayNames.map(name => ({ name, logs: dayMap[name] }));
    };

    const handleGenerate = async () => {
        if (!range.from || !range.to) {
            toast.error('Please select date range');
            return;
        }
        if (!selectedCompany) {
            toast.error('Please select a company');
            return;
        }
        
        setLoading(true);
        try {
            const res = await api.post('/ai/generate', { 
                ...range, 
                company: selectedCompany._id,
                save: false
            });
            setReport(res.data);
            toast.success('Report generated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const presetRanges = [
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Last 90 Days', days: 90 },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-text tracking-tight">Analytics</h1>
                <p className="text-muted mt-2">Track your patterns, growth, and performance over time.</p>
            </header>

            {/* Chart Range Presets */}
            <div className="flex gap-2">
                {presetRanges.map(preset => (
                    <button
                        key={preset.days}
                        onClick={() => setChartRange(preset.days)}
                        className={clsx(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            chartRange === preset.days
                                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                : 'bg-surface text-muted border border-border hover:text-text hover:bg-card'
                        )}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Day of Week Pattern */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-lg text-text">Work Pattern</h3>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getDayOfWeekData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="logs" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Project Distribution */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-lg text-text">Project Focus</h3>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData?.projectDist || []}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={75}
                                    paddingAngle={4} dataKey="value"
                                >
                                    {(chartData?.projectDist || []).map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#e2e8f0' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {(chartData?.projectDist || []).map((entry, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-xs text-muted">{entry.name} ({entry.value})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Tech Stack Usage */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 rounded-3xl"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-lg text-text">Tech Stack</h3>
                    </div>
                    {chartData?.focusStats && chartData.focusStats.length > 0 ? (
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.focusStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-56 flex items-center justify-center text-muted text-sm">Log your tech stack to see usage patterns</div>
                    )}
                </motion.div>
            </div>

            {/* AI Report Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-border relative overflow-hidden"
            >
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-end">
                    <div className="flex-1 space-y-6 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text">AI Performance Report</h3>
                                <p className="text-sm text-muted">Generate a deep analysis of your work for any date range</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted ml-1">From Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-muted w-5 h-5 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text"
                                        onChange={e => setRange({ ...range, from: e.target.value })} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted ml-1">To Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-muted w-5 h-5 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-text"
                                        onChange={e => setRange({ ...range, to: e.target.value })} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={clsx(
                            "px-8 py-3.5 rounded-xl font-medium shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 min-w-[160px] justify-center",
                            loading 
                                ? "bg-surface text-muted cursor-not-allowed shadow-none" 
                                : "bg-gradient-to-r from-accent to-accentHover text-white shadow-accent/20 hover:shadow-xl"
                        )}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Generate</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
            </motion.div>

            {report && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card p-10 rounded-3xl shadow-lg border border-border"
                >
                    <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text">Performance Review</h2>
                                <p className="text-sm text-muted">Generated on {new Date(report.generatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                             <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Period</div>
                             <div className="text-sm font-medium text-text">
                                {new Date(range.from).toLocaleDateString()}  <ArrowRight className="inline w-3 h-3 mx-1 text-muted" />  {new Date(range.to).toLocaleDateString()}
                             </div>
                        </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none prose-headings:font-bold prose-h3:text-accent prose-p:text-muted prose-p:leading-relaxed">
                        <ReactMarkdown>{report.content}</ReactMarkdown>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Analytics;
