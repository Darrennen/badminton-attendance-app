import React from 'react';
import { Calendar, Clock, MapPin, Users as UsersIcon, ArrowRight, Download, User } from 'lucide-react';
import { STUDENTS } from '../constants';

export const SessionSummary: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section>
        <p className="font-label text-sm font-medium uppercase tracking-widest text-primary mb-2">Session Summary</p>
        <h2 className="font-headline font-extrabold text-4xl lg:text-5xl text-on-background leading-tight mb-4">Advanced Organic Chemistry</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Calendar size={16} />
            <span className="font-medium">Monday, April 04</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Clock size={16} />
            <span className="font-medium">09:00 AM — 10:30 AM</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MapPin size={16} />
            <span className="font-medium">Lecture Hall C</span>
          </div>
        </div>
      </section>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm">
          <div>
            <h3 className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Attendance Rate</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-black text-6xl text-primary">88%</span>
              <span className="font-body text-secondary font-semibold">+2% vs last session</span>
            </div>
          </div>
          <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden mt-6">
            <div className="h-full bg-primary-container w-[88%] rounded-full"></div>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-3xl p-8 flex flex-col justify-center items-center text-center">
          <UsersIcon size={40} className="text-primary mb-3" />
          <span className="font-headline font-bold text-3xl text-on-surface">42</span>
          <span className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Enrolled</span>
        </div>
        <div className="bg-surface-container-low rounded-3xl p-8 flex flex-col justify-center gap-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm font-medium text-on-surface-variant">Present</span>
            <span className="font-headline font-bold text-secondary text-xl">37</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-sm font-medium text-on-surface-variant">Late</span>
            <span className="font-headline font-bold text-primary text-xl">2</span>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
            <span className="font-body text-sm font-medium text-on-surface-variant">Absent</span>
            <span className="font-headline font-bold text-tertiary text-xl">3</span>
          </div>
        </div>
      </div>

      {/* Exceptions List */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <h3 className="font-headline font-bold text-2xl">Exceptions & Flags</h3>
          <button className="text-primary font-semibold flex items-center gap-1 hover:underline">
            View Full Roster
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {STUDENTS.filter(s => s.status !== 'present').map(student => (
            <div key={student.id} className={`bg-surface-container-low rounded-2xl p-5 flex items-center justify-between group hover:bg-surface-container-high transition-colors ${student.status === 'absent' ? 'border-l-4 border-tertiary' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <p className="font-body font-bold text-on-surface">{student.name}</p>
                  <p className="font-label text-xs text-on-surface-variant">ID: {student.studentId} • {student.status === 'late' ? 'Arrived late' : 'Unexcused'}</p>
                </div>
              </div>
              <span className={`font-label text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                student.status === 'late' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-tertiary-container text-white'
              }`}>
                {student.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl p-1 bg-gradient-to-r from-primary to-primary-container shadow-xl">
        <div className="bg-primary/95 backdrop-blur-sm rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-headline font-bold text-2xl text-white">Generate Full Report?</h3>
            <p className="text-on-primary-container/80 max-w-md">Compile a PDF with student notes, historical trends, and flag patterns for this group.</p>
          </div>
          <button className="bg-surface-container-lowest text-primary px-8 py-3 rounded-2xl font-headline font-bold hover:scale-105 transition-transform active:scale-95 whitespace-nowrap flex items-center gap-2">
            <Download size={18} />
            Download Report
          </button>
        </div>
      </section>
    </div>
  );
};
