import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart2, Download, Settings, Menu, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

import CompanySwitcher from './CompanySwitcher';
import PushNotificationManager from './PushNotificationManager';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'My Logs', path: '/logs', icon: FileText },
        { name: 'Analytics', path: '/analytics', icon: BarChart2 },
        { name: 'Self-Improvement', path: '/improvement', icon: TrendingUp },
        { name: 'Export', path: '/export', icon: Download },
    ];
    
    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-bg overflow-hidden font-sans text-text">
import PushNotificationManager from './PushNotificationManager';

// ... inside Layout return ...

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg">WorkLog AI</span>
                </div>
                <div className="flex items-center gap-2">
                    <PushNotificationManager />
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6 text-text" />
                    </button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "w-72 bg-card border-r border-border flex flex-col z-50 shadow-xl md:shadow-sm",
                "fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            WorkLog AI
                        </h1>
                    </div>
                    
                    <CompanySwitcher />
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group overflow-hidden',
                                    isActive 
                                        ? 'text-accent font-medium bg-accent/10 shadow-sm ring-1 ring-accent/20' 
                                        : 'text-muted hover:text-accent hover:bg-surface'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-accent rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                                <item.icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-accent" : "text-muted group-hover:text-accent")} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border mt-auto">
                    <div className="bg-gradient-to-br from-accent to-accentHover rounded-2xl p-4 text-white shadow-lg shadow-accent/20">
                        <h4 className="font-semibold text-sm">Pro Tip</h4>
                        <p className="text-xs text-white/80 mt-1">Use AI Analytics to boost your productivity by 20%.</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide pt-16 md:pt-0">
                <div className="max-w-7xl mx-auto p-4 md:p-8 md:pt-10">
                   <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                   >
                        <Outlet />
                   </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Layout;

