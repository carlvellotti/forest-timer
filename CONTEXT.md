# Forest Timer: words

The words this app uses, and what each one means. Use these words in code, screens and docs.

- **Session:** one 25-minute focus countdown. It ends in one of two ways: you finish it, or you give up. There's no break timer after it.
- **Finished session:** a session that ran the full 25 minutes. It grows one tree, and the screen goes back to Start.
- **Give up:** ending a session before the 25 minutes are up. Clicking "Give up" asks once, in place ("Give up? No tree this time."), with "Keep going" and "Give up". Closing the tab halfway also counts as giving up.
- **Given-up session:** a session that was given up. It's recorded, but it grows no tree.
- **Reload:** reloading the page, by you or by the browser itself (phones often do this). The clock runs from Start: reload before the 25 minutes are up and the session carries on; reload after, and it counts as finished (see docs/adr/0001).
- **Session record:** what's saved in this browser for every session, finished or given up: when it started, when it ended, and how it ended (finished or gave up). For a close or a crash, "ended" is the last moment the page was open, to within a few seconds. Length comes from the start and end times.
- **Forest:** every tree you've ever grown, all time. It never resets. Trees sit in rows like treelines, and when a row is full, the next tree starts a new row underneath. The newest tree comes first (top-left, right under the line), and older trees move along one spot each time.
- **Tree:** what a finished session grows. One finished session means one tree. The tree you just grew has the orange dashed ring until you press Start again or leave the page.
- **Another tab:** Forest Timer runs in one tab at a time. Any other tab shows only "Forest Timer is open in another tab." Opening or closing another tab never gives up a session.
- **Ready:** the screen when no session is running. The timer reads 25:00, with Start under it and no Give up link.
- **Running:** the screen during a session. The timer counts down, Start is gone, and only the quiet Give up link sits under it.
