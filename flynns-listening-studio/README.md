# Flynn's Listening Studio

A classroom app for I.S., a 3rd-grade student who is Deaf/Hard of Hearing and uses spoken language. It practices and tracks her four IEP goals for listening comprehension, auditory memory, Assistive Listening Device (ALD) use and self-advocacy.

Open `index.html` in any browser (no install). `app.html` is the same page without the document wrapper, used for the hosted version.

## Two modes
- **Student mode** opens first, every time. She sees only her comic panels, the activity tabs and her stickers. It opens on the most recent lesson you made, or on an example lesson (a two-paragraph *Flynn's Day at the Dog Park* that you take turns reading) before you've made one.
- **Teacher mode:** press and hold **Teacher: hold** (top right) for about a second. A quick tap does nothing, so she won't wander in by accident. Here you choose the goal, passage category, theme, length, key details, how she answers and the accommodations, score trials and see **Teacher data**. The pink panels show a live **student preview**. Press **Present in student mode** or **Start student mode** to hand the screen back.
- **Teacher tools while she listens:** in student mode, press and hold **Teacher tools: hold** (bottom right) for the blurred script, the repetition counter and computer voice. You can read aloud without leaving her screen. **Score in teacher mode** takes you straight to the detail checklist.
- When she taps her answers, the trial saves on its own when she finishes. You can add support and notes later in teacher mode and press **Update saved trial**.
- The ALD **Show me** checklist and all Goal 4 classroom logging are teacher-mode only.

## Built around her interests
- **Look:** pastel blue and pink, drawn as a graphic novel. Every student screen is a comic panel with speech bubbles.
- **Flynn, her dog,** is the guide on every screen. Stickers are paw prints and music notes.
- **Themes for listening passages:** Flynn & pets, Music & singing, Comic club (graphic novels, library), Animal world.
- **Music as a memory tool:** "The Listening Song" puts the ALD steps to a beat with karaoke-style highlighting, and the "Sing it back" accommodation prompts her to rehearse details to a tune she knows.
- All stories and lyrics are original. They don't reuse characters or songs from her favorite books and artists.

## Listen & Remember: Goals 1 and 2
1. Choose the goal, what you present (3–5 sentences, a **passage**, classroom directions, teacher information), the theme and how many key details to check (4, 5, 6 or all). Goal 2 hides the 3–5 sentence option because it targets extended information.
2. **Passage length:** two sliders set the number of paragraphs (1–5) and the sentences in each paragraph (5–9). Each theme has its own multi-paragraph story: *Flynn's Day at the Dog Park*, *The Big Concert*, *The Comic Club Contest* and *A Visit to the Animal Rescue*.
3. **How you present it:**
   - **We take turns reading (she sees the text):** the passage appears as a graphic-novel page with one comic panel per paragraph. Choose turns by paragraph or by sentence, and who reads first. A bar at the bottom says whose turn it is (pink for her, blue for you), and she taps **Next turn** after each one. Turn on **Blur my turns** to keep your parts blurred, so she reads her parts and listens to yours. That keeps listening practice in the shared reading.
   - **She reads it herself:** the same graphic-novel page, but every part is hers. She reads the pink paragraph or sentence aloud and taps **Next part**. Choose whether one paragraph or one sentence is highlighted at a time. You can follow along with the blurred script in Teacher tools.
   - **I read it aloud (text hidden):** the original listening task. Flynn shows "Listening ears on!" while you read.
4. **The teacher script** (teacher mode, or **Teacher tools** in student mode) is blurred until you press and hold. Key details are highlighted, each turn is labeled *Me* or *Her*, and `/ pause /` marks show where to stop when chunking is on. In turn-taking mode, the computer voice reads only the current turn.
5. Count repetitions with **+ Repeated**. The goal allows one, so a second repetition marks the trial as not meeting criterion.
6. She recalls in one of two ways:
   - **She tells me:** tap each key detail she recalls, and mark the main idea for Goal 2.
   - **She taps answer choices:** one question per detail (plus the main idea for Goal 2), with visual right/try-again feedback.
7. Pick the support given, add notes and **Save trial**.

Each saved trial records how the passage was presented (for example, "took turns by paragraph, teacher started"), so data from shared reading can be told apart from listening-only trials.

**Meets criterion:** 4 or more key details, 80% or higher, no more than 1 repetition, plus the correct main idea for Goal 2.

**Accommodations you can switch on (saved with each trial):** ALD on and checked, preferential seating, "Listen for…" preview chips (Who? Where? How many?), chunking with pauses, slower rate, visual comic recap after recall, look-back (the passage stays available during questions), sing-it-back strategy, comic-panel graphic organizer, check for understanding, reduced background noise.

New passages are built from hand-written story frames, direction sets and fact lists, with names, days, colors, numbers, songs, books and so on filled in at random. Each tap of **New passage** gives a new version, and every answer choice is generated to match.

## My Listening Device: Goal 3
1. **Learn it:** comic panels explaining what the ALD is, why it helps, when to use it and what to do if it's not working, followed by step-by-step panels.
2. **Sing it:** The Listening Song.
3. **Put steps in order:** she taps shuffled step cards into numbered slots (4, 6 or all steps). Scored by position.
4. **When do I use it?:** classroom scenes. She chooses "Yes, use it!" or "Not needed now" and sees why.
5. **Why does it help?:** questions about purpose and benefit.
6. **Show me:** while she uses her real device, the teacher marks each step *on her own / prompted / not yet*. Only steps she does on her own count.

Edit the step list in **Teacher data → Settings** to match her real device, for example "Roger" or "my FM". The lesson, song cards, sequencing and checklist all update. Accommodations: picture icons, song reminder, modeled first, fewer choices, read aloud, hands-on with her real device.

## Speak Up!: Goal 4
- **My Speak-Up cards:** big cards she can tap to show full screen ("Please turn on the mic." "My battery is low." "Can you say that again, please?" …).
- **Practice scenarios:** "Is there a listening problem?" (recognizing the need), then "What could you say or do?" (choosing a kind, clear request over a passive or rude choice). Scenarios include ones where nothing is wrong, so she also learns when she *doesn't* need to speak up.
- **Real classroom log (the goal data):** for each real opportunity, record the setting, whether she recognized the need and whether she communicated it (on her own / with a prompt / not yet), and what she said. A **data period** meets the goal at 80% (4 of 5) with at least 5 opportunities. Start a new period whenever your data-collection window ends, for example weekly. A setting lets "with a prompt" count as success if your team agrees.

## Teacher data
- One card per goal: status (Building, *n* of 3 in a row, Criterion met), 3-in-a-row dots, a bar chart of recent scores against the 80% line, and the goal wording.
- Every trial and opportunity is listed with date, score, repetitions, support, accommodations, details and notes. Uncheck "Count as a data collection opportunity" to save a practice trial that doesn't affect mastery.
- **Copy data as CSV** to paste into Google Sheets or Excel. **Backup or move data** copies all records as text and restores them on another device.
- **Where data is saved:** on the hosted page, it's saved privately to the teacher's claude.ai account. When `index.html` is opened as a file, it stays in that browser. Use initials only.
