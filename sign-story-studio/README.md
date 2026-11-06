# Sign Story Studio

Make a small picture book from ASL video clips. Each page pairs a clip of a person signing with the English text, plus a cartoon picture that animates as the story is signed. Children can take in each page in several ways: watching the signer, reading highlighted words, seeing the picture act it out, and tapping words to hear them or see their sign.

Open `index.html` in any browser. There is nothing to install, and it works offline (the internet is only used for fonts).

## Make (for the grown-up)
1. **Add ASL clips.** Drop several clips at once, or tap to choose them. Each clip becomes a page, in file-name order (`1`, `2`, … `10`). New clips fill pages that have no clip first, so you can type the text before or after adding clips.
   - **From PowerPoint:** drop a `.pptx` file and every video embedded in it becomes a page, in slide order. The words shown on each slide fill in that page's text. If a slide has no words, its page is left blank for you to type what is signed (speaker notes are never used). If the first slide has no video, its words become the book title. Everything is read inside the browser, and nothing is uploaded.
   - Older `.ppt` files need to be saved as `.pptx` first (File > Save As > PowerPoint Presentation).
   - Videos that are only *linked* from a slide (not saved inside the file) are skipped. Add those clips directly.
   - If a video is in a format browsers can't play (such as `.wmv`), use PowerPoint's **File > Info > Optimize Media Compatibility**, save, and add the file again.
2. **Book cover.** Add a title, a name and, if you like, a clip of the title being signed.
3. **Type what is signed** under each clip, in English. To type everything at once, open **Type all the sentences at once** and enter one line per page.
4. **Match words to signs** (on each page). Play the clip, slowly if you like, and tap the English word each time its sign starts. Because ASL word order is different from English, you can tap words in any order. Leave words that have no sign, such as "the", empty. Without this step, the words light up at an even pace.
5. **Pictures appear by themselves** from the words: about 20 animals, people (mom, dad, grandparents, baby), names (a name like *Mia* becomes the same child on every page, and *"Pip the bunny"* makes Pip a bunny), about 20 everyday things, places (beach, snow, forest, bedroom, space), night, rain and rainbows. Feelings change the faces and action words make the characters move. On any page you can remove a picture with ×, add one, or change the place. Move pages with ↑ ↓.

## Read (for the child)
- **Play** plays the signer, highlights each word as it is signed and animates the picture. Characters walk in, things pop up and rain starts at the moment their word is signed. Action words make the characters jump, dance, fly or swim. Tap the video to pause.
- **Speed:** Slow, Medium or Normal, for the clip and the voice.
- **Tap a word** to hear it. If the word was matched to a sign (purple dot), the signer shows just that sign. Words with a wavy line make their picture jump.
- **Tap a character** to see and hear its sound in a speech bubble (*Quack!*). Tap the sky for sparkles.
- **Hear it** reads the page aloud with the same highlighting and animation.
- **Whole book** plays every page in a row. **Bigger signer** gives the video more room. **Sounds** turns voice and sound effects on or off. Everything still works by sight with sounds off.
- Swipe, use the arrow keys or the round buttons to turn pages, and press the space bar to play or pause. **Full screen** works well on a tablet or smartboard.

## Saving
The book and the clips are saved in this browser on this device. **Copy book code** holds the words, pictures and sign matches but not the clips, so add the clips again on another device.

`app.html` is the same page without the document wrapper (used for the hosted version).
