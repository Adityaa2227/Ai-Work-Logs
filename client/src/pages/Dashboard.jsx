import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getChartData, getHeatmapData } from '../services/dashboardService';
import { getLogs } from '../services/logService';
import StatCard from '../components/dashboard/StatCard';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';
import RecentActivity from '../components/dashboard/RecentActivity';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import { CheckCircle, TrendingUp, Calendar, Flame, BookOpen, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useCompany } from '../context/CompanyContext';

const Dashboard = () => {
    const { selectedCompany } = useCompany();

    // Get username from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user?.username || 'there';

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // 1. Fetch KPI Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboardStats', selectedCompany?._id],
        queryFn: () => getDashboardStats(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    // 2. Fetch Chart Data
    const { data: chartData, isLoading: chartsLoading } = useQuery({
        queryKey: ['chartData', 7, selectedCompany?._id],
        queryFn: () => getChartData(7, selectedCompany?._id),
        enabled: !!selectedCompany
    });

    // 3. Fetch Recent Logs (for activity feed)
    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['recentLogs', selectedCompany?._id],
        queryFn: () => getLogs({ limit: 3, company: selectedCompany?._id }),
        enabled: !!selectedCompany
    });

    // 4. Fetch Heatmap Data
    const { data: heatmapData } = useQuery({
        queryKey: ['heatmap', selectedCompany?._id],
        queryFn: () => getHeatmapData(selectedCompany?._id),
        enabled: !!selectedCompany
    });

    const isLoading = statsLoading || chartsLoading || logsLoading;

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Skeleton greeting */}
                <div className="skeleton h-10 w-72 rounded-xl" />
                <div className="skeleton h-5 w-48 rounded-lg mt-2" />

                {/* Skeleton stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton-card p-6 h-32">
                            <div className="skeleton h-10 w-10 rounded-xl mb-3" />
                            <div className="skeleton h-3 w-20 rounded mb-2" />
                            <div className="skeleton h-7 w-12 rounded" />
                        </div>
                    ))}
                </div>

                {/* Skeleton chart */}
                <div className="skeleton-card p-6 h-72">
                    <div className="skeleton h-5 w-32 rounded mb-4" />
                    <div className="skeleton h-48 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header with Greeting & Quick Actions */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl font-bold text-text tracking-tight">
                        {getGreeting()}, {username} 👋
                    </h1>
                    <p className="text-muted mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3"
                >
                    <Link 
                        to="/logs"
                        className="bg-accent text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-accent/20 hover:bg-accentHover hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Log Today
                    </Link>
                    <Link
                        to="/analytics"
                        className="bg-surface text-text px-5 py-2.5 rounded-xl font-medium border border-border hover:bg-card hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                        <Sparkles className="w-4 h-4 text-accent" />
                        AI Report
                    </Link>
                </motion.div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard 
                    title="Total Logs" 
                    value={stats?.totalLogs || 0} 
                    icon={CheckCircle} 
                    color="bg-orange-500" 
                    delay={0.05} 
                />
                <StatCard 
                    title="This Week" 
                    value={stats?.weeklyLogs || 0} 
                    icon={Calendar} 
                    color="bg-cyan-500" 
                    delay={0.1} 
                />
                <StatCard 
                    title="Projects" 
                    value={stats?.projectDist?.length || 0} 
                    icon={TrendingUp} 
                    color="bg-emerald-500" 
                    delay={0.15} 
                />
                <StatCard 
                    title="Day Streak" 
                    value={stats?.streak || 0} 
                    icon={Flame} 
                    color="bg-orange-500" 
                    delay={0.2} 
                />
                <StatCard 
                    title="Learnings" 
                    value={stats?.totalLearnings || 0} 
                    icon={BookOpen} 
                    color="bg-amber-500" 
                    delay={0.25} 
                />
            </div>

            {/* Activity Heatmap */}
            <ActivityHeatmap data={heatmapData} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <AnalyticsCharts data={chartData} />
                </div>
                <div>
                    <RecentActivity logs={logsData?.logs} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
