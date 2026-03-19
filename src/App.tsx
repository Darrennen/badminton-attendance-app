/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SessionRoster } from './components/SessionRoster';
import { StudentDirectory } from './components/StudentDirectory';
import { SessionSummary } from './components/SessionSummary';
import { CoachAvailability } from './components/CoachAvailability';
import { Replacements } from './components/Replacements';
import { STUDENTS, COACHES } from './constants';
import { AttendanceStatus, Student, Coach } from './types';

type Tab = 'dashboard' | 'sessions' | 'roster' | 'settings' | 'summary' | 'coaches' | 'replacements';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [coaches, setCoaches] = useState<Coach[]>(COACHES);

  const handleStudentStatus = (id: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleCoachStatus = (id: string, status: Coach['status']) => {
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onStartAttendance={() => setActiveTab('sessions')} />;
      case 'sessions':
        return <SessionRoster students={students} onStatusChange={handleStudentStatus} />;
      case 'roster':
        return <StudentDirectory students={students} />;
      case 'summary':
        return <SessionSummary />;
      case 'coaches':
        return <CoachAvailability coaches={coaches} onStatusChange={handleCoachStatus} />;
      case 'replacements':
        return <Replacements />;
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64 text-outline">
            <p className="font-headline font-bold text-xl">Settings coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Attendance';
      case 'sessions': return 'Session Roster';
      case 'roster': return 'Student Directory';
      case 'summary': return 'Session Summary';
      case 'coaches': return 'Coach Availability';
      case 'replacements': return 'Replacements';
      case 'settings': return 'Settings';
      default: return 'Attendance';
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as Tab)} title={getTitle()}>
      {/* Quick Access for Demo */}
      <div className="mb-6 flex flex-wrap gap-2 md:hidden">
        <button onClick={() => setActiveTab('summary')} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-surface-container-high rounded-full">Summary View</button>
        <button onClick={() => setActiveTab('coaches')} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-surface-container-high rounded-full">Coaches View</button>
        <button onClick={() => setActiveTab('replacements')} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-surface-container-high rounded-full">Staffing View</button>
      </div>
      {renderContent()}
    </Layout>
  );
}
