// ─── Badminton App Stress Test Seed Script ────────────────────────────────────
// Paste this entire script into the browser DevTools console (F12 → Console)
// Seeds TWO branches with realistic bulk data so the Consolidated sheet works.
// To clear all test data: clearTestData()
// ─────────────────────────────────────────────────────────────────────────────

(function seedTestData() {
  const rand  = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ── Branch definitions ─────────────────────────────────────────────────────
  const BRANCHES = [
    { id: 'main',   name: 'PJ Branch',  location: 'Petaling Jaya' },
    { id: 'branch_kl', name: 'KL Branch', location: 'Kuala Lumpur' },
  ];

  localStorage.setItem('branches', JSON.stringify(BRANCHES));
  localStorage.setItem('active_branch', BRANCHES[0].id);
  console.log('✅ Branches created:', BRANCHES.map(b => b.name).join(', '));

  // ── Session templates (both branches use similar sessions) ─────────────────
  const SESSION_TEMPLATES = [
    { name: 'Morning Juniors',   day: 'Monday',    startTime: '08:00', endTime: '10:00' },
    { name: 'Evening Adults',    day: 'Monday',    startTime: '18:00', endTime: '20:00' },
    { name: 'U15 Squad',         day: 'Wednesday', startTime: '15:00', endTime: '17:00' },
    { name: 'Advanced Training', day: 'Thursday',  startTime: '19:00', endTime: '21:00' },
    { name: 'Weekend Open',      day: 'Saturday',  startTime: '09:00', endTime: '12:00' },
    { name: 'Beginners Class',   day: 'Sunday',    startTime: '10:00', endTime: '12:00' },
  ];

  const FIRST_NAMES = [
    'Adam','Aisha','Ali','Amirul','Azri','Bella','Bryan','Chelsea','Daniel','Daniya',
    'Daryl','Erica','Ethan','Faris','Fatin','Gabriel','Hannah','Haziq','Irfan','Isaac',
    'Jasmine','Joshua','Kai','Karen','Khairul','Liyana','Lucas','Maisarah','Marcus','Nadia',
    'Nathan','Nur Aina','Omar','Patricia','Qistina','Rachel','Rania','Ryan','Syafiq','Tasha',
    'Umar','Vivian','Wei Hong','Xin Yi','Yasmin','Yusof','Zara','Zikri','Zoe','Zulaikha',
  ];
  const LAST_NAMES = [
    'Abdullah','Ahmad','Ali','Aziz','Chan','Chong','Hassan','Ibrahim','Ismail',
    'Johari','Karim','Lim','Low','Mohamed','Ng','Ong','Rahman','Razak','Singh','Tan',
    'Teh','Wan','Wong','Yap','Yusof','Zakaria',
  ];
  const GROUPS = ['U10','U12','U15','U18','Adults','Beginners','Intermediate','Advanced'];
  const COACH_NAMES = [
    { name: 'Ahmad Firdaus', ic: '850101-14-1234', phone: '012-3456789', rate: 60 },
    { name: 'Nurul Hidayah', ic: '900215-10-5678', phone: '013-2345678', rate: 70 },
    { name: 'Darren Tan',    ic: '920303-08-9012', phone: '011-3456789', rate: 55 },
    { name: 'Siti Aminah',   ic: '880420-06-3456', phone: '016-4567890', rate: 65 },
    { name: 'Rajesh Kumar',  ic: '910512-14-7890', phone: '017-5678901', rate: 60 },
    { name: 'Lim Wei Xian',  ic: '870625-08-2345', phone: '019-6789012', rate: 75 },
  ];

  let globalStudentCounter = 0;

  // ── Seed one branch ─────────────────────────────────────────────────────────
  function seedBranch(branch, coachPrefix, studentCount, studentFeeRange) {
    const pfx = `branch_${branch.id}_`;

    // Sessions
    const sessions = SESSION_TEMPLATES.map((t, i) => ({
      id: `${coachPrefix}sess${i + 1}`, ...t,
    }));
    localStorage.setItem(pfx + 'training_sessions', JSON.stringify(sessions));

    // Coaches (6 per branch, each handles 2 sessions)
    const coaches = COACH_NAMES.map((c, i) => ({
      id: `${coachPrefix}coach${i + 1}`,
      name: c.name,
      icNumber: c.ic,
      phone: c.phone,
      sessionIds: [sessions[i % 6].id, sessions[(i + 1) % 6].id],
      initials: c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      coachStatus: 'active',
      ratePerClass: c.rate,
      registeredAt: new Date(2025, 0, 1).toISOString(),
    }));
    localStorage.setItem(pfx + 'registered_coaches', JSON.stringify(coaches));

    // Students
    const students = Array.from({ length: studentCount }, (_, i) => {
      globalStudentCounter++;
      const fname = FIRST_NAMES[globalStudentCounter % FIRST_NAMES.length];
      const lname = rand(LAST_NAMES);
      const numSess = randInt(1, 3);
      const shuffled = [...sessions].sort(() => Math.random() - 0.5).slice(0, numSess);
      const sessionCoachMap = {};
      shuffled.forEach(s => {
        const c = coaches.find(co => co.sessionIds.includes(s.id));
        if (c) sessionCoachMap[s.id] = c.id;
      });
      // Give ~10% of students a break period in current month
      const breakPeriods = Math.random() < 0.1 ? [{
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        to:   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
      }] : [];
      return {
        id: `${coachPrefix}stu${String(i + 1).padStart(3, '0')}`,
        name: `${fname} ${lname}`,
        studentId: `#${String(globalStudentCounter).padStart(5, '0')}`,
        icNumber: `${randInt(800101, 991231)}-${randInt(10, 16)}-${String(randInt(1000, 9999))}`,
        phone: `0${rand(['11','12','13','16','17','19'])}-${randInt(1000000, 9999999)}`,
        emergencyContactName: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)} (Parent)`,
        emergencyContactPhone: `0${rand(['11','12','13'])}-${randInt(1000000, 9999999)}`,
        sessionIds: shuffled.map(s => s.id),
        sessionCoachMap,
        group: rand(GROUPS),
        monthlyFee: rand(studentFeeRange),
        breakPeriods,
        registeredAt: new Date(2025, randInt(0, 11), randInt(1, 28)).toISOString(),
      };
    });
    localStorage.setItem(pfx + 'registered_students', JSON.stringify(students));

    // Scheduled replacements (5 future dates)
    const futureReplacements = [1, 3, 5, 8, 10].map(n => {
      const d = new Date(); d.setDate(d.getDate() + n);
      const date = d.toISOString().slice(0, 10);
      const student = rand(students);
      const sess = rand(sessions);
      const coach = coaches.find(c => c.sessionIds.includes(sess.id));
      return { id: uid(), studentId: student.id, date, sessionId: sess.id, coachId: coach?.id ?? '' };
    });
    localStorage.setItem(pfx + 'scheduled_replacements', JSON.stringify(futureReplacements));

    // Attendance + payments: last 3 months
    const ATT_STATUSES   = ['present','present','present','absent','late'];
    const COACH_STATUSES = ['present','present','present','on-leave','absent'];
    let attendanceDays = 0;

    for (let mo = 0; mo < 3; mo++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - mo);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date > new Date()) continue;
        const dateStr = date.toISOString().slice(0, 10);

        const attMap = {};
        students.forEach(s => { attMap[s.id] = rand(ATT_STATUSES); });
        localStorage.setItem(pfx + `attendance_${dateStr}`, JSON.stringify(attMap));

        const coachAttMap = {};
        coaches.forEach(c => { coachAttMap[c.id] = rand(COACH_STATUSES); });
        localStorage.setItem(pfx + `coach_attendance_${dateStr}`, JSON.stringify(coachAttMap));
        attendanceDays++;
      }

      // Payments
      const payMap = {};
      students.forEach(s => { payMap[s.id] = Math.random() > 0.2 ? 'paid' : 'unpaid'; });
      localStorage.setItem(pfx + `payments_${monthKey}`, JSON.stringify(payMap));

      const coachPayMap = {};
      coaches.forEach(c => { coachPayMap[c.id] = Math.random() > 0.15 ? 'paid' : 'unpaid'; });
      localStorage.setItem(pfx + `coach_payments_${monthKey}`, JSON.stringify(coachPayMap));

      // Expenses
      const expenses = [
        { id: uid(), label: 'Court Rental',  amount: randInt(700, 1000) },
        { id: uid(), label: 'Shuttlecocks',  amount: randInt(100, 200) },
        { id: uid(), label: 'Electricity',   amount: randInt(80, 150) },
      ];
      if (mo === 0) expenses.push({ id: uid(), label: 'Equipment Maintenance', amount: randInt(200, 500) });
      localStorage.setItem(pfx + `expenses_${monthKey}`, JSON.stringify(expenses));
    }

    console.log(
      `✅ ${branch.name}: ${sessions.length} sessions, ${coaches.length} coaches,`,
      `${students.length} students, ${attendanceDays} attendance days`
    );
  }

  // ── Seed both branches ─────────────────────────────────────────────────────
  seedBranch(BRANCHES[0], 'pj_', 60, [120, 130, 150, 160, 180, 200]);
  seedBranch(BRANCHES[1], 'kl_', 40, [110, 120, 140, 150, 160, 180]);

  console.log('\n🎉 Both branches seeded! Reloading in 1 second...');
  setTimeout(() => location.reload(), 1000);
})();

// ── Clear all test data ────────────────────────────────────────────────────────
window.clearTestData = function() {
  const keys = Object.keys(localStorage).filter(k =>
    k.startsWith('branch_') ||
    k === 'branches' ||
    k === 'active_branch'
  );
  keys.forEach(k => localStorage.removeItem(k));
  console.log('🗑️ Cleared', keys.length, 'keys. Reloading...');
  setTimeout(() => location.reload(), 500);
};

console.log('Script loaded. Running seed... (call clearTestData() to wipe)');
