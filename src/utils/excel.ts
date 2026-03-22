import * as XLSX from 'xlsx-js-style';
import { Student, RegisteredStudent, RegisteredCoach, TrainingSession, PaymentStatus, CoachAttendanceStatus, MonthlyExpense } from '../types';

export type ReplacementStudent = Student & { sessionId: string; coachId: string };
export type CoachReplacement = { coachId: string; replacedById: string; sessionId: string };

// ─── Colour Palette ───────────────────────────────────────────────────────────
const C = {
  // Section headers
  navy:         '1F3864',   // Main title / master header
  blue:         '2E75B6',   // Sub-section headers
  green:        '1E5631',   // Revenue section
  purple:       '6B2A8E',   // Coach costs section
  orange:       'C55A11',   // Expenses section
  teal:         '1A6B72',   // Overview sections
  charcoal:     '2D2D2D',   // Dividers / emphasis

  // Status colours (data cells)
  paidBg:       'E2EFDA',   fgPaid:   '1E5631',   // Paid / Present → green
  unpaidBg:     'FCE4D6',   fgUnpaid: 'C00000',   // Unpaid / Absent → red
  breakBg:      'EDEDED',   fgBreak:  '595959',   // On Break / Leave → grey
  unmarkedBg:   'FFEB9C',   fgUnmark: '9C6500',   // Unmarked → amber

  // Profit / Loss
  profitBg:     '375623',   // Big profit row → dark green
  lossBg:       'C00000',   // Big loss row → dark red

  // Summary / Totals
  subtotalBg:   'BDD7EE',   fgSubtotal: '1F3864',  // Row subtotals → light blue
  grandBg:      '1F3864',   fgGrand:    'FFFFFF',  // Grand total row → navy
  summaryBg:    'D9E2F3',   fgSummary:  '1F3864',  // Summary KPI row

  // Rows / UI
  altRow:       'F2F2F2',   // Odd data rows
  white:        'FFFFFF',
  hdrText:      'FFFFFF',   // Header text (white on dark)
  bodyText:     '1A1A1A',   // Normal data text
  border:       'BFBFBF',   // Thin border
  borderMed:    '595959',   // Medium border
};

// ─── Style builders ───────────────────────────────────────────────────────────
type BS = { style: string; color: { rgb: string } };
type XStyle = {
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number; name?: string; italic?: boolean };
  fill?: { fgColor: { rgb: string }; patternType: string };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: { top?: BS; bottom?: BS; left?: BS; right?: BS };
  numFmt?: string;
};

const thin   = (rgb = C.border):    BS => ({ style: 'thin',   color: { rgb } });
const medium = (rgb = C.borderMed): BS => ({ style: 'medium', color: { rgb } });
const allBorders  = (t: BS): XStyle['border'] => ({ top: t, bottom: t, left: t, right: t });
const outerMed = (): XStyle['border'] => ({ top: medium(), bottom: medium(), left: medium(), right: medium() });

function cs(
  bg: string,
  fg: string,
  opts: {
    bold?: boolean; sz?: number; italic?: boolean;
    h?: 'left' | 'center' | 'right';
    wrap?: boolean; numFmt?: string;
    border?: 'thin' | 'medium' | 'none';
  } = {}
): XStyle {
  const bdr = opts.border === 'none' ? {} : opts.border === 'medium' ? allBorders(medium()) : allBorders(thin());
  return {
    font: { bold: opts.bold ?? false, color: { rgb: fg }, sz: opts.sz ?? 10, name: 'Calibri', italic: opts.italic ?? false },
    fill: { fgColor: { rgb: bg }, patternType: 'solid' },
    alignment: { horizontal: opts.h ?? 'left', vertical: 'center', wrapText: opts.wrap ?? false },
    border: bdr,
    ...(opts.numFmt ? { numFmt: opts.numFmt } : {}),
  };
}

// Pre-built styles
const S = {
  // Section-specific headers (column label row)
  hdrNavy:    cs(C.navy,     C.hdrText,  { bold: true, sz: 10, border: 'medium' }),
  hdrBlue:    cs(C.blue,     C.hdrText,  { bold: true, sz: 10, border: 'medium' }),
  hdrGreen:   cs(C.green,    C.hdrText,  { bold: true, sz: 10, border: 'medium' }),
  hdrPurple:  cs(C.purple,   C.hdrText,  { bold: true, sz: 10, border: 'medium' }),
  hdrOrange:  cs(C.orange,   C.hdrText,  { bold: true, sz: 10, border: 'medium' }),
  hdrTeal:    cs(C.teal,     C.hdrText,  { bold: true, sz: 10, border: 'medium' }),

  // Title rows
  title:      cs(C.navy,     C.hdrText,  { bold: true, sz: 14, h: 'center', border: 'medium' }),
  sectionNav: cs(C.navy,     C.hdrText,  { bold: true, sz: 11 }),
  sectionBlue:cs(C.blue,     C.hdrText,  { bold: true, sz: 11 }),
  sectionGrn: cs(C.green,    C.hdrText,  { bold: true, sz: 11 }),
  sectionPur: cs(C.purple,   C.hdrText,  { bold: true, sz: 11 }),
  sectionOrg: cs(C.orange,   C.hdrText,  { bold: true, sz: 11 }),
  sectionTeal:cs(C.teal,     C.hdrText,  { bold: true, sz: 11 }),

  // Data rows
  dataEven:   cs(C.white,    C.bodyText),
  dataOdd:    cs(C.altRow,   C.bodyText),
  dataNum:    cs(C.white,    C.bodyText, { h: 'right', numFmt: '#,##0.00' }),
  dataNumOdd: cs(C.altRow,   C.bodyText, { h: 'right', numFmt: '#,##0.00' }),

  // Status cells
  paid:       cs(C.paidBg,   C.fgPaid,   { bold: true, h: 'center' }),
  unpaid:     cs(C.unpaidBg, C.fgUnpaid, { bold: true, h: 'center' }),
  onBreak:    cs(C.breakBg,  C.fgBreak,  { italic: true, h: 'center' }),
  unmarked:   cs(C.unmarkedBg, C.fgUnmark, { bold: true, h: 'center' }),
  present:    cs(C.paidBg,   C.fgPaid,   { bold: true, h: 'center' }),
  absent:     cs(C.unpaidBg, C.fgUnpaid, { bold: true, h: 'center' }),
  onLeave:    cs(C.breakBg,  C.fgBreak,  { italic: true, h: 'center' }),

  // Totals
  subtotal:   cs(C.subtotalBg, C.fgSubtotal, { bold: true }),
  subtotalNum:cs(C.subtotalBg, C.fgSubtotal, { bold: true, h: 'right', numFmt: '#,##0.00' }),
  grandTotal: cs(C.grandBg,  C.fgGrand,  { bold: true, sz: 11, border: 'medium' }),
  grandNum:   cs(C.grandBg,  C.fgGrand,  { bold: true, sz: 11, h: 'right', numFmt: '#,##0.00', border: 'medium' }),

  // KPI / Summary
  kpiLabel:   cs(C.summaryBg, C.fgSummary, { bold: true }),
  kpiValue:   cs(C.summaryBg, C.fgSummary, { bold: true, h: 'right' }),
  kpiNum:     cs(C.summaryBg, C.fgSummary, { bold: true, h: 'right', numFmt: '#,##0.00' }),

  // Profit / loss hero
  profit:     cs(C.profitBg, C.hdrText,  { bold: true, sz: 13, border: 'medium' }),
  profitNum:  cs(C.profitBg, C.hdrText,  { bold: true, sz: 13, h: 'right', numFmt: '#,##0.00', border: 'medium' }),
  loss:       cs(C.lossBg,   C.hdrText,  { bold: true, sz: 13, border: 'medium' }),
  lossNum:    cs(C.lossBg,   C.hdrText,  { bold: true, sz: 13, h: 'right', numFmt: '#,##0.00', border: 'medium' }),

  // Misc
  subtitle:   cs(C.white,    C.charcoal, { italic: true, sz: 9, border: 'none' }),
  empty:      cs(C.white,    C.white,    { border: 'none' }),
  divider:    cs(C.charcoal, C.hdrText,  { bold: true, h: 'center' }),
};

// ─── Cell utilities ───────────────────────────────────────────────────────────
function ec(r: number, c: number) { return XLSX.utils.encode_cell({ r, c }); }

function setStyle(ws: XLSX.WorkSheet, r: number, c: number, s: XStyle) {
  const ref = ec(r, c);
  if (ws[ref]) ws[ref].s = s;
}

function styleRow(ws: XLSX.WorkSheet, row: number, numCols: number, s: XStyle) {
  for (let c = 0; c < numCols; c++) setStyle(ws, row, c, s);
}

function merge(ws: XLSX.WorkSheet, r1: number, c1: number, r2: number, c2: number) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function statusStyle(val: string): XStyle {
  const v = (val ?? '').toLowerCase();
  if (v === 'paid'    || v === 'present') return S.paid;
  if (v === 'unpaid'  || v === 'absent')  return S.unpaid;
  if (v === 'on break'|| v === 'on leave'|| v.startsWith('on break') || v.startsWith('on leave')) return S.onBreak;
  if (v === 'unmarked') return S.unmarked;
  if (v.includes('exempt')) return S.onBreak;
  return S.dataEven;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
function upsertSheet(wb: XLSX.WorkBook, name: string, ws: XLSX.WorkSheet) {
  wb.Sheets[name] = ws;
  if (!wb.SheetNames.includes(name)) wb.SheetNames.push(name);
}

function pinSheetFirst(wb: XLSX.WorkBook, name: string) {
  wb.SheetNames = [name, ...wb.SheetNames.filter(n => n !== name)];
}

const sessLabels = (ids: string[], sessions: TrainingSession[]) =>
  ids.map(sid => sessions.find(x => x.id === sid)?.name ?? '').filter(Boolean).join(', ');

const isOnBreakInMonth = (s: RegisteredStudent, month: string) =>
  s.breakPeriods?.some(bp => bp.from <= `${month}-31` && bp.to >= `${month}-01`) ?? false;

function computeClassCounts(paymentMonth: string, branchId = 'main'): Record<string, number> {
  const counts: Record<string, number> = {};
  if (typeof localStorage === 'undefined') return counts;
  const prefix = `branch_${branchId}_coach_attendance_${paymentMonth}-`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const map: Record<string, string> = JSON.parse(localStorage.getItem(key) ?? '{}');
      for (const [coachId, status] of Object.entries(map)) {
        if (status === 'present') counts[coachId] = (counts[coachId] ?? 0) + 1;
      }
    } catch { /* ignore */ }
  }
  return counts;
}

function setCols(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ─── Overview Sheet ────────────────────────────────────────────────────────────
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
  const exportedAt = new Date().toLocaleString('en-GB');

  const activeStudents = allStudents.filter(s => !isOnBreakInMonth(s, paymentMonth));
  const paidStudents   = activeStudents.filter(s => paymentMap[s.id] === 'paid');
  const paidCoaches    = coaches.filter(c => coachPaymentMap[c.id] === 'paid');
  const totalRevenue   = paidStudents.reduce((n, s) => n + (s.monthlyFee ?? 0), 0);
  const totalCoachCost = coaches.reduce((n, c) => n + (c.ratePerClass != null ? c.ratePerClass * (classCounts[c.id] ?? 0) : 0), 0);
  const totalOther     = expenses.reduce((n, e) => n + e.amount, 0);
  const netProfit      = totalRevenue - totalCoachCost - totalOther;

  const E = '';
  // Track row indices for styling
  let r = 0;
  const aoa: (string | number)[][] = [];
  const rowMeta: string[] = []; // for styling pass

  const push = (row: (string | number)[], meta: string) => { aoa.push(row); rowMeta.push(meta); };

  push([`BADMINTON ACADEMY — MANAGEMENT OVERVIEW`, E, E], 'title');
  push([`Exported: ${exportedAt}`, E, `Attendance: ${sessionDate}  |  Payment Month: ${monthLabel}`], 'subtitle');
  push([E, E, E], 'blank');

  // KPI strip
  push(['FINANCIAL SNAPSHOT', E, E], 'section-teal');
  push(['Net Profit / Loss (RM)', netProfit >= 0 ? '▲ PROFIT' : '▼ LOSS', netProfit], netProfit >= 0 ? 'profit' : 'loss');
  push(['Total Revenue Collected (RM)', E, totalRevenue], 'kpi');
  push(['Total Coach Costs (RM)', E, totalCoachCost], 'kpi');
  push(['Total Other Expenses (RM)', E, totalOther], 'kpi');
  push([E, E, E], 'blank');

  // Student payment summary
  push(['STUDENT PAYMENTS', E, E], 'section-blue');
  push(['Students Paid', E, `${paidStudents.length} / ${activeStudents.length}`], 'kpi');
  push(['Students On Break (Exempt)', E, allStudents.length - activeStudents.length], 'kpi');
  push(['Total Potential Revenue (RM)', E, activeStudents.reduce((n, s) => n + (s.monthlyFee ?? 0), 0)], 'kpi');
  push(['Outstanding (RM)', E, activeStudents.reduce((n, s) => n + (s.monthlyFee ?? 0), 0) - totalRevenue], 'kpi');
  push([E, E, E], 'blank');

  // Coach summary
  push(['COACH PAYMENTS', E, E], 'section-purple');
  push(['Coaches Paid', E, `${paidCoaches.length} / ${coaches.length}`], 'kpi');
  push(['Total Coach Classes This Month', E, Object.values(classCounts).reduce((a, b) => a + b, 0)], 'kpi');
  push([E, E, E], 'blank');

  // Workbook contents
  push(['SHEETS IN THIS WORKBOOK', 'Tab Name', 'Description'], 'header-teal');
  const sheetDefs: [string, string, string][] = [
    ['Overview', 'Overview', 'This summary dashboard — start here'],
    ...sessions.map((s): [string, string, string] => [`Attendance: ${s.name}`, s.name.slice(0, 31), 'Student attendance per date, colour coded by status']),
    ['Replacements', 'Replacements', 'All replacement/guest students across all dates'],
    ['Coach Attendance', 'Coach Attendance', 'Coach presence per date with replacement notes'],
    ['Student Payments', 'Student Payments', 'Monthly payment status per student'],
    ['Coach Payments', 'Coach Payments', 'Coach rate × classes = total cost per month'],
    ['Financial Audit', `Audit ${paymentMonth}`, 'Full revenue, cost & net profit audit for the month'],
  ];
  sheetDefs.forEach((row, i) => {
    push(row, i % 2 === 0 ? 'data-even' : 'data-odd');
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setCols(ws, [38, 22, 40]);
  ws['!freeze'] = { xSplit: 0, ySplit: 2 };

  // Apply styles
  aoa.forEach((_, row) => {
    const meta = rowMeta[row];
    const nc = 3;
    if (meta === 'title') {
      merge(ws, row, 0, row, nc - 1);
      styleRow(ws, row, nc, S.title);
      if (ws[ec(row, 0)]) ws[ec(row, 0)].s = { ...S.title, alignment: { horizontal: 'center', vertical: 'center' } };
    } else if (meta === 'subtitle') {
      styleRow(ws, row, nc, S.subtitle);
    } else if (meta === 'blank') {
      styleRow(ws, row, nc, S.empty);
    } else if (meta === 'section-teal') {
      merge(ws, row, 0, row, nc - 1);
      styleRow(ws, row, nc, S.sectionTeal);
    } else if (meta === 'section-blue') {
      merge(ws, row, 0, row, nc - 1);
      styleRow(ws, row, nc, S.sectionBlue);
    } else if (meta === 'section-purple') {
      merge(ws, row, 0, row, nc - 1);
      styleRow(ws, row, nc, S.sectionPur);
    } else if (meta === 'header-teal') {
      styleRow(ws, row, nc, S.hdrTeal);
    } else if (meta === 'kpi') {
      setStyle(ws, row, 0, S.kpiLabel);
      setStyle(ws, row, 1, S.kpiLabel);
      setStyle(ws, row, 2, typeof aoa[row][2] === 'number' ? S.kpiNum : S.kpiValue);
    } else if (meta === 'profit') {
      setStyle(ws, row, 0, S.profit);
      setStyle(ws, row, 1, S.profit);
      setStyle(ws, row, 2, S.profitNum);
    } else if (meta === 'loss') {
      setStyle(ws, row, 0, S.loss);
      setStyle(ws, row, 1, S.loss);
      setStyle(ws, row, 2, S.lossNum);
    } else if (meta === 'data-even') {
      styleRow(ws, row, nc, S.dataEven);
    } else if (meta === 'data-odd') {
      styleRow(ws, row, nc, S.dataOdd);
    }
  });

  upsertSheet(wb, 'Overview', ws);
  pinSheetFirst(wb, 'Overview');
}

// ─── Student Attendance Sheets ────────────────────────────────────────────────
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
        const coachName = coaches.find(c => c.id === (s.sessionCoachMap ?? {})[sess.id])?.name ?? '';
        rows.push({ Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Coach: coachName, [sessionDate]: statusLabel(s.id) });
      });
    } else {
      rows = sessStudents.map(s => {
        const coachName = coaches.find(c => c.id === (s.sessionCoachMap ?? {})[sess.id])?.name ?? '';
        return { Name: s.name, 'Student ID': s.studentId, Group: s.group ?? '', Coach: coachName, [sessionDate]: statusLabel(s.id) };
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    _styleAttendanceSheet(ws, rows, 4);
    ws['!autofilter'] = { ref: ws['!ref']! };
    upsertSheet(wb, sheetName, ws);
  });

  // Replacements sheet
  if (replacementStudents.length > 0 || wb.SheetNames.includes('Replacements')) {
    const todayRows = replacementStudents.map(r => {
      const sess = sessions.find(x => x.id === r.sessionId);
      const coach = coaches.find(x => x.id === r.coachId);
      const st = r.status === 'none' ? 'Unmarked' : r.status.charAt(0).toUpperCase() + r.status.slice(1);
      return { Date: sessionDate, Name: r.name, 'Student ID': r.studentId, Group: r.group ?? '', Session: sess ? `${sess.name} (${sess.day})` : 'Unspecified', Coach: coach?.name ?? '', Status: st };
    });

    let replRows: Record<string, string>[];
    if (wb.SheetNames.includes('Replacements')) {
      const existing = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Replacements'], { defval: '' });
      replRows = [...existing.filter(r => r['Date'] !== sessionDate), ...todayRows]
        .sort((a, b) => b['Date'].localeCompare(a['Date']));
    } else {
      replRows = todayRows;
    }

    if (replRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(replRows);
      _styleAttendanceSheet(ws, replRows, 2);
      ws['!autofilter'] = { ref: ws['!ref']! };
      upsertSheet(wb, 'Replacements', ws);
    }
  }
}

function _styleAttendanceSheet(ws: XLSX.WorkSheet, rows: Record<string, string>[], fixedCols: number) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const numCols = range.e.c + 1;
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Auto column widths
  ws['!cols'] = keys.map((key, i) => {
    const maxLen = Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length));
    return { wch: (i < fixedCols ? Math.max(maxLen, 18) : Math.max(maxLen, 10)) + 2 };
  });
  if (fixedCols > 0) ws['!freeze'] = { xSplit: fixedCols, ySplit: 1 };

  // Header row (row 0)
  styleRow(ws, 0, numCols, S.hdrNavy);

  // Data rows
  for (let r = 1; r <= range.e.r; r++) {
    const isOdd = r % 2 === 1;
    for (let c = 0; c <= range.e.c; c++) {
      const ref = ec(r, c);
      const cell = ws[ref];
      if (!cell) continue;
      const val = String(cell.v ?? '');
      // Status columns (by value)
      const colKey = keys[c] ?? '';
      const isStatusCol = colKey === 'Status' || (!['Name', 'Student ID', 'Group', 'Coach', 'Session', 'Session Day', 'Sessions', 'Date'].includes(colKey) && c >= fixedCols);
      if (isStatusCol) {
        cell.s = statusStyle(val);
      } else {
        cell.s = isOdd ? S.dataOdd : S.dataEven;
      }
    }
  }
}

// ─── Coach Attendance Sheet ───────────────────────────────────────────────────
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
    return sub ? ` (→ ${sub.name})` : '';
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
        return { ...row, [sessionDate]: statusLabel(c.id) + replNote(c.id) };
      }
      return row;
    });
    sortedCoaches.filter(c => !updatedIds.has(c.id)).forEach(c =>
      rows.push({ Name: c.name, Sessions: sessLabels(c.sessionIds, sessions), 'Rate (RM/class)': c.ratePerClass != null ? String(c.ratePerClass) : '', [sessionDate]: statusLabel(c.id) + replNote(c.id) })
    );
  } else {
    rows = sortedCoaches.map(c => ({
      Name: c.name, Sessions: sessLabels(c.sessionIds, sessions), 'Rate (RM/class)': c.ratePerClass != null ? String(c.ratePerClass) : '', [sessionDate]: statusLabel(c.id) + replNote(c.id),
    }));
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  _styleAttendanceSheet(ws, rows, 3);
  ws['!autofilter'] = { ref: ws['!ref']! };
  upsertSheet(wb, sheetName, ws);
}

// ─── Student Payment Sheet ────────────────────────────────────────────────────
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
  // Style it
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const feeCol = keys.indexOf('Monthly Fee (RM)');
    ws['!cols'] = keys.map((k, i) => {
      const maxLen = Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length));
      return { wch: (i < 4 ? Math.max(maxLen, 18) : Math.max(maxLen, 12)) + 2 };
    });
    ws['!freeze'] = { xSplit: 4, ySplit: 1 };
    ws['!autofilter'] = { ref: ws['!ref']! };

    // Header
    styleRow(ws, 0, range.e.c + 1, S.hdrNavy);

    for (let r = 1; r <= range.e.r; r++) {
      const isOdd = r % 2 === 1;
      for (let c = 0; c <= range.e.c; c++) {
        const ref = ec(r, c);
        const cell = ws[ref];
        if (!cell) continue;
        const val = String(cell.v ?? '');
        const colKey = keys[c] ?? '';
        if (colKey === paymentMonth) {
          cell.s = statusStyle(val);
        } else if (c === feeCol) {
          cell.s = isOdd ? S.dataNumOdd : S.dataNum;
        } else {
          cell.s = isOdd ? S.dataOdd : S.dataEven;
        }
      }
    }
  }

  upsertSheet(wb, sheetName, ws);
}

// ─── Coach Payment Sheet ──────────────────────────────────────────────────────
function buildCoachPaymentSheet(
  wb: XLSX.WorkBook,
  coaches: RegisteredCoach[],
  sessions: TrainingSession[],
  coachPaymentMap: Record<string, PaymentStatus>,
  classCounts: Record<string, number>,
  paymentMonth: string,
) {
  const sheetName = 'Coach Payments';
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
      [`Total Cost (RM) (${paymentMonth})`]: total,
      [paymentMonth]: coachPaymentMap[c.id] === 'paid' ? 'Paid' : 'Unpaid',
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
        return { ...row, 'Rate (RM/class)': nr['Rate (RM/class)'], [`Classes (${paymentMonth})`]: nr[`Classes (${paymentMonth})`], [`Total Cost (RM) (${paymentMonth})`]: nr[`Total Cost (RM) (${paymentMonth})`], [paymentMonth]: nr[paymentMonth] };
      }
      return row;
    });
    sortedCoaches.filter(c => !updatedIds.has(c.id)).forEach(c => rows.push(makeRow(c)));
  } else {
    rows = sortedCoaches.map(makeRow);
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref']);
    const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const rateCol  = keys.indexOf('Rate (RM/class)');
    const classCol = keys.indexOf(`Classes (${paymentMonth})`);
    const totalCol = keys.indexOf(`Total Cost (RM) (${paymentMonth})`);
    ws['!cols'] = keys.map((k, i) => {
      const maxLen = Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length));
      return { wch: (i < 2 ? Math.max(maxLen, 18) : Math.max(maxLen, 14)) + 2 };
    });
    ws['!freeze'] = { xSplit: 2, ySplit: 1 };
    ws['!autofilter'] = { ref: ws['!ref']! };

    styleRow(ws, 0, range.e.c + 1, S.hdrPurple);

    for (let r = 1; r <= range.e.r; r++) {
      const isOdd = r % 2 === 1;
      for (let c = 0; c <= range.e.c; c++) {
        const ref = ec(r, c);
        const cell = ws[ref];
        if (!cell) continue;
        const val = String(cell.v ?? '');
        const colKey = keys[c] ?? '';
        if (colKey === paymentMonth) {
          cell.s = statusStyle(val);
        } else if (c === rateCol || c === classCol || c === totalCol) {
          cell.s = isOdd ? S.dataNumOdd : S.dataNum;
        } else {
          cell.s = isOdd ? S.dataOdd : S.dataEven;
        }
      }
    }
  }

  upsertSheet(wb, sheetName, ws);
}

// ─── Financial Audit Sheet ────────────────────────────────────────────────────
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
  const NC = 7; // number of columns

  // ── Compute data ──
  let totalRevenue = 0;
  const sortedStudents = [...allRegisteredStudents].sort((a, b) => a.name.localeCompare(b.name));
  const studentRows = sortedStudents.map(s => {
    const onBreak  = isOnBreakInMonth(s, paymentMonth);
    const paid     = paymentMap[s.id] === 'paid';
    const fee      = s.monthlyFee ?? 0;
    const collected = !onBreak && paid ? fee : 0;
    totalRevenue  += collected;
    return {
      name: s.name, studentId: s.studentId, group: s.group ?? '',
      sessions: sessLabels(s.sessionIds, sessions),
      fee: fee || '',
      status: onBreak ? 'On Break (Exempt)' : paid ? 'Paid' : 'Unpaid',
      collected: collected || '',
    };
  });
  const potentialRevenue = sortedStudents.filter(s => !isOnBreakInMonth(s, paymentMonth)).reduce((n, s) => n + (s.monthlyFee ?? 0), 0);
  const outstanding = potentialRevenue - totalRevenue;

  let totalCoachCosts = 0;
  const sortedCoaches = [...coaches].sort((a, b) => a.name.localeCompare(b.name));
  const coachRows = sortedCoaches.map(c => {
    const classes = classCounts[c.id] ?? 0;
    const rate    = c.ratePerClass;
    const total   = rate != null ? rate * classes : null;
    if (total != null) totalCoachCosts += total;
    return {
      name: c.name, sessions: sessLabels(c.sessionIds, sessions),
      rate: rate ?? '', classes, total: total ?? '',
      status: coachPaymentMap[c.id] === 'paid' ? 'Paid' : 'Unpaid',
    };
  });

  const totalOtherCosts = expenses.reduce((n, e) => n + e.amount, 0);
  const totalCosts  = totalCoachCosts + totalOtherCosts;
  const netProfit   = totalRevenue - totalCosts;

  // ── Build AOA and track row metadata ──
  const aoa: (string | number)[][] = [];
  type RowMeta = 'title' | 'subtitle' | 'blank' | 'divider'
    | 'net-label' | 'net-profit' | 'net-loss'
    | 'kpi-plain' | 'kpi-highlight'
    | 'section-green' | 'section-purple' | 'section-orange'
    | 'hdr-green' | 'hdr-purple' | 'hdr-orange'
    | 'data-even' | 'data-odd'
    | 'data-paid' | 'data-unpaid' | 'data-break'
    | 'subtotal';
  const meta: RowMeta[] = [];
  const statusRowIdx: number[] = []; // rows that have a status cell

  const push = (row: (string | number)[], m: RowMeta) => { aoa.push(row); meta.push(m); };
  const E = '';
  const blank = () => push([E, E, E, E, E, E, E], 'blank');
  const divider = () => push(['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', E, E, E, E, E, E], 'divider');

  // Title block
  push([`MONTHLY FINANCIAL AUDIT REPORT — ${monthLabel}`, E, E, E, E, E, E], 'title');
  push([`Prepared: ${exportDate}`, E, E, E, E, E, E], 'subtitle');
  blank();

  // Net Summary
  divider();
  push(['NET SUMMARY', E, E, E, E, E, E], 'section-green');
  push(['Total Revenue Collected (RM)', E, E, E, E, totalRevenue, E], 'kpi-plain');
  push(['Outstanding — Not Yet Paid (RM)', E, E, E, E, outstanding, E], 'kpi-highlight');
  push(['Potential Revenue if All Active Paid (RM)', E, E, E, E, potentialRevenue, E], 'kpi-plain');
  blank();
  push(['Total Coach Costs (RM)', E, E, E, E, totalCoachCosts, E], 'kpi-plain');
  push(['Total Other Expenses (RM)', E, E, E, E, totalOtherCosts, E], 'kpi-plain');
  push(['Total Costs (RM)', E, E, E, E, totalCosts, E], 'kpi-highlight');
  blank();
  push(['NET PROFIT / LOSS (RM)', E, E, E, E, netProfit, netProfit >= 0 ? '▲ PROFIT' : '▼ LOSS'], netProfit >= 0 ? 'net-profit' : 'net-loss');
  divider();
  blank();

  // ── REVENUE BREAKDOWN ──
  push(['SECTION 1 — REVENUE BREAKDOWN', E, E, E, E, E, E], 'section-green');
  push(['Student Name', 'Student ID', 'Group', 'Sessions', 'Monthly Fee (RM)', 'Status', 'Collected (RM)'], 'hdr-green');
  const revStart = aoa.length;
  studentRows.forEach((s, i) => {
    const m: RowMeta = s.status === 'Paid' ? 'data-paid' : s.status.startsWith('On Break') ? 'data-break' : 'data-unpaid';
    push([s.name, s.studentId, s.group, s.sessions, s.fee, s.status, s.collected], i % 2 === 0 ? 'data-even' : 'data-odd');
    statusRowIdx.push(aoa.length - 1);
    // override: colour the entire row based on status
    meta[aoa.length - 1] = m;
  });
  push([E, E, E, E, 'SUBTOTAL', E, totalRevenue], 'subtotal');
  blank();
  push([E, E, E, E, 'Potential Revenue', E, potentialRevenue], 'subtotal');
  push([E, E, E, E, 'Outstanding', E, outstanding], 'kpi-highlight');
  blank();

  // ── COACH COSTS ──
  push(['SECTION 2 — COACH COSTS BREAKDOWN', E, E, E, E, E, E], 'section-purple');
  push(['Coach Name', 'Sessions Handled', 'Rate / Class (RM)', 'Classes Attended', 'Total Cost (RM)', 'Payment Status', E], 'hdr-purple');
  coachRows.forEach((c, i) => {
    const m: RowMeta = c.status === 'Paid' ? 'data-paid' : 'data-unpaid';
    push([c.name, c.sessions, c.rate, c.classes, c.total, c.status, E], m);
    statusRowIdx.push(aoa.length - 1);
  });
  push([E, E, E, 'SUBTOTAL', totalCoachCosts, E, E], 'subtotal');
  blank();

  // ── OTHER EXPENSES ──
  push(['SECTION 3 — OTHER EXPENSES', E, E, E, E, E, E], 'section-orange');
  push(['Description', 'Amount (RM)', E, E, E, E, E], 'hdr-orange');
  if (expenses.length === 0) {
    push(['(No other expenses recorded)', E, E, E, E, E, E], 'data-even');
  } else {
    expenses.forEach((e, i) => push([e.label, e.amount, E, E, E, E, E], i % 2 === 0 ? 'data-even' : 'data-odd'));
  }
  push(['SUBTOTAL', totalOtherCosts, E, E, E, E, E], 'subtotal');
  blank();

  // ── GRAND TOTAL ──
  push(['TOTAL COSTS (Coach + Other)', E, E, E, E, totalCosts, E], 'net-profit');
  push(['NET PROFIT / LOSS', E, E, E, E, netProfit, netProfit >= 0 ? '▲ PROFIT' : '▼ LOSS'], netProfit >= 0 ? 'net-profit' : 'net-loss');

  // ── Create sheet & apply styles ──
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setCols(ws, [36, 15, 13, 32, 20, 22, 14]);
  ws['!freeze'] = { xSplit: 0, ySplit: 3 };

  const statusColsBySection: Record<string, number[]> = {
    revenue: [5],   // Status col in revenue table
    coach:   [5],   // Payment Status col in coach table
  };

  // We need to know which rows belong to which section for column-level status styling
  // Let's track them: revStart, coachStart, expStart
  let coachHdrRow = -1, expHdrRow = -1;
  meta.forEach((m, i) => {
    if (m === 'hdr-purple') coachHdrRow = i;
    if (m === 'hdr-orange') expHdrRow = i;
  });

  aoa.forEach((row, r) => {
    const m = meta[r];
    if (m === 'title') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.title);
    } else if (m === 'subtitle') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.subtitle);
    } else if (m === 'blank') {
      styleRow(ws, r, NC, S.empty);
    } else if (m === 'divider') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.divider);
    } else if (m === 'section-green') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.sectionGrn);
    } else if (m === 'section-purple') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.sectionPur);
    } else if (m === 'section-orange') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.sectionOrg);
    } else if (m === 'hdr-green') {
      styleRow(ws, r, NC, S.hdrGreen);
    } else if (m === 'hdr-purple') {
      styleRow(ws, r, NC, S.hdrPurple);
    } else if (m === 'hdr-orange') {
      styleRow(ws, r, NC, S.hdrOrange);
    } else if (m === 'subtotal') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.subtotalNum : S.subtotal;
      }
    } else if (m === 'net-profit') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.profitNum : S.profit;
      }
    } else if (m === 'net-loss') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.lossNum : S.loss;
      }
    } else if (m === 'kpi-plain') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.kpiNum : S.kpiLabel;
      }
    } else if (m === 'kpi-highlight') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number'
          ? cs(C.summaryBg, C.fgSummary, { bold: true, h: 'right', numFmt: '#,##0.00', border: 'medium' })
          : cs(C.summaryBg, C.fgSummary, { bold: true, border: 'medium' });
      }
    } else if (m === 'data-paid') {
      // Colour entire row light green
      styleRow(ws, r, NC, cs(C.paidBg, C.fgPaid));
      // Status cell bold
      const statusVal = String(aoa[r][5] ?? '');
      if (ws[ec(r, 5)]) ws[ec(r, 5)].s = S.paid;
      if (ws[ec(r, 4)]) ws[ec(r, 4)].s = cs(C.paidBg, C.fgPaid, { h: 'right', numFmt: '#,##0.00' });
      if (ws[ec(r, 6)]) ws[ec(r, 6)].s = cs(C.paidBg, C.fgPaid, { h: 'right', numFmt: '#,##0.00' });
      void statusVal;
    } else if (m === 'data-unpaid') {
      styleRow(ws, r, NC, cs(C.unpaidBg, C.fgUnpaid));
      if (ws[ec(r, 5)]) ws[ec(r, 5)].s = S.unpaid;
      // For coach rows (col 5 = status, col 4 = total)
      const isCoachRow = r > coachHdrRow && coachHdrRow >= 0 && (expHdrRow < 0 || r < expHdrRow);
      if (isCoachRow) {
        if (ws[ec(r, 4)]) ws[ec(r, 4)].s = cs(C.unpaidBg, C.fgUnpaid, { h: 'right', numFmt: '#,##0.00' });
      } else {
        if (ws[ec(r, 4)]) ws[ec(r, 4)].s = cs(C.unpaidBg, C.fgUnpaid, { h: 'right', numFmt: '#,##0.00' });
        if (ws[ec(r, 6)]) ws[ec(r, 6)].s = cs(C.unpaidBg, C.fgUnpaid, { h: 'right', numFmt: '#,##0.00' });
      }
    } else if (m === 'data-break') {
      styleRow(ws, r, NC, cs(C.breakBg, C.fgBreak, { italic: true }));
      if (ws[ec(r, 5)]) ws[ec(r, 5)].s = S.onBreak;
    } else if (m === 'data-even') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.dataNum : S.dataEven;
      }
    } else if (m === 'data-odd') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.dataNumOdd : S.dataOdd;
      }
    }
  });

  upsertSheet(wb, `Audit ${paymentMonth}`, ws);
}

// ─── Consolidated Multi-Branch Sheet ─────────────────────────────────────────
function buildConsolidatedSheet(
  wb: XLSX.WorkBook,
  branches: { id: string; name: string; location?: string }[],
  paymentMonth: string,
) {
  if (branches.length < 2) return; // only show when multiple branches
  if (typeof localStorage === 'undefined') return;

  const monthLabel = new Date(`${paymentMonth}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
  const E = '';
  const NC = 7;

  let grandRevenue = 0, grandCoachCost = 0, grandOther = 0;

  type BranchRow = (string | number)[];
  const branchRows: BranchRow[] = [];

  branches.forEach(branch => {
    const bPrefix = `branch_${branch.id}_`;
    const loadB = <T,>(key: string, fb: T): T => {
      try { const v = localStorage.getItem(bPrefix + key); if (v) return JSON.parse(v); } catch {}
      return fb;
    };
    const students: RegisteredStudent[] = loadB('registered_students', []);
    const coaches: RegisteredCoach[]    = loadB('registered_coaches',  []);
    const payMap:  Record<string, PaymentStatus> = loadB(`payments_${paymentMonth}`, {});
    const exps:    MonthlyExpense[]     = loadB(`expenses_${paymentMonth}`, []);
    const cc = computeClassCounts(paymentMonth, branch.id);

    const activeStudents = students.filter(s => !isOnBreakInMonth(s, paymentMonth));
    const revenue  = activeStudents.filter(s => payMap[s.id] === 'paid').reduce((n, s) => n + (s.monthlyFee ?? 0), 0);
    const coachCost = coaches.reduce((n, c) => n + (c.ratePerClass != null ? c.ratePerClass * (cc[c.id] ?? 0) : 0), 0);
    const other    = exps.reduce((n, e) => n + e.amount, 0);
    const net      = revenue - coachCost - other;

    grandRevenue   += revenue;
    grandCoachCost += coachCost;
    grandOther     += other;

    branchRows.push([
      branch.name,
      branch.location ?? '',
      students.length,
      activeStudents.length,
      revenue,
      coachCost,
      other,
    ]);
  });

  const grandNet = grandRevenue - grandCoachCost - grandOther;

  const aoa: (string | number)[][] = [];
  const meta: string[] = [];
  const push = (row: (string | number)[], m: string) => { aoa.push(row); meta.push(m); };

  push([`CONSOLIDATED REPORT — ALL BRANCHES — ${monthLabel}`, E, E, E, E, E, E], 'title');
  push([`Exported: ${new Date().toLocaleString('en-GB')}`, E, E, E, E, E, E], 'subtitle');
  push([E, E, E, E, E, E, E], 'blank');

  push(['GRAND TOTALS ACROSS ALL BRANCHES', E, E, E, E, E, E], 'section-nav');
  push(['Total Revenue (All Branches) (RM)', E, E, E, E, grandRevenue, E], 'kpi-plain');
  push(['Total Coach Costs (All Branches) (RM)', E, E, E, E, grandCoachCost, E], 'kpi-plain');
  push(['Total Other Expenses (All Branches) (RM)', E, E, E, E, grandOther, E], 'kpi-plain');
  push(['NET PROFIT / LOSS (All Branches) (RM)', E, E, E, E, grandNet, grandNet >= 0 ? '▲ PROFIT' : '▼ LOSS'], grandNet >= 0 ? 'net-profit' : 'net-loss');
  push([E, E, E, E, E, E, E], 'blank');

  push(['BRANCH BREAKDOWN', 'Location', 'Total Students', 'Active Students', 'Revenue (RM)', 'Coach Costs (RM)', 'Other Expenses (RM)'], 'hdr-teal');
  branchRows.forEach((row, i) => push(row, i % 2 === 0 ? 'data-even' : 'data-odd'));
  push(['TOTAL', E, E, E, grandRevenue, grandCoachCost, grandOther], 'subtotal');

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setCols(ws, [30, 18, 16, 16, 16, 18, 20]);

  // Style pass
  aoa.forEach((_, r) => {
    const m = meta[r];
    if (m === 'title') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.title);
    } else if (m === 'subtitle') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.subtitle);
    } else if (m === 'blank') {
      styleRow(ws, r, NC, S.empty);
    } else if (m === 'section-nav') {
      merge(ws, r, 0, r, NC - 1);
      styleRow(ws, r, NC, S.sectionNav);
    } else if (m === 'hdr-teal') {
      styleRow(ws, r, NC, S.hdrTeal);
    } else if (m === 'kpi-plain') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.kpiNum : S.kpiLabel;
      }
    } else if (m === 'net-profit') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.profitNum : S.profit;
      }
    } else if (m === 'net-loss') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.lossNum : S.loss;
      }
    } else if (m === 'subtotal') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.subtotalNum : S.subtotal;
      }
    } else if (m === 'data-even') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.dataNum : S.dataEven;
      }
    } else if (m === 'data-odd') {
      for (let c = 0; c < NC; c++) {
        const cell = ws[ec(r, c)];
        if (!cell) continue;
        cell.s = typeof cell.v === 'number' ? S.dataNumOdd : S.dataOdd;
      }
    }
  });

  upsertSheet(wb, 'Consolidated', ws);
  // Place Consolidated right after Overview
  const idx = wb.SheetNames.indexOf('Overview');
  wb.SheetNames = wb.SheetNames.filter(n => n !== 'Consolidated');
  wb.SheetNames.splice(idx + 1, 0, 'Consolidated');
}

// ─── Combined Workbook ────────────────────────────────────────────────────────
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
  activeBranchId = 'main',
  branches: { id: string; name: string; location?: string }[] = [],
): XLSX.WorkBook {
  const wb = baseWb ?? XLSX.utils.book_new();
  const classCounts = computeClassCounts(paymentMonth, activeBranchId);
  buildAttendanceSheets(wb, sessions, allRegisteredStudents, students, replacementStudents, coaches, sessionDate);
  buildCoachAttendanceSheet(wb, coaches, sessions, coachAttendanceMap, coachReplacements, sessionDate);
  buildPaymentSheet(wb, allRegisteredStudents, sessions, paymentMap, paymentMonth);
  buildCoachPaymentSheet(wb, coaches, sessions, coachPaymentMap, classCounts, paymentMonth);
  buildFinancialAuditSheet(wb, allRegisteredStudents, sessions, coaches, paymentMap, coachPaymentMap, classCounts, expenses, paymentMonth);
  buildOverviewSheet(wb, sessions, allRegisteredStudents, coaches, paymentMap, coachPaymentMap, expenses, classCounts, sessionDate, paymentMonth);
  if (branches.length > 1) buildConsolidatedSheet(wb, branches, paymentMonth);
  return wb;
}
