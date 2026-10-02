# Forest Timer: words

The words this app uses, and what each one means. Use these words in code, screens and docs.

- **Session:** one 25-minute focus countdown. It ends in one of two ways: you finish it, or you give up. There's no break timer after it.
- **Finished session:** a session that ran the full 25 minutes. It grows one tree, and the screen goes back to Start.
- **Give up:** ending a session before the 25 minutes are up. Clicking "Give up" asks once, in place ("Give up? No tree this time."), with "Keep going" and "Give up". Closing the tab halfway also counts as giving up.
- **Given-up session:** a session that was given up. It's recorded, but it grows no tree.
- **Reload:** reloading the page, by you or by the browser itself (phones often do this). The clock runs from Start: reload before the 25 minutes are up and the session carries on; reload after, and it counts as finished (see docs/adr/0001).
- **Session record:** what's saved in this browser for every session, finished or given up: when it started, when it ended, and how it ended (finished or gave up). For a close or a crash, "ended" is the last moment the page was open, to within a few seconds. Length comes from the start and end times.
- **Chime:** the one soft note that plays when a session finishes. Giving up plays nothing.
- **Forest:** every tree you've ever grown, all time. It never resets. Trees sit in centered rows like treelines, and when a row is full, the next tree starts a new row underneath. The newest tree comes first (the first spot in the top row, right under the line), and older trees move along one spot each time.
- **Line:** the single thin line between the timer and the forest. The forest starts right under it. It never moves: not when asking to give up, and not as the forest grows.
- **First-visit line:** "Finish a session to grow your first tree." It's the forest's only content before the first tree, and it disappears once there is one.
- **Tree:** what a finished session grows. One finished session means one tree. The tree you just grew has the orange dashed ring until you press Start again or leave the page.
- **Another tab:** Forest Timer runs in one tab at a time. Any other tab shows only "Forest Timer is open in another tab." Opening or closing another tab never gives up a session.
- **Ready:** the screen when no session is running. The timer reads 25:00, with Start under it and no Give up link. The quiet "Stats" link sits at the top-right.
- **Running:** the screen during a session. The timer counts down, Start is gone, and only the quiet Give up link sits under it.
- **Stats page:** the page at /stats that shows your streak and this week. You reach it from the quiet "Stats" link at the top-right, which only shows when Ready, and leave it with "Back to forest". It only reads session records; it saves nothing. Typing /stats mid-session is a give-up, like leaving the page. The browser's Back button mid-session keeps you on the timer.
- **This week:** Monday to Sunday, in your own time zone. Shown as each day's count of finished sessions plus the week's total. A session counts on the day it finished.
- **Streak:** how many days in a row, up to today, you finished at least one session. Today doesn't break it until it's over: finished Monday to Wednesday, it's still 3 on Thursday morning, 4 once you finish one Thursday, and 0 on Friday if Thursday had none. Given-up sessions don't count.
