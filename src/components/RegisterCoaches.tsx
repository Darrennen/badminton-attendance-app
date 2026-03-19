import React, { useState } from 'react';
import { UserCircle, Trash2, Phone, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { RegisteredCoach, TrainingSession } from '../types';

interface Props {
  coaches: RegisteredCoach[];
  sessions: TrainingSession[];
  onAdd: (coach: RegisteredCoach) => void;
  onDelete: (id: string) => void;
}

const blank = () => ({
  name: '',
  icNumber: '',
  phone: '',
  sessionIds: [] as string[],
});

export const RegisterCoaches: React.FC<Props> = ({ coaches, sessions, onAdd, onDelete }) => {
  const [form, setForm] = useState(blank());
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState('');
  const [successName, setSuccessName] = useState('');

  const toggleSession = (id: string) => {
    setForm(prev => ({
      ...prev,
      sessionIds: prev.sessionIds.includes(id)
        ? prev.sessionIds.filter(s => s !== id)
        : [...prev.sessionIds, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (!form.icNumber.trim()) { setError('IC number is required.'); return; }
    setError('');

    const initials = form.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const coach: RegisteredCoach = {
      id: Date.now().toString(),
      name: form.name.trim(),
      icNumber: form.icNumber.trim(),
      phone: form.phone.trim(),
      sessionIds: form.sessionIds,
      initials,
      coachStatus: 'active',
      registeredAt: new Date().toISOString(),
    };

    onAdd(coach);
    setSuccessName(coach.name);
    setForm(blank());
    setShowForm(false);
    setTimeout(() => setSuccessName(''), 4000);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Registration</p>
        <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Register Coaches</h2>
        <p className="text-on-surface-variant mt-2 text-sm">{coaches.length} coach{coaches.length !== 1 ? 'es' : ''} registered</p>
      </div>

      {/* Success banner */}
      {successName && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container rounded-2xl text-on-secondary-container font-semibold text-sm">
          <CheckCircle size={18} />
          {successName} has been registered as a coach!
        </div>
      )}

      {/* Form card */}
      <div className="bg-surface-container-low rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-between px-6 py-5 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-secondary p-2 rounded-xl text-white">
              <UserCircle size={18} />
            </div>
            <span className="font-headline font-bold text-lg">Add New Coach</span>
          </div>
          {showForm ? <ChevronUp size={20} className="text-outline" /> : <ChevronDown size={20} className="text-outline" />}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">

            {/* Validation error */}
            {error && (
              <p className="text-sm font-semibold text-tertiary bg-tertiary-container/20 px-4 py-3 rounded-xl">{error}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => { setError(''); setForm(p => ({ ...p, name: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Darren Yap"
                />
              </div>
              {/* IC */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">IC Number *</label>
                <input
                  value={form.icNumber}
                  onChange={e => { setError(''); setForm(p => ({ ...p, icNumber: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 900101-14-5432"
                />
              </div>
              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 012-3456789"
                />
              </div>
            </div>

            {/* Session picker */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Sessions Handling</label>
              {sessions.length === 0 ? (
                <p className="text-sm text-outline bg-surface-container-high px-4 py-3 rounded-xl">
                  No sessions yet — go to <strong>Sessions</strong> tab first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sessions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSession(s.id)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
                        form.sessionIds.includes(s.id)
                          ? 'bg-secondary text-white shadow-md'
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {s.name} · {s.day} {s.startTime}–{s.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full md:w-auto bg-secondary text-white font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform shadow-md"
            >
              Register Coach
            </button>
          </form>
        )}
      </div>

      {/* Coach list */}
      <div>
        <h3 className="font-headline font-bold text-xl mb-4">
          All Coaches <span className="text-outline font-normal text-base">({coaches.length})</span>
        </h3>
        {coaches.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <UserCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No coaches registered yet.</p>
            <p className="text-sm mt-1">Use the form above to add coaches.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coaches.map(c => (
              <div key={c.id} className="bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container text-lg shrink-0">
                    {c.initials}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 text-sm">
                    <div>
                      <p className="font-headline font-bold text-on-surface text-base">{c.name}</p>
                      <p className="text-outline text-xs mt-0.5">IC: {c.icNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Phone size={14} className="text-outline shrink-0" />
                      <p>{c.phone || '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-start">
                      {c.sessionIds.length === 0 ? (
                        <span className="text-xs text-outline">No sessions</span>
                      ) : c.sessionIds.map(sid => {
                        const sess = sessions.find(x => x.id === sid);
                        return sess ? (
                          <span key={sid} className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {sess.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(c.id)}
                  className="p-2 text-outline hover:text-red-500 transition-colors self-start md:self-center shrink-0"
                  title="Remove coach"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
