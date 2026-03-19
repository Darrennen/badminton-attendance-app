import React, { useState } from 'react';
import { Search, Filter, MoreVertical, UserPlus, User } from 'lucide-react';
import { Student } from '../types';

interface StudentDirectoryProps {
  students: Student[];
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ students }) => {
  const [query, setQuery] = useState('');
  const filtered = query
    ? students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.studentId.toLowerCase().includes(query.toLowerCase()) ||
        (s.group ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : students;
  const groups = Array.from(new Set(filtered.map(s => s.group)));

  return (
    <div className="space-y-10">
      {/* Search & Filter */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline font-extrabold text-4xl tracking-tight text-on-background">Student Directory</h2>
          <p className="text-on-surface-variant font-medium">Manage and view all enrolled students across your groups.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-high border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-on-surface-variant placeholder:text-outline/70"
              placeholder="Search by name, ID, or group..."
              type="text"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-highest rounded-2xl font-semibold text-primary hover:bg-surface-container-high transition-colors w-full md:w-auto justify-center">
            <Filter size={20} />
            <span>Sort</span>
          </button>
        </div>
      </section>

      {/* Stats Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between h-32 border-l-4 border-primary">
          <span className="font-label text-xs uppercase tracking-widest text-outline">Total Students</span>
          <span className="font-headline font-bold text-3xl">142</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between h-32 border-l-4 border-secondary">
          <span className="font-label text-xs uppercase tracking-widest text-outline">Active Now</span>
          <span className="font-headline font-bold text-3xl">88%</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-3xl flex flex-col justify-between h-32 border-l-4 border-tertiary">
          <span className="font-label text-xs uppercase tracking-widest text-outline">Alerts</span>
          <span className="font-headline font-bold text-3xl">3</span>
        </div>
      </section>

      {/* Group Sections */}
      {groups.map(group => (
        <section key={group} className="space-y-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-headline font-bold text-xl text-primary">Group: {group}</h3>
            <span className="font-label text-xs font-bold uppercase tracking-widest bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full">
              {filtered.filter(s => s.group === group).length} Students
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {filtered.filter(s => s.group === group).map(student => (
              <div key={student.id} className="group bg-surface-container-low hover:bg-surface-container-high transition-all p-4 flex items-center justify-between rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary overflow-hidden">
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-headline font-semibold text-on-surface">{student.name}</h4>
                    <p className="font-body text-sm text-outline">ID: {student.studentId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative">
                  {student.status === 'absent' && <div className="absolute -left-4 top-0 bottom-0 w-1 bg-tertiary rounded-full"></div>}
                  <span className={`font-label text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    student.status === 'present' ? 'bg-secondary-container text-on-secondary-container' :
                    student.status === 'absent' ? 'bg-tertiary-container text-white' : 'bg-primary-fixed text-on-primary-fixed'
                  }`}>
                    {student.status}
                  </span>
                  <button className="p-2 text-outline hover:text-primary transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* FAB */}
      <button className="fixed right-6 bottom-28 w-14 h-14 bg-primary rounded-full text-white shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40">
        <UserPlus size={24} />
      </button>
    </div>
  );
};
