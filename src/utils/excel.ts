import * as XLSX from 'xlsx';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus, CoachAttendanceStatus, MonthlyExpense } from '../types';

export type ReplacementStudent = Student & { sessionId: string; coachId: string };
export type CoachReplacement = { coachId: string; replacedById: string; sessionId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function styleSheet(ws: XLSX.WorkSheet, rows: Record<string, unknown>[], fixedCols: number) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map((key, i) => {
    const maxLen = Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length));
    return { wch: (i < fixedCols ? Math.max(maxLen, 18) : Math.max(maxLen, 10)) + 2 };
  });
  if (fixedCols > 0) ws['!freeze'] = { xSplit: fixedCols, ySplit: 1 };
  if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
}

function upsertSheet(wb: XLSX.WorkBook, sheetName: string, ws: XLSX.WorkSheet) {
  wb.Sheets[sheetName] = ws;
  if (!wb.SheetNames.includes(sheetName)) wb.SheetNames.push(sheetName);
}

/** Move a sheet to position 0 in the tab bar */
function pinSheetFirst(wb: XLSX.WorkBook, sheetName: string) {
  wb.SheetNames = [sheetName, ...wb.SheetNames.filter(n => n !== sheetName)];
}

const sessLabels = (ids: string[], sessions: TrainingSession[]) =>
  ids.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

const isOnBreakInMonth = (s: RegisteredStudent, month: string) =>
  s.breakPeriods?.some(bp => bp.from <= `${month}-31` && bp.to >= `${month}-01`) ?? false;

// ─── Overview sheet ───────────────────────────────────────────────────────────
function buildOverviewSheet(
  wb: XLSX.WorkBook,
  sessions: TrainingSession[],
  allStudents: RegisteredStudent[],
  coaches: RegisteredCoach[],
  paymentMap: Record<string, PaymentStatus>,
  coachPaymentMap: Record<string, PaymentStatus>,
  expenses: MonthlyExpense[],
  classCounts: Record<string, number>,
  sessionDate: string,
  paymentMonth: string,
) {
  const monthLabel = new Date(`${paymentMonth}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const exportedAt  = new Date().toLocaleString('en-GB');

  const paidStudents   = allStudents.filter(s => !isOnBreakInMonth(s, paymentMonth) && paymentMap[s.id] === 'paid').length;
  const paidCoaches    = coaches.filter(c => coachPaymentMap[c.id] === 'paid').length;
  const totalRevenue   = allStudents.filter(s => !isOnBreakInMonth(s, paymentMonth) && paymentMap[s.id] === 'paid').reduce((n, s) => n + (s.monthlyFee ?? 0), 0);
  const totalCoachCost = coaches.reduce((n, c) => n + (c.ratePerClass != null ? c.ratePerClass * (classCounts[c.id] ?? 0) : 0), 0);
  const totalOther     = expenses.reduce((n, e) => n + e.amount, 0);
  const netProfit      = totalRevenue - totalCoachCost - totalOther;

  const E = '';
  const aoa: (string | number)[][] = [
    ['BADMINTON ACADEMY — WORKBOOK OVERVIEW'],
    [`Exported: ${exportedAt}`],
    [`Attendance Date: ${sessionDate}`, E, `Payment Month: ${monthLabel}`],
    [E],

    ['WHAT\'S IN THIS FILE', 'Sheet Name', 'Description'],
    ['Attendance (per session)', sessions.map(s => s.name).join(', '), 'Each session has its own sheet — rows = students, columns = dates'],
    ['Replacements',            'Replacements',      'All ad-hoc replacement students across all dates'],
    ['Coach Attendance',        'Coach Attendance',   'Rows = coaches, columns = dates with Present / Absent / On Leave'],
    ['Student Payments',        'Student Payments',   'Rows = students, columns = months with Paid / Unpaid + monthly fee'],
    ['Coach Payments',          'Coach Payments',     'Rows = coaches, columns = months + rate, classes, total cost'],
    ['Financial Audit',         `Audit ${paymentMonth}`, 'Full revenue, cost and net profit breakdown for the month'],
    [E],

    ['QUICK STATS', 'Value'],
    ['Total Sessions Configured', sessions.length],
    ['Total Students Registered',  allStudents.length],
    ['Total Coaches Registered',   coaches.length],
    [E],

    [`PAYMENTS (${monthLabel})`, 'Value'],
    ['Students Paid',            `${paidStudents} / ${allStudents.filter(s => !isOnBreakInMonth(s, paymentMonth)).length}`],
    ['Coaches Paid',             `${paidCoaches} / ${coaches.length}`],
    ['Total Revenue Collected',  `RM ${totalRevenue.toFixed(2)}`],
    ['Total Coach Costs',        `RM ${totalCoachCost.toFixed(2)}`],
    ['Total Other Expenses',     `RM ${totalOther.toFixed(2)}`],
    ['Net Profit / Loss',        `RM ${netProfit.toFixed(2)}`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 36 }, { wch: 40 }, { wch: 55 }];
  upsertSheet(wb, 'Overview', ws);
  pinSheetFirst(wb, 'Overview');
}

// ─── Student attendance sheets ────────────────────────────────────────────────
function buildAttendanceSheets(
  wb: XLSX.WorkBook,
  sessions: TrainingSession[],
  allRegisteredStudents: RegisteredStudent[],
  students: Student[],
  replacementStudents: ReplacementStudent[],
  coaches: RegisteredCoach[],
  sessionDate: string,
) {
  const statusLabel = (id: string) => {
    const st = students.find(x => x.id === id)?.status ?? 'none';
    return st === 'none' ? 'Unmarked' : st.charAt(0).toUpperCase() + st.slice(1);
  };

  sessions.forEach(sess => {
    const sheetName = sess.name.slice(0, 31);
    // Only students enrolled in this session, sorted A-Z
    const sessStudents = allRegisteredStudents
      .filter(s => s.sessionIds.includes(sess.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    let rows: Record<string, string>[];

    if (wb.SheetNames.includes(sheetName)) {
      const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
      const updatedIds = new Set<string>();
      rows = existing.map(row => {
        const rs = allRegisteredStudents.find(s => s.studentId === row['Student ID']);
        if (rs && sessStudents.some(ss => ss.id === rs.id)) {
          updatedIds.add(rs.studentId);
          return { ...row, [sessionDate]: statusLabel(rs.id) };
        }
        return row;
      });
      sessStudents.filter(s => !updatedIds.has(s.studentId)).forEach(s => {
        const coachId = (s.sessionCoachMap ?? {})[sess.id];
        const coachName = coaches.find(c => c.id === coachId)?.name ?? '';
        rows.push({ Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Coach: coachName, [sessionDate]: statusLabel(s.id) });
      });
    } else {
      rows = sessStudents.map(s => {
        const coachId = (s.sessionCoachMap ?? {})[sess.id];
        const coachName = coaches.find(c => c.id === coachId)?.name ?? '';
        return { Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Coach: coachName, [sessionDate]: statusLabel(s.id) };
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    upsertSheet(wb, sheetName, ws);
    styleSheet(wb.Sheets[sheetName], rows, 4);
  });

  // Replacements — flat sheet, sorted by date desc
  if (replacementStudents.length > 0 || wb.SheetNames.includes('Replacements')) {
    const todayRows = replacementStudents.map(r => {
      const sess = sessions.find(x => x.id === r.sessionId);
      const coach = coaches.find(x => x.id === r.coachId);
      const st = r.status === 'none' ? 'Unmarked' : r.status.charAt(0).toUpperCase() + r.status.slice(1);
      return {
        Date: sessionDate,
        Name: r.name,
        'Student ID': r.studentId,
        Group: r.group ?? '',
        Session: sess ? `${sess.name} (${sess.day})` : 'Unspecified',
        'Session Day': sess?.day ?? '',
        Coach: coach?.name ?? '',
        Status: st,
      };
    });
    let replRows: Record<string, string>[];
    if (wb.SheetNames.includes('Replacements')) {
      const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Replacements'], { defval: '' });
      replRows = [...existing.filter(r => r['Date'] !== sessionDate), ...todayRows]
        .sort((a, b) => b['Date'].localeCompare(a['Date'])); // newest first
    } else {
      replRows = todayRows;
    }
    if (replRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(replRows);
      upsertSheet(wb, 'Replacements', ws);
      styleSheet(wb.Sheets['Replacements'], replRows, 0);
    }
  }
}

// ─── Coach attendance sheet ───────────────────────────────────────────────────
function buildCoachAttendanceSheet(
  wb: XLSX.WorkBook,
  coaches: RegisteredCoach[],
  sessions: TrainingSession[],
  coachAttendanceMap: Record<string, CoachAttendanceStatus>,
  coachReplacements: CoachReplacement[],
  sessionDate: string,
) {
  const sheetName = 'Coach Attendance';

  const statusLabel = (id: string) => {
    const st = coachAttendanceMap[id] ?? 'none';
    if (st === 'none') return 'Unmarked';
    if (st === 'on-leave') return 'On Leave';
    return st.charAt(0).toUpperCase() + st.slice(1);
  };

  const replNote = (id: string) => {
    const repl = coachReplacements.find(r => r.coachId === id);
    if (!repl) return '';
    const sub = coaches.find(c => c.id === repl.replacedById);
    return sub ? `→ ${sub.name}` : '';
  };

  const sortedCoaches = [...coaches].sort((a, b) => a.name.localeCompare(b.name));

  let rows: Record<string, string>[];
  if (wb.SheetNames.includes(sheetName)) {
    const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
    const updatedIds = new Set<string>();
    rows = existing.map(row => {
      const c = coaches.find(x => x.name === row['Name']);
      if (c) {
        updatedIds.add(c.id);
        const note = replNote(c.id);
        return { ...row, [sessionDate]: statusLabel(c.id) + (note ? ` (${note})` : '') };
      }
      return row;
    });
    sortedCoaches.filter(c => !updatedIds.has(c.id)).forEach(c => {
      const note = replNote(c.id);
      rows.push({ Name: c.name, Sessions: sessLabels(c.sessionIds, sessions), 'Rate (RM/class)': c.ratePerClass != null ? String(c.ratePerClass) : '', [sessionDate]: statusLabel(c.id) + (note ? ` (${note})` : '') });
    });
  } else {
    rows = sortedCoaches.map(c => {
      const note = replNote(c.id);
      return { Name: c.name, Sessions: sessLabels(c.sessionIds, sessions), 'Rate (RM/class)': c.ratePerClass != null ? String(c.ratePerClass) : '', [sessionDate]: statusLabel(c.id) + (note ? ` (${note})` : '') };
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  upsertSheet(wb, sheetName, ws);
  styleSheet(wb.Sheets[sheetName], rows, 3);
}

// ─── Student payment sheet ────────────────────────────────────────────────────
function buildPaymentSheet(
  wb: XLSX.WorkBook,
  allRegisteredStudents: RegisteredStudent[],
  sessions: TrainingSession[],
  paymentMap: Record<string, PaymentStatus>,
  paymentMonth: string,
) {
  const sheetName = 'Student Payments';
  const statusLabel = (s: RegisteredStudent) => {
    if (isOnBreakInMonth(s, paymentMonth)) return 'On Break';
    return paymentMap[s.id] === 'paid' ? 'Paid' : 'Unpaid';
  };

  const sortedStudents = [...allRegisteredStudents].sort((a, b) => a.name.localeCompare(b.name));

  let rows: Record<string, string>[];
  if (wb.SheetNames.includes(sheetName)) {
    const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
    const updatedIds = new Set<string>();
    rows = existing.map(row => {
      const rs = allRegisteredStudents.find(s => s.studentId === row['Student ID']);
      if (rs) {
        updatedIds.add(rs.studentId);
        return { ...row, 'Monthly Fee (RM)': rs.monthlyFee != null ? String(rs.monthlyFee) : '', [paymentMonth]: statusLabel(rs) };
      }
      return row;
    });
    sortedStudents.filter(s => !updatedIds.has(s.studentId)).forEach(s =>
      rows.push({ Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Sessions: sessLabels(s.sessionIds, sessions), 'Monthly Fee (RM)': s.monthlyFee != null ? String(s.monthlyFee) : '', [paymentMonth]: statusLabel(s) })
    );
  } else {
    rows = sortedStudents.map(s => ({
      Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Sessions: sessLabels(s.sessionIds, sessions), 'Monthly Fee (RM)': s.monthlyFee != null ? String(s.monthlyFee) : '', [paymentMonth]: statusLabel(s),
    }));
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  upsertSheet(wb, sheetName, ws);
  styleSheet(wb.Sheets[sheetName], rows, 4);
}

// ─── Shared: scan localStorage for monthly coach class counts ─────────────────
function computeClassCounts(paymentMonth: string): Record<string, number> {
  const counts: Record<string, number> = {};
  if (typeof localStorage === 'undefined') return counts;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(`coach_attendance_${paymentMonth}-`)) continue;
    try {
      const map: Record<string, string> = JSON.parse(localStorage.getItem(key) ?? '{}');
      for (const [coachId, status] of Object.entries(map)) {
        if (status === 'present') counts[coachId] = (counts[coachId] ?? 0) + 1;
      }
    } catch {}
  }
  return counts;
}

// ─── Coach payment sheet ──────────────────────────────────────────────────────
function buildCoachPaymentSheet(
  wb: XLSX.WorkBook,
  coaches: RegisteredCoach[],
  sessions: TrainingSession[],
  coachPaymentMap: Record<string, PaymentStatus>,
  classCounts: Record<string, number>,
  paymentMonth: string,
) {
  const sheetName = 'Coach Payments';
  const statusLabel = (id: string) => coachPaymentMap[id] === 'paid' ? 'Paid' : 'Unpaid';
  const sortedCoaches = [...coaches].sort((a, b) => a.name.localeCompare(b.name));

  const makeRow = (c: RegisteredCoach) => {
    const classes = classCounts[c.id] ?? 0;
    const rate = c.ratePerClass;
    const total = rate != null ? String(rate * classes) : '';
    return {
      Name: c.name,
      Sessions: sessLabels(c.sessionIds, sessions),
      'Rate (RM/class)': rate != null ? String(rate) : '',
      [`Classes (${paymentMonth})`]: String(classes),
      [`Total (RM) (${paymentMonth})`]: total,
      [paymentMonth]: statusLabel(c.id),
    };
  };

  let rows: Record<string, string>[];
  if (wb.SheetNames.includes(sheetName)) {
    const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
    const updatedIds = new Set<string>();
    rows = existing.map(row => {
      const c = coaches.find(x => x.name === row['Name']);
      if (c) {
        updatedIds.add(c.id);
        const nr = makeRow(c);
        // keep old month columns, update fixed cols + this month
        return { ...row, 'Rate (RM/class)': nr['Rate (RM/class)'], [`Classes (${paymentMonth})`]: nr[`Classes (${paymentMonth})`], [`Total (RM) (${paymentMonth})`]: nr[`Total (RM) (${paymentMonth})`], [paymentMonth]: nr[paymentMonth] };
      }
      return row;
    });
    sortedCoaches.filter(c => !updatedIds.has(c.id)).forEach(c => rows.push(makeRow(c)));
  } else {
    rows = sortedCoaches.map(makeRow);
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  upsertSheet(wb, sheetName, ws);
  styleSheet(wb.Sheets[sheetName], rows, 2);
}

// ─── Financial Audit sheet ────────────────────────────────────────────────────
function buildFinancialAuditSheet(
  wb: XLSX.WorkBook,
  allRegisteredStudents: RegisteredStudent[],
  sessions: TrainingSession[],
  coaches: RegisteredCoach[],
  paymentMap: Record<string, PaymentStatus>,
  coachPaymentMap: Record<string, PaymentStatus>,
  classCounts: Record<string, number>,
  expenses: MonthlyExpense[],
  paymentMonth: string,
) {
  const monthLabel = new Date(`${paymentMonth}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
  const exportDate = new Date().toLocaleString('en-GB');

  // Revenue
  let totalRevenue = 0;
  const sortedStudents = [...allRegisteredStudents].sort((a, b) => a.name.localeCompare(b.name));
  const studentRows = sortedStudents.map(s => {
    const onBreak = isOnBreakInMonth(s, paymentMonth);
    const paid    = paymentMap[s.id] === 'paid';
    const fee     = s.monthlyFee ?? 0;
    const collected = !onBreak && paid ? fee : 0;
    totalRevenue += collected;
    return {
      'Student Name':    s.name,
      'Student ID':      s.studentId,
      'Group':           s.group ?? '',
      'Sessions':        sessLabels(s.sessionIds, sessions),
      'Monthly Fee (RM)': fee || '',
      'Status':          onBreak ? 'On Break (Exempt)' : paid ? 'Paid' : 'Unpaid',
      'Collected (RM)':  collected || '',
    };
  });
  const potentialRevenue = allRegisteredStudents.filter(s => !isOnBreakInMonth(s, paymentMonth)).reduce((n, s) => n + (s.monthlyFee ?? 0), 0);
  const outstanding = potentialRevenue - totalRevenue;

  // Coach costs
  let totalCoachCosts = 0;
  const sortedCoaches = [...coaches].sort((a, b) => a.name.localeCompare(b.name));
  const coachRows = sortedCoaches.map(c => {
    const classes = classCounts[c.id] ?? 0;
    const rate    = c.ratePerClass;
    const total   = rate != null ? rate * classes : null;
    if (total != null) totalCoachCosts += total;
    return {
      'Coach Name':        c.name,
      'Sessions Handled':  sessLabels(c.sessionIds, sessions),
      'Rate / Class (RM)': rate ?? 'No rate set',
      'Classes Attended':  classes,
      'Total Cost (RM)':   total ?? 'N/A',
      'Payment Status':    coachPaymentMap[c.id] === 'paid' ? 'Paid' : 'Unpaid',
    };
  });

  // Other expenses
  const totalOtherCosts = expenses.reduce((n, e) => n + e.amount, 0);
  const expenseRows = expenses.map(e => ({ 'Description': e.label, 'Amount (RM)': e.amount }));

  const totalCosts = totalCoachCosts + totalOtherCosts;
  const netProfit  = totalRevenue - totalCosts;

  // Build audit workbook with three mini-tables using aoa
  const E = '';
  const divider = ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', E, E, E, E, E, E];

  const aoa: (string | number)[][] = [
    [`MONTHLY FINANCIAL REPORT — ${monthLabel}`],
    [`Exported: ${exportDate}`],
    [E],
    divider,
    ['NET SUMMARY',                         E,                   ''],
    ['Total Revenue Collected (RM)',         totalRevenue,        ''],
    ['Still Outstanding (RM)',               outstanding,         ''],
    ['Potential Revenue if All Paid (RM)',   potentialRevenue,    ''],
    [E],
    ['Total Coach Costs (RM)',               totalCoachCosts,     ''],
    ['Total Other Expenses (RM)',            totalOtherCosts,     ''],
    ['Total Costs (RM)',                     totalCosts,          ''],
    [E],
    ['NET PROFIT / LOSS (RM)',               netProfit,           netProfit >= 0 ? '▲ Profit' : '▼ Loss'],
    divider,
    [E],

    // Revenue table
    ['REVENUE BREAKDOWN'],
    ['Student Name', 'Student ID', 'Group', 'Sessions', 'Monthly Fee (RM)', 'Status', 'Collected (RM)'],
    ...studentRows.map(r => Object.values(r)),
    [E, E, E, E, 'SUBTOTAL', E, totalRevenue],
    [E],

    // Coach cost table
    ['COACH COSTS BREAKDOWN'],
    ['Coach Name', 'Sessions Handled', 'Rate / Class (RM)', 'Classes Attended', 'Total Cost (RM)', 'Payment Status'],
    ...coachRows.map(r => Object.values(r)),
    [E, E, E, 'SUBTOTAL', totalCoachCosts, E],
    [E],

    // Expenses table
    ['OTHER EXPENSES'],
    ['Description', 'Amount (RM)'],
    ...(expenseRows.length > 0 ? expenseRows.map(r => Object.values(r)) : [['(none)', E]]),
    ['SUBTOTAL', totalOtherCosts],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 34 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
    { wch: 20 }, { wch: 22 }, { wch: 16 },
  ];

  upsertSheet(wb, `Audit ${paymentMonth}`, ws);
}

// ─── Combined workbook ────────────────────────────────────────────────────────
export function buildCombinedWorkbook(
  sessions: TrainingSession[],
  allRegisteredStudents: RegisteredStudent[],
  students: Student[],
  replacementStudents: ReplacementStudent[],
  coaches: RegisteredCoach[],
  sessionDate: string,
  paymentMap: Record<string, PaymentStatus>,
  paymentMonth: string,
  coachAttendanceMap: Record<string, CoachAttendanceStatus>,
  coachReplacements: CoachReplacement[],
  coachPaymentMap: Record<string, PaymentStatus>,
  baseWb?: XLSX.WorkBook,
  expenses: MonthlyExpense[] = [],
): XLSX.WorkBook {
  const wb = baseWb ?? XLSX.utils.book_new();
  const classCounts = computeClassCounts(paymentMonth);
  buildAttendanceSheets(wb, sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate);
  buildCoachAttendanceSheet(wb, coaches, sessions, coachAttendanceMap, coachReplacements, sessionDate);
  buildPaymentSheet(wb, allRegisteredStudents, sessions, paymentMap, paymentMonth);
  buildCoachPaymentSheet(wb, coaches, sessions, coachPaymentMap, classCounts, paymentMonth);
  buildFinancialAuditSheet(wb, allRegisteredStudents, sessions, coaches, paymentMap, coachPaymentMap, classCounts, expenses, paymentMonth);
  buildOverviewSheet(wb, sessions, allRegisteredStudents, coaches, paymentMap, coachPaymentMap, expenses, classCounts, sessionDate, paymentMonth);
  return wb;
}
