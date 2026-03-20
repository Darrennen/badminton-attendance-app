import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CheckCircle, XCircle, CreditCard, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus } from '../types';
import { buildCombinedWorkbook, ReplacementStudent } from '../utils/excel';

interface Props {
  students: RegisteredStudent[];
  sessions: TrainingSession[];
  coaches: RegisteredCoach[];
  paymentMap: Record<string, PaymentStatus>;
  paymentMonth: string;
  onMonthChange: (month: string) => void;
  onStatusChange: (studentId: string, status: PaymentStatus) => void;
  // Attendance cross-data for combined export
  studentsWithStatus: Student[];
  sessionDate: string;
  replacements: { studentId: string; sessionId: string; coachId: string }[];
}

export const PaymentTracker: React.FC<Props> = ({
  students,
  sessions,
  coaches,
  paymentMap,
  paymentMonth,
  onMonthChange,
  onStatusChange,
  studentsWithStatus,
  sessionDate,
  replacements,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSession, setActiveSession] = useState('all');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  const displayedStudents = activeSession === 'all'
    ? students
    : students.filter(s => s.sessionIds.includes(activeSession));

  const paidCount   = students.filter(s => paymentMap[s.id] === 'paid').length;
  const unpaidCount = students.length - paidCount;
  const paidPct     = students.length ? Math.round((paidCount / students.length) * 100) : 0;

  // Session-specific counts for tab badges
  const sessionCount = (sessId: string) => {
    const ss = students.filter(s => s.sessionIds.includes(sessId));
    return { paid: ss.filter(s => paymentMap[s.id] === 'paid').length, total: ss.length };
  };

  const monthLabel = new Date(`${paymentMonth}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const replacementStudents: ReplacementStudent[] = replacements.map(r => {
    const s = studentsWithStatus.find(st => st.id === r.studentId);
    return s ? { ...s, sessionId: r.sessionId, coachId: r.coachId } : null;
  }).filter(Boolean) as ReplacementStudent[];

  const exportXLSX = () => {
    const wb = buildCombinedWorkbook(sessions, students, studentsWithStatus, replacementStudents, coaches, sessionDate, paymentMap, paymentMonth);
    XLSX.writeFile(wb, `badminton_${paymentMonth}.xlsx`);
  };

  const handleSyncFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const baseWb = XLSX.read(data, { type: 'array' });
        buildCombinedWorkbook(sessions, students, studentsWithStatus, replacementStudents, coaches, sessionDate, paymentMap, paymentMonth, baseWb);
        XLSX.writeFile(baseWb, `${file.name.replace(/\.xlsx?$/i, '')}.xlsx`);
        setSyncStatus('success');
        setSyncMsg(`Synced! Payments (${paymentMonth}) and attendance (${sessionDate}) updated.`);
      } catch {
        setSyncStatus('error');
        setSyncMsg('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
      }
      setTimeout(() => setSyncStatus('idle'), 5000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Finance</p>
          <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Payments</h2>
          <p className="text-outline text-sm mt-1">{monthLabel}</p>
        </div>

        {/* Month picker + exports */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
            <CreditCard size={15} className="text-primary" />
            <input
              type="month"
              value={paymentMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="bg-transparent font-medium text-on-surface text-sm focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={exportXLSX}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <FileSpreadsheet size={15} />New XLSX
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <RefreshCw size={15} />Sync Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleSyncFile} />
        </div>
      </div>

      {/* Sync status */}
      {syncStatus !== 'idle' && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold ${
          syncStatus === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container/30 text-tertiary'
        }`}>
          {syncStatus === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          {syncMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary-container/30 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-secondary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Paid</p>
          </div>
          <p className="text-3xl font-black text-secondary">{paidCount}</p>
        </div>
        <div className="bg-tertiary-container/20 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={14} className="text-tertiary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Unpaid</p>
          </div>
          <p className="text-3xl font-black text-tertiary">{unpaidCount}</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Collection</p>
          </div>
          <p className="text-3xl font-black text-primary">{paidPct}%</p>
          {students.length > 0 && (
            <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${paidPct}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Session filter tabs */}
      {sessions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSession('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeSession === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            All ({paidCount}/{students.length})
          </button>
          {sessions.map(s => {
            const { paid, total } = sessionCount(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setActiveSession(s.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeSession === s.id ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {s.name} ({paid}/{total})
              </button>
            );
          })}
        </div>
      )}

      {/* Student list */}
      {students.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
          <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No students registered yet.</p>
          <p className="text-sm mt-1">Go to Students tab to register students first.</p>
        </div>
      ) : displayedStudents.length === 0 ? (
        <p className="text-sm text-outline text-center py-8">No students in this session.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayedStudents.map(s => {
            const isPaid = paymentMap[s.id] === 'paid';
            const sessNames = s.sessionIds
              .map(sid => sessions.find(x => x.id === sid)?.name)
              .filter(Boolean);
            return (
              <div
                key={s.id}
                className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                  isPaid
                    ? 'bg-secondary-container/20 border-secondary-container/40'
                    : 'bg-surface-container-low border-outline-variant/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isPaid ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-outline'
                  }`}>
                    {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface">{s.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-xs text-outline">{s.studentId}</span>
                      {s.group && (
                        <span className="bg-primary-fixed text-on-primary-fixed text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">{s.group}</span>
                      )}
                      {sessNames.map(name => (
                        <span key={name} className="bg-surface-container-highest text-outline text-[9px] font-bold px-1.5 py-0.5 rounded-full">{name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPaid && (
                    <span className="hidden sm:flex items-center gap-1 text-secondary text-xs font-bold">
                      <CheckCircle size={13} />Paid
                    </span>
                  )}
                  <button
                    onClick={() => onStatusChange(s.id, isPaid ? 'unpaid' : 'paid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      isPaid
                        ? 'bg-surface-container-high text-outline hover:bg-tertiary-container/30 hover:text-tertiary'
                        : 'bg-secondary text-white shadow-sm hover:opacity-90'
                    }`}
                  >
                    {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All paid banner */}
      {students.length > 0 && unpaidCount === 0 && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
          <CheckCircle size={18} />
          All {students.length} students paid for {monthLabel} — tap <strong>Sync Excel</strong> to save.
        </div>
      )}

    </div>
  );
};
