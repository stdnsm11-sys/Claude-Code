/**
 * AMR Tracker – Google Apps Script back end.
 *
 * Stores the Amplification Monitoring Record in the Google Sheet this script is attached to.
 * Tabs created automatically: Students, Entries, FollowUps, Settings.
 *
 * Who can see what:
 *   - DHH teachers (the owner plus the emails in Settings) see every student, the dashboard, reports and settings.
 *   - Case managers see and document only students whose record lists their district email.
 *   - The Sheet itself does NOT need to be shared with case managers. The web app runs as the owner
 *     and checks each user's email before it reads or saves anything.
 *
 * Setup steps are in README.md.
 */

var SHEETS = {
  Students:  ['id','initials','schoolId','campus','grade','rightDevice','leftDevice','ald','soundfield','cmName','cmEmail','start','active','notes','updated'],
  Entries:   ['key','studentId','student','date','absent','right','left','ald','ling','comment','by','ts'],
  FollowUps: ['id','studentId','student','date','method','note','by','ts'],
  Settings:  ['key','value']
};

var DEFAULT_SETTINGS = {
  district: '', schoolYear: '2026-2027', firstDay: '2026-08-03', lastDay: '2027-05-28', noSchool: '',
  dhhEmails: '', missThreshold: 2, nonUseThreshold: 2, cutoff: '10:00',
  aldStatuses: 'In use, Not in use, Declined, Refused, Not working',
  emailDigest: true, emailCmReminder: false, reminderHour: 13
};

/* ------------------------------------------------------------------ */
/* Web app entry points                                                */
/* ------------------------------------------------------------------ */

function doGet() {
  ensureSheets_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('AMR Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Run once from the editor: creates the tabs, remembers the Sheet, and asks for permissions. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the Google Sheet, then use Extensions > Apps Script, so the script is attached to it.');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  ensureSheets_();
  Logger.log('AMR Tracker is set up for: ' + ss.getName());
}

/** Single endpoint called by the page with google.script.run.api(action, json). Returns a JSON string. */
function api(action, payloadJson) {
  try {
    var p = payloadJson ? JSON.parse(payloadJson) : {};
    var me = whoAmI_();
    var out;
    switch (action) {
      case 'bootstrap':      out = snapshot_(me, ''); break;
      case 'changes':        out = snapshot_(me, p.since || ''); break;
      case 'saveEntries':    out = saveEntries_(me, p.entries || []); break;
      case 'saveStudent':    requireDhh_(me); out = { student: saveStudent_(p.student) }; break;
      case 'deleteStudent':  requireDhh_(me); out = deleteStudent_(p.id); break;
      case 'saveSettings':   requireDhh_(me); out = { settings: saveSettings_(p.settings || {}) }; break;
      case 'addFollowUp':    requireDhh_(me); out = { followup: addFollowUp_(me, p.followup || {}) }; break;
      case 'deleteFollowUp': requireDhh_(me); out = deleteRowsWhere_('FollowUps', function (r) { return r.id === p.id; }); break;
      default: throw new Error('Unknown action: ' + action);
    }
    return JSON.stringify(out);
  } catch (e) {
    return JSON.stringify({ error: e.message || String(e) });
  }
}

/* ------------------------------------------------------------------ */
/* Identity & permissions                                              */
/* ------------------------------------------------------------------ */

function emails_(s) {
  return String(s || '').toLowerCase().split(/[\s,;]+/).filter(function (x) { return x; });
}

function whoAmI_() {
  var email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('Could not read your district email. Make sure you are signed in with your district Google account.');
  var settings = getSettings_();
  var owner = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  var admins = emails_(settings.dhhEmails).concat([owner]);
  if (admins.indexOf(email) >= 0) return { email: email, name: email.split('@')[0], role: 'dhh' };
  var mine = readTable_('Students').filter(function (s) { return s.active !== 'N' && emails_(s.cmEmail).indexOf(email) >= 0; });
  return { email: email, name: mine.length ? (mine[0].cmName || email.split('@')[0]) : email.split('@')[0], role: mine.length ? 'cm' : 'none' };
}

function requireDhh_(me) {
  if (me.role !== 'dhh') throw new Error('Only a DHH teacher can do that.');
}

function studentsFor_(me) {
  var all = readTable_('Students');
  if (me.role === 'dhh') return all;
  return all.filter(function (s) { return s.active !== 'N' && emails_(s.cmEmail).indexOf(me.email) >= 0; });
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function snapshot_(me, since) {
  var students = studentsFor_(me);
  var ids = {};
  students.forEach(function (s) { ids[s.id] = true; });
  var entries = readTable_('Entries').filter(function (e) { return ids[e.studentId] && (!since || String(e.ts) > since); });
  return {
    me: me,
    settings: getSettings_(),
    students: students,
    entries: entries,
    followups: me.role === 'dhh' ? readTable_('FollowUps') : [],
    serverTime: new Date().toISOString()
  };
}

function saveEntries_(me, list) {
  var students = studentsFor_(me);
  var byId = {};
  students.forEach(function (s) { byId[s.id] = s; });
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var now = new Date().toISOString();
  var recs = list.map(function (e) {
    var st = byId[e.studentId];
    if (!st) throw new Error('You are not listed as the case manager for that student.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || e.date > today) throw new Error('Invalid date: ' + e.date);
    var pick = function (v, allowed) { return allowed.indexOf(v) >= 0 ? v : ''; };
    return {
      key: st.id + '|' + e.date, studentId: st.id, student: st.initials + ' (' + st.schoolId + ')', date: e.date,
      absent: e.absent === 'Y' ? 'Y' : '',
      right: pick(e.right, ['yes', 'no']), left: pick(e.left, ['yes', 'no']),
      ald: String(e.ald || '').slice(0, 40), ling: e.ling === 'Y' ? 'Y' : '',
      comment: String(e.comment || '').slice(0, 300),
      by: me.email, ts: now
    };
  });
  upsert_('Entries', 'key', recs);
  return { entries: recs, serverTime: now };
}

function normInitials_(v) {
  var letters = String(v || '').toUpperCase().replace(/[^A-Z]/g, '');
  return letters ? letters.split('').join('.') + '.' : '';
}

function saveStudent_(s) {
  var all = readTable_('Students');
  var out = {};
  SHEETS.Students.forEach(function (k) { out[k] = s[k] == null ? '' : String(s[k]); });
  out.initials = normInitials_(s.initials);
  if (out.initials.length < 4 || out.initials.length > 8) throw new Error('Initials must be 2 to 4 letters (for example J.D.).');
  out.schoolId = String(s.schoolId || '').trim();
  if (!/^[A-Za-z0-9]{3,12}$/.test(out.schoolId)) throw new Error('School ID must be 3 to 12 letters or numbers.');
  if (all.some(function (x) { return x.schoolId === out.schoolId && x.id !== s.id; })) throw new Error('Another student already has school ID ' + out.schoolId + '.');
  if (!emails_(s.cmEmail).length) throw new Error("Enter the case manager's district email.");
  out.cmEmail = emails_(s.cmEmail).join(', ');
  out.id = s.id || Utilities.getUuid();
  out.active = s.active === 'N' ? 'N' : 'Y';
  out.soundfield = s.soundfield === 'Y' ? 'Y' : 'N';
  out.updated = new Date().toISOString();
  upsert_('Students', 'id', [out]);
  return out;
}

function deleteStudent_(id) {
  deleteRowsWhere_('Entries', function (r) { return r.studentId === id; });
  deleteRowsWhere_('FollowUps', function (r) { return r.studentId === id; });
  deleteRowsWhere_('Students', function (r) { return r.id === id; });
  return { ok: true };
}

function addFollowUp_(me, f) {
  var st = readTable_('Students').filter(function (s) { return s.id === f.studentId; })[0];
  if (!st) throw new Error('Unknown student');
  var rec = {
    id: Utilities.getUuid(), studentId: st.id, student: st.initials + ' (' + st.schoolId + ')',
    date: String(f.date || '').slice(0, 10), method: String(f.method || '').slice(0, 30),
    note: String(f.note || '').slice(0, 1000), by: me.email, ts: new Date().toISOString()
  };
  upsert_('FollowUps', 'id', [rec]);
  return rec;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function getSettings_() {
  var s = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  readTable_('Settings').forEach(function (r) {
    try { s[r.key] = JSON.parse(r.value); } catch (e) { s[r.key] = r.value; }
  });
  return s;
}

function saveSettings_(next) {
  var allowed = Object.keys(DEFAULT_SETTINGS);
  var rows = allowed.filter(function (k) { return k in next; }).map(function (k) { return { key: k, value: JSON.stringify(next[k]) }; });
  upsert_('Settings', 'key', rows);
  return getSettings_();
}

/* ------------------------------------------------------------------ */
/* Sheet helpers (everything stored as plain text so dates never shift) */
/* ------------------------------------------------------------------ */

function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheets_() {
  var ss = ss_();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, sh.getMaxRows(), SHEETS[name].length).setNumberFormat('@');
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
}

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) { ensureSheets_(); sh = ss_().getSheetByName(name); }
  return sh;
}

function cell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v == null ? '' : String(v);
}

function readTable_(name) {
  var values = sheet_(name).getDataRange().getValues();
  var head = values.shift() || [];
  return values.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    var o = {};
    head.forEach(function (k, i) { o[k] = cell_(r[i]); });
    return o;
  });
}

/** Insert or update rows by key. Uses a lock so two people saving at once never collide. */
function upsert_(name, keyField, objs) {
  if (!objs.length) return;
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(name);
    var head = SHEETS[name];
    var last = sh.getLastRow();
    var keyCol = head.indexOf(keyField) + 1;
    var keys = last > 1 ? sh.getRange(2, keyCol, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    var appendRows = [];
    objs.forEach(function (o) {
      var row = head.map(function (k) { return o[k] == null ? '' : String(o[k]); });
      var i = keys.indexOf(String(o[keyField]));
      if (i >= 0) sh.getRange(i + 2, 1, 1, head.length).setNumberFormat('@').setValues([row]);
      else appendRows.push(row);
    });
    if (appendRows.length) {
      var start = sh.getLastRow() + 1;
      sh.getRange(start, 1, appendRows.length, head.length).setNumberFormat('@').setValues(appendRows);
    }
  } finally {
    lock.releaseLock();
  }
}

function deleteRowsWhere_(name, test) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(name);
    var values = sh.getDataRange().getValues();
    var head = values[0];
    for (var i = values.length - 1; i >= 1; i--) {
      var o = {};
      head.forEach(function (k, j) { o[k] = cell_(values[i][j]); });
      if (test(o)) sh.deleteRow(i + 1);
    }
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Email alerts (optional; turn on with installTriggers)               */
/* ------------------------------------------------------------------ */

function ymd_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function addDays_(s, n) { var p = s.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return ymd_(d); }
function pad_(n) { return (n < 10 ? '0' : '') + n; }

function noSchoolSet_(text) {
  var set = {};
  var toIso = function (t) {
    var m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return m[1] + '-' + pad_(+m[2]) + '-' + pad_(+m[3]);
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m) return (m[3].length === 2 ? '20' + m[3] : m[3]) + '-' + pad_(+m[1]) + '-' + pad_(+m[2]);
    return null;
  };
  String(text || '').split(/\n|;/).forEach(function (line) {
    var f = line.match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4}/g);
    if (!f) return;
    var a = toIso(f[0]), b = f[1] ? toIso(f[1]) : a;
    for (var d = a, i = 0; a && b && d <= b && i < 400; d = addDays_(d, 1), i++) set[d] = true;
  });
  return set;
}

function calendar_(settings) {
  var off = noSchoolSet_(settings.noSchool);
  return function (s) {
    var p = s.split('-'); var w = new Date(+p[0], +p[1] - 1, +p[2]).getDay();
    return w > 0 && w < 6 && s >= settings.firstDay && s <= settings.lastDay && !off[s];
  };
}

function needs_(st) {
  return { r: st.rightDevice && st.rightDevice !== 'None', l: st.leftDevice && st.leftDevice !== 'None', a: st.ald && st.ald !== 'None' };
}

function complete_(e, st) {
  if (!e) return false;
  if (e.absent === 'Y') return true;
  var n = needs_(st);
  return (!n.r || e.right) && (!n.l || e.left) && (!n.a || e.ald);
}

/** Students whose documentation is behind, counting school days up to (not including) `today`. */
function behind_(settings, includeToday) {
  var isSchool = calendar_(settings);
  var today = ymd_(new Date());
  var students = readTable_('Students').filter(function (s) { return s.active !== 'N'; });
  var entries = {};
  readTable_('Entries').forEach(function (e) { entries[e.key] = e; });
  var okStatus = String(settings.aldStatuses).split(',')[0].trim();
  var out = [];
  students.forEach(function (st) {
    var start = st.start && st.start > settings.firstDay ? st.start : settings.firstDay;
    var days = [];
    for (var d = start, i = 0; d <= today && i < 400; d = addDays_(d, 1), i++) {
      if (isSchool(d) && (includeToday || d < today)) days.push(d);
    }
    var missed = [];
    for (var j = days.length - 1; j >= 0; j--) {
      if (complete_(entries[st.id + '|' + days[j]], st)) break;
      missed.unshift(days[j]);
    }
    var n = needs_(st), nonUse = 0, present = 0;
    for (var k = days.length - 1; k >= 0 && present < 5; k--) {
      var e = entries[st.id + '|' + days[k]];
      if (!complete_(e, st) || e.absent === 'Y') continue;
      present++;
      if ((n.r && e.right === 'no') || (n.l && e.left === 'no') || (n.a && e.ald && e.ald !== okStatus)) nonUse++;
    }
    out.push({ st: st, missed: missed, nonUse: nonUse, present: present });
  });
  return out;
}

/** Morning email to DHH teachers listing students who need follow-up. */
function dailyDigest() {
  var settings = getSettings_();
  if (!settings.emailDigest) return;
  if (!calendar_(settings)(ymd_(new Date()))) return;
  var rows = behind_(settings, false).filter(function (x) {
    return x.missed.length >= +settings.missThreshold || x.nonUse >= +settings.nonUseThreshold;
  });
  if (!rows.length) return;
  var url = ScriptApp.getService().getUrl();
  var html = '<p>These students need follow-up on their Amplification Monitoring Record:</p><table border="1" cellpadding="5" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
    '<tr><th>Student</th><th>Campus</th><th>Case manager</th><th>Undocumented school days</th><th>Device not in use (last 5 days)</th></tr>' +
    rows.map(function (x) {
      return '<tr><td>' + x.st.initials + ' (' + x.st.schoolId + ')</td><td>' + x.st.campus + '</td><td>' + (x.st.cmName || '') + ' ' + x.st.cmEmail +
        '</td><td>' + (x.missed.length ? x.missed.length + ' (' + x.missed.slice(-10).join(', ') + ')' : '0') + '</td><td>' + x.nonUse + ' of ' + x.present + '</td></tr>';
    }).join('') + '</table><p><a href="' + url + '">Open AMR Tracker</a></p>';
  var owner = Session.getEffectiveUser().getEmail();
  var to = emails_(settings.dhhEmails).concat([owner]).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(',');
  MailApp.sendEmail({ to: to, subject: 'AMR Tracker: ' + rows.length + ' student(s) need follow-up', htmlBody: html });
}

/** Afternoon reminder to case managers who have not documented today. */
function caseManagerReminder() {
  var settings = getSettings_();
  if (!settings.emailCmReminder) return;
  var today = ymd_(new Date());
  if (!calendar_(settings)(today)) return;
  var byCm = {};
  behind_(settings, true).forEach(function (x) {
    if (x.missed.indexOf(today) < 0) return;
    emails_(x.st.cmEmail).forEach(function (e) { (byCm[e] = byCm[e] || []).push(x); });
  });
  var url = ScriptApp.getService().getUrl();
  Object.keys(byCm).forEach(function (email) {
    var list = byCm[email].map(function (x) { return x.st.initials + ' (' + x.st.schoolId + ')'; }).join(', ');
    MailApp.sendEmail({
      to: email,
      subject: "Reminder: today's hearing device check (AMR)",
      htmlBody: "<p>Today's Amplification Monitoring Record still needs to be filled in for: <b>" + list + '</b>.</p>' +
        '<p>It takes a few seconds: open <a href="' + url + '">AMR Tracker</a> and press <b>Y</b> for each student whose devices are in use.</p>'
    });
  });
}

/** Run once from the editor to turn on the morning summary and the case manager reminder. */
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['dailyDigest', 'caseManagerReminder'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  var settings = getSettings_();
  ScriptApp.newTrigger('dailyDigest').timeBased().everyDays(1).atHour(7).create();
  ScriptApp.newTrigger('caseManagerReminder').timeBased().everyDays(1).atHour(+settings.reminderHour || 13).create();
  Logger.log('Email triggers installed.');
}
