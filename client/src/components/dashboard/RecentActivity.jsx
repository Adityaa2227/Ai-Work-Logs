import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentActivity = ({ logs }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-3xl"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text">Recent Activity</h3>
                <Link to="/logs" className="text-sm text-accent hover:text-indigo-400 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-4">
                {logs?.map((log, index) => (
                    <div key={log._id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                            <Clock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-text truncate pr-2 group-hover:text-accent transition-colors">
                                    {log.status === 'Available' ? log.task : log.status}
                                </h4>
                                <span className="text-xs text-muted whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</span>
                            </div>
                            {log.status === 'Available' ? (
                                <>
                                    <p className="text-sm text-muted mb-2">{log.project}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {log.workDone?.slice(0, 2).map((point, i) => (
                                            <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700/50 truncate max-w-[200px]">
                                                {point}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted italic">{log.noWorkReason || 'No reason provided'}</p>
                            )}
                        </div>
                    </div>
                ))}
                
                {(!logs || logs.length === 0) && (
                    <div className="text-center py-8 text-muted">
                        No recent activity found.
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default RecentActivity;
