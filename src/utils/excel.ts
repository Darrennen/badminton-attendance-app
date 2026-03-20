import * as XLSX from 'xlsx';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus } from '../types';

export type ReplacementStudent = Student & { sessionId: string; coachId: string };

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

// ─── Attendance sheets ────────────────────────────────────────────────────────
// One pivot sheet per session: rows = students, columns = Name|StudentID|Group|date1|date2|…
// Plus a flat Replacements sheet.
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

    const ws = XLSX.utils.json_to_sheet(rows);
    styleSheet(ws, rows, 3);
    wb.Sheets[sheetName] = ws;
    if (!wb.SheetNames.includes(sheetName)) wb.SheetNames.push(sheetName);
  });

  // Replacements sheet
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
      const ws = XLSX.utils.json_to_sheet(replRows);
      styleSheet(ws, replRows, 0);
      wb.Sheets['Replacements'] = ws;
      if (!wb.SheetNames.includes('Replacements')) wb.SheetNames.push('Replacements');
    }
  }
}

// ─── Payment sheet ────────────────────────────────────────────────────────────
// Single pivot sheet "Payments": rows = students, columns = Name|StudentID|Group|Sessions|month1|month2|…
function buildPaymentSheet(
  wb: XLSX.WorkBook,
  allRegisteredStudents: RegisteredStudent[],
  sessions: TrainingSession[],
  paymentMap: Record<string, PaymentStatus>,
  paymentMonth: string,
) {
  const sheetName = 'Payments';
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

  const ws = XLSX.utils.json_to_sheet(rows);
  styleSheet(ws, rows, 4);
  wb.Sheets[sheetName] = ws;
  if (!wb.SheetNames.includes(sheetName)) wb.SheetNames.push(sheetName);
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
  baseWb?: XLSX.WorkBook,
): XLSX.WorkBook {
  const wb = baseWb ?? XLSX.utils.book_new();
  buildAttendanceSheets(wb, sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate);
  buildPaymentSheet(wb, allRegisteredStudents, sessions, paymentMap, paymentMonth);
  return wb;
}
