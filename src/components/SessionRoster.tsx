import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CheckCircle, XCircle, History, Calendar, Download, FileSpreadsheet, RefreshCw, AlertCircle, UserPlus, X, Search } from 'lucide-react';
import { Student, AttendanceStatus, RegisteredStudent, RegisteredCoach, TrainingSession } from '../types';

type ReplacementStudent = Student & { sessionId: string; coachId: string };

// Auto-size columns + freeze header row and first 3 fixed columns
function styleSheet(ws: XLSX.WorkSheet, rows: Record<string, string>[], fixedCols = 3) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map((key, i) => {
    const maxLen = Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length));
    // Fixed columns get a comfortable min-width; date columns get a bit more room
    const base = i < fixedCols ? Math.max(maxLen, 16) : Math.max(maxLen, 13);
    return { wch: base + 2 };
  });
  // Freeze header row + first N fixed columns so you can scroll dates while names stay visible
  ws['!freeze'] = { xSplit: fixedCols, ySplit: 1 };
}

// Build (or update) a pivot workbook where each session is its own sheet:
//   Rows = students,  Columns = Name | Student ID | Group | date1 | date2 | …
// Replacements go on a separate flat "Replacements" sheet.
function buildPivotWorkbook(
  sessions: TrainingSession[],
  allRegisteredStudents: RegisteredStudent[],
  students: Student[],
  replacementStudents: ReplacementStudent[],
  coaches: RegisteredCoach[],
  sessionDate: string,
  baseWb?: XLSX.WorkBook,
): XLSX.WorkBook {
  const wb = baseWb ?? XLSX.utils.book_new();

  const statusLabel = (id: string) => {
    const st = students.find(x => x.id === id)?.status ?? 'none';
    return st === 'none' ? 'Unmarked' : st.charAt(0).toUpperCase() + st.slice(1);
  };

  // --- One pivot sheet per session ---
  sessions.forEach(sess => {
    const sheetName = sess.name.slice(0, 31);
    const sessStudents = allRegisteredStudents.filter(s => s.sessionIds.includes(sess.id));

    let rows: Record<string, string>[];

    if (baseWb?.SheetNames.includes(sheetName)) {
      // Existing sheet: read rows, update today's column, add any new students
      const existing = XLSX.utils.sheet_to_json<Record<string, string>>(
        baseWb.Sheets[sheetName], { defval: '' }
      );
      const updatedIds = new Set<string>();
      rows = existing.map(row => {
        const rs = allRegisteredStudents.find(s => s.studentId === row['Student ID']);
        if (rs && sessStudents.some(ss => ss.id === rs.id)) {
          updatedIds.add(rs.studentId);
          return { ...row, [sessionDate]: statusLabel(rs.id) };
        }
        return row;
      });
      // Append students registered after the sheet was first created
      sessStudents
        .filter(s => !updatedIds.has(s.studentId))
        .forEach(s => rows.push({
          Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '',
          [sessionDate]: statusLabel(s.id),
        }));
    } else {
      // New sheet
      rows = sessStudents.map(s => ({
        Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '',
        [sessionDate]: statusLabel(s.id),
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    styleSheet(ws, rows, 3); // freeze Name | Student ID | Group
    if (baseWb?.SheetNames.includes(sheetName)) {
      wb.Sheets[sheetName] = ws;
    } else {
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  });

  // --- Replacements sheet (flat: Date | Name | Student ID | Session | Coach | Status) ---
  if (replacementStudents.length > 0 || (baseWb?.SheetNames.includes('Replacements'))) {
    const replSheetName = 'Replacements';
    const todayReplRows = replacementStudents.map(r => {
      const sess = sessions.find(x => x.id === r.sessionId);
      const coach = coaches.find(x => x.id === r.coachId);
      const st = r.status === 'none' ? 'Unmarked' : r.status.charAt(0).toUpperCase() + r.status.slice(1);
      return {
        Date: sessionDate,
        Name: r.name,
        'Student ID': r.studentId,
        Group: r.group ?? '',
        Session: sess ? `${sess.name} (${sess.day})` : 'Unspecified',
        Coach: coach ? coach.name : '',
        Status: st,
      };
    });

    let replRows: Record<string, string>[];
    if (baseWb?.SheetNames.includes(replSheetName)) {
      const existing = XLSX.utils.sheet_to_json<Record<string, string>>(
        baseWb.Sheets[replSheetName], { defval: '' }
      );
      // Remove today's entries then re-add fresh
      replRows = [
        ...existing.filter(r => r['Date'] !== sessionDate),
        ...todayReplRows,
      ];
    } else {
      replRows = todayReplRows;
    }

    if (replRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(replRows);
      styleSheet(ws, replRows, 0); // no freeze — flat list, all columns fixed
      if (baseWb?.SheetNames.includes(replSheetName)) {
        wb.Sheets[replSheetName] = ws;
      } else {
        XLSX.utils.book_append_sheet(wb, ws, replSheetName);
      }
    }
  }

  return wb;
}

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
}

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  // Replacement search state
  const [showReplacementPanel, setShowReplacementPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState('');

  // Replacement student objects with their current attendance status
  const replacementStudents = replacements.map(r => {
    const s = students.find(st => st.id === r.studentId)
      ?? allRegisteredStudents.find(st => st.id === r.studentId);
    const status: AttendanceStatus = students.find(st => st.id === r.studentId)?.status ?? 'none';
    return s ? { ...s, status, sessionId: r.sessionId, coachId: r.coachId } : null;
  }).filter(Boolean) as ReplacementStudent[];

  // Any registered student can be a replacement — even ones already on the regular roster
  // (they may have a Monday session but want a makeup on Wednesday)
  // Only exclude students already added to today's replacements list
  const replacementCandidates = allRegisteredStudents.filter(s =>
    !replacements.some(r => r.studentId === s.id)
  );

  const filtered = replacementCandidates.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount  = students.filter(s => s.status === 'present').length
    + replacementStudents.filter(s => s.status === 'present').length;
  const absentCount   = students.filter(s => s.status === 'absent').length
    + replacementStudents.filter(s => s.status === 'absent').length;
  const lateCount     = students.filter(s => s.status === 'late').length
    + replacementStudents.filter(s => s.status === 'late').length;
  const unmarkedCount = students.filter(s => s.status === 'none').length
    + replacementStudents.filter(s => s.status === 'none').length;

  // CSV stays flat (CSV can't do multiple sheets)
  const exportCSV = () => {
    const header = ['Date', 'Name', 'Student ID', 'Group', 'Session', 'Type', 'Coach', 'Status'];
    const rows = [
      ...students.flatMap(s => {
        const sessNames = allRegisteredStudents
          .find(rs => rs.id === s.id)?.sessionIds
          .map(sid => sessions.find(x => x.id === sid)?.name ?? '')
          .filter(Boolean) ?? [];
        return [{
          Date: sessionDate, Name: s.name, 'Student ID': s.studentId,
          Group: s.group ?? '', Session: sessNames.join(', '), Type: 'Regular', Coach: '',
          Status: s.status === 'none' ? 'Unmarked' : s.status.charAt(0).toUpperCase() + s.status.slice(1),
        }];
      }),
      ...replacementStudents.map(s => {
        const sess = sessions.find(x => x.id === s.sessionId);
        const coach = coaches.find(x => x.id === s.coachId);
        return {
          Date: sessionDate, Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '',
          Session: sess ? `${sess.name} (${sess.day})` : '', Type: 'Replacement',
          Coach: coach?.name ?? '',
          Status: s.status === 'none' ? 'Unmarked' : s.status.charAt(0).toUpperCase() + s.status.slice(1),
        };
      }),
    ];
    const lines = [header.join(','), ...rows.map(r => header.map(h => `"${r[h as keyof typeof r]}"`).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${sessionDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // XLSX: pivot format — one sheet per session, dates as columns
  const exportXLSX = () => {
    const wb = buildPivotWorkbook(sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate);
    XLSX.writeFile(wb, `attendance_${sessionDate}.xlsx`);
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
        buildPivotWorkbook(sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate, baseWb);
        const originalName = file.name.replace(/\.xlsx?$/i, '');
        XLSX.writeFile(baseWb, `${originalName}.xlsx`);
        setSyncStatus('success');
        setSyncMsg(`Synced! ${sessionDate} column updated across ${sessions.length} session sheet${sessions.length !== 1 ? 's' : ''}.`);
      } catch {
        setSyncStatus('error');
        setSyncMsg('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
      }
      setTimeout(() => setSyncStatus('idle'), 6000);
    };
    reader.readAsArrayBuffer(file);
  };

  const StatusButtons = ({ student }: { student: Student }) => (
    <div className="flex gap-2">
      <button
        onClick={() => onStatusChange(student.id, 'present')}
        className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
          student.status === 'present'
            ? 'bg-secondary-container text-on-secondary-container'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container/50'
        }`}
      >Present</button>
      <button
        onClick={() => onStatusChange(student.id, 'absent')}
        className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
          student.status === 'absent'
            ? 'bg-tertiary-container text-white'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-tertiary-container/50'
        }`}
      >Absent</button>
      <button
        onClick={() => onStatusChange(student.id, 'late')}
        className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
          student.status === 'late'
            ? 'bg-primary-fixed text-on-primary-fixed'
            : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed/50'
        }`}
      >Late</button>
    </div>
  );

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
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-highest transition-colors active:scale-95"
            >
              <Download size={15} />CSV
            </button>
            <button
              onClick={exportXLSX}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md"
            >
              <FileSpreadsheet size={15} />New XLSX
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md"
            >
              <RefreshCw size={15} />Sync with Excel
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleSyncFile} />
          </div>
        </div>

        {syncStatus !== 'idle' && (
          <div className={`mt-4 flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold ${
            syncStatus === 'success'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-tertiary-container/30 text-tertiary'
          }`}>
            {syncStatus === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            {syncMsg}
          </div>
        )}
        {syncStatus === 'idle' && (
          <p className="mt-3 text-xs text-outline">
            <strong>Sync with Excel</strong> — upload your existing attendance file and today's data (including replacements) will be appended automatically.
          </p>
        )}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Present</p>
            <p className="text-2xl font-black text-secondary">{presentCount}</p>
          </div>
          <div className="bg-secondary-container p-2.5 rounded-full text-on-secondary-container"><CheckCircle size={20} /></div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Absent</p>
            <p className="text-2xl font-black text-tertiary">{absentCount}</p>
          </div>
          <div className="bg-tertiary-container p-2.5 rounded-full text-white"><XCircle size={20} /></div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Late</p>
            <p className="text-2xl font-black text-primary">{lateCount}</p>
          </div>
          <div className="bg-primary-fixed p-2.5 rounded-full text-on-primary-fixed"><History size={20} /></div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Unmarked</p>
            <p className="text-2xl font-black text-outline">{unmarkedCount}</p>
          </div>
          <div className="bg-surface-container-highest p-2.5 rounded-full text-outline"><Calendar size={20} /></div>
        </div>
      </div>

      {/* Regular student list */}
      <div className="flex flex-col gap-2">
        {students.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <p className="font-medium">No students registered yet.</p>
            <p className="text-sm mt-1">Go to the Students tab to register students first.</p>
          </div>
        ) : students.map(student => (
          <div
            key={student.id}
            className={`group p-4 rounded-2xl flex items-center justify-between transition-all border ${
              student.status === 'none'
                ? 'bg-surface-container-lowest border-outline-variant/20'
                : 'bg-surface-container-low border-transparent'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary overflow-hidden">
                {student.avatar
                  ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">{student.name}</h4>
                <p className="text-xs text-on-surface-variant font-medium">
                  {student.studentId}{student.group ? ` · ${student.group}` : ''}
                </p>
              </div>
            </div>
            <StatusButtons student={student} />
          </div>
        ))}
      </div>

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

        {/* Replacement search panel */}
        {showReplacementPanel && (
          <div className="bg-surface-container-low rounded-3xl overflow-hidden border-2 border-primary/20">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="font-headline font-bold text-base">Add Replacement Student</span>
              <button onClick={() => setShowReplacementPanel(false)} className="p-1 text-outline hover:text-on-surface">
                <X size={18} />
              </button>
            </div>

            {/* Session picker */}
            {sessions.length > 0 && (
              <div className="px-5 pb-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">
                  Replacing into session
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSelectedSessionId(''); setSelectedCoachId(''); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      !selectedSessionId ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    Unspecified
                  </button>
                  {sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSessionId(s.id); setSelectedCoachId(''); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        selectedSessionId === s.id ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Coach picker — shown only when a session is selected */}
            {selectedSessionId && (() => {
              const sessCoaches = coaches.filter(c => c.sessionIds.includes(selectedSessionId));
              return sessCoaches.length > 0 ? (
                <div className="px-5 pb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5">
                    Under which coach
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCoachId('')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        !selectedCoachId ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      Unassigned
                    </button>
                    {sessCoaches.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCoachId(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          selectedCoachId === c.id ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-2.5 rounded-xl">
                <Search size={14} className="text-outline shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or ID…"
                  className="bg-transparent text-sm text-on-surface font-medium flex-1 focus:outline-none placeholder:text-outline"
                />
              </div>
            </div>

            {/* Results */}
            <div className="px-5 pb-5 space-y-2 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-outline text-center py-4">
                  {replacementCandidates.length === 0
                    ? 'All registered students are already on today\'s roster.'
                    : 'No students match your search.'}
                </p>
              ) : filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-surface-container-high px-4 py-3 rounded-2xl">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{s.name}</p>
                    <p className="text-xs text-outline">{s.studentId}{s.group ? ` · ${s.group}` : ''}</p>
                  </div>
                  <button
                    onClick={() => {
                      onAddReplacement(s.id, selectedSessionId, selectedCoachId);
                      setSearchQuery('');
                    }}
                    className="bg-primary text-white font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Replacement student rows */}
        {replacementStudents.length === 0 && !showReplacementPanel && (
          <p className="text-sm text-outline bg-surface-container-low rounded-2xl px-5 py-4">
            No replacements today. Tap <strong>Add Replacement</strong> to add a student doing a makeup class.
          </p>
        )}

        {replacementStudents.map(student => {
          const sess = sessions.find(x => x.id === student.sessionId);
          const coach = coaches.find(x => x.id === student.coachId);
          return (
            <div
              key={student.id}
              className={`p-4 rounded-2xl flex items-center justify-between transition-all border border-primary/10 ${
                student.status === 'none' ? 'bg-primary/5' : 'bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden">
                  {student.avatar
                    ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-bold text-on-surface">{student.name}</h4>
                    <span className="bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full">Replacement</span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {student.studentId}
                    {sess ? ` · ${sess.name} (${sess.day})` : ''}
                    {coach ? ` · ${coach.name}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusButtons student={student} />
                <button
                  onClick={() => onRemoveReplacement(student.id)}
                  className="p-1.5 text-outline hover:text-tertiary transition-colors ml-1"
                  title="Remove replacement"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* All marked banner */}
      {(students.length + replacementStudents.length) > 0 && unmarkedCount === 0 && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
          <CheckCircle size={18} />
          All {students.length + replacementStudents.length} students marked
          {replacementStudents.length > 0 && ` (${replacementStudents.length} replacement${replacementStudents.length > 1 ? 's' : ''})`}
          — tap <strong>Sync with Excel</strong> to save.
        </div>
      )}
    </div>
  );
};
