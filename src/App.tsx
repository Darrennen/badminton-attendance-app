/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SessionRoster } from './components/SessionRoster';
import { StudentDirectory } from './components/StudentDirectory';
import { SessionSummary } from './components/SessionSummary';
import { CoachAvailability } from './components/CoachAvailability';
import { Replacements } from './components/Replacements';
import { RegisterStudents } from './components/RegisterStudents';
import { RegisterCoaches } from './components/RegisterCoaches';
import { ManageSessions } from './components/ManageSessions';
import { PaymentTracker } from './components/PaymentTracker';
import { COACHES } from './constants';
import { AttendanceStatus, Branch, CoachAttendanceStatus, PaymentStatus, Student, Coach, RegisteredStudent, RegisteredCoach, TrainingSession, ScheduledReplacement, MonthlyExpense } from './types';
import { CoachReplacement } from './utils/excel';

type Tab =
  | 'dashboard'
  | 'sessions'
  | 'roster'
  | 'settings'
  | 'summary'
  | 'coaches'
  | 'replacements'
  | 'register-students'
  | 'register-coaches'
  | 'manage-sessions'
  | 'payments';

const todayISO = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v) return JSON.parse(v);
  } catch {}
  return fallback;
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Migrate pre-branch localStorage data into the given branch's namespace */
function migrateLegacyData(branchId: string) {
  const prefix = `branch_${branchId}_`;
  const staticKeys = ['registered_students', 'registered_coaches', 'training_sessions', 'scheduled_replacements'];
  staticKeys.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) localStorage.setItem(prefix + k, v);
  });
  const dynamicPrefixes = ['attendance_', 'replacements_', 'coach_attendance_', 'coach_replacements_', 'payments_', 'coach_payments_', 'expenses_'];
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && dynamicPrefixes.some(p => k.startsWith(p))) keys.push(k);
  }
  keys.forEach(k => {
    const v = localStorage.getItem(k);
    if (v) localStorage.setItem(prefix + k, v);
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // ─── Branch management ────────────────────────────────────────────────────
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('branches');
    if (saved) return JSON.parse(saved);
    // First run — check if there's legacy (pre-branch) data to migrate
    const defaultBranch: Branch = { id: 'main', name: 'Main Branch' };
    if (localStorage.getItem('registered_students')) migrateLegacyData('main');
    const initial = [defaultBranch];
    saveJSON('branches', initial);
    return initial;
  });

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    return localStorage.getItem('active_branch') ?? branches[0]?.id ?? 'main';
  });

  /** Prefix any localStorage key with the active branch's namespace */
  const bk = useCallback((key: string) => `branch_${activeBranchId}_${key}`, [activeBranchId]);

  useEffect(() => { saveJSON('branches', branches); }, [branches]);
  useEffect(() => { localStorage.setItem('active_branch', activeBranchId); }, [activeBranchId]);

  const addBranch = (name: string, location?: string) => {
    const id = `branch_${Date.now()}`;
    const nb: Branch = { id, name, location };
    setBranches(prev => [...prev, nb]);
    setActiveBranchId(id);
  };

  const renameBranch = (id: string, name: string, location?: string) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, name, location } : b));
  };

  const deleteBranch = (id: string) => {
    if (branches.length === 1) return; // must keep at least one
    setBranches(prev => {
      const remaining = prev.filter(b => b.id !== id);
      if (activeBranchId === id) setActiveBranchId(remaining[0].id);
      return remaining;
    });
  };

  // ─── Registered data (per branch) ────────────────────────────────────────
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>(
    () => loadJSON(bk('registered_students'), [])
  );
  const [registeredCoaches, setRegisteredCoaches] = useState<RegisteredCoach[]>(
    () => loadJSON(bk('registered_coaches'), [])
  );
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(
    () => loadJSON(bk('training_sessions'), [])
  );

  // ─── Attendance state (per date, per branch) ──────────────────────────────
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(
    () => loadJSON(bk(`attendance_${todayISO()}`), {})
  );
  const [replacements, setReplacements] = useState<{ studentId: string; sessionId: string; coachId: string }[]>(
    () => loadJSON(bk(`replacements_${todayISO()}`), [])
  );

  // ─── Legacy coaches (CoachAvailability) ──────────────────────────────────
  const [coaches, setCoaches] = useState<Coach[]>(COACHES);

  // ─── RELOAD ALL when branch switches ─────────────────────────────────────
  useEffect(() => {
    setRegisteredStudents(loadJSON(bk('registered_students'), []));
    setRegisteredCoaches(loadJSON(bk('registered_coaches'), []));
    setTrainingSessions(loadJSON(bk('training_sessions'), []));
    setScheduledReplacements(loadJSON(bk('scheduled_replacements'), []));
    setAttendanceMap(loadJSON(bk(`attendance_${sessionDate}`), {}));
    setReplacements(loadJSON(bk(`replacements_${sessionDate}`), []));
    setCoachAttendanceMap(loadJSON(bk(`coach_attendance_${sessionDate}`), {}));
    setCoachReplacements(loadJSON(bk(`coach_replacements_${sessionDate}`), []));
    setPaymentMap(loadJSON(bk(`payments_${paymentMonth}`), {}));
    setCoachPaymentMap(loadJSON(bk(`coach_payments_${paymentMonth}`), {}));
    setExpenses(loadJSON(bk(`expenses_${paymentMonth}`), []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  // ─── Persist registered data ──────────────────────────────────────────────
  useEffect(() => { saveJSON(bk('registered_students'), registeredStudents); }, [registeredStudents, bk]);
  useEffect(() => { saveJSON(bk('registered_coaches'), registeredCoaches); }, [registeredCoaches, bk]);
  useEffect(() => { saveJSON(bk('training_sessions'), trainingSessions); }, [trainingSessions, bk]);

  // ─── Attendance: load on date/branch change, save on change ───────────────
  useEffect(() => {
    setAttendanceMap(loadJSON(bk(`attendance_${sessionDate}`), {}));
    setReplacements(loadJSON(bk(`replacements_${sessionDate}`), []));
  }, [sessionDate, bk]);

  useEffect(() => { saveJSON(bk(`attendance_${sessionDate}`), attendanceMap); }, [attendanceMap, sessionDate, bk]);
  useEffect(() => { saveJSON(bk(`replacements_${sessionDate}`), replacements); }, [replacements, sessionDate, bk]);

  // ─── Payment state (per month, per branch) ────────────────────────────────
  const [paymentMonth, setPaymentMonth] = useState(thisMonth());
  const [paymentMap, setPaymentMap] = useState<Record<string, PaymentStatus>>(
    () => loadJSON(bk(`payments_${thisMonth()}`), {})
  );
  const [coachPaymentMap, setCoachPaymentMap] = useState<Record<string, PaymentStatus>>(
    () => loadJSON(bk(`coach_payments_${thisMonth()}`), {})
  );
  useEffect(() => {
    setPaymentMap(loadJSON(bk(`payments_${paymentMonth}`), {}));
    setCoachPaymentMap(loadJSON(bk(`coach_payments_${paymentMonth}`), {}));
  }, [paymentMonth, bk]);
  useEffect(() => { saveJSON(bk(`payments_${paymentMonth}`), paymentMap); }, [paymentMap, paymentMonth, bk]);
  useEffect(() => { saveJSON(bk(`coach_payments_${paymentMonth}`), coachPaymentMap); }, [coachPaymentMap, paymentMonth, bk]);

  // ─── Monthly expenses (per month, per branch) ─────────────────────────────
  const [expenses, setExpenses] = useState<MonthlyExpense[]>(
    () => loadJSON(bk(`expenses_${thisMonth()}`), [])
  );
  useEffect(() => { setExpenses(loadJSON(bk(`expenses_${paymentMonth}`), [])); }, [paymentMonth, bk]);
  useEffect(() => { saveJSON(bk(`expenses_${paymentMonth}`), expenses); }, [expenses, paymentMonth, bk]);

  const addExpense = (e: MonthlyExpense) => setExpenses(prev => [...prev, e]);
  const removeExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const handlePaymentStatus = (studentId: string, status: PaymentStatus) =>
    setPaymentMap(prev => ({ ...prev, [studentId]: status }));
  const handleCoachPaymentStatus = (coachId: string, status: PaymentStatus) =>
    setCoachPaymentMap(prev => ({ ...prev, [coachId]: status }));

  const getMonthlyCoachClassCounts = (month: string): Record<string, number> => {
    const counts: Record<string, number> = {};
    const branchPrefix = `branch_${activeBranchId}_coach_attendance_${month}-`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(branchPrefix)) continue;
      try {
        const map: Record<string, string> = JSON.parse(localStorage.getItem(key) ?? '{}');
        for (const [coachId, status] of Object.entries(map)) {
          if (status === 'present') counts[coachId] = (counts[coachId] ?? 0) + 1;
        }
      } catch {}
    }
    return counts;
  };

  // ─── Coach attendance (per date, per branch) ──────────────────────────────
  const [coachAttendanceMap, setCoachAttendanceMap] = useState<Record<string, CoachAttendanceStatus>>(
    () => loadJSON(bk(`coach_attendance_${todayISO()}`), {})
  );
  const [coachReplacements, setCoachReplacements] = useState<CoachReplacement[]>(
    () => loadJSON(bk(`coach_replacements_${todayISO()}`), [])
  );
  useEffect(() => {
    setCoachAttendanceMap(loadJSON(bk(`coach_attendance_${sessionDate}`), {}));
    setCoachReplacements(loadJSON(bk(`coach_replacements_${sessionDate}`), []));
  }, [sessionDate, bk]);
  useEffect(() => { saveJSON(bk(`coach_attendance_${sessionDate}`), coachAttendanceMap); }, [coachAttendanceMap, sessionDate, bk]);
  useEffect(() => { saveJSON(bk(`coach_replacements_${sessionDate}`), coachReplacements); }, [coachReplacements, sessionDate, bk]);

  const handleCoachAttendance = (coachId: string, status: CoachAttendanceStatus) =>
    setCoachAttendanceMap(prev => ({ ...prev, [coachId]: status }));
  const setCoachReplacement = (coachId: string, replacedById: string, sessionId: string) =>
    setCoachReplacements(prev => {
      const without = prev.filter(r => !(r.coachId === coachId && r.sessionId === sessionId));
      return replacedById ? [...without, { coachId, replacedById, sessionId }] : without;
    });

  // ─── Scheduled replacements (per branch) ─────────────────────────────────
  const [scheduledReplacements, setScheduledReplacements] = useState<ScheduledReplacement[]>(
    () => loadJSON(bk('scheduled_replacements'), [])
  );
  useEffect(() => { saveJSON(bk('scheduled_replacements'), scheduledReplacements); }, [scheduledReplacements, bk]);

  const addScheduledReplacement = (r: ScheduledReplacement) =>
    setScheduledReplacements(prev => [...prev, r]);
  const removeScheduledReplacement = (id: string) =>
    setScheduledReplacements(prev => prev.filter(r => r.id !== id));

  // Auto-apply scheduled replacements when date changes
  useEffect(() => {
    scheduledReplacements.filter(r => r.date === sessionDate).forEach(r => {
      setReplacements(prev =>
        prev.some(x => x.studentId === r.studentId) ? prev : [...prev, { studentId: r.studentId, sessionId: r.sessionId, coachId: r.coachId }]
      );
    });
  }, [sessionDate, scheduledReplacements]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isOnBreak = (s: RegisteredStudent, date: string) =>
    s.breakPeriods?.some(bp => bp.from <= date && date <= bp.to) ?? false;

  const addReplacement = (studentId: string, sessionId: string, coachId: string) => {
    setReplacements(prev =>
      prev.some(r => r.studentId === studentId) ? prev : [...prev, { studentId, sessionId, coachId }]
    );
  };
  const removeReplacement = (studentId: string) => {
    setReplacements(prev => prev.filter(r => r.studentId !== studentId));
    setAttendanceMap(prev => { const n = { ...prev }; delete n[studentId]; return n; });
  };

  const studentsWithStatus: Student[] = registeredStudents.map(s => ({
    id: s.id,
    name: s.name,
    studentId: s.studentId,
    avatar: s.avatar,
    group: s.group,
    status: attendanceMap[s.id] ?? 'none',
    onBreak: isOnBreak(s, sessionDate),
  }));

  const handleStudentStatus = (id: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
  };
  const handleCoachStatus = (id: string, status: Coach['status']) => {
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  // ─── Registration handlers ────────────────────────────────────────────────
  const addStudent    = (s: RegisteredStudent) => setRegisteredStudents(prev => [s, ...prev]);
  const updateStudent = (s: RegisteredStudent) => setRegisteredStudents(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteStudent = (id: string)            => setRegisteredStudents(prev => prev.filter(s => s.id !== id));

  const addCoach    = (c: RegisteredCoach) => setRegisteredCoaches(prev => [c, ...prev]);
  const updateCoach = (c: RegisteredCoach) => setRegisteredCoaches(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteCoach = (id: string)          => setRegisteredCoaches(prev => prev.filter(c => c.id !== id));

  const addSession    = (s: TrainingSession) => setTrainingSessions(prev => [...prev, s]);
  const deleteSession = (id: string)          => setTrainingSessions(prev => prev.filter(s => s.id !== id));

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            sessions={trainingSessions}
            coaches={registeredCoaches}
            students={registeredStudents}
            studentsWithStatus={studentsWithStatus}
            onStartAttendance={() => setActiveTab('sessions')}
          />
        );
      case 'sessions':
        return (
          <SessionRoster
            students={studentsWithStatus}
            onStatusChange={handleStudentStatus}
            sessionDate={sessionDate}
            onDateChange={setSessionDate}
            allRegisteredStudents={registeredStudents}
            sessions={trainingSessions}
            coaches={registeredCoaches}
            replacements={replacements}
            onAddReplacement={addReplacement}
            onRemoveReplacement={removeReplacement}
            paymentMap={paymentMap}
            paymentMonth={paymentMonth}
            coachAttendanceMap={coachAttendanceMap}
            coachReplacements={coachReplacements}
            coachPaymentMap={coachPaymentMap}
            onCoachAttendance={handleCoachAttendance}
            onSetCoachReplacement={setCoachReplacement}
            activeBranchId={activeBranchId}
          />
        );
      case 'roster':
        return <StudentDirectory students={studentsWithStatus} />;
      case 'summary':
        return <SessionSummary />;
      case 'coaches':
        return <CoachAvailability coaches={coaches} onStatusChange={handleCoachStatus} />;
      case 'replacements':
        return <Replacements />;
      case 'register-students':
        return (
          <RegisterStudents
            students={registeredStudents}
            sessions={trainingSessions}
            coaches={registeredCoaches}
            onAdd={addStudent}
            onUpdate={updateStudent}
            onDelete={deleteStudent}
            scheduledReplacements={scheduledReplacements}
            onAddScheduledReplacement={addScheduledReplacement}
            onRemoveScheduledReplacement={removeScheduledReplacement}
          />
        );
      case 'register-coaches':
        return (
          <RegisterCoaches
            coaches={registeredCoaches}
            sessions={trainingSessions}
            onAdd={addCoach}
            onUpdate={updateCoach}
            onDelete={deleteCoach}
          />
        );
      case 'manage-sessions':
        return (
          <ManageSessions
            sessions={trainingSessions}
            onAdd={addSession}
            onDelete={deleteSession}
          />
        );
      case 'payments':
        return (
          <PaymentTracker
            students={registeredStudents}
            sessions={trainingSessions}
            coaches={registeredCoaches}
            paymentMap={paymentMap}
            coachPaymentMap={coachPaymentMap}
            paymentMonth={paymentMonth}
            onMonthChange={setPaymentMonth}
            onStudentPayment={handlePaymentStatus}
            onCoachPayment={handleCoachPaymentStatus}
            studentsWithStatus={studentsWithStatus}
            sessionDate={sessionDate}
            replacements={replacements}
            coachAttendanceMap={coachAttendanceMap}
            coachReplacements={coachReplacements}
            monthlyCoachClassCounts={getMonthlyCoachClassCounts(paymentMonth)}
            expenses={expenses}
            onAddExpense={addExpense}
            onRemoveExpense={removeExpense}
            activeBranchId={activeBranchId}
          />
        );
      default:
        return <Dashboard onStartAttendance={() => setActiveTab('sessions')} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':         return 'Badminton Attendance';
      case 'sessions':          return 'Take Attendance';
      case 'roster':            return 'Student Directory';
      case 'summary':           return 'Session Summary';
      case 'coaches':           return 'Coach Availability';
      case 'replacements':      return 'Replacements';
      case 'register-students': return 'Register Students';
      case 'register-coaches':  return 'Register Coaches';
      case 'manage-sessions':   return 'Manage Sessions';
      case 'payments':          return 'Payments';
      default:                  return 'Badminton Attendance';
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={(tab) => setActiveTab(tab as Tab)}
      title={getTitle()}
      branches={branches}
      activeBranchId={activeBranchId}
      onBranchChange={setActiveBranchId}
      onAddBranch={addBranch}
      onRenameBranch={renameBranch}
      onDeleteBranch={deleteBranch}
    >
      {renderContent()}
    </Layout>
  );
}
