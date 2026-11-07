# AMR Tracker: Amplification Monitoring Record

A web app that replaces the monthly AMR spreadsheet (`AMR 2026-2027 – Fillable`). It has two sides:

| Who | What they do |
|---|---|
| **Case manager** | Each day, records whether each DHH student's hearing devices (hearing aid, cochlear implant, BAHA) and ALD are in use. It takes **one keystroke per student** on a normal day. |
| **DHH teacher** | Gets a live dashboard showing who is and isn't being documented, alerts when documentation stops, a follow-up log, and printable monthly AMRs for the student's file. |

Students are stored as **initials + school ID only** (the ID tells apart students with the same initials). Do not enter full names.

## Try it now (demo mode)

Open `index.html` in Chrome or Edge. It runs with sample students. The data is saved only in that browser.
Use **Viewing as** at the top to switch between the DHH teacher and a case manager. Open two tabs, one for each role, to watch the dashboard update live as you enter data.

## Case manager: daily check

Every student on the caseload appears as one row: **Right / Left / ALD / Absent / Ling check / comment**. Only the devices the student actually has are shown.

| Key | Action |
|---|---|
| <kbd>Y</kbd> | Present and **all devices in use**. Saves and moves to the next student. |
| <kbd>A</kbd> | Absent. Saves and moves to the next student. |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Switch Right / Left between yes and no, or step through the ALD status |
| <kbd>C</kbd> | Type a problem or comment (quick buttons appear: *Dead battery, Left at home, Not working, Refused…*) |
| <kbd>↑</kbd> <kbd>↓</kbd> | Move between students |
| <kbd>←</kbd> <kbd>→</kbd> / <kbd>T</kbd> | Previous or next school day / today |
| <kbd>Shift</kbd>+<kbd>Y</kbd> | Mark every student not yet documented as "all in use" |

Everything saves automatically. The **Missed days** panel lists past school days that still need an entry, with a link to fill each one in.

## DHH teacher

- **Dashboard** (updates every minute): documented today, a strip showing the last 10 school days for each student, % documented this month, and the last day documented.
  - 🔴 **Follow up**: N school days in a row not documented (N is set in Settings, default 2).
  - 🟡 **Watch**: one missed day, or a device marked *not in use* on 2 or more of the last 5 days.
  - **Email CM** opens an email to the case manager that already lists the missing dates, then offers to log the contact.
- **Daily check**: the DHH teacher can enter data for any student, too.
- **Students**: add or edit initials, school ID, campus, right/left device, ALD, soundfield access, case manager email(s), and the date tracking starts. Set a student to *Inactive* to keep their records.
- **AMR reports**: a printable AMR for each month or the whole year. It shows the same fields as the spreadsheet: device and ALD for each day, absences, problems/comments, who entered each day, soundfield access, the required IEP/504 statements, your follow-up contacts, and a signature line. **Download all data (CSV)** exports everything.
- **Follow-ups**: a dated log of your contacts with case managers.
- **Settings**: first and last day of school, **no-school days** (holidays and breaks are not counted as missed), alert thresholds, the time entries are due each day, and the ALD wording (from the spreadsheet: *In use, Not in use, Declined, Refused, Not working*).

## Installing it for your district (Google Workspace, about 10 minutes)

The data lives in a Google Sheet in **your district Google Drive**. Case managers never need access to the Sheet. The app checks each person's district login and only shows them their own students.

1. In Google Drive, create a new Google Sheet named, for example, **AMR Tracker 2026-2027**.
2. In the Sheet, open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with [`apps-script/Code.gs`](apps-script/Code.gs).
4. Click **+ → HTML**, name the file **`Index`**, and paste in the full contents of [`index.html`](index.html).
5. Open **Project Settings (⚙)**, check **Show "appsscript.json"**, and replace that file's contents with [`apps-script/appsscript.json`](apps-script/appsscript.json). Change the time zone there if you are not in US Central time.
6. Select the **`setup`** function in the toolbar and click **Run**. Approve the permissions. This creates the *Students, Entries, FollowUps, Settings* tabs.
7. Click **Deploy → New deployment → Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone within [your district]**
8. Copy the web app URL. That one link is used by everyone: you get the DHH view, and case managers get their daily check.
9. Open the link, go to **Settings**, and enter the first and last day of school and the holidays. Add other DHH teachers' emails if you share the caseload.
10. Optional: to turn on email alerts, run **`installTriggers`** once in Apps Script. This sends:
    - a 7 AM summary to DHH teachers listing students who need follow-up
    - an afternoon reminder to case managers who haven't documented today (turn this on in Settings)

**After a code change**, paste the new files and use **Deploy → Manage deployments → Edit → New version**. That keeps the same URL.

### Privacy notes
- Only initials and school IDs are stored. The Notes field says not to enter names or medical details.
- A school ID is still information that can identify a student. Keep the Sheet in district Drive and do not share it outside the DHH team. Check with your district's data privacy or technology office before rolling the app out.
- Each entry records who saved it and when, which creates an audit trail for your documentation.

## Files
- `index.html`: the whole user interface. It works by itself as a demo, and inside Apps Script it uses the Google Sheet.
- `apps-script/Code.gs`: the back end (Sheet storage, permissions, email alerts).
- `apps-script/appsscript.json`: the project manifest (time zone, web app settings).
