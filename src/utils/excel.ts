import * as XLSX from 'xlsx';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus, CoachAttendanceStatus, MonthlyExpense } from '../types';

export type ReplacementStudent = Student & { sessionId: string; coachId: string };
export type CoachReplacement = { coachId: string; replacedById: string; sessionId: string };

// Auto-size columns + optionally freeze header + first N columns
function styleSheet(ws: XLSX.WorkSheet, rows: Record<string, string>[], fixedCols: number) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map((key, i) => {
    const maxLen = Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length));
    return { wch: (i < fixedCols ? Math.max(maxLen, 18) : Math.max(maxLen, 10)) + 2 };
  });
  if (fixedCols > 0) ws['!freeze'] = { xSplit: fixedCols, ySplit: 1 };
}

function upsertSheet(wb: XLSX.WorkBook, sheetName: string, ws: XLSX.WorkSheet) {
  wb.Sheets[sheetName] = ws;
  if (!wb.SheetNames.includes(sheetName)) wb.SheetNames.push(sheetName);
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
    const sessStudents = allRegisteredStudents.filter(s => s.sessionIds.includes(sess.id));
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
      sessStudents.filter(s => !updatedIds.has(s.studentId)).forEach(s =>
        rows.push({ Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', [sessionDate]: statusLabel(s.id) })
      );
    } else {
      rows = sessStudents.map(s => ({
        Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', [sessionDate]: statusLabel(s.id),
      }));
    }

    upsertSheet(wb, sheetName, XLSX.utils.json_to_sheet(rows));
    styleSheet(wb.Sheets[sheetName], rows, 3);
  });

  // Student replacements — flat sheet
  if (replacementStudents.length > 0 || wb.SheetNames.includes('Replacements')) {
    const todayRows = replacementStudents.map(r => {
      const sess = sessions.find(x => x.id === r.sessionId);
      const coach = coaches.find(x => x.id === r.coachId);
      const st = r.status === 'none' ? 'Unmarked' : r.status.charAt(0).toUpperCase() + r.status.slice(1);
      return {
        Date: sessionDate, Name: r.name, 'Student ID': r.studentId, Group: r.group ?? '',
        Session: sess ? `${sess.name} (${sess.day})` : 'Unspecified',
        Coach: coach?.name ?? '', Status: st,
      };
    });
    let replRows: Record<string, string>[];
    if (wb.SheetNames.includes('Replacements')) {
      const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Replacements'], { defval: '' });
      replRows = [...existing.filter(r => r['Date'] !== sessionDate), ...todayRows];
    } else {
      replRows = todayRows;
    }
    if (replRows.length > 0) {
      upsertSheet(wb, 'Replacements', XLSX.utils.json_to_sheet(replRows));
      styleSheet(wb.Sheets['Replacements'], replRows, 0);
    }
  }
}

// ─── Coach attendance sheet ───────────────────────────────────────────────────
// One pivot sheet "Coach Attendance": rows = coaches, columns = Name|Sessions|date1|date2|…
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

  const sessionNames = (c: RegisteredCoach) =>
    c.sessionIds.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

  const replNote = (id: string) => {
    const repl = coachReplacements.find(r => r.coachId === id);
    if (!repl) return '';
    const sub = coaches.find(c => c.id === repl.replacedById);
    return sub ? `→ ${sub.name}` : '';
  };

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
    coaches.filter(c => !updatedIds.has(c.id)).forEach(c => {
      const note = replNote(c.id);
      rows.push({ Name: c.name, Sessions: sessionNames(c), [sessionDate]: statusLabel(c.id) + (note ? ` (${note})` : '') });
    });
  } else {
    rows = coaches.map(c => {
      const note = replNote(c.id);
      return { Name: c.name, Sessions: sessionNames(c), [sessionDate]: statusLabel(c.id) + (note ? ` (${note})` : '') };
    });
  }

  upsertSheet(wb, sheetName, XLSX.utils.json_to_sheet(rows));
  styleSheet(wb.Sheets[sheetName], rows, 2);
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
  const statusLabel = (id: string) => paymentMap[id] === 'paid' ? 'Paid' : 'Unpaid';
  const sessionNames = (s: RegisteredStudent) =>
    s.sessionIds.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

  let rows: Record<string, string>[];
  if (wb.SheetNames.includes(sheetName)) {
    const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
    const updatedIds = new Set<string>();
    rows = existing.map(row => {
      const rs = allRegisteredStudents.find(s => s.studentId === row['Student ID']);
      if (rs) { updatedIds.add(rs.studentId); return { ...row, [paymentMonth]: statusLabel(rs.id) }; }
      return row;
    });
    allRegisteredStudents.filter(s => !updatedIds.has(s.studentId)).forEach(s =>
      rows.push({ Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Sessions: sessionNames(s), [paymentMonth]: statusLabel(s.id) })
    );
  } else {
    rows = allRegisteredStudents.map(s => ({
      Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Sessions: sessionNames(s), [paymentMonth]: statusLabel(s.id),
    }));
  }

  upsertSheet(wb, sheetName, XLSX.utils.json_to_sheet(rows));
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
  const sessionNames = (c: RegisteredCoach) =>
    c.sessionIds.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

  let rows: Record<string, string>[];
  const makeRow = (c: RegisteredCoach) => {
    const classes = classCounts[c.id] ?? 0;
    const rate = c.ratePerClass ?? '';
    const total = c.ratePerClass != null ? String(c.ratePerClass * classes) : '';
    return {
      Name: c.name,
      Sessions: sessionNames(c),
      'Rate (RM/class)': rate !== '' ? String(rate) : '',
      'Classes Attended': String(classes),
      'Total (RM)': total,
      [paymentMonth]: statusLabel(c.id),
    };
  };

  if (wb.SheetNames.includes(sheetName)) {
    const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
    const updatedIds = new Set<string>();
    rows = existing.map(row => {
      const c = coaches.find(x => x.name === row['Name']);
      if (c) {
        updatedIds.add(c.id);
        return { ...makeRow(c), ...Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'Name' && k !== 'Sessions' && k !== 'Rate (RM/class)' && k !== 'Classes Attended' && k !== 'Total (RM)')), ...{ [paymentMonth]: statusLabel(c.id) } };
      }
      return row;
    });
    coaches.filter(c => !updatedIds.has(c.id)).forEach(c => rows.push(makeRow(c)));
  } else {
    rows = coaches.map(makeRow);
  }

  upsertSheet(wb, sheetName, XLSX.utils.json_to_sheet(rows));
  styleSheet(wb.Sheets[sheetName], rows, 5);
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
  const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const sessNames = (ids: string[]) =>
    ids.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

  const isOnBreak = (s: RegisteredStudent) =>
    s.breakPeriods?.some(bp => bp.from <= `${paymentMonth}-31` && bp.to >= `${paymentMonth}-01`) ?? false;

  // ── Revenue ──
  let totalRevenue = 0;
  const studentRows = allRegisteredStudents.map(s => {
    const onBreak = isOnBreak(s);
    const paid = paymentMap[s.id] === 'paid';
    const fee = s.monthlyFee ?? 0;
    const collected = !onBreak && paid ? fee : 0;
    totalRevenue += collected;
    const status = onBreak ? 'On Break (Exempt)' : paid ? 'Paid' : 'Unpaid';
    return [s.name, s.studentId, s.group ?? '', sessNames(s.sessionIds), fee || '', status, collected || ''];
  });
  const unpaidStudents = allRegisteredStudents.filter(s => !isOnBreak(s) && paymentMap[s.id] !== 'paid').length;
  const potentialRevenue = allRegisteredStudents
    .filter(s => !isOnBreak(s))
    .reduce((sum, s) => sum + (s.monthlyFee ?? 0), 0);

  // ── Coach costs ──
  let totalCoachCosts = 0;
  const coachRows = coaches.map(c => {
    const classes = classCounts[c.id] ?? 0;
    const rate = c.ratePerClass;
    const total = rate != null ? rate * classes : null;
    if (total != null) totalCoachCosts += total;
    const payStatus = coachPaymentMap[c.id] === 'paid' ? 'Paid' : 'Unpaid';
    return [c.name, sessNames(c.sessionIds), rate ?? 'No rate set', classes, total ?? 'N/A', payStatus];
  });

  // ── Other expenses ──
  const totalOtherCosts = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseRows = expenses.map(e => [e.label, e.amount]);

  const totalCosts = totalCoachCosts + totalOtherCosts;
  const netProfit = totalRevenue - totalCosts;
  const outstanding = potentialRevenue - totalRevenue;

  // ── Build array-of-arrays ──
  const E = ''; // empty cell shorthand
  const aoa: (string | number)[][] = [
    [`MONTHLY FINANCIAL REPORT — ${monthLabel}`],
    [`Exported: ${exportDate}`],
    [E],

    // ── Revenue ──────────────────────────────────────
    ['REVENUE'],
    ['Student Name', 'Student ID', 'Group', 'Sessions', 'Monthly Fee (RM)', 'Payment Status', 'Collected (RM)'],
    ...studentRows,
    [E, E, E, E, E, 'Total Collected', totalRevenue],
    [E, E, E, E, E, 'Still Outstanding', outstanding],
    [E, E, E, E, E, 'Potential (all paid)', potentialRevenue],
    [E],

    // ── Coach costs ───────────────────────────────────
    ['COACH COSTS'],
    ['Coach Name', 'Sessions Handled', 'Rate / Class (RM)', 'Classes Attended', 'Total Cost (RM)', 'Payment Status'],
    ...coachRows,
    [E, E, E, E, 'Total Coach Costs', totalCoachCosts],
    [E],

    // ── Other expenses ────────────────────────────────
    ['OTHER EXPENSES'],
    ['Description', 'Amount (RM)'],
    ...(expenseRows.length > 0 ? expenseRows : [['(none)', E]]),
    ['Total Other Expenses', totalOtherCosts],
    [E],

    // ── Net summary ───────────────────────────────────
    ['NET SUMMARY'],
    ['Total Revenue Collected (RM)', totalRevenue],
    ['Total Coach Costs (RM)', totalCoachCosts],
    ['Total Other Expenses (RM)', totalOtherCosts],
    ['Total Costs (RM)', totalCosts],
    ['─────────────────────────────', E],
    ['NET PROFIT / LOSS (RM)', netProfit],
    [E],
    ['Outstanding Revenue (RM)', outstanding],
    ['Potential Revenue if All Paid (RM)', potentialRevenue],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = [
    { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
    { wch: 20 }, { wch: 22 }, { wch: 18 },
  ];

  // Name by month so past audits are preserved as separate tabs
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
  return wb;
}
