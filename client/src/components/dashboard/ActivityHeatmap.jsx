import React from 'react';
import { motion } from 'framer-motion';

const ActivityHeatmap = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="glass p-6 rounded-3xl">
                <h3 className="font-bold text-lg mb-4 text-text">Activity</h3>
                <div className="text-center py-8 text-muted text-sm">No activity data yet</div>
            </div>
        );
    }

    const getColor = (count) => {
        if (count === 0) return 'bg-slate-800/60';
        if (count === 1) return 'bg-orange-900/80';
        if (count === 2) return 'bg-orange-700/80';
        return 'bg-orange-500';
    };

    const getTooltip = (item) => {
        const date = new Date(item.date).toLocaleDateString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric' 
        });
        return `${date}: ${item.count} log${item.count !== 1 ? 's' : ''}`;
    };

    // Organize data into weeks (columns) with days (rows, 0=Sun to 6=Sat)
    const weeks = [];
    let currentWeek = [];
    
    data.forEach((item, index) => {
        if (index > 0 && item.day === 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(item);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Pad first week
    if (weeks.length > 0 && weeks[0].length < 7) {
        const padding = Array(7 - weeks[0].length).fill(null);
        weeks[0] = [...padding, ...weeks[0]];
    }

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    const totalLogs = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-6 rounded-3xl"
        >
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-text">Activity</h3>
                <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{totalLogs} logs</span>
                    <span>{activeDays} active days</span>
                </div>
            </div>

            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-1 pt-0">
                    {dayLabels.map((label, i) => (
                        <div key={i} className="h-[14px] text-[10px] text-muted flex items-center justify-end pr-1 w-6">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-1 flex-1 overflow-hidden">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-1">
                            {Array.from({ length: 7 }, (_, dayIndex) => {
                                const cell = week.find(d => d && d.day === dayIndex);
                                if (!cell) {
                                    return <div key={dayIndex} className="w-[14px] h-[14px]" />;
                                }
                                return (
                                    <div
                                        key={dayIndex}
                                        className={`w-[14px] h-[14px] rounded-[3px] ${getColor(cell.count)} transition-colors hover:ring-1 hover:ring-white/30 cursor-pointer`}
                                        title={getTooltip(cell)}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-4 text-[10px] text-muted">
                <span>Less</span>
                <div className="w-[12px] h-[12px] rounded-[2px] bg-slate-800/60" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-orange-900/80" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-orange-700/80" />
                <div className="w-[12px] h-[12px] rounded-[2px] bg-orange-500" />
                <span>More</span>
            </div>
        </motion.div>
    );
};

export default ActivityHeatmap;
