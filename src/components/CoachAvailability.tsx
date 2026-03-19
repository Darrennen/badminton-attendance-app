import React from 'react';
import { FileText, CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react';
import { COACHES } from '../constants';

export const CoachAvailability: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Operations Center</p>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight leading-tight">
          Coach <span className="text-primary-container">Availability</span>
        </h2>
        <p className="text-on-surface-variant mt-3 max-w-md">Real-time tracking of coaching staff for the Monday, Fall 2024 session.</p>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm flex flex-col justify-between h-32">
          <span className="font-label text-outline text-xs font-semibold uppercase tracking-wider">Total Coaches</span>
          <span className="font-headline font-extrabold text-3xl text-primary">24</span>
        </div>
        <div className="bg-secondary-container/20 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-32">
          <span className="font-label text-secondary text-xs font-semibold uppercase tracking-wider">Currently Active</span>
          <span className="font-headline font-extrabold text-3xl text-secondary">18</span>
        </div>
        <div className="bg-tertiary-container/10 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-32">
          <span className="font-label text-tertiary text-xs font-semibold uppercase tracking-wider">Replacements Pending</span>
          <span className="font-headline font-extrabold text-3xl text-tertiary">02</span>
        </div>
      </div>

      {/* Coach List */}
      <div className="space-y-4">
        {COACHES.map(coach => (
          <div key={coach.id} className={`bg-surface-container-low p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-surface-container-high transition-colors ${coach.status === 'replace' ? 'border-l-4 border-tertiary' : ''}`}>
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-primary font-bold text-xl shadow-sm">
                {coach.initials}
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">{coach.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <FileText size={14} className="text-outline" />
                  <p className="font-body text-sm text-on-surface-variant">Session: {coach.session}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className={`font-label text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform ${
                coach.status === 'active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-white text-outline hover:bg-slate-100'
              }`}>
                {coach.status === 'active' && <CheckCircle size={14} />}
                Active
              </button>
              <button className={`font-label text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform ${
                coach.status === 'on-break' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-white text-outline hover:bg-slate-100'
              }`}>
                {coach.status === 'on-break' && <Clock size={14} />}
                On Break
              </button>
              <button className={`font-label text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-transform ${
                coach.status === 'replace' ? 'bg-tertiary-container text-white' : 'bg-white text-outline hover:bg-slate-100'
              }`}>
                {coach.status === 'replace' && <AlertCircle size={14} />}
                {coach.status === 'replace' ? 'Replacement Needed' : 'Replace'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fixed right-6 bottom-28 w-14 h-14 bg-primary rounded-full text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40">
        <Plus size={24} />
      </button>
    </div>
  );
};
