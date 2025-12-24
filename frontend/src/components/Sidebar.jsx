import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiSlack } from 'react-icons/si';
import { HiOutlineMail, HiUserGroup, HiCloud } from 'react-icons/hi';
import { MdEmail } from 'react-icons/md';
import { RxDashboard } from 'react-icons/rx';
import { FiCheckSquare, FiCalendar, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi';

const Sidebar = () => {
    const { logout } = useAuth();
    const location = useLocation();

    return (
        <aside className="w-16 md:w-64 bg-dark-card border-r border-slate-800 flex flex-col transition-all duration-300 h-screen sticky top-0">
            <div className="h-16 flex items-center justify-center md:justify-start px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary to-purple-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">P</div>
                <span className="ml-3 font-bold text-lg tracking-tight hidden md:block">ProdMax</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                <Link to="/" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <RxDashboard className="w-5 h-5 transition-colors" />
                    <span className="ml-3 font-medium hidden md:block">Dashboard</span>
                </Link>
                <Link to="/my-tasks" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/my-tasks' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <FiCheckSquare className="w-5 h-5 transition-colors" />
                    <span className="ml-3 font-medium hidden md:block">My Tasks</span>
                </Link>
                <Link to="/calendar" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/calendar' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <FiCalendar className="w-5 h-5 transition-colors" />
                    <span className="ml-3 font-medium hidden md:block">Calendar</span>
                </Link>
                <Link to="/team" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/team' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <FiUsers className="w-5 h-5 transition-colors" />
                    <span className="ml-3 font-medium hidden md:block">Team</span>
                </Link>
                <Link to="/settings" className={`p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group ${location.pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <FiSettings className="w-5 h-5 transition-colors" />
                    <span className="ml-3 font-medium hidden md:block">Settings</span>
                </Link>

                <div className="pt-4 mt-4 border-t border-slate-800">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 hidden md:block">External Tools</p>
                    <a href="https://teams.microsoft.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group text-slate-400 hover:bg-[#6264A7]/10 hover:text-[#6264A7]">
                        <HiUserGroup className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="ml-3 font-medium hidden md:block">Teams</span>
                    </a>
                    <a href="https://slack.com/signin" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group text-slate-400 hover:bg-[#4A154B]/10 hover:text-[#4A154B]">
                        <SiSlack className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="ml-3 font-medium hidden md:block">Slack</span>
                    </a>
                    <a href="https://outlook.office.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group text-slate-400 hover:bg-[#0078D4]/10 hover:text-[#0078D4]">
                        <HiOutlineMail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="ml-3 font-medium hidden md:block">Outlook</span>
                    </a>
                    <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group text-slate-400 hover:bg-[#EA4335]/10 hover:text-[#EA4335]">
                        <MdEmail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="ml-3 font-medium hidden md:block">Gmail</span>
                    </a>
                    <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl cursor-pointer flex items-center transition-all duration-200 group text-slate-400 hover:bg-[#1DA462]/10 hover:text-[#1DA462]">
                        <HiCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="ml-3 font-medium hidden md:block">Drive</span>
                    </a>
                </div>
            </nav>
            <div className="p-4 border-t border-slate-800">

                <div onClick={logout} className="p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-slate-400 cursor-pointer flex items-center transition-colors">
                    <FiLogOut className="w-5 h-5 transition-colors" />
                    <span className="ml-3 font-medium hidden md:block">Logout</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
