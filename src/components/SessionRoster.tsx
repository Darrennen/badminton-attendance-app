import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { CheckCircle, XCircle, History, Calendar, Download, FileSpreadsheet, RefreshCw, AlertCircle, UserPlus, X, Search } from 'lucide-react';
import { Student, AttendanceStatus, CoachAttendanceStatus, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus } from '../types';
import { buildCombinedWorkbook, ReplacementStudent, CoachReplacement } from '../utils/excel';

interface SessionRosterProps {
  students: Student[];
  onStatusChange: (id: string, status: AttendanceStatus) => void;
  sessionDate: string;
  onDateChange: (date: string) => void;
  allRegisteredStudents: RegisteredStudent[];
  sessions: TrainingSession[];
  coaches: RegisteredCoach[];
  replacements: { studentId: string; sessionId: string; coachId: string }[];
  onAddReplacement: (studentId: string, sessionId: string, coachId: string) => void;
  onRemoveReplacement: (studentId: string) => void;
  paymentMap: Record<string, PaymentStatus>;
  paymentMonth: string;
  coachAttendanceMap: Record<string, CoachAttendanceStatus>;
  coachReplacements: CoachReplacement[];
  coachPaymentMap: Record<string, PaymentStatus>;
  onCoachAttendance: (coachId: string, status: CoachAttendanceStatus) => void;
  onSetCoachReplacement: (coachId: string, replacedById: string, sessionId: string) => void;
  activeBranchId?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
interface StatusButtonsProps { student: Student; onStatusChange: (id: string, status: AttendanceStatus) => void; }
const StatusButtons: React.FC<StatusButtonsProps> = ({ student, onStatusChange }) => (
  <div className="flex gap-1.5">
    {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => (
      <button
        key={s}
        onClick={() => onStatusChange(student.id, s)}
        className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
          student.status === s
            ? s === 'present' ? 'bg-secondary-container text-on-secondary-container'
              : s === 'absent' ? 'bg-tertiary-container text-white'
              : 'bg-primary-fixed text-on-primary-fixed'
            : 'bg-surface-container-high text-on-surface-variant hover:opacity-80'
        }`}
      >
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </button>
    ))}
  </div>
);

interface StudentRowProps {
  student: Student & Partial<ReplacementStudent>;
  isReplacement?: boolean;
  onRemove?: () => void;
  onStatusChange: (id: string, status: AttendanceStatus) => void;
}
const StudentRow: React.FC<StudentRowProps> = ({ student, isReplacement = false, onRemove, onStatusChange }) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all border ${
    student.onBreak
      ? 'bg-surface-container-lowest border-outline-variant/10 opacity-60'
      : student.status === 'none'
        ? 'bg-surface-container-lowest border-outline-variant/15'
        : 'bg-surface-container-low border-transparent'
  }`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 ${
        isReplacement ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-primary'
      }`}>
        {student.avatar
          ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          : student.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm text-on-surface">{student.name}</p>
          {isReplacement && <span className="bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">Replacement</span>}
          {student.onBreak && <span className="bg-tertiary-container/40 text-tertiary text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">On Break</span>}
        </div>
        <p className="text-xs text-on-surface-variant">{student.studentId}{student.group ? ` · ${student.group}` : ''}</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      {student.onBreak
        ? <span className="text-xs text-outline italic">Skipping</span>
        : <StatusButtons student={student} onStatusChange={onStatusChange} />
      }
      {onRemove && (
        <button onClick={onRemove} className="p-1 text-outline hover:text-tertiary transition-colors ml-1" title="Remove">
          <X size={14} />
        </button>
      )}
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
export const SessionRoster: React.FC<SessionRosterProps> = ({
  students,
  onStatusChange,
  sessionDate,
  onDateChange,
  allRegisteredStudents,
  sessions,
  coaches,
  replacements,
  onAddReplacement,
  onRemoveReplacement,
  paymentMap,
  paymentMonth,
  coachAttendanceMap,
  coachReplacements,
  coachPaymentMap,
  onCoachAttendance,
  onSetCoachReplacement,
  activeBranchId = 'main',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');
  const [coachReplacerOpen, setCoachReplacerOpen] = useState<string | null>(null);

  // Replacement panel state
  const [showReplacementPanel, setShowReplacementPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');

  // Replacement student objects
  const replacementStudents = replacements.map(r => {
    const s = students.find(st => st.id === r.studentId)
      ?? allRegisteredStudents.find(st => st.id === r.studentId);
    const status: AttendanceStatus = students.find(st => st.id === r.studentId)?.status ?? 'none';
    return s ? { ...s, status, sessionId: r.sessionId, coachId: r.coachId } : null;
  }).filter(Boolean) as ReplacementStudent[];

  const replacementCandidates = allRegisteredStudents.filter(s =>
    !replacements.some(r => r.studentId === s.id)
  );
  const filtered = replacementCandidates.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats (students + coaches combined)
  const activeStudents = students.filter(s => !s.onBreak);
  const presentCount  = activeStudents.filter(s => s.status === 'present').length + replacementStudents.filter(s => s.status === 'present').length;
  const absentCount   = activeStudents.filter(s => s.status === 'absent').length  + replacementStudents.filter(s => s.status === 'absent').length;
  const lateCount     = activeStudents.filter(s => s.status === 'late').length    + replacementStudents.filter(s => s.status === 'late').length;
  const unmarkedCount = activeStudents.filter(s => s.status === 'none').length    + replacementStudents.filter(s => s.status === 'none').length;

  const coachPresent  = coaches.filter(c => coachAttendanceMap[c.id] === 'present').length;
  const coachAbsent   = coaches.filter(c => coachAttendanceMap[c.id] === 'absent' || coachAttendanceMap[c.id] === 'on-leave').length;
  const coachUnmarked = coaches.filter(c => !coachAttendanceMap[c.id] || coachAttendanceMap[c.id] === 'none').length;

  // Export helpers
  const exportCSV = () => {
    const header = ['Date', 'Name', 'Student ID', 'Group', 'Session', 'Type', 'Coach', 'Status'];
    const rows = [
      ...students.flatMap(s => {
        const sessNames = allRegisteredStudents.find(rs => rs.id === s.id)?.sessionIds
          .map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean) ?? [];
        return [{ Date: sessionDate, Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Session: sessNames.join(', '), Type: 'Regular', Coach: '', Status: s.status === 'none' ? 'Unmarked' : s.status.charAt(0).toUpperCase() + s.status.slice(1) }];
      }),
      ...replacementStudents.map(s => {
        const sess = sessions.find(x => x.id === s.sessionId);
        const coach = coaches.find(x => x.id === s.coachId);
        return { Date: sessionDate, Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Session: sess ? `${sess.name} (${sess.day})` : '', Type: 'Replacement', Coach: coach?.name ?? '', Status: s.status === 'none' ? 'Unmarked' : s.status.charAt(0).toUpperCase() + s.status.slice(1) };
      }),
    ];
    const lines = [header.join(','), ...rows.map(r => header.map(h => `"${r[h as keyof typeof r]}"`).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${sessionDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const wb = buildCombinedWorkbook(sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate, paymentMap, paymentMonth, coachAttendanceMap, coachReplacements, coachPaymentMap, undefined, [], activeBranchId);
    XLSX.writeFile(wb, `badminton_${sessionDate}.xlsx`);
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
        buildCombinedWorkbook(sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate, paymentMap, paymentMonth, coachAttendanceMap, coachReplacements, coachPaymentMap, baseWb, [], activeBranchId);
        XLSX.writeFile(baseWb, `badminton_file_${new Date().toISOString().slice(0, 10)}.xlsx`);
        setSyncStatus('success');
        setSyncMsg(`Synced! Attendance (${sessionDate}) and payments (${paymentMonth}) updated.`);
      } catch {
        setSyncStatus('error');
        setSyncMsg('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
      }
      setTimeout(() => setSyncStatus('idle'), 6000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <span className="font-label text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Session Attendance</span>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-4">Badminton Training</h2>
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl w-fit">
              <Calendar size={16} className="text-primary" />
              <input
                type="date"
                value={sessionDate}
                onChange={e => onDateChange(e.target.value)}
                className="bg-transparent font-medium text-on-surface text-sm focus:outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-start">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-highest transition-colors active:scale-95">
              <Download size={15} />CSV
            </button>
            <button onClick={exportXLSX} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md">
              <FileSpreadsheet size={15} />New XLSX
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md">
              <RefreshCw size={15} />Sync with Excel
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleSyncFile} />
          </div>
        </div>

        {syncStatus !== 'idle' && (
          <div className={`mt-4 flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold ${
            syncStatus === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container/30 text-tertiary'
          }`}>
            {syncStatus === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            {syncMsg}
          </div>
        )}
        {syncStatus === 'idle' && (
          <p className="mt-3 text-xs text-outline">
            <strong>Sync with Excel</strong> — upload your existing file and today's data will be appended automatically.
          </p>
        )}
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-0.5">Students Present</p>
            <p className="text-2xl font-black text-secondary">{presentCount}</p>
          </div>
          <div className="bg-secondary-container p-2 rounded-full text-on-secondary-container"><CheckCircle size={18} /></div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-0.5">Absent / Late</p>
            <p className="text-2xl font-black text-tertiary">{absentCount + lateCount}</p>
          </div>
          <div className="bg-tertiary-container p-2 rounded-full text-white"><XCircle size={18} /></div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-0.5">Unmarked</p>
            <p className="text-2xl font-black text-outline">{unmarkedCount}</p>
          </div>
          <div className="bg-surface-container-highest p-2 rounded-full text-outline"><History size={18} /></div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-0.5">Coaches Present</p>
            <p className="text-2xl font-black text-primary">{coachPresent}<span className="text-sm font-bold text-outline">/{coaches.length}</span></p>
          </div>
          <div className={`p-2 rounded-full ${coachUnmarked > 0 ? 'bg-surface-container-highest text-outline' : coachAbsent > 0 ? 'bg-tertiary-container text-white' : 'bg-primary/10 text-primary'}`}>
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* ── Main roster: grouped by Session → Coach → Students ── */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
          <p className="font-medium">No sessions configured.</p>
          <p className="text-sm mt-1">Go to the Sessions tab to add training sessions first.</p>
        </div>
      ) : sessions.map(sess => {
        // All students enrolled in this session
        const sessStudents = students.filter(s => {
          const rs = allRegisteredStudents.find(x => x.id === s.id);
          return rs?.sessionIds.includes(sess.id);
        });

        // Coaches handling this session
        const sessCoaches = coaches.filter(c => c.sessionIds.includes(sess.id));

        if (sessStudents.length === 0 && sessCoaches.length === 0) return null;

        return (
          <div key={sess.id} className="space-y-3">
            {/* Session header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-outline-variant/20" />
              <span className="text-[11px] font-black uppercase tracking-widest text-outline whitespace-nowrap">
                {sess.name} · {sess.day} {sess.startTime}–{sess.endTime}
              </span>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>

            {sessCoaches.map(coach => {
              const st = coachAttendanceMap[coach.id] ?? 'none';
              const repl = coachReplacements.find(r => r.coachId === coach.id && r.sessionId === sess.id);
              const replCoach = repl ? coaches.find(c => c.id === repl.replacedById) : null;
              const isAbsentOrLeave = st === 'absent' || st === 'on-leave';

              // Students under this coach in this session
              const coachStudents = sessStudents.filter(s => {
                const rs = allRegisteredStudents.find(x => x.id === s.id);
                return rs?.sessionCoachMap?.[sess.id] === coach.id;
              });

              return (
                <div key={coach.id} className={`rounded-2xl border overflow-hidden transition-all ${
                  st === 'none'      ? 'border-outline-variant/20 bg-surface-container-lowest'
                  : st === 'present' ? 'border-secondary-container/30 bg-secondary-container/5'
                  : 'border-tertiary-container/30 bg-tertiary-container/5'
                }`}>
                  {/* Coach row */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        st === 'present' ? 'bg-secondary-container text-on-secondary-container'
                        : st === 'none'  ? 'bg-surface-container-high text-outline'
                        : 'bg-tertiary-container/30 text-tertiary'
                      }`}>
                        {coach.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-on-surface">{coach.name}</p>
                          <span className="text-[9px] font-black uppercase tracking-wider text-outline bg-surface-container-high px-2 py-0.5 rounded-full">Coach</span>
                          {coach.ratePerClass && (
                            <span className="text-[9px] font-bold text-outline">RM{coach.ratePerClass}/class</span>
                          )}
                        </div>
                        {replCoach && (
                          <p className="text-xs text-primary font-semibold">↳ Replaced by {replCoach.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['present', 'absent', 'on-leave'] as CoachAttendanceStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => onCoachAttendance(coach.id, s)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                            st === s
                              ? s === 'present'  ? 'bg-secondary-container text-on-secondary-container'
                                : s === 'absent' ? 'bg-tertiary-container text-white'
                                : 'bg-primary-fixed text-on-primary-fixed'
                              : 'bg-surface-container-high text-on-surface-variant hover:opacity-80'
                          }`}
                        >
                          {s === 'on-leave' ? 'On Leave' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Replacement coach picker */}
                  {isAbsentOrLeave && (
                    <div className="px-4 pb-3 pl-16">
                      {coachReplacerOpen === `${coach.id}-${sess.id}` ? (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => { onSetCoachReplacement(coach.id, '', sess.id); setCoachReplacerOpen(null); }}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container-highest text-outline"
                          >None</button>
                          {coaches.filter(c => c.id !== coach.id).map(c => (
                            <button
                              key={c.id}
                              onClick={() => { onSetCoachReplacement(coach.id, c.id, sess.id); setCoachReplacerOpen(null); }}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                                repl?.replacedById === c.id ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >{c.name}</button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setCoachReplacerOpen(`${coach.id}-${sess.id}`)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          {replCoach ? 'Change replacement →' : '+ Assign replacement coach'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Students under this coach */}
                  {coachStudents.length > 0 && (
                    <div className="px-3 pb-3 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-outline px-1 pt-1">
                        Students ({coachStudents.length})
                      </p>
                      {coachStudents.map(student => (
                        <StudentRow key={student.id} student={student} onStatusChange={onStatusChange} />
                      ))}
                    </div>
                  )}

                  {coachStudents.length === 0 && (
                    <p className="px-4 pb-3 text-xs text-outline italic">No students assigned to this coach in this session.</p>
                  )}
                </div>
              );
            })}

            {/* Students in this session with no coach assigned */}
            {(() => {
              const unassigned = sessStudents.filter(s => {
                const rs = allRegisteredStudents.find(x => x.id === s.id);
                const coachId = rs?.sessionCoachMap?.[sess.id];
                return !coachId || !coaches.find(c => c.id === coachId);
              });
              if (unassigned.length === 0) return null;
              return (
                <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline px-4 pt-3 pb-2">
                    Unassigned Coach · {unassigned.length} student{unassigned.length > 1 ? 's' : ''}
                  </p>
                  <div className="px-3 pb-3 space-y-1.5">
                    {unassigned.map(student => <StudentRow key={student.id} student={student} onStatusChange={onStatusChange} />)}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Replacements section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-lg flex items-center gap-2">
            Replacements
            {replacementStudents.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{replacementStudents.length}</span>
            )}
          </h3>
          <button
            onClick={() => { setShowReplacementPanel(p => !p); setSearchQuery(''); setSelectedSessionId(''); setSelectedCoachId(''); }}
            className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <UserPlus size={15} />Add Replacement
          </button>
        </div>

        {showReplacementPanel && (
          <div className="bg-surface-container-low rounded-3xl overflow-hidden border-2 border-primary/20">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="font-headline font-bold text-base">Add Replacement Student</span>
              <button onClick={() => setShowReplacementPanel(false)} className="p-1 text-outline hover:text-on-surface"><X size={18} /></button>
            </div>
            {sessions.length > 0 && (
              <div className="px-5 pb-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">Session</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setSelectedSessionId(''); setSelectedCoachId(''); }} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedSessionId ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>Unspecified</button>
                  {sessions.map(s => (
                    <button key={s.id} onClick={() => { setSelectedSessionId(s.id); setSelectedCoachId(''); }} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedSessionId === s.id ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>{s.name}</button>
                  ))}
                </div>
              </div>
            )}
            {selectedSessionId && (() => {
              const sessCoaches = coaches.filter(c => c.sessionIds.includes(selectedSessionId));
              return sessCoaches.length > 0 ? (
                <div className="px-5 pb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">Coach</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedCoachId('')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!selectedCoachId ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>Unassigned</button>
                    {sessCoaches.map(c => (
                      <button key={c.id} onClick={() => setSelectedCoachId(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCoachId === c.id ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>{c.name}</button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2.5 rounded-xl">
                <Search size={14} className="text-outline shrink-0" />
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or ID…" className="bg-transparent text-sm text-on-surface font-medium flex-1 focus:outline-none placeholder:text-outline" />
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-outline text-center py-4">
                  {replacementCandidates.length === 0 ? "All registered students are already on today's roster." : 'No students match your search.'}
                </p>
              ) : filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-surface-container-high px-4 py-3 rounded-2xl">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{s.name}</p>
                    <p className="text-xs text-outline">{s.studentId}{s.group ? ` · ${s.group}` : ''}</p>
                  </div>
                  <button onClick={() => { onAddReplacement(s.id, selectedSessionId, selectedCoachId); setSearchQuery(''); }} className="bg-primary text-white font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform">Add</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {replacementStudents.length === 0 && !showReplacementPanel && (
          <p className="text-sm text-outline bg-surface-container-low rounded-2xl px-5 py-4">
            No replacements today. Tap <strong>Add Replacement</strong> to add a student doing a makeup class.
          </p>
        )}

        {replacementStudents.map(student => {
          const sess = sessions.find(x => x.id === student.sessionId);
          const coach = coaches.find(x => x.id === student.coachId);
          return (
            <div key={student.id} className={`p-4 rounded-2xl flex items-center justify-between transition-all border border-primary/10 ${student.status === 'none' ? 'bg-primary/5' : 'bg-surface-container-low'}`}>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary overflow-hidden">
                  {student.avatar ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-on-surface">{student.name}</p>
                    <span className="bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">Replacement</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{student.studentId}{sess ? ` · ${sess.name}` : ''}{coach ? ` · ${coach.name}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusButtons student={student} onStatusChange={onStatusChange} />
                <button onClick={() => onRemoveReplacement(student.id)} className="p-1.5 text-outline hover:text-tertiary transition-colors ml-1" title="Remove"><X size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* All marked banner */}
      {(students.length + replacementStudents.length) > 0 && unmarkedCount === 0 && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
          <CheckCircle size={18} />
          All {activeStudents.length + replacementStudents.length} students marked — tap <strong>Sync with Excel</strong> to save.
        </div>
      )}
    </div>
  );
};
