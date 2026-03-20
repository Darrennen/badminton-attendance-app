import React, { useState } from 'react';
import { UserCircle, Trash2, Phone, CheckCircle, Pencil, X } from 'lucide-react';
import { RegisteredCoach, TrainingSession } from '../types';

interface Props {
  coaches: RegisteredCoach[];
  sessions: TrainingSession[];
  onAdd: (coach: RegisteredCoach) => void;
  onUpdate: (coach: RegisteredCoach) => void;
  onDelete: (id: string) => void;
}

const blank = () => ({
  name: '',
  icNumber: '',
  phone: '',
  sessionIds: [] as string[],
});

export const RegisterCoaches: React.FC<Props> = ({ coaches, sessions, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const toggleSession = (id: string) => {
    setForm(prev => ({
      ...prev,
      sessionIds: prev.sessionIds.includes(id)
        ? prev.sessionIds.filter(s => s !== id)
        : [...prev.sessionIds, id],
    }));
  };

  const startEdit = (c: RegisteredCoach) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      icNumber: c.icNumber,
      phone: c.phone,
      sessionIds: [...c.sessionIds],
    });
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blank());
    setError('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (!form.icNumber.trim()) { setError('IC number is required.'); return; }
    setError('');

    const initials = form.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (editingId) {
      const existing = coaches.find(c => c.id === editingId)!;
      onUpdate({
        ...existing,
        name: form.name.trim(),
        icNumber: form.icNumber.trim(),
        phone: form.phone.trim(),
        sessionIds: form.sessionIds,
        initials,
      });
      setSuccessMsg(`${form.name.trim()} updated successfully!`);
      setEditingId(null);
    } else {
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
      setSuccessMsg(`${coach.name} registered as a coach!`);
    }

    setForm(blank());
    setShowForm(false);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Registration</p>
          <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Register Coaches</h2>
          <p className="text-on-surface-variant mt-2 text-sm">{coaches.length} coach{coaches.length !== 1 ? 'es' : ''} registered</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => { cancelEdit(); setShowForm(true); }}
            className="flex items-center gap-2 bg-secondary text-white font-bold px-5 py-2.5 rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <UserCircle size={16} /> Add Coach
          </button>
        )}
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container rounded-2xl text-on-secondary-container font-semibold text-sm">
          <CheckCircle size={18} />{successMsg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-surface-container-low rounded-3xl overflow-hidden border-2 border-secondary/20">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-secondary p-2 rounded-xl text-white">
                {editingId ? <Pencil size={18} /> : <UserCircle size={18} />}
              </div>
              <span className="font-headline font-bold text-lg">
                {editingId ? 'Edit Coach' : 'Add New Coach'}
              </span>
            </div>
            <button type="button" onClick={cancelEdit} className="p-2 text-outline hover:text-on-surface transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
            {error && (
              <p className="text-sm font-semibold text-tertiary bg-tertiary-container/20 px-4 py-3 rounded-xl">{error}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Full Name *</label>
                <input
                  value={form.name}
                  onChange={e => { setError(''); setForm(p => ({ ...p, name: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Darren Yap"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">IC Number *</label>
                <input
                  value={form.icNumber}
                  onChange={e => { setError(''); setForm(p => ({ ...p, icNumber: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 900101-14-5432"
                />
              </div>
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

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-secondary text-white font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform shadow-md"
              >
                {editingId ? 'Save Changes' : 'Register Coach'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-3 rounded-xl font-bold text-outline bg-surface-container-high hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coach list */}
      <div>
        <h3 className="font-headline font-bold text-xl mb-4">
          All Coaches <span className="text-outline font-normal text-base">({coaches.length})</span>
        </h3>
        {coaches.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <UserCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No coaches registered yet.</p>
            <p className="text-sm mt-1">Tap "Add Coach" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coaches.map(c => (
              <div
                key={c.id}
                className={`bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  editingId === c.id ? 'ring-2 ring-secondary/40' : ''
                }`}
              >
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
                <div className="flex gap-1 self-start md:self-center shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-2 text-outline hover:text-primary transition-colors"
                    title="Edit coach"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-2 text-outline hover:text-red-500 transition-colors"
                    title="Remove coach"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
