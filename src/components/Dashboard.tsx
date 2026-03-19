import React from 'react';
import { Calendar, TrendingUp, MoreVertical, Clock, Users as UsersIcon } from 'lucide-react';
import { SESSIONS } from '../constants';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-label text-sm font-medium uppercase tracking-wider text-outline mb-1">Welcome back,</p>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight">Dr. Henderson</h2>
          </div>
          <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-2 w-fit">
            <Calendar size={16} className="text-primary" />
            <span className="font-label text-sm font-semibold text-primary">Fall 2024 Semester</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-white relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="relative z-10">
              <h3 className="font-headline text-2xl font-bold mb-2">Next Session Starting</h3>
              <p className="text-on-primary-container font-medium">Advanced Theoretical Physics • Room 402</p>
            </div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="text-4xl font-black">09:45 AM</div>
              <button className="bg-surface-container-lowest text-primary px-6 py-3 rounded-full font-bold shadow-sm hover:scale-105 transition-transform active:scale-95">
                Start Attendance
              </button>
            </div>
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-center border-l-4 border-secondary">
            <p className="text-outline font-medium mb-1">Today's Presence</p>
            <div className="text-5xl font-black text-on-surface mb-2">94%</div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <TrendingUp size={16} />
              <span>+2% from yesterday</span>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="space-y-12 pb-12">
        {['Monday, Apr 04', 'Tuesday, Apr 05'].map((day) => (
          <div key={day}>
            <h3 className="font-headline font-bold text-2xl mb-6 flex items-center gap-3">
              {day}
              <span className="h-px flex-grow bg-outline-variant/30"></span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SESSIONS.filter(s => s.date === day).map((session) => (
                <div key={session.id} className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-6 rounded-3xl group cursor-pointer relative overflow-hidden border-l-4 border-transparent hover:border-primary">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      session.status === 'ongoing' ? 'bg-secondary-container text-on-secondary-container' : 
                      session.status === 'urgent' ? 'bg-tertiary-container text-white' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {session.status}
                    </div>
                    <button className="p-1 text-outline-variant hover:text-primary transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <h4 className="font-headline font-bold text-xl mb-1 text-on-surface">{session.title}</h4>
                  <div className="flex items-center gap-4 text-outline text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      {session.time}
                    </div>
                    <div className="flex items-center gap-1">
                      <UsersIcon size={16} />
                      {session.studentCount} Students
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <img 
                      className="w-6 h-6 rounded-full object-cover" 
                      src={session.instructorAvatar} 
                      alt={session.instructor} 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-xs font-semibold text-on-surface-variant">{session.instructor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
