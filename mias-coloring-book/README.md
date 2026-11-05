# Mia's Coloring Book

A smartboard activity for a 2nd-grade student who is Deaf/Hard of Hearing. Open `index.html` in any browser (no install, no internet needed except for fonts) and press **Full screen**.

## 1 · Read & Punctuate (end-of-sentence punctuation)
- Three short stories about Mia, who wears a cochlear implant: *Meet Mia*, *How It Works*, *Mia's Day* (8–9 sentences each, mixing `.` `?` `!`).
- The student taps a box at the end of a sentence, then taps a big **period / question / exclamation** button.
- **Feedback mode** (switch on): green = correct, orange shake = try again. Data records the *first try*.
- **Probe mode** (switch off): no feedback until the teacher presses **Check my work**.
- All feedback is visual. No sound is needed.
- **“Are you sure?” check:** after the student taps a mark, the sentence opens large and is reread word by word (highlighted, with an optional computer voice). The **Yes, I'm sure** button stays locked until the reread and a wait time (0–8 s) finish. The student can **Read it again** or **Change it**. A wrong mark changed to the right one is logged as a self-correction.
- **Guiding prompts** (feedback mode) after a confirmed wrong answer: 1) *Is this sentence telling, asking, or a big feeling?* 2) the clue word is highlighted (“Do” is an asking word, “Wow” shows a big feeling) 3) the correct mark glows (modeled). The highest prompt level needed is saved for each sentence.
- All of these can be turned on or off under **Teacher settings**.

## 2 · Listen & Color (following 3- and 4-step oral directions)
- Pick **3 steps** or **4 steps** and press **New directions** (e.g. "First, color the sun yellow. Next, color Mia's cochlear implant purple. Last, color the dog brown.").
- Directions are **blurred on screen**. Press and hold the box to read them, then say them aloud (or use **Read aloud** for a computer voice). Use **+ / −** to count repetitions.
- The student colors with the big crayons. The app logs every tap, so **Check coloring** scores each step, whether the steps were done in order, and any extra coloring.
- Tap a step to override the score, pick the support given (independent, repeated, visual cue, sign/cued support, written, modeled), add notes, and **Save this trial**.
- **Free coloring** turns scoring off for reward time.

## Teacher Data
- Summary: first-try punctuation accuracy overall and by mark, plus % of steps correct for 3-step and 4-step directions, trials fully correct, and average repetitions.
- Every trial is listed with date, score, details and support. **Copy data as CSV** to paste into Google Sheets or Excel.
- Data is saved only in this browser on this device. Use initials, not full names.

`app.html` is the same page without the document wrapper (used for the hosted version).
