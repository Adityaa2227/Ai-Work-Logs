import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="glass p-6 rounded-2xl relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300`}>
                <Icon className={`w-24 h-24 ${color.replace('bg-', 'text-')}`} />
            </div>
            
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 shadow-lg shadow-black/20`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-muted text-sm font-medium tracking-wide uppercase">{title}</h3>
                <p className="text-3xl font-bold text-text mt-1">{value}</p>
            </div>
        </motion.div>
    );
};

export default StatCard;
