import * as XLSX from 'xlsx';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus, CoachAttendanceStatus } from '../types';

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

// ─── Coach payment sheet ──────────────────────────────────────────────────────
function buildCoachPaymentSheet(
  wb: XLSX.WorkBook,
  coaches: RegisteredCoach[],
  sessions: TrainingSession[],
  coachPaymentMap: Record<string, PaymentStatus>,
  paymentMonth: string,
) {
  const sheetName = 'Coach Payments';
  const statusLabel = (id: string) => coachPaymentMap[id] === 'paid' ? 'Paid' : 'Unpaid';
  const sessionNames = (c: RegisteredCoach) =>
    c.sessionIds.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

  let rows: Record<string, string>[];
  if (wb.SheetNames.includes(sheetName)) {
    const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[sheetName], { defval: '' });
    const updatedIds = new Set<string>();
    rows = existing.map(row => {
      const c = coaches.find(x => x.name === row['Name']);
      if (c) { updatedIds.add(c.id); return { ...row, [paymentMonth]: statusLabel(c.id) }; }
      return row;
    });
    coaches.filter(c => !updatedIds.has(c.id)).forEach(c =>
      rows.push({ Name: c.name, Sessions: sessionNames(c), [paymentMonth]: statusLabel(c.id) })
    );
  } else {
    rows = coaches.map(c => ({
      Name: c.name, Sessions: sessionNames(c), [paymentMonth]: statusLabel(c.id),
    }));
  }

  upsertSheet(wb, sheetName, XLSX.utils.json_to_sheet(rows));
  styleSheet(wb.Sheets[sheetName], rows, 2);
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
): XLSX.WorkBook {
  const wb = baseWb ?? XLSX.utils.book_new();
  buildAttendanceSheets(wb, sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate);
  buildCoachAttendanceSheet(wb, coaches, sessions, coachAttendanceMap, coachReplacements, sessionDate);
  buildPaymentSheet(wb, allRegisteredStudents, sessions, paymentMap, paymentMonth);
  buildCoachPaymentSheet(wb, coaches, sessions, coachPaymentMap, paymentMonth);
  return wb;
}
