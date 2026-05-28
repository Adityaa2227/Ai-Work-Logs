import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, FileText, Server, GitPullRequest, 
    GraduationCap, ClipboardCheck, Search, Download, 
    LogOut, Menu, Brain, X, ChevronLeft, ChevronRight,
    Command, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

import CompanySwitcher from './CompanySwitcher';
import PushNotificationManager from './PushNotificationManager';
import GlobalLogModal from './GlobalLogModal';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user?.username || 'User';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Work Logs', path: '/logs', icon: FileText },
        { name: 'Systems', path: '/systems-timeline', icon: Server },
        { name: 'PR & Jira', path: '/pr-activity', icon: GitPullRequest },
        { name: 'Learning', path: '/learning', icon: GraduationCap },
        { name: 'Reviews', path: '/manager-review', icon: ClipboardCheck },
        { name: 'Search', path: '/search', icon: Search },
        { name: 'AI Critique', path: '/critique', icon: Brain },
        { name: 'Export', path: '/export', icon: Download },
    ];

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const SidebarContent = ({ mobile = false }) => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className={clsx(
                "flex items-center border-b border-border/50 shrink-0",
                isCollapsed && !mobile ? "justify-center px-2 py-3" : "justify-between px-4 py-3"
            )}>
                <Link to="/" className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-accent" />
                    </div>
                    {(!isCollapsed || mobile) && (
                        <span className="text-sm font-semibold text-text tracking-tight truncate">
                            WorkLog AI
                        </span>
                    )}
                </Link>
                {!mobile && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 rounded hover:bg-surface text-muted hover:text-text transition-colors hidden md:flex"
                    >
                        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                    </button>
                )}
                {mobile && (
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1 rounded hover:bg-surface text-muted hover:text-text transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Company Switcher */}
            {(!isCollapsed || mobile) && (
                <div className="px-3 py-2 border-b border-border/30">
                    <CompanySwitcher />
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={isCollapsed && !mobile ? item.name : undefined}
                            className={clsx(
                                'flex items-center rounded-md transition-colors duration-100 group relative',
                                isCollapsed && !mobile ? 'justify-center px-2 py-2' : 'px-2.5 py-[7px] gap-2.5',
                                isActive
                                    ? 'bg-surface text-text'
                                    : 'text-muted hover:text-text hover:bg-surface/50'
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent rounded-r-full" />
                            )}
                            <item.icon className={clsx(
                                "shrink-0 transition-colors",
                                isCollapsed && !mobile ? "w-[18px] h-[18px]" : "w-4 h-4",
                                isActive ? "text-accent" : "text-muted group-hover:text-text"
                            )} />
                            {(!isCollapsed || mobile) && (
                                <span className="text-[13px] font-medium truncate">{item.name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={clsx(
                "border-t border-border/50 shrink-0",
                isCollapsed && !mobile ? "px-2 py-2" : "px-3 py-3 space-y-2"
            )}>
                {/* Keyboard shortcut hint */}
                {(!isCollapsed || mobile) && (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-muted">
                        <Command className="w-3 h-3" />
                        <span className="text-[11px]">Ctrl+M to log</span>
                    </div>
                )}

                {/* User & Notifications */}
                <div className={clsx(
                    "flex items-center",
                    isCollapsed && !mobile ? "justify-center" : "justify-between px-1"
                )}>
                    <div className={clsx(
                        "flex items-center",
                        isCollapsed && !mobile ? "" : "gap-2.5"
                    )}>
                        <div className="w-6 h-6 rounded-md bg-accent/15 flex items-center justify-center text-accent text-[11px] font-bold shrink-0">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        {(!isCollapsed || mobile) && (
                            <div className="min-w-0">
                                <p className="text-[12px] font-medium text-text truncate">{username}</p>
                            </div>
                        )}
                    </div>
                    {(!isCollapsed || mobile) && (
                        <div className="flex items-center gap-1">
                            <PushNotificationManager />
                            <button
                                onClick={handleLogout}
                                className="p-1.5 rounded hover:bg-surface text-muted hover:text-error transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-bg overflow-hidden font-sans text-text">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-card border-b border-border/50 z-40 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-accent/15 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="font-semibold text-sm text-text">WorkLog AI</span>
                </div>
                <div className="flex items-center gap-1">
                    <PushNotificationManager />
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1.5 hover:bg-surface rounded-md transition-colors"
                    >
                        <Menu className="w-5 h-5 text-muted" />
                    </button>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.2 }}
                            className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border/50 z-50 md:hidden"
                        >
                            <SidebarContent mobile={true} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className={clsx(
                "hidden md:flex flex-col bg-card border-r border-border/50 shrink-0 transition-all duration-200",
                isCollapsed ? "w-[52px]" : "w-[220px]"
            )}>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 pt-12 md:pt-0">
                <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
                    <Outlet />
                </div>
            </main>

            <GlobalLogModal />
        </div>
    );
};

export default Layout;
