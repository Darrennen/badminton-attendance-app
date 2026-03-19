import React from 'react';
import { Send, CheckCircle, XCircle, History, Calendar, Clock, User } from 'lucide-react';
import { STUDENTS } from '../constants';

export const SessionRoster: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Session Focus Header */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-label text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Current Session</span>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-3">CS101: Advanced Logic</h2>
            <div className="flex flex-wrap gap-4 items-center text-on-surface-variant font-medium">
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl">
                <Calendar size={14} />
                <span>Monday, Oct 24</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl">
                <Clock size={14} />
                <span>09:00 AM - 10:30 AM</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl">
                <User size={14} />
                <span>Dr. Henderson</span>
              </div>
            </div>
          </div>
          <button className="bg-primary text-white font-headline font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container">
            <span>Submit Roster</span>
            <Send size={18} />
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface-variant opacity-70">Present</p>
            <p className="text-2xl font-black text-secondary">24</p>
          </div>
          <div className="bg-secondary-container p-3 rounded-full text-on-secondary-container">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface-variant opacity-70">Absent</p>
            <p className="text-2xl font-black text-tertiary">2</p>
          </div>
          <div className="bg-tertiary-container p-3 rounded-full text-white">
            <XCircle size={24} />
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-on-surface-variant opacity-70">Late</p>
            <p className="text-2xl font-black text-primary">1</p>
          </div>
          <div className="bg-primary-fixed p-3 rounded-full text-on-primary-fixed">
            <History size={24} />
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="flex flex-col gap-2">
        {STUDENTS.slice(0, 5).map((student) => (
          <div key={student.id} className="group bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-surface-container-high border border-transparent hover:border-outline-variant/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary text-lg overflow-hidden">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  student.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">{student.name}</h4>
                <p className="text-xs text-on-surface-variant font-medium">ID: {student.studentId}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`px-4 py-2 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                student.status === 'present' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-low text-on-surface-variant hover:bg-secondary-container/50'
              }`}>
                Present
              </button>
              <button className={`px-4 py-2 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                student.status === 'absent' ? 'bg-tertiary-container text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-tertiary-container/50'
              }`}>
                Absent
              </button>
              <button className={`px-4 py-2 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                student.status === 'late' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed/50'
              }`}>
                Late
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
