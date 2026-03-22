import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, CalendarDays, UserPlus, UserCircle, CreditCard, Sun, Moon, Layers, ChevronDown, Plus, Check, Pencil, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Branch } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  branches: Branch[];
  activeBranchId: string;
  onBranchChange: (id: string) => void;
  onAddBranch: (name: string, location?: string) => void;
  onRenameBranch: (id: string, name: string, location?: string) => void;
  onDeleteBranch: (id: string) => void;
}

// ─── Branch Selector Dropdown ─────────────────────────────────────────────────
function BranchSelector({ branches, activeBranchId, onBranchChange, onAddBranch, onRenameBranch, onDeleteBranch }: {
  branches: Branch[];
  activeBranchId: string;
  onBranchChange: (id: string) => void;
  onAddBranch: (name: string, location?: string) => void;
  onRenameBranch: (id: string, name: string, location?: string) => void;
  onDeleteBranch: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoc, setEditLoc] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeBranch = branches.find(b => b.id === activeBranchId);

  const submitAdd = () => {
    if (!newName.trim()) return;
    onAddBranch(newName.trim(), newLoc.trim() || undefined);
    setNewName('');
    setNewLoc('');
    setAdding(false);
    setOpen(false);
  };

  const submitEdit = (id: string) => {
    if (!editName.trim()) return;
    onRenameBranch(id, editName.trim(), editLoc.trim() || undefined);
    setEditingId(null);
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => { setOpen(o => !o); setAdding(false); setEditingId(null); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors max-w-[180px]"
        title="Switch branch"
      >
        <span className="truncate">{activeBranch?.name ?? 'Branch'}</span>
        {activeBranch?.location && <span className="text-primary/60 text-xs hidden sm:inline truncate">· {activeBranch.location}</span>}
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-lg z-[60] overflow-hidden">
          <div className="p-2 max-h-72 overflow-y-auto">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest px-2 pb-1">Branches</p>
            {branches.map(b => (
              <div key={b.id}>
                {editingId === b.id ? (
                  <div className="p-2 rounded-xl bg-surface-container-low space-y-1">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitEdit(b.id); if (e.key === 'Escape') setEditingId(null); }}
                      placeholder="Branch name"
                      className="w-full px-2 py-1 text-sm rounded-lg bg-surface-container-highest border border-outline-variant/30 text-on-surface outline-none"
                    />
                    <input
                      value={editLoc}
                      onChange={e => setEditLoc(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitEdit(b.id); if (e.key === 'Escape') setEditingId(null); }}
                      placeholder="Location (optional)"
                      className="w-full px-2 py-1 text-sm rounded-lg bg-surface-container-highest border border-outline-variant/30 text-on-surface outline-none"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => submitEdit(b.id)} className="flex-1 px-2 py-1 text-xs font-bold bg-primary text-white rounded-lg">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-outline rounded-lg hover:bg-surface-container"><X size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer group ${b.id === activeBranchId ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}
                    onClick={() => { onBranchChange(b.id); setOpen(false); }}
                  >
                    <Check size={14} className={b.id === activeBranchId ? 'text-primary' : 'text-transparent'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${b.id === activeBranchId ? 'text-primary' : 'text-on-surface'}`}>{b.name}</p>
                      {b.location && <p className="text-xs text-outline truncate">{b.location}</p>}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingId(b.id); setEditName(b.name); setEditLoc(b.location ?? ''); }}
                        className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </button>
                      {branches.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); onDeleteBranch(b.id); setOpen(false); }}
                          className="p-1 rounded-lg hover:bg-tertiary/10 text-outline hover:text-tertiary"
                          title="Delete branch"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant/10 p-2">
            {adding ? (
              <div className="space-y-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') setAdding(false); }}
                  placeholder="Branch name (e.g. KL Branch)"
                  className="w-full px-3 py-1.5 text-sm rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface outline-none focus:border-primary"
                />
                <input
                  value={newLoc}
                  onChange={e => setNewLoc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') setAdding(false); }}
                  placeholder="Location (optional)"
                  className="w-full px-3 py-1.5 text-sm rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface outline-none focus:border-primary"
                />
                <div className="flex gap-1">
                  <button onClick={submitAdd} className="flex-1 px-3 py-1.5 text-sm font-bold bg-primary text-white rounded-xl">Add Branch</button>
                  <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-outline rounded-xl hover:bg-surface-container-low"><X size={14} /></button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus size={14} />
                Add Branch
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export const Layout: React.FC<LayoutProps> = ({
  children, activeTab, setActiveTab, title,
  branches, activeBranchId, onBranchChange, onAddBranch, onRenameBranch, onDeleteBranch,
}) => {
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
    { id: 'dashboard',        label: 'Dashboard' },
    { id: 'sessions',         label: 'Attendance' },
    { id: 'payments',         label: 'Payments' },
    { id: 'register-students',label: 'Students' },
    { id: 'register-coaches', label: 'Coaches' },
    { id: 'manage-sessions',  label: 'Sessions' },
  ];

  const bottomNav = [
    { id: 'dashboard',         label: 'Home',       icon: LayoutDashboard },
    { id: 'sessions',          label: 'Attendance', icon: CalendarDays },
    { id: 'payments',          label: 'Payments',   icon: CreditCard },
    { id: 'register-students', label: 'Students',   icon: UserPlus },
    { id: 'register-coaches',  label: 'Coaches',    icon: UserCircle },
    { id: 'manage-sessions',   label: 'Sessions',   icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top App Bar */}
      <header className="glass-header flex items-center justify-between px-4 h-16 border-b border-outline-variant/10 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary whitespace-nowrap">{title}</h1>
          <BranchSelector
            branches={branches}
            activeBranchId={activeBranchId}
            onBranchChange={onBranchChange}
            onAddBranch={onAddBranch}
            onRenameBranch={onRenameBranch}
            onDeleteBranch={onDeleteBranch}
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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
