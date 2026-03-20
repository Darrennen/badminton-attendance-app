/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
import { AttendanceStatus, CoachAttendanceStatus, PaymentStatus, Student, Coach, RegisteredStudent, RegisteredCoach, TrainingSession, ScheduledReplacement } from './types';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // --- Registered data (persisted) ---
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>(
    () => loadJSON('registered_students', [])
  );
  const [registeredCoaches, setRegisteredCoaches] = useState<RegisteredCoach[]>(
    () => loadJSON('registered_coaches', [])
  );
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(
    () => loadJSON('training_sessions', [])
  );

  // --- Attendance state (per date) ---
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(
    () => loadJSON(`attendance_${todayISO()}`, {})
  );
  const [replacements, setReplacements] = useState<{ studentId: string; sessionId: string; coachId: string }[]>(
    () => loadJSON(`replacements_${todayISO()}`, [])
  );

  // --- Legacy coaches state (for CoachAvailability) ---
  const [coaches, setCoaches] = useState<Coach[]>(COACHES);

  // Persist registered data on change
  useEffect(() => { saveJSON('registered_students', registeredStudents); }, [registeredStudents]);
  useEffect(() => { saveJSON('registered_coaches', registeredCoaches); }, [registeredCoaches]);
  useEffect(() => { saveJSON('training_sessions', trainingSessions); }, [trainingSessions]);

  // Load attendance + replacements when date changes
  useEffect(() => {
    setAttendanceMap(loadJSON(`attendance_${sessionDate}`, {}));
    setReplacements(loadJSON(`replacements_${sessionDate}`, []));
  }, [sessionDate]);

  // Auto-save attendance on change
  useEffect(() => {
    saveJSON(`attendance_${sessionDate}`, attendanceMap);
  }, [attendanceMap, sessionDate]);

  // Auto-save replacements on change
  useEffect(() => {
    saveJSON(`replacements_${sessionDate}`, replacements);
  }, [replacements, sessionDate]);

  // --- Payment state (per month) ---
  const [paymentMonth, setPaymentMonth] = useState(thisMonth());
  const [paymentMap, setPaymentMap] = useState<Record<string, PaymentStatus>>(
    () => loadJSON(`payments_${thisMonth()}`, {})
  );
  const [coachPaymentMap, setCoachPaymentMap] = useState<Record<string, PaymentStatus>>(
    () => loadJSON(`coach_payments_${thisMonth()}`, {})
  );
  useEffect(() => {
    setPaymentMap(loadJSON(`payments_${paymentMonth}`, {}));
    setCoachPaymentMap(loadJSON(`coach_payments_${paymentMonth}`, {}));
  }, [paymentMonth]);
  useEffect(() => { saveJSON(`payments_${paymentMonth}`, paymentMap); }, [paymentMap, paymentMonth]);
  useEffect(() => { saveJSON(`coach_payments_${paymentMonth}`, coachPaymentMap); }, [coachPaymentMap, paymentMonth]);
  const handlePaymentStatus = (studentId: string, status: PaymentStatus) =>
    setPaymentMap(prev => ({ ...prev, [studentId]: status }));
  const handleCoachPaymentStatus = (coachId: string, status: PaymentStatus) =>
    setCoachPaymentMap(prev => ({ ...prev, [coachId]: status }));

  const getMonthlyCoachClassCounts = (month: string): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(`coach_attendance_${month}-`)) continue;
      try {
        const map: Record<string, string> = JSON.parse(localStorage.getItem(key) ?? '{}');
        for (const [coachId, status] of Object.entries(map)) {
          if (status === 'present') counts[coachId] = (counts[coachId] ?? 0) + 1;
        }
      } catch {}
    }
    return counts;
  };

  // --- Coach attendance state (per date) ---
  const [coachAttendanceMap, setCoachAttendanceMap] = useState<Record<string, CoachAttendanceStatus>>(
    () => loadJSON(`coach_attendance_${todayISO()}`, {})
  );
  const [coachReplacements, setCoachReplacements] = useState<CoachReplacement[]>(
    () => loadJSON(`coach_replacements_${todayISO()}`, [])
  );
  useEffect(() => {
    setCoachAttendanceMap(loadJSON(`coach_attendance_${sessionDate}`, {}));
    setCoachReplacements(loadJSON(`coach_replacements_${sessionDate}`, []));
  }, [sessionDate]);
  useEffect(() => { saveJSON(`coach_attendance_${sessionDate}`, coachAttendanceMap); }, [coachAttendanceMap, sessionDate]);
  useEffect(() => { saveJSON(`coach_replacements_${sessionDate}`, coachReplacements); }, [coachReplacements, sessionDate]);
  const handleCoachAttendance = (coachId: string, status: CoachAttendanceStatus) =>
    setCoachAttendanceMap(prev => ({ ...prev, [coachId]: status }));
  const setCoachReplacement = (coachId: string, replacedById: string, sessionId: string) =>
    setCoachReplacements(prev => {
      const without = prev.filter(r => !(r.coachId === coachId && r.sessionId === sessionId));
      return replacedById ? [...without, { coachId, replacedById, sessionId }] : without;
    });

  // --- Scheduled (future) replacements ---
  const [scheduledReplacements, setScheduledReplacements] = useState<ScheduledReplacement[]>(
    () => loadJSON('scheduled_replacements', [])
  );
  useEffect(() => { saveJSON('scheduled_replacements', scheduledReplacements); }, [scheduledReplacements]);

  const addScheduledReplacement = (r: ScheduledReplacement) =>
    setScheduledReplacements(prev => [...prev, r]);
  const removeScheduledReplacement = (id: string) =>
    setScheduledReplacements(prev => prev.filter(r => r.id !== id));

  // Auto-apply scheduled replacements when date changes or a new one is added for today
  useEffect(() => {
    scheduledReplacements.filter(r => r.date === sessionDate).forEach(r => {
      setReplacements(prev =>
        prev.some(x => x.studentId === r.studentId) ? prev : [...prev, { studentId: r.studentId, sessionId: r.sessionId, coachId: r.coachId }]
      );
    });
  }, [sessionDate, scheduledReplacements]);

  // Helper: is a student on break for a given date?
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

  // Build students-with-status for the attendance page
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

  // Registration handlers
  const addStudent = (s: RegisteredStudent) =>
    setRegisteredStudents(prev => [s, ...prev]);
  const updateStudent = (s: RegisteredStudent) =>
    setRegisteredStudents(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteStudent = (id: string) =>
    setRegisteredStudents(prev => prev.filter(s => s.id !== id));

  const addCoach = (c: RegisteredCoach) =>
    setRegisteredCoaches(prev => [c, ...prev]);
  const updateCoach = (c: RegisteredCoach) =>
    setRegisteredCoaches(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteCoach = (id: string) =>
    setRegisteredCoaches(prev => prev.filter(c => c.id !== id));

  const addSession = (s: TrainingSession) =>
    setTrainingSessions(prev => [...prev, s]);
  const deleteSession = (id: string) =>
    setTrainingSessions(prev => prev.filter(s => s.id !== id));

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
          />
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64 text-outline">
            <p className="font-headline font-bold text-xl">Settings coming soon...</p>
          </div>
        );
      default:
        return <Dashboard onStartAttendance={() => setActiveTab('sessions')} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Badminton Attendance';
      case 'sessions': return 'Take Attendance';
      case 'roster': return 'Student Directory';
      case 'summary': return 'Session Summary';
      case 'coaches': return 'Coach Availability';
      case 'replacements': return 'Replacements';
      case 'register-students': return 'Register Students';
      case 'register-coaches': return 'Register Coaches';
      case 'manage-sessions': return 'Manage Sessions';
      case 'payments': return 'Payments';
      case 'settings': return 'Settings';
      default: return 'Badminton Attendance';
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as Tab)} title={getTitle()}>
      {renderContent()}
    </Layout>
  );
}
