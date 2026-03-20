import React from 'react';
import { Calendar, Clock, Users, UserCircle, CheckCircle, XCircle, Layers, TrendingUp, PlayCircle } from 'lucide-react';
import { RegisteredStudent, RegisteredCoach, TrainingSession, Student } from '../types';

interface DashboardProps {
  sessions: TrainingSession[];
  coaches: RegisteredCoach[];
  students: RegisteredStudent[];
  studentsWithStatus: Student[];        // has today's attendance status
  onStartAttendance: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  present: 'bg-secondary-container text-on-secondary-container',
  absent:  'bg-tertiary-container text-white',
  late:    'bg-primary-fixed text-on-primary-fixed',
  none:    'bg-surface-container-highest text-outline',
};

const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

export const Dashboard: React.FC<DashboardProps> = ({
  sessions,
  coaches,
  students,
  studentsWithStatus,
  onStartAttendance,
}) => {
  // Global stats
  const totalPresent  = studentsWithStatus.filter(s => s.status === 'present').length;
  const totalAbsent   = studentsWithStatus.filter(s => s.status === 'absent').length;
  const totalLate     = studentsWithStatus.filter(s => s.status === 'late').length;
  const totalMarked   = totalPresent + totalAbsent + totalLate;
  const attendancePct = studentsWithStatus.length
    ? Math.round((totalPresent / studentsWithStatus.length) * 100)
    : 0;

  // Build per-session data
  const sessionData = sessions.map(sess => {
    const sessCoaches  = coaches.filter(c  => c.sessionIds.includes(sess.id));
    const sessStudents = students.filter(s => s.sessionIds.includes(sess.id));
    const sessWithStatus = studentsWithStatus.filter(s =>
      sessStudents.some(rs => rs.id === s.id)
    );
    const present  = sessWithStatus.filter(s => s.status === 'present').length;
    const absent   = sessWithStatus.filter(s => s.status === 'absent').length;
    const late     = sessWithStatus.filter(s => s.status === 'late').length;
    const unmarked = sessWithStatus.filter(s => s.status === 'none').length;
    return { sess, sessCoaches, sessStudents, sessWithStatus, present, absent, late, unmarked };
  });

  if (sessions.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Overview</p>
          <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Dashboard</h2>
          <p className="text-outline text-sm mt-1">{today}</p>
        </div>
        <div className="text-center py-20 bg-surface-container-low rounded-3xl space-y-4">
          <Layers size={40} className="mx-auto text-outline opacity-30" />
          <p className="font-headline font-bold text-xl text-on-surface">No sessions configured yet</p>
          <p className="text-outline text-sm">Go to <strong>Sessions</strong> tab to add your training sessions,<br />then register students and coaches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Overview</p>
          <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Dashboard</h2>
          <p className="text-outline text-sm mt-1">{today}</p>
        </div>
        <button
          onClick={onStartAttendance}
          className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl shadow-md active:scale-95 transition-transform self-start md:self-auto"
        >
          <PlayCircle size={18} />
          Take Attendance
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={15} className="text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Sessions</p>
          </div>
          <p className="text-3xl font-black text-on-surface">{sessions.length}</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Users size={15} className="text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Students</p>
          </div>
          <p className="text-3xl font-black text-on-surface">{students.length}</p>
        </div>
        <div className="bg-surface-container-low p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <UserCircle size={15} className="text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Coaches</p>
          </div>
          <p className="text-3xl font-black text-on-surface">{coaches.length}</p>
        </div>
        <div className={`p-5 rounded-2xl ${totalMarked > 0 ? 'bg-secondary-container/40' : 'bg-surface-container-low'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-secondary" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Today Present</p>
          </div>
          <p className={`text-3xl font-black ${totalMarked > 0 ? 'text-secondary' : 'text-outline'}`}>
            {totalMarked > 0 ? `${attendancePct}%` : '—'}
          </p>
          {totalMarked > 0 && (
            <p className="text-[10px] text-on-surface-variant mt-1">
              {totalPresent} present · {totalAbsent} absent · {totalLate} late
            </p>
          )}
        </div>
      </div>

      {/* Session cards */}
      <div className="space-y-6">
        <h3 className="font-headline font-bold text-xl flex items-center gap-3">
          All Sessions
          <span className="h-px flex-grow bg-outline-variant/30" />
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sessionData.map(({ sess, sessCoaches, sessStudents, sessWithStatus, present, absent, late, unmarked }) => {
            const total = sessStudents.length;
            const pct   = total ? Math.round((present / total) * 100) : 0;
            const allMarked = total > 0 && unmarked === 0;

            return (
              <div key={sess.id} className="bg-surface-container-low rounded-3xl overflow-hidden flex flex-col">

                {/* Session header */}
                <div className="bg-gradient-to-r from-primary/10 to-transparent px-6 pt-5 pb-4 border-b border-outline-variant/10">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-headline font-extrabold text-lg text-on-surface leading-tight">{sess.name}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-on-surface-variant">
                        <span className="flex items-center gap-1"><Calendar size={12} />{sess.day}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{sess.startTime} – {sess.endTime}</span>
                      </div>
                    </div>
                    {allMarked && (
                      <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                        Done
                      </span>
                    )}
                  </div>

                  {/* Attendance bar */}
                  {total > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-bold text-outline mb-1">
                        <span>{present} present · {absent} absent · {late} late · {unmarked} unmarked</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 flex flex-col gap-4 flex-1">

                  {/* Coaches */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 flex items-center gap-1.5">
                      <UserCircle size={11} />Coaches ({sessCoaches.length})
                    </p>
                    {sessCoaches.length === 0 ? (
                      <p className="text-xs text-outline italic">No coaches assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sessCoaches.map(c => (
                          <div key={c.id} className="flex items-center gap-1.5 bg-secondary-container/40 text-on-secondary-container px-2.5 py-1 rounded-full">
                            <span className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[9px] font-black">
                              {c.initials}
                            </span>
                            <span className="text-[11px] font-bold">{c.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Students */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2 flex items-center gap-1.5">
                      <Users size={11} />Students ({total})
                    </p>
                    {total === 0 ? (
                      <p className="text-xs text-outline italic">No students assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {sessWithStatus.map(s => (
                          <span
                            key={s.id}
                            title={`${s.name} — ${s.status}`}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status] ?? STATUS_STYLE.none}`}
                          >
                            {s.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant">
                    <span className="flex items-center gap-1 text-secondary"><CheckCircle size={12}/>{present}</span>
                    <span className="flex items-center gap-1 text-tertiary"><XCircle size={12}/>{absent}</span>
                    <span className="flex items-center gap-1 text-primary"><Clock size={12}/>{late}</span>
                  </div>
                  <button
                    onClick={onStartAttendance}
                    className="text-[11px] font-bold text-primary hover:underline active:opacity-70"
                  >
                    Mark attendance →
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary-container inline-block" />Present</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-tertiary-container inline-block" />Absent</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary-fixed inline-block" />Late</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-surface-container-highest inline-block" />Not yet marked</span>
      </div>

    </div>
  );
};
