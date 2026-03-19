import React, { useState } from 'react';
import { Layers, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { TrainingSession } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Props {
  sessions: TrainingSession[];
  onAdd: (session: TrainingSession) => void;
  onDelete: (id: string) => void;
}

const emptyForm = { name: '', day: 'Monday', startTime: '09:00', endTime: '11:00' };

export const ManageSessions: React.FC<Props> = ({ sessions, onAdd, onDelete }) => {
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({
      id: Date.now().toString(),
      name: form.name.trim(),
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
    });
    setForm(emptyForm);
  };

  // Group by day for display
  const byDay = DAYS.reduce<Record<string, TrainingSession[]>>((acc, day) => {
    const list = sessions.filter(s => s.day === day);
    if (list.length) acc[day] = list;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Configuration</p>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Manage Sessions</h2>
        <p className="text-on-surface-variant mt-2 text-sm">{sessions.length} session{sessions.length !== 1 ? 's' : ''} configured</p>
      </div>

      {/* Form */}
      <div className="bg-surface-container-low rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-between px-6 py-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-tertiary p-2 rounded-xl text-white">
              <Layers size={18} />
            </div>
            <span className="font-headline font-bold text-lg">Add New Session</span>
          </div>
          {showForm ? <ChevronUp size={20} className="text-outline" /> : <ChevronDown size={20} className="text-outline" />}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Session name */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Session Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Morning Juniors, Evening Advanced, U15 Squad"
                />
              </div>
              {/* Day */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Day</label>
                <select
                  value={form.day}
                  onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {/* Start time */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              {/* End time */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-tertiary text-white font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform shadow-md"
            >
              Add Session
            </button>
          </form>
        )}
      </div>

      {/* Session list */}
      <div>
        <h3 className="font-headline font-bold text-xl mb-4">
          All Sessions <span className="text-outline font-normal text-base">({sessions.length})</span>
        </h3>
        {sessions.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <Layers size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No sessions yet. Add your first session above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(byDay).map(([day, list]) => (
              <div key={day}>
                <p className="font-label text-[11px] font-bold uppercase tracking-widest text-outline mb-3">{day}</p>
                <div className="space-y-2">
                  {list.map(s => (
                    <div key={s.id} className="bg-surface-container-low rounded-2xl px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-tertiary-container p-2.5 rounded-xl text-white">
                          <Clock size={16} />
                        </div>
                        <div>
                          <p className="font-headline font-bold text-on-surface">{s.name}</p>
                          <p className="text-sm text-on-surface-variant">{s.day} · {s.startTime} – {s.endTime}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onDelete(s.id)}
                        className="p-2 text-outline hover:text-red-500 transition-colors"
                        title="Delete session"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
