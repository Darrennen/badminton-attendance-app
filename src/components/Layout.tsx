import React from 'react';
import { Menu, LayoutDashboard, CalendarDays, Users, Settings, UserCircle, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, title }) => {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top App Bar */}
      <header className="glass-header flex items-center justify-between px-6 h-16 shadow-none border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-primary">
            <Menu size={24} />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-6 mr-6">
            <button onClick={() => setActiveTab('dashboard')} className={`text-sm font-bold transition-colors ${activeTab === 'dashboard' ? 'text-primary' : 'text-outline hover:text-primary'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('sessions')} className={`text-sm font-bold transition-colors ${activeTab === 'sessions' ? 'text-primary' : 'text-outline hover:text-primary'}`}>Sessions</button>
            <button onClick={() => setActiveTab('roster')} className={`text-sm font-bold transition-colors ${activeTab === 'roster' ? 'text-primary' : 'text-outline hover:text-primary'}`}>Roster</button>
            <button onClick={() => setActiveTab('settings')} className={`text-sm font-bold transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-outline hover:text-primary'}`}>Settings</button>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/10 cursor-pointer">
            <img 
              alt="User profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHwVH-3cQFF5xUzuY0_5u0gz837f_som5wffrD6MBC5abeSgGSOo7CqTABHv8c7QgGg_hHRmbhcXXF-rnLLKILnU7a_Nsnbzo-GSy9jb0XUJlBr_9a8-_emwKOiLhb5j4Jjk6mZiB9GEETD0bv_r9WJ1UfybtMDruDZojzWjCz2SUzwxcHZXGlnTQPb54VVU3DTknrZm95kU0Si5kiWR4zak6A8cg8rTUt7c9GrUy6Tmm3GJhODwRQv59cdtc8Zh5yZQgeR7s7YRs" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md flex justify-around items-center px-4 pb-6 pt-3 shadow-[0_-4px_24px_rgba(24,28,30,0.08)] rounded-t-3xl">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-100 text-primary' : 'text-outline'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all ${activeTab === 'sessions' ? 'bg-blue-100 text-primary' : 'text-outline'}`}
        >
          <CalendarDays size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Sessions</span>
        </button>
        <button 
          onClick={() => setActiveTab('coaches')}
          className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all ${activeTab === 'coaches' ? 'bg-blue-100 text-primary' : 'text-outline'}`}
        >
          <UserCircle size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Coaches</span>
        </button>
        <button 
          onClick={() => setActiveTab('replacements')}
          className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all ${activeTab === 'replacements' ? 'bg-blue-100 text-primary' : 'text-outline'}`}
        >
          <ArrowLeftRight size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Staffing</span>
        </button>
        <button 
          onClick={() => setActiveTab('roster')}
          className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-all ${activeTab === 'roster' ? 'bg-blue-100 text-primary' : 'text-outline'}`}
        >
          <Users size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Roster</span>
        </button>
      </nav>
    </div>
  );
};
