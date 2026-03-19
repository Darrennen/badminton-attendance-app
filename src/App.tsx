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

type Tab = 'dashboard' | 'sessions' | 'roster' | 'settings' | 'summary' | 'coaches' | 'replacements';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sessions':
        return <SessionRoster />;
      case 'roster':
        return <StudentDirectory />;
      case 'summary':
        return <SessionSummary />;
      case 'coaches':
        return <CoachAvailability />;
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
