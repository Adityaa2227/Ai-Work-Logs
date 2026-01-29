import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getChartData } from '../services/dashboardService';
import { getLogs } from '../services/logService';
import StatCard from '../components/dashboard/StatCard';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';
import RecentActivity from '../components/dashboard/RecentActivity';
import { CheckCircle, TrendingUp, Calendar } from 'lucide-react';

import { useCompany } from '../context/CompanyContext';

const Dashboard = () => {
    const { selectedCompany } = useCompany();

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

    // 3. Fetch Recent Logs (for activity feed) - limit to 3 for display
    const { data: logsData, isLoading: logsLoading } = useQuery({
        queryKey: ['recentLogs', selectedCompany?._id],
        queryFn: () => getLogs({ limit: 3, company: selectedCompany?._id }),
        enabled: !!selectedCompany
    });

    // 4. Get total log count
    const { data: allLogsData } = useQuery({
        queryKey: ['allLogs', selectedCompany?._id],
        queryFn: () => getLogs({ company: selectedCompany?._id }),
        enabled: !!selectedCompany
    });

    const isLoading = statsLoading || chartsLoading || logsLoading;

    if (isLoading) {
        return (
            <div className="flex bg-transparent h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text tracking-tight">Dashboard</h1>
                <p className="text-muted mt-2">Overview of your work logs and projects.</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Logs" 
                    value={allLogsData?.logs?.length || 0} 
                    icon={CheckCircle} 
                    color="bg-indigo-500" 
                    delay={0.1} 
                />
                <StatCard 
                    title="Active Projects" 
                    value={stats?.projectDist?.length || 0} 
                    icon={TrendingUp} 
                    color="bg-emerald-500" 
                    delay={0.2} 
                />
                <StatCard 
                    title="Day Streak" 
                    value={stats?.streak || 0} 
                    icon={Calendar} 
                    color="bg-rose-500" 
                    delay={0.3} 
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Project Distribution */}
                <div className="xl:col-span-2">
                    <AnalyticsCharts data={chartData} />
                </div>

                {/* Right Column: Recent Activity */}
                <div>
                    <RecentActivity logs={logsData?.logs} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

