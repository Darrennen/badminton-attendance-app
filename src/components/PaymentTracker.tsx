import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { CheckCircle, XCircle, CreditCard, FileSpreadsheet, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus, Plus, Trash2 } from 'lucide-react';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus, BreakPeriod, MonthlyExpense } from '../types';
import { buildCombinedWorkbook, ReplacementStudent } from '../utils/excel';

interface Props {
  students: RegisteredStudent[];
  sessions: TrainingSession[];
  coaches: RegisteredCoach[];
  paymentMap: Record<string, PaymentStatus>;
  coachPaymentMap: Record<string, PaymentStatus>;
  paymentMonth: string;
  onMonthChange: (month: string) => void;
  onStudentPayment: (studentId: string, status: PaymentStatus) => void;
  onCoachPayment: (coachId: string, status: PaymentStatus) => void;
  // Cross-data for combined export
  studentsWithStatus: Student[];
  sessionDate: string;
  replacements: { studentId: string; sessionId: string; coachId: string }[];
  coachAttendanceMap: Record<string, import('../types').CoachAttendanceStatus>;
  coachReplacements: import('../utils/excel').CoachReplacement[];
  monthlyCoachClassCounts: Record<string, number>;
  expenses: MonthlyExpense[];
  onAddExpense: (e: MonthlyExpense) => void;
  onRemoveExpense: (id: string) => void;
}

export const PaymentTracker: React.FC<Props> = ({
  students,
  sessions,
  coaches,
  paymentMap,
  coachPaymentMap,
  paymentMonth,
  onMonthChange,
  onStudentPayment,
  onCoachPayment,
  studentsWithStatus,
  sessionDate,
  replacements,
  coachAttendanceMap,
  coachReplacements,
  monthlyCoachClassCounts,
  expenses,
  onAddExpense,
  onRemoveExpense,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSession, setActiveSession] = useState('all');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState('');

  // Check if student is on break during the payment month
  const isOnBreakThisMonth = (s: RegisteredStudent) =>
    s.breakPeriods?.some((bp: BreakPeriod) => bp.from <= `${paymentMonth}-31` && bp.to >= `${paymentMonth}-01`) ?? false;

  const displayedStudents = activeSession === 'all'
    ? students
    : students.filter(s => s.sessionIds.includes(activeSession));

  const activeStudents = students.filter(s => !isOnBreakThisMonth(s));
  const paidCount   = activeStudents.filter(s => paymentMap[s.id] === 'paid').length;
  const unpaidCount = activeStudents.filter(s => paymentMap[s.id] !== 'paid').length;
  const paidPct     = students.length ? Math.round((paidCount / students.length) * 100) : 0;

  // Session-specific counts for tab badges
  const sessionCount = (sessId: string) => {
    const ss = students.filter(s => s.sessionIds.includes(sessId));
    return { paid: ss.filter(s => paymentMap[s.id] === 'paid').length, total: ss.length };
  };

  const monthLabel = new Date(`${paymentMonth}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const replacementStudents: ReplacementStudent[] = replacements.map(r => {
    const s = studentsWithStatus.find(st => st.id === r.studentId);
    return s ? { ...s, sessionId: r.sessionId, coachId: r.coachId } : null;
  }).filter(Boolean) as ReplacementStudent[];

  const [activeTab, setActiveTab] = useState<'students' | 'coaches' | 'summary'>('students');
  const [newExpenseLabel, setNewExpenseLabel] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const exportXLSX = () => {
    const wb = buildCombinedWorkbook(sessions, students, studentsWithStatus, replacementStudents, coaches, sessionDate, paymentMap, paymentMonth, coachAttendanceMap, coachReplacements, coachPaymentMap, undefined, expenses);
    XLSX.writeFile(wb, `badminton_${paymentMonth}.xlsx`);
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
        buildCombinedWorkbook(sessions, students, studentsWithStatus, replacementStudents, coaches, sessionDate, paymentMap, paymentMonth, coachAttendanceMap, coachReplacements, coachPaymentMap, baseWb, expenses);
        XLSX.writeFile(baseWb, `badminton_file_${new Date().toISOString().slice(0, 10)}.xlsx`);
        setSyncStatus('success');
        setSyncMsg(`Synced! Student & coach payments (${paymentMonth}) updated.`);
      } catch {
        setSyncStatus('error');
        setSyncMsg('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
      }
      setTimeout(() => setSyncStatus('idle'), 5000);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="font-label text-primary font-bold tracking-widest text-[11px] uppercase mb-2">Finance</p>
          <h2 className="font-headline font-extrabold text-4xl text-on-background tracking-tight">Payments</h2>
          <p className="text-outline text-sm mt-1">{monthLabel}</p>
        </div>

        {/* Month picker + exports */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
            <CreditCard size={15} className="text-primary" />
            <input
              type="month"
              value={paymentMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="bg-transparent font-medium text-on-surface text-sm focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={exportXLSX}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <FileSpreadsheet size={15} />New XLSX
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-md"
          >
            <RefreshCw size={15} />Sync Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleSyncFile} />
        </div>
      </div>

      {/* Sync status */}
      {syncStatus !== 'idle' && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold ${
          syncStatus === 'success' ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-container/30 text-tertiary'
        }`}>
          {syncStatus === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          {syncMsg}
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveTab('students')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant'}`}>
          Students ({paidCount}/{activeStudents.length})
        </button>
        <button onClick={() => setActiveTab('coaches')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'coaches' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant'}`}>
          Coaches ({coaches.filter(c => coachPaymentMap[c.id] === 'paid').length}/{coaches.length})
        </button>
        <button onClick={() => setActiveTab('summary')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant'}`}>
          Summary
        </button>
      </div>

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && <>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-secondary-container/30 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><CheckCircle size={14} className="text-secondary" /><p className="text-[11px] font-bold uppercase tracking-wider text-outline">Paid</p></div>
            <p className="text-3xl font-black text-secondary">{paidCount}</p>
          </div>
          <div className="bg-tertiary-container/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><XCircle size={14} className="text-tertiary" /><p className="text-[11px] font-bold uppercase tracking-wider text-outline">Unpaid</p></div>
            <p className="text-3xl font-black text-tertiary">{unpaidCount}</p>
          </div>
          <div className="bg-surface-container-low p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2"><CreditCard size={14} className="text-primary" /><p className="text-[11px] font-bold uppercase tracking-wider text-outline">Collection</p></div>
            <p className="text-3xl font-black text-primary">{paidPct}%</p>
            {students.length > 0 && <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${paidPct}%` }} /></div>}
          </div>
        </div>

        {/* Session filter */}
        {sessions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveSession('all')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSession === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant'}`}>
              All ({paidCount}/{students.length})
            </button>
            {sessions.map(s => { const { paid, total } = sessionCount(s.id); return (
              <button key={s.id} onClick={() => setActiveSession(s.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSession === s.id ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {s.name} ({paid}/{total})
              </button>
            ); })}
          </div>
        )}

        {/* Student list */}
        {students.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
            <CreditCard size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No students registered yet.</p>
          </div>
        ) : displayedStudents.length === 0 ? (
          <p className="text-sm text-outline text-center py-8">No students in this session.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {displayedStudents.map(s => {
              const isPaid = paymentMap[s.id] === 'paid';
              const onBreak = isOnBreakThisMonth(s);
              const sessNames = s.sessionIds.map(sid => sessions.find(x => x.id === sid)?.name).filter(Boolean);
              return (
                <div key={s.id} className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                  onBreak ? 'bg-surface-container-lowest border-outline-variant/10 opacity-60'
                  : isPaid ? 'bg-secondary-container/20 border-secondary-container/40'
                  : 'bg-surface-container-low border-outline-variant/10'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${onBreak ? 'bg-surface-container-high text-outline' : isPaid ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-outline'}`}>
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-headline font-bold text-on-surface">{s.name}</p>
                        {onBreak && <span className="bg-tertiary-container/40 text-tertiary text-[9px] font-bold px-1.5 py-0.5 rounded-full">On Break</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-xs text-outline">{s.studentId}</span>
                        {s.group && <span className="bg-primary-fixed text-on-primary-fixed text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">{s.group}</span>}
                        {sessNames.map(name => <span key={name} className="bg-surface-container-highest text-outline text-[9px] font-bold px-1.5 py-0.5 rounded-full">{name}</span>)}
                      </div>
                    </div>
                  </div>
                  {onBreak
                    ? <span className="text-xs text-outline italic px-4 py-2">Exempt</span>
                    : <button onClick={() => onStudentPayment(s.id, isPaid ? 'unpaid' : 'paid')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${isPaid ? 'bg-surface-container-high text-outline hover:bg-tertiary-container/30 hover:text-tertiary' : 'bg-secondary text-white shadow-sm hover:opacity-90'}`}>
                        {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                      </button>
                  }
                </div>
              );
            })}
          </div>
        )}
        {students.length > 0 && unpaidCount === 0 && (
          <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
            <CheckCircle size={18} />All {students.length} students paid for {monthLabel} — tap <strong>Sync Excel</strong> to save.
          </div>
        )}
      </>}

      {/* ── COACHES TAB ── */}
      {activeTab === 'coaches' && (() => {
        const coachPaid   = coaches.filter(c => coachPaymentMap[c.id] === 'paid').length;
        const coachUnpaid = coaches.length - coachPaid;
        const coachPct    = coaches.length ? Math.round((coachPaid / coaches.length) * 100) : 0;
        return <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary-container/30 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2"><CheckCircle size={14} className="text-secondary" /><p className="text-[11px] font-bold uppercase tracking-wider text-outline">Paid</p></div>
              <p className="text-3xl font-black text-secondary">{coachPaid}</p>
            </div>
            <div className="bg-tertiary-container/20 p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2"><XCircle size={14} className="text-tertiary" /><p className="text-[11px] font-bold uppercase tracking-wider text-outline">Unpaid</p></div>
              <p className="text-3xl font-black text-tertiary">{coachUnpaid}</p>
            </div>
            <div className="bg-surface-container-low p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2"><CreditCard size={14} className="text-primary" /><p className="text-[11px] font-bold uppercase tracking-wider text-outline">Collection</p></div>
              <p className="text-3xl font-black text-primary">{coachPct}%</p>
              {coaches.length > 0 && <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden"><div className="h-full bg-secondary rounded-full" style={{ width: `${coachPct}%` }} /></div>}
            </div>
          </div>
          {coaches.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-3xl text-outline">
              <CreditCard size={32} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No coaches registered yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {coaches.map(c => {
                const isPaid = coachPaymentMap[c.id] === 'paid';
                const sessNames = c.sessionIds.map(sid => sessions.find(x => x.id === sid)?.name).filter(Boolean);
                const classes = monthlyCoachClassCounts[c.id] ?? 0;
                const rate = c.ratePerClass;
                const total = rate != null ? rate * classes : null;
                return (
                  <div key={c.id} className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${isPaid ? 'bg-secondary-container/20 border-secondary-container/40' : 'bg-surface-container-low border-outline-variant/10'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPaid ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-highest text-outline'}`}>
                        {c.initials}
                      </div>
                      <div>
                        <p className="font-headline font-bold text-on-surface">{c.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {sessNames.map(name => <span key={name} className="bg-surface-container-highest text-outline text-[9px] font-bold px-1.5 py-0.5 rounded-full">{name}</span>)}
                        </div>
                        {rate != null ? (
                          <p className="text-xs text-outline mt-1">
                            RM{rate}/class × {classes} class{classes !== 1 ? 'es' : ''} = <span className="font-bold text-on-surface">RM{total}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-outline mt-1">{classes} class{classes !== 1 ? 'es' : ''} attended — no rate set</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => onCoachPayment(c.id, isPaid ? 'unpaid' : 'paid')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${isPaid ? 'bg-surface-container-high text-outline hover:bg-tertiary-container/30 hover:text-tertiary' : 'bg-secondary text-white shadow-sm hover:opacity-90'}`}>
                      {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {coaches.length > 0 && coachUnpaid === 0 && (
            <div className="flex items-center gap-3 p-4 bg-secondary-container/30 rounded-2xl text-on-secondary-container text-sm font-semibold">
              <CheckCircle size={18} />All {coaches.length} coaches paid for {monthLabel} — tap <strong>Sync Excel</strong> to save.
            </div>
          )}
        </>;
      })()}

      {/* ── SUMMARY TAB ── */}
      {activeTab === 'summary' && (() => {
        // Revenue: sum of monthlyFee for paid, non-break students
        const revenue = students
          .filter(s => !isOnBreakThisMonth(s) && paymentMap[s.id] === 'paid')
          .reduce((sum, s) => sum + (s.monthlyFee ?? 0), 0);
        const revenueUnknown = students
          .filter(s => !isOnBreakThisMonth(s) && paymentMap[s.id] === 'paid' && s.monthlyFee == null)
          .length;

        // Coach costs
        const coachCosts = coaches.reduce((sum, c) => {
          const classes = monthlyCoachClassCounts[c.id] ?? 0;
          return sum + (c.ratePerClass != null ? c.ratePerClass * classes : 0);
        }, 0);
        const coachCostUnknown = coaches.filter(c => c.ratePerClass == null && (monthlyCoachClassCounts[c.id] ?? 0) > 0).length;

        // Other expenses
        const otherCosts = expenses.reduce((sum, e) => sum + e.amount, 0);

        const totalCosts = coachCosts + otherCosts;
        const netProfit = revenue - totalCosts;

        return (
          <div className="space-y-6">
            {/* Net profit hero */}
            <div className={`p-6 rounded-3xl ${netProfit >= 0 ? 'bg-secondary-container/30' : 'bg-tertiary-container/20'}`}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Net Profit — {monthLabel}</p>
              <p className={`text-5xl font-black ${netProfit >= 0 ? 'text-secondary' : 'text-tertiary'}`}>
                {netProfit >= 0 ? '+' : ''}RM{netProfit.toFixed(2)}
              </p>
              <p className="text-sm text-outline mt-2">RM{revenue.toFixed(2)} revenue − RM{totalCosts.toFixed(2)} costs</p>
            </div>

            {/* Breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary-container/20 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-secondary" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Revenue</p>
                </div>
                <p className="text-3xl font-black text-secondary">RM{revenue.toFixed(2)}</p>
                <p className="text-xs text-outline mt-1">
                  {students.filter(s => !isOnBreakThisMonth(s) && paymentMap[s.id] === 'paid').length} students paid
                  {revenueUnknown > 0 && ` · ${revenueUnknown} with no fee set`}
                </p>
              </div>
              <div className="bg-tertiary-container/15 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={16} className="text-tertiary" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Coach Costs</p>
                </div>
                <p className="text-3xl font-black text-tertiary">RM{coachCosts.toFixed(2)}</p>
                <p className="text-xs text-outline mt-1">
                  {coaches.length} coaches
                  {coachCostUnknown > 0 && ` · ${coachCostUnknown} without rate`}
                </p>
              </div>
              <div className="bg-surface-container-low p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Minus size={16} className="text-outline" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-outline">Other Expenses</p>
                </div>
                <p className="text-3xl font-black text-on-surface">RM{otherCosts.toFixed(2)}</p>
                <p className="text-xs text-outline mt-1">{expenses.length} item{expenses.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Coach cost breakdown */}
            {coaches.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-3">Coach Breakdown</p>
                <div className="space-y-2">
                  {coaches.map(c => {
                    const classes = monthlyCoachClassCounts[c.id] ?? 0;
                    const total = c.ratePerClass != null ? c.ratePerClass * classes : null;
                    return (
                      <div key={c.id} className="flex items-center justify-between bg-surface-container-low px-4 py-3 rounded-xl text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-on-secondary-container">{c.initials}</div>
                          <span className="font-semibold text-on-surface">{c.name}</span>
                        </div>
                        <span className="text-outline text-xs">
                          {c.ratePerClass != null
                            ? `RM${c.ratePerClass} × ${classes} = `
                            : `${classes} classes · `}
                          <span className="font-bold text-on-surface">{total != null ? `RM${total}` : 'no rate'}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other expenses list + add form */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-3">Other Expenses</p>
              <div className="space-y-2 mb-3">
                {expenses.length === 0 && (
                  <p className="text-sm text-outline bg-surface-container-low rounded-xl px-4 py-3">No expenses added yet.</p>
                )}
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-surface-container-low px-4 py-3 rounded-xl">
                    <span className="font-medium text-on-surface text-sm">{e.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-on-surface text-sm">RM{e.amount.toFixed(2)}</span>
                      <button onClick={() => onRemoveExpense(e.id)} className="p-1 text-outline hover:text-tertiary transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Add expense form */}
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] text-outline mb-1">Description</label>
                  <input value={newExpenseLabel} onChange={e => setNewExpenseLabel(e.target.value)}
                    placeholder="e.g. Court Rental"
                    className="w-full px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] text-outline mb-1">Amount (RM)</label>
                  <input type="number" min="0" step="0.01" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <button
                  onClick={() => {
                    if (!newExpenseLabel.trim() || !newExpenseAmount) return;
                    onAddExpense({ id: Date.now().toString(), label: newExpenseLabel.trim(), amount: Number(newExpenseAmount) });
                    setNewExpenseLabel(''); setNewExpenseAmount('');
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-primary text-white font-bold text-sm rounded-xl active:scale-95 transition-transform shadow-sm"
                >
                  <Plus size={14} />Add
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
