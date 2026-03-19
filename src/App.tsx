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
import { COACHES } from './constants';
import { AttendanceStatus, Student, Coach, RegisteredStudent, RegisteredCoach, TrainingSession } from './types';

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
  | 'manage-sessions';

const todayISO = () => new Date().toISOString().slice(0, 10);

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

  // --- Legacy coaches state (for CoachAvailability) ---
  const [coaches, setCoaches] = useState<Coach[]>(COACHES);

  // Persist registered data on change
  useEffect(() => { saveJSON('registered_students', registeredStudents); }, [registeredStudents]);
  useEffect(() => { saveJSON('registered_coaches', registeredCoaches); }, [registeredCoaches]);
  useEffect(() => { saveJSON('training_sessions', trainingSessions); }, [trainingSessions]);

  // Load attendance when date changes
  useEffect(() => {
    setAttendanceMap(loadJSON(`attendance_${sessionDate}`, {}));
  }, [sessionDate]);

  // Auto-save attendance on change
  useEffect(() => {
    saveJSON(`attendance_${sessionDate}`, attendanceMap);
  }, [attendanceMap, sessionDate]);

  // Build students-with-status for the attendance page
  const studentsWithStatus: Student[] = registeredStudents.map(s => ({
    id: s.id,
    name: s.name,
    studentId: s.studentId,
    avatar: s.avatar,
    group: s.group,
    status: attendanceMap[s.id] ?? 'none',
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
  const deleteStudent = (id: string) =>
    setRegisteredStudents(prev => prev.filter(s => s.id !== id));

  const addCoach = (c: RegisteredCoach) =>
    setRegisteredCoaches(prev => [c, ...prev]);
  const deleteCoach = (id: string) =>
    setRegisteredCoaches(prev => prev.filter(c => c.id !== id));

  const addSession = (s: TrainingSession) =>
    setTrainingSessions(prev => [...prev, s]);
  const deleteSession = (id: string) =>
    setTrainingSessions(prev => prev.filter(s => s.id !== id));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onStartAttendance={() => setActiveTab('sessions')} />;
      case 'sessions':
        return (
          <SessionRoster
            students={studentsWithStatus}
            onStatusChange={handleStudentStatus}
            sessionDate={sessionDate}
            onDateChange={setSessionDate}
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
            onAdd={addStudent}
            onDelete={deleteStudent}
          />
        );
      case 'register-coaches':
        return (
          <RegisterCoaches
            coaches={registeredCoaches}
            sessions={trainingSessions}
            onAdd={addCoach}
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
