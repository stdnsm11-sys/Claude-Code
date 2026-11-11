# Writing Fix-Up Board

A smartboard editing activity built from a student's own writing. The teacher uploads a photo of the student's paper. The words appear in large print on lined paper, and the student edits them with a finger using real proofreading marks. The student can also label parts of the writing (Who, What, When, Where, Why, How, Important detail).

Open `index.html` in any browser (Chrome or Edge works best on a smartboard) and press **Full screen**. `app.html` is the same page without the document wrapper. It is used for the hosted version.

## Teacher setup (the **Teacher** button)
1. **Add the writing.** Choose, drag in, or paste one or more photos of the paper. To paste, copy a picture (right-click it and choose **Copy image**, or take a screenshot), then press **Paste a picture** or **Ctrl+V**. Pasting while students are editing adds the picture as a new page and opens **On my paper**. Use **Turn ↻** if a photo is sideways.
2. **Read the handwriting.**
   - In the hosted version on claude.ai, **Read handwriting with Claude** reads the photo and keeps the student's mistakes so they have something to fix. The first time, the viewer is asked to allow it, and it uses that person's Claude account.
   - In the downloaded `index.html`, **Read handwriting** uses free on-device text recognition (Tesseract.js, which needs internet the first time). It is much weaker on handwriting, so check every word.
   - You can always type or paste the writing yourself. Leave a blank line between paragraphs.
3. **Check the words** against the photo. Fix misreadings, but keep the student's own errors.
4. **Choose labels:** *5 W's + How*, *Story parts* (Character, Setting, Problem, Solution, Feeling, Detail), *Information writing* (Main idea, Detail, Fact, Opinion, Word to know), or add your own (up to 9).
5. Optional (hosted version): **Mark spots to check with Claude** adds colored hint dots under words with mistakes: **C**apitals, **U**sage, **P**unctuation, **S**pelling. When the student taps that word with **Fix a word**, they see a short tip that never gives the answer.
6. Press **Start editing**.

Tip: cover the student's name before taking the photo.

## Taking pictures on an iPad and opening them on the smartboard
This works in the claude.ai version. Sign in to the same claude.ai account on both devices.
1. On the iPad, open the app, tap **Teacher**, then **Take a picture**. The camera opens. Take one picture per page. Tap **Take another page** for each extra page. Use **Turn ↻** if a page is sideways.
2. Type the student's initials (and a title if you like), then tap **Send to the board**.
3. Tap **Next student** and repeat for the next paper.
4. On the smartboard, open the same app. A green **From iPad (number)** button appears at the top. Tap it (or open **Teacher**) to see **Pictures from your iPad**, then tap **Open for the lesson**.
5. When you're done with a paper, tap **Delete** in that list to remove the pictures from your account.

Pictures are kept in your claude.ai account in a private area only you can see, even if you share the app with someone. They stay there until you delete them.

## Student tools (big buttons on the left)
| Tool | What the student does | Mark shown |
|---|---|---|
| **Fix a word** | Tap a word, then type the fix on the big on-screen keyboard | old word shown small and crossed out above the fix |
| **Add words** | Tap a green ‸ between words | new words in green with ‸ |
| **Take out** | Tap a word (tap again to put it back) | red line through it |
| **Capital** | Tap a word to switch its first letter | ≡ under a new capital, / through a new lowercase letter |
| **Paragraph** | Tap the first word of a new paragraph | ¶ |
| **Label it** | Pick a label, then tap a word or slide a finger across several | colored highlight with a label tag |
| **Draw** | Circle, underline or point with a finger (4 colors, eraser, clear) | |

## Editing on the photo (**On my paper**)
Press **On my paper** to mark up the actual photo of the student's paper. You don't need to type the words for this. If you only add a photo in Teacher setup, **Start editing** opens straight to the photo.

| Tool | What the student does |
|---|---|
| **Pen** | Write, circle or cross out with a finger (4 colors, 3 sizes) |
| **Highlight** | Slide a finger over words (yellow, green, pink, blue) |
| **Marks** | Pick a proofreading mark and tap to place it: ≡ capital, / lowercase, ‸ add here, ⊙ add period, — take out, ¶ new paragraph, (sp) spelling, ? check this, ★ great! Drag a mark to move it. |
| **Write** | Tap the paper and type a fix with the big keyboard. Tap the words later to change them, or drag them to move them. |
| **Label it** | Pick a label and drag a box around words. The boxed part of the photo appears in the 5 W chart. |
| **Eraser** | Tap or rub over any mark to erase it |
| **Move page** | Scroll around the photo with a finger. **A− / A+** zoom the photo. |

Marks stay lined up with the handwriting when you zoom, and they turn with the page if you press **Turn ↻** in Teacher setup.

Along the top:
- **Undo / Redo** (also Ctrl+Z / Ctrl+Y)
- **Marks / Clean copy / On my paper**: switch between the proofreading marks, the finished writing, and the photo of the real paper
- **A− / A+**: change the text size
- **Read it to me**: the computer reads the writing aloud and highlights each word, which helps students hear mistakes
- **My paper**: the original photo, with zoom
- **5 W chart**: every labeled phrase sorted by label, as a graphic organizer. Empty labels say "Not found yet." Tap a phrase to flash it in the writing.
- **Checklist**: a CUPS self-check (Capitals, Usage, Punctuation, Spelling)
- The yellow counter shows how many fixes the student has made.

## Saving
- Work saves automatically in this browser on this computer. Open older pieces from **Saved work**.
- **Copy the clean copy** puts the finished writing on the clipboard so you can paste it into a document. The downloaded `index.html` also has **Print**.
- Nothing is sent anywhere except the photos and text you choose to send to Claude with the Claude buttons.
