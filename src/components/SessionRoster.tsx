import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CheckCircle, XCircle, History, Calendar, Download, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { Student, AttendanceStatus } from '../types';

interface SessionRosterProps {
  students: Student[];
  onStatusChange: (id: string, status: AttendanceStatus) => void;
  sessionDate: string;
  onDateChange: (date: string) => void;
}

export const SessionRoster: React.FC<SessionRosterProps> = ({
  students,
  onStatusChange,
  sessionDate,
  onDateChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;
  const unmarkedCount = students.filter(s => s.status === 'none').length;

  // Today's attendance rows to append
  const todayRows = students.map(s => ({
    Date: sessionDate,
    Name: s.name,
    'Student ID': s.studentId,
    Group: s.group ?? '',
    Status: s.status === 'none' ? 'Unmarked' : s.status.charAt(0).toUpperCase() + s.status.slice(1),
  }));

  const exportCSV = () => {
    const header = ['Date', 'Name', 'Student ID', 'Group', 'Status'];
    const lines = [
      header.join(','),
      ...todayRows.map(r => header.map(h => `"${r[h as keyof typeof r]}"`).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${sessionDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(todayRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `attendance_${sessionDate}.xlsx`);
  };

  // Sync: upload existing Excel → strip any rows for today → append fresh rows → download
  const handleSyncFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-uploaded if needed
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Work on the first sheet that looks like attendance, else first sheet
        const sheetName =
          wb.SheetNames.find(n => /attend/i.test(n)) ?? wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // Read existing rows as array-of-objects
        const existing: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        // Remove any rows already recorded for today (avoid duplicates on re-sync)
        const withoutToday = existing.filter(row => {
          const rowDate = String(row['Date'] ?? row['date'] ?? '').trim();
          return rowDate !== sessionDate;
        });

        // Append today's rows
        const merged = [...withoutToday, ...todayRows];

        // Write back to same sheet
        const newWs = XLSX.utils.json_to_sheet(merged);
        wb.Sheets[sheetName] = newWs;

        // Download merged file with today's date in filename
        const originalName = file.name.replace(/\.xlsx?$/i, '');
        XLSX.writeFile(wb, `${originalName}_synced_${sessionDate}.xlsx`);

        setSyncStatus('success');
        setSyncMsg(`Synced! ${todayRows.length} rows appended to "${sheetName}" — download starting.`);
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

            {/* Date picker */}
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

          {/* Export buttons */}
          <div className="flex gap-2 flex-wrap items-start">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-highest transition-colors active:scale-95"
            >
              <Download size={15} />
              CSV
            </button>
            <button
              onClick={exportXLSX}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md"
            >
              <FileSpreadsheet size={15} />
              New XLSX
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md"
            >
              <RefreshCw size={15} />
              Sync with Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleSyncFile}
            />
          </div>
        </div>

        {/* Sync status */}
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

        {/* Sync hint */}
        {syncStatus === 'idle' && (
          <p className="mt-3 text-xs text-outline">
            <strong>Sync with Excel</strong> — upload your existing attendance Excel file and today's data will be appended automatically, then downloaded back.
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
          <div className="bg-secondary-container p-2.5 rounded-full text-on-secondary-container">
            <CheckCircle size={20} />
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Absent</p>
            <p className="text-2xl font-black text-tertiary">{absentCount}</p>
          </div>
          <div className="bg-tertiary-container p-2.5 rounded-full text-white">
            <XCircle size={20} />
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Late</p>
            <p className="text-2xl font-black text-primary">{lateCount}</p>
          </div>
          <div className="bg-primary-fixed p-2.5 rounded-full text-on-primary-fixed">
            <History size={20} />
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-on-surface-variant opacity-70">Unmarked</p>
            <p className="text-2xl font-black text-outline">{unmarkedCount}</p>
          </div>
          <div className="bg-surface-container-highest p-2.5 rounded-full text-outline">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="flex flex-col gap-2">
        {students.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <p className="font-medium">No students registered yet.</p>
            <p className="text-sm mt-1">Go to the Students tab to register students first.</p>
          </div>
        ) : students.map((student) => (
          <div
            key={student.id}
            className={`group p-4 rounded-2xl flex items-center justify-between transition-all border ${
              student.status === 'none'
                ? 'bg-surface-container-lowest border-outline-variant/20'
                : 'bg-surface-container-low border-transparent hover:bg-surface-container-high hover:border-outline-variant/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary overflow-hidden">
                {student.avatar ? (
                  <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  student.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">{student.name}</h4>
                <p className="text-xs text-on-surface-variant font-medium">
                  {student.studentId}{student.group ? ` · ${student.group}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(student.id, 'present')}
                className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                  student.status === 'present'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-secondary-container/50'
                }`}
              >
                Present
              </button>
              <button
                onClick={() => onStatusChange(student.id, 'absent')}
                className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                  student.status === 'absent'
                    ? 'bg-tertiary-container text-white'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-tertiary-container/50'
                }`}
              >
                Absent
              </button>
              <button
                onClick={() => onStatusChange(student.id, 'late')}
                className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                  student.status === 'late'
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed/50'
                }`}
              >
                Late
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* All marked banner */}
      {students.length > 0 && unmarkedCount === 0 && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
          <CheckCircle size={18} />
          All {students.length} students marked — tap <strong>Sync with Excel</strong> to append to your existing file.
        </div>
      )}
    </div>
  );
};
