import React from 'react';
import { LayoutDashboard, CalendarDays, UserPlus, UserCircle, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, title }) => {
  const topNav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'sessions', label: 'Attendance' },
    { id: 'register-students', label: 'Students' },
    { id: 'register-coaches', label: 'Coaches' },
    { id: 'manage-sessions', label: 'Sessions' },
  ];

  const bottomNav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'sessions', label: 'Attendance', icon: CalendarDays },
    { id: 'register-students', label: 'Students', icon: UserPlus },
    { id: 'register-coaches', label: 'Coaches', icon: UserCircle },
    { id: 'manage-sessions', label: 'Sessions', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top App Bar */}
      <header className="glass-header flex items-center justify-between px-6 h-16 shadow-none border-b border-outline-variant/10 sticky top-0 z-40">
        <h1 className="font-headline font-bold text-lg tracking-tight text-primary">{title}</h1>
        <nav className="hidden md:flex gap-1">
          {topNav.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-outline hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md flex justify-around items-center px-2 pb-6 pt-3 shadow-[0_-4px_24px_rgba(24,28,30,0.08)] rounded-t-3xl">
        {bottomNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-all ${
              activeTab === id ? 'bg-blue-100 text-primary' : 'text-outline'
            }`}
          >
            <Icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
