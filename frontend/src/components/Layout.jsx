// Enhanced Layout matching new Dashboard aesthetics
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white overflow-hidden font-inter selection:bg-primary/30 selection:text-white transition-colors duration-300">
            {/* Ambient Background Glows - Dark Mode Only */}
            <div className="fixed inset-0 pointer-events-none z-0 hidden dark:block">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow delay-700"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] opacity-20"></div>
            </div>

            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-transparent backdrop-blur-[0px]">
                {children}
            </main>
        </div>
    );
};

export default Layout;
