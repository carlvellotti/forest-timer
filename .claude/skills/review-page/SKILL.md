---
name: review-page
description: Turn a markdown file into one HTML review page I can read easily, with an answer box under each question, a button that copies all my answers as one message, and answers saved in the browser so they survive a refresh. Use when an AI hands me something long to read, or questions to answer.
---

Turn the markdown file I give you (or the last long thing you wrote me) into one HTML page that's easier to read. Save it next to the markdown file, with the same name ending in ".html".

Presentation:
- Clear sections, and a table or a simple diagram where it helps. Keep my words; don't add new content.
- Put all the CSS inside the same file. No outside files, no libraries.
- Comfortable reading width, works at phone width, and has a dark version for when my system is in dark mode.
- Right under the intro at the top, add a "Jump to the questions ↓" link that scrolls smoothly down to the questions, because they're a long scroll away. (Skip the smooth scroll when my system asks for reduced motion.)

Logic:
- Put an answer box under each question.
- At the bottom, add a "Copy my answers" button that copies all my answers as one message: a line saying which document it's about, then each question numbered with my answer right under it. An empty box shows as "(no answer)".
- If the browser blocks the normal clipboard on a local file, fall back to an older copy method. Show a short note by the button saying whether it copied.

Data:
- Save my answers in the browser as I type, and load them back when the page opens, so they survive a refresh.
- Save them under this document's name (like "review-page:<file name>"), so a different review page doesn't wipe them.
- If browser storage is blocked, the page should still work, just without saving.

Then open it in my browser. If you can't, tell me where the file is so I can open it myself.

Finally, show me where the presentation, the logic and the data are in the file.
