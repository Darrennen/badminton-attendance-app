import React, { useState } from 'react';
import { UserPlus, Trash2, Phone, ShieldAlert, CheckCircle, Pencil, X, PauseCircle, Calendar } from 'lucide-react';
import { RegisteredStudent, RegisteredCoach, TrainingSession, ScheduledReplacement, BreakPeriod } from '../types';

interface Props {
  students: RegisteredStudent[];
  sessions: TrainingSession[];
  coaches: RegisteredCoach[];
  onAdd: (student: RegisteredStudent) => void;
  onUpdate: (student: RegisteredStudent) => void;
  onDelete: (id: string) => void;
  scheduledReplacements: ScheduledReplacement[];
  onAddScheduledReplacement: (r: ScheduledReplacement) => void;
  onRemoveScheduledReplacement: (id: string) => void;
}

const blank = () => ({
  name: '',
  icNumber: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  sessionIds: [] as string[],
  sessionCoachMap: {} as Record<string, string>,
  group: '',
  breakPeriods: [] as BreakPeriod[],
});

export const RegisterStudents: React.FC<Props> = ({ students, sessions, coaches, onAdd, onUpdate, onDelete, scheduledReplacements, onAddScheduledReplacement, onRemoveScheduledReplacement }) => {
  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Break period form state
  const [newBreakFrom, setNewBreakFrom] = useState('');
  const [newBreakTo, setNewBreakTo] = useState('');

  // Scheduled replacement form state (in edit mode)
  const [newReplDate, setNewReplDate] = useState('');
  const [newReplSessionId, setNewReplSessionId] = useState('');
  const [newReplCoachId, setNewReplCoachId] = useState('');

  const toggleSession = (id: string) => {
    setForm(prev => {
      const included = prev.sessionIds.includes(id);
      const newIds = included ? prev.sessionIds.filter(s => s !== id) : [...prev.sessionIds, id];
      const newMap = { ...prev.sessionCoachMap };
      if (included) delete newMap[id];
      return { ...prev, sessionIds: newIds, sessionCoachMap: newMap };
    });
  };

  const setCoachForSession = (sessionId: string, coachId: string) => {
    setForm(prev => ({
      ...prev,
      sessionCoachMap: { ...prev.sessionCoachMap, [sessionId]: coachId },
    }));
  };

  const startEdit = (s: RegisteredStudent) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      icNumber: s.icNumber,
      phone: s.phone,
      emergencyContactName: s.emergencyContactName,
      emergencyContactPhone: s.emergencyContactPhone,
      sessionIds: [...s.sessionIds],
      sessionCoachMap: { ...(s.sessionCoachMap ?? {}) },
      group: s.group ?? '',
      breakPeriods: [...(s.breakPeriods ?? [])],
    });
    setNewBreakFrom(''); setNewBreakTo('');
    setNewReplDate(''); setNewReplSessionId(''); setNewReplCoachId('');
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

    if (editingId) {
      const existing = students.find(s => s.id === editingId)!;
      onUpdate({
        ...existing,
        name: form.name.trim(),
        icNumber: form.icNumber.trim(),
        phone: form.phone.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        sessionIds: form.sessionIds,
        sessionCoachMap: form.sessionCoachMap,
        group: form.group.trim() || undefined,
        breakPeriods: form.breakPeriods,
      });
      setSuccessMsg(`${form.name.trim()} updated successfully!`);
      setEditingId(null);
    } else {
      onAdd({
        id: Date.now().toString(),
        name: form.name.trim(),
        studentId: `#${String(students.length + 1).padStart(5, '0')}`,
        icNumber: form.icNumber.trim(),
        phone: form.phone.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        sessionIds: form.sessionIds,
        sessionCoachMap: form.sessionCoachMap,
        group: form.group.trim() || undefined,
        breakPeriods: [],
        registeredAt: new Date().toISOString(),
      });
      setSuccessMsg(`${form.name.trim()} registered successfully!`);
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
          <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Register Students</h2>
          <p className="text-on-surface-variant mt-2 text-sm">{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => { cancelEdit(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <UserPlus size={16} /> Add Student
          </button>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container rounded-2xl text-on-secondary-container font-semibold text-sm">
          <CheckCircle size={18} />{successMsg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-surface-container-low rounded-3xl overflow-hidden border-2 border-primary/20">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-white">
                {editingId ? <Pencil size={18} /> : <UserPlus size={18} />}
              </div>
              <span className="font-headline font-bold text-lg">
                {editingId ? 'Edit Student' : 'Add New Student'}
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
                <input value={form.name} onChange={e => { setError(''); setForm(p => ({ ...p, name: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Ahmad Bin Ali" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">IC Number *</label>
                <input value={form.icNumber} onChange={e => { setError(''); setForm(p => ({ ...p, icNumber: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 990101-14-5432" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 012-3456789" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Group / Level</label>
                <input value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Beginner, U15, Adults" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">
                  <ShieldAlert size={11} className="inline mr-1" />Emergency Contact Name
                </label>
                <input value={form.emergencyContactName} onChange={e => setForm(p => ({ ...p, emergencyContactName: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Fatimah Binti Ali (Mother)" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">
                  <ShieldAlert size={11} className="inline mr-1" />Emergency Contact Phone
                </label>
                <input type="tel" value={form.emergencyContactPhone} onChange={e => setForm(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 011-9876543" />
              </div>
            </div>

            {/* Session + Coach assignment */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-3">
                Sessions & Coach Assignment
              </label>
              {sessions.length === 0 ? (
                <p className="text-sm text-outline bg-surface-container-high px-4 py-3 rounded-xl">
                  No sessions yet — go to <strong>Sessions</strong> tab first.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => {
                    const selected = form.sessionIds.includes(s.id);
                    const sessCoaches = coaches.filter(c => c.sessionIds.includes(s.id));
                    return (
                      <div key={s.id} className={`rounded-2xl border-2 transition-all ${selected ? 'border-primary/40 bg-primary/5' : 'border-transparent bg-surface-container-high'}`}>
                        {/* Session toggle row */}
                        <button
                          type="button"
                          onClick={() => toggleSession(s.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                          <div>
                            <p className={`font-bold text-sm ${selected ? 'text-primary' : 'text-on-surface-variant'}`}>{s.name}</p>
                            <p className="text-xs text-outline">{s.day} · {s.startTime} – {s.endTime}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            selected ? 'bg-primary border-primary' : 'border-outline'
                          }`}>
                            {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>

                        {/* Coach picker — only shown when session is selected */}
                        {selected && (
                          <div className="px-4 pb-3">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">
                              Assigned Coach for this session
                            </label>
                            {sessCoaches.length === 0 ? (
                              <p className="text-xs text-outline italic">No coaches assigned to this session yet</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCoachForSession(s.id, '')}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                    !form.sessionCoachMap[s.id]
                                      ? 'bg-surface-container-highest text-on-surface'
                                      : 'bg-surface-container-high text-outline hover:bg-surface-container-highest'
                                  }`}
                                >
                                  Unassigned
                                </button>
                                {sessCoaches.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setCoachForSession(s.id, c.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                      form.sessionCoachMap[s.id] === c.id
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                                    }`}
                                  >
                                    {c.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Break Periods ── */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-outline">
                <PauseCircle size={13} />Break / Pause Periods
              </label>
              {form.breakPeriods.length > 0 && (
                <div className="space-y-2">
                  {form.breakPeriods.map((bp, i) => (
                    <div key={i} className="flex items-center gap-3 bg-surface-container-high px-4 py-2.5 rounded-xl text-sm">
                      <span className="text-outline text-xs">From</span>
                      <span className="font-semibold text-on-surface">{bp.from}</span>
                      <span className="text-outline text-xs">To</span>
                      <span className="font-semibold text-on-surface">{bp.to}</span>
                      <button type="button" onClick={() => setForm(p => ({ ...p, breakPeriods: p.breakPeriods.filter((_, j) => j !== i) }))}
                        className="ml-auto p-1 text-outline hover:text-tertiary transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-[10px] text-outline mb-1">From</label>
                  <input type="date" value={newBreakFrom} onChange={e => setNewBreakFrom(e.target.value)}
                    className="px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-[10px] text-outline mb-1">To</label>
                  <input type="date" value={newBreakTo} onChange={e => setNewBreakTo(e.target.value)}
                    className="px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <button type="button"
                  onClick={() => {
                    if (!newBreakFrom || !newBreakTo || newBreakFrom > newBreakTo) return;
                    setForm(p => ({ ...p, breakPeriods: [...p.breakPeriods, { from: newBreakFrom, to: newBreakTo }] }));
                    setNewBreakFrom(''); setNewBreakTo('');
                  }}
                  className="px-4 py-2 bg-primary-container text-on-primary-container font-bold text-sm rounded-xl active:scale-95 transition-transform"
                >+ Add Period</button>
              </div>
            </div>

            {/* ── Scheduled Replacements (only in edit mode) ── */}
            {editingId && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-outline">
                  <Calendar size={13} />Pre-scheduled Replacements
                </label>
                {scheduledReplacements.filter(r => r.studentId === editingId).length > 0 && (
                  <div className="space-y-2">
                    {scheduledReplacements.filter(r => r.studentId === editingId).map(r => {
                      const sess = sessions.find(x => x.id === r.sessionId);
                      const coach = coaches.find(c => c.id === r.coachId);
                      return (
                        <div key={r.id} className="flex items-center gap-3 bg-primary/5 border border-primary/15 px-4 py-2.5 rounded-xl text-sm flex-wrap">
                          <span className="font-bold text-on-surface">{r.date}</span>
                          {sess && <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">{sess.name}</span>}
                          {coach && <span className="text-xs text-outline">→ {coach.name}</span>}
                          <button type="button" onClick={() => onRemoveScheduledReplacement(r.id)}
                            className="ml-auto p-1 text-outline hover:text-tertiary transition-colors"><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 items-end">
                  <div>
                    <label className="block text-[10px] text-outline mb-1">Date</label>
                    <input type="date" value={newReplDate} onChange={e => setNewReplDate(e.target.value)}
                      className="px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-outline mb-1">Session</label>
                    <select value={newReplSessionId} onChange={e => { setNewReplSessionId(e.target.value); setNewReplCoachId(''); }}
                      className="px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">— pick session —</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.day})</option>)}
                    </select>
                  </div>
                  {newReplSessionId && (
                    <div>
                      <label className="block text-[10px] text-outline mb-1">Coach</label>
                      <select value={newReplCoachId} onChange={e => setNewReplCoachId(e.target.value)}
                        className="px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">— unassigned —</option>
                        {coaches.filter(c => c.sessionIds.includes(newReplSessionId)).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button type="button"
                    onClick={() => {
                      if (!newReplDate || !newReplSessionId) return;
                      onAddScheduledReplacement({ id: Date.now().toString(), studentId: editingId, date: newReplDate, sessionId: newReplSessionId, coachId: newReplCoachId });
                      setNewReplDate(''); setNewReplSessionId(''); setNewReplCoachId('');
                    }}
                    className="px-4 py-2 bg-secondary-container text-on-secondary-container font-bold text-sm rounded-xl active:scale-95 transition-transform"
                  >+ Schedule</button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" className="bg-primary text-white font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform shadow-md">
                {editingId ? 'Save Changes' : 'Register Student'}
              </button>
              <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-xl font-bold text-outline bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Student list */}
      <div>
        <h3 className="font-headline font-bold text-xl mb-4">
          All Students <span className="text-outline font-normal text-base">({students.length})</span>
        </h3>
        {students.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <UserPlus size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No students registered yet.</p>
            <p className="text-sm mt-1">Tap "Add Student" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map(s => (
              <div key={s.id} className={`bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${editingId === s.id ? 'ring-2 ring-primary/40' : ''}`}>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-headline font-bold text-on-surface text-base">{s.name}</p>
                      {(s.breakPeriods?.length ?? 0) > 0 && (
                        <span className="bg-tertiary-container/40 text-tertiary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <PauseCircle size={9} />On Break
                        </span>
                      )}
                      {scheduledReplacements.filter(r => r.studentId === s.id).length > 0 && (
                        <span className="bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={9} />{scheduledReplacements.filter(r => r.studentId === s.id).length} scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-outline text-xs mt-0.5">{s.studentId} · IC: {s.icNumber}</p>
                    {s.group && (
                      <span className="inline-block mt-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{s.group}</span>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <Phone size={14} className="mt-0.5 shrink-0 text-outline" />
                    <div>
                      <p>{s.phone || '—'}</p>
                      <p className="text-xs text-outline mt-0.5">
                        Emergency: {s.emergencyContactName || '—'} · {s.emergencyContactPhone || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {s.sessionIds.length === 0 ? (
                      <span className="text-xs text-outline">No sessions</span>
                    ) : s.sessionIds.map(sid => {
                      const sess = sessions.find(x => x.id === sid);
                      const coachId = (s.sessionCoachMap ?? {})[sid];
                      const coach = coaches.find(c => c.id === coachId);
                      return sess ? (
                        <div key={sid} className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">{sess.name}</span>
                          {coach && <span className="text-[10px] text-outline">→ {coach.name}</span>}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex gap-1 self-start md:self-center shrink-0">
                  <button onClick={() => startEdit(s)} className="p-2 text-outline hover:text-primary transition-colors" title="Edit student">
                    <Pencil size={17} />
                  </button>
                  <button onClick={() => onDelete(s.id)} className="p-2 text-outline hover:text-red-500 transition-colors" title="Remove student">
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
