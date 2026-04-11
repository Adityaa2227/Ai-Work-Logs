import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsCharts = ({ data }) => {
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg shadow-xl">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-white">{payload[0].value} logs</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Project Dist + Tech Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Distribution */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 rounded-3xl"
                >
                    <h3 className="font-bold text-lg mb-4 text-text">Projects</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.projectDist || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(data?.projectDist || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#e2e8f0' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {(data?.projectDist || []).map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-muted">{entry.name} ({entry.value})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Tech Stack Chart */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-3xl"
                >
                    <h3 className="font-bold text-lg mb-4 text-text">Tech Stack</h3>
                    {data?.focusStats && data.focusStats.length > 0 ? (
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.focusStats} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={70} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#e2e8f0' }}
                                        formatter={(val) => [`${val} uses`, 'Count']}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted text-sm">
                            No tech stack data yet
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
