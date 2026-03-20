import React, { useState } from 'react';
import { UserPlus, Trash2, Phone, ChevronDown, ChevronUp, ShieldAlert, CheckCircle, Pencil, X } from 'lucide-react';
import { RegisteredStudent, TrainingSession } from '../types';

interface Props {
  students: RegisteredStudent[];
  sessions: TrainingSession[];
  onAdd: (student: RegisteredStudent) => void;
  onUpdate: (student: RegisteredStudent) => void;
  onDelete: (id: string) => void;
}

const blank = () => ({
  name: '',
  icNumber: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  sessionIds: [] as string[],
  group: '',
});

export const RegisterStudents: React.FC<Props> = ({ students, sessions, onAdd, onUpdate, onDelete }) => {
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

  const startEdit = (s: RegisteredStudent) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      icNumber: s.icNumber,
      phone: s.phone,
      emergencyContactName: s.emergencyContactName,
      emergencyContactPhone: s.emergencyContactPhone,
      sessionIds: [...s.sessionIds],
      group: s.group ?? '',
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
        group: form.group.trim() || undefined,
      });
      setSuccessMsg(`${form.name.trim()} updated successfully!`);
      setEditingId(null);
    } else {
      const student: RegisteredStudent = {
        id: Date.now().toString(),
        name: form.name.trim(),
        studentId: `#${String(students.length + 1).padStart(5, '0')}`,
        icNumber: form.icNumber.trim(),
        phone: form.phone.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        sessionIds: form.sessionIds,
        group: form.group.trim() || undefined,
        registeredAt: new Date().toISOString(),
      };
      onAdd(student);
      setSuccessMsg(`${student.name} registered successfully!`);
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

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container rounded-2xl text-on-secondary-container font-semibold text-sm">
          <CheckCircle size={18} />{successMsg}
        </div>
      )}

      {/* Form card */}
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
                <input
                  value={form.name}
                  onChange={e => { setError(''); setForm(p => ({ ...p, name: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Ahmad Bin Ali"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">IC Number *</label>
                <input
                  value={form.icNumber}
                  onChange={e => { setError(''); setForm(p => ({ ...p, icNumber: e.target.value })); }}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 990101-14-5432"
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
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">Group / Level</label>
                <input
                  value={form.group}
                  onChange={e => setForm(p => ({ ...p, group: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Beginner, U15, Adults"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">
                  <ShieldAlert size={11} className="inline mr-1" />Emergency Contact Name
                </label>
                <input
                  value={form.emergencyContactName}
                  onChange={e => setForm(p => ({ ...p, emergencyContactName: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. Fatimah Binti Ali (Mother)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-1.5">
                  <ShieldAlert size={11} className="inline mr-1" />Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.emergencyContactPhone}
                  onChange={e => setForm(p => ({ ...p, emergencyContactPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  placeholder="e.g. 011-9876543"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Sessions Joining</label>
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
                          ? 'bg-primary text-white shadow-md'
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
                className="bg-primary text-white font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-transform shadow-md"
              >
                {editingId ? 'Save Changes' : 'Register Student'}
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
              <div
                key={s.id}
                className={`bg-surface-container-low rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  editingId === s.id ? 'ring-2 ring-primary/40' : ''
                }`}
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="font-headline font-bold text-on-surface text-base">{s.name}</p>
                    <p className="text-outline text-xs mt-0.5">{s.studentId} · IC: {s.icNumber}</p>
                    {s.group && (
                      <span className="inline-block mt-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {s.group}
                      </span>
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
                  <div className="flex flex-wrap gap-1.5 items-start">
                    {s.sessionIds.length === 0 ? (
                      <span className="text-xs text-outline">No sessions assigned</span>
                    ) : s.sessionIds.map(sid => {
                      const sess = sessions.find(x => x.id === sid);
                      return sess ? (
                        <span key={sid} className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {sess.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex gap-1 self-start md:self-center shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-2 text-outline hover:text-primary transition-colors"
                    title="Edit student"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-2 text-outline hover:text-red-500 transition-colors"
                    title="Remove student"
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
