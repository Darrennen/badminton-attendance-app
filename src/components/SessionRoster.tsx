import React from 'react';
import * as XLSX from 'xlsx';
import { CheckCircle, XCircle, History, Calendar, Download, FileSpreadsheet } from 'lucide-react';
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
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;
  const unmarkedCount = students.filter(s => s.status === 'none').length;

  const rows = students.map(s => ({
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
      ...rows.map(r => header.map(h => `"${r[h as keyof typeof r]}"`).join(',')),
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
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `attendance_${sessionDate}.xlsx`);
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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-highest transition-colors active:scale-95"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={exportXLSX}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-md"
            >
              <FileSpreadsheet size={16} />
              Export XLSX
            </button>
          </div>
        </div>
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
        {students.map((student) => (
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
                    : 'bg-surface-container text-on-surface-variant hover:bg-secondary-container/50'
                }`}
              >
                Present
              </button>
              <button
                onClick={() => onStatusChange(student.id, 'absent')}
                className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                  student.status === 'absent'
                    ? 'bg-tertiary-container text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-tertiary-container/50'
                }`}
              >
                Absent
              </button>
              <button
                onClick={() => onStatusChange(student.id, 'late')}
                className={`px-3 py-1.5 rounded-full font-label text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 ${
                  student.status === 'late'
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed/50'
                }`}
              >
                Late
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Save reminder */}
      {unmarkedCount === 0 && (
        <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
          <CheckCircle size={18} />
          All {students.length} students marked — attendance auto-saved. Use Export buttons above to download.
        </div>
      )}
    </div>
  );
};
