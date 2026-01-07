import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SiSlack } from 'react-icons/si';
import { HiOutlineMail, HiUserGroup, HiCloud } from 'react-icons/hi';
import { MdEmail } from 'react-icons/md';
import { RxDashboard } from 'react-icons/rx';
import { FiCheckSquare, FiCalendar, FiUsers, FiSettings, FiLogOut, FiSun, FiMoon, FiLayers, FiAward } from 'react-icons/fi';

const Sidebar = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const NavLink = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`group relative flex items-center p-3 rounded-xl transition-all duration-200 font-medium
                    ${isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                    }
                `}
            >
                {/* Icon */}
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:scale-110'}`} />
                <span className="ml-3 text-sm tracking-wide hidden md:block">
                    {label}
                </span>
            </Link>
        );
    };

    const ExternalLink = ({ href, icon: Icon, label, colorClass, hoverBg, hoverText }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex items-center p-3 rounded-2xl transition-all duration-300 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-700/50`}
        >
            <div className={`p-1.5 rounded-lg transition-colors duration-300 ${hoverBg} ${hoverText} bg-opacity-10 group-hover:bg-opacity-20`}>
                <Icon className="w-4 h-4" />
            </div>
            <span className="ml-3 font-medium text-sm hidden md:block group-hover:translate-x-1 transition-transform">{label}</span>
        </a>
    );

    return (
        <aside className="w-16 md:w-72 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex flex-col h-screen sticky top-0 z-50 transition-colors duration-300">
            {/* Logo Section */}
            <div className="h-24 flex items-center px-8 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
                {/* Ambient background glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-3xl pointer-events-none"></div>

                <div className="relative group cursor-pointer flex items-center gap-4 z-10 w-full">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 border border-white/10">
                            <FiLayers className="text-white w-6 h-6 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" />
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col">
                        <h1 className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white">ProdMax</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">Workspace</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 hidden md:block">Main Menu</p>

                <NavLink to="/" icon={RxDashboard} label="Dashboard" />
                <NavLink to="/my-tasks" icon={FiCheckSquare} label="My Tasks" />
                <NavLink to="/calendar" icon={FiCalendar} label="Calendar" />
                <NavLink to="/team" icon={FiUsers} label="Team Members" />
                <NavLink to="/leaderboard" icon={FiAward} label="Leaderboard" />

                <div className="my-8 border-t border-slate-200 dark:border-white/5 mx-2"></div>

                <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 hidden md:block">Tools & Apps</p>
                <div className="space-y-1">
                    <ExternalLink href="https://teams.microsoft.com" icon={HiUserGroup} label="Microsoft Teams" hoverBg="group-hover:bg-[#6264A7]" hoverText="text-[#6264A7]" />
                    <ExternalLink href="https://slack.com/signin" icon={SiSlack} label="Slack Workspace" hoverBg="group-hover:bg-[#4A154B]" hoverText="text-[#4A154B]" />
                    <ExternalLink href="https://outlook.office.com" icon={HiOutlineMail} label="Outlook Mail" hoverBg="group-hover:bg-[#0078D4]" hoverText="text-[#0078D4]" />
                    <ExternalLink href="https://mail.google.com" icon={MdEmail} label="Gmail" hoverBg="group-hover:bg-[#EA4335]" hoverText="text-[#EA4335]" />
                    <ExternalLink href="https://drive.google.com" icon={HiCloud} label="Google Drive" hoverBg="group-hover:bg-[#1DA462]" hoverText="text-[#1DA462]" />
                </div>
            </nav>

            {/* Footer / Settings */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group mb-1 text-slate-600 dark:text-slate-400"
                >
                    {theme === 'dark' ? (
                        <FiSun className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
                    ) : (
                        <FiMoon className="w-5 h-5 group-hover:text-primary transition-colors" />
                    )}
                    <span className="ml-3 font-medium text-sm group-hover:text-slate-900 dark:group-hover:text-white hidden md:block">
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>

                <Link to="/settings" className="flex items-center p-3 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group mb-1">
                    <FiSettings className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    <span className="ml-3 font-medium text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white hidden md:block">Settings</span>
                </Link>
                <button onClick={logout} className="w-full flex items-center p-3 rounded-xl hover:bg-red-500/10 transition-colors group text-left">
                    <FiLogOut className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                    <span className="ml-3 font-medium text-sm text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 hidden md:block">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
