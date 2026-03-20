import React, { useEffect, useState } from 'react';
import { LayoutDashboard, CalendarDays, UserPlus, UserCircle, CreditCard, Sun, Moon, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, title }) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const topNav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'sessions', label: 'Attendance' },
    { id: 'payments', label: 'Payments' },
    { id: 'register-students', label: 'Students' },
    { id: 'register-coaches', label: 'Coaches' },
    { id: 'manage-sessions', label: 'Sessions' },
  ];

  const bottomNav = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'sessions', label: 'Attendance', icon: CalendarDays },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'register-students', label: 'Students', icon: UserPlus },
    { id: 'register-coaches', label: 'Coaches', icon: UserCircle },
    { id: 'manage-sessions', label: 'Sessions', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top App Bar */}
      <header className="glass-header flex items-center justify-between px-6 h-16 border-b border-outline-variant/10">
        <h1 className="font-headline font-bold text-lg tracking-tight text-primary">{title}</h1>
        <div className="flex items-center gap-1">
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
          <button
            onClick={() => setDark(d => !d)}
            className="ml-2 p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 glass-bottom flex justify-around items-center px-2 pb-6 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.15)] rounded-t-3xl border-t border-outline-variant/10">
        {bottomNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-2xl transition-all ${
              activeTab === id ? 'bg-primary/10 text-primary' : 'text-outline'
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
