# 1. A reload picks the session back up; closing the tab gives up

Date: 2026-10-01
Status: accepted

## Context

A session is 25 minutes. Closing the tab halfway has to count as giving up (idea.md). But an accidental reload at minute 24 shouldn't cost a tree. While a page is closing, the browser doesn't tell it whether it's being reloaded or closed. The app only finds out on its next start: a reload says "I was reloaded," and anything else (closing the tab, closing the browser, a crash) looks like opening the app fresh.

## Decision

- The app saves the moment Start was pressed.
- When the app starts and a session was in progress:
  - If the page was **reloaded** and the 25 minutes aren't up yet, the session carries on from where it should be. Start at 9:00, reload at 9:10, and 15:00 is left.
  - If the page was **reloaded** after the 25 minutes would have ended, the session counts as **finished**. Start at 9:00, reload at 9:40, and you get the tree. (Changed on 2026-10-01; see the addendum below.)
  - If the app was **opened fresh** (after a close or a crash), it's a give-up. Start at 9:00, close at 9:10, and there's no tree. The give-up is recorded at that point.

## Consequences

- A browser crash counts as giving up. The app can't tell it from a close, and that was accepted as the trade-off.
- A give-up from closing the tab is only recorded the next time the app is opened.
- Someone reading the code later may wonder why a reload and a close are treated differently. This is why.

## Addendum: a second tab (2026-10-01)

Opening the app in a second tab while it's open in a first tab is *not* "opening fresh," and it doesn't give up the session. Only one tab runs the app at a time. A second tab shows just "Forest Timer is open in another tab." in the muted grey, with no timer and no buttons, and closing it does nothing to the session.

## Addendum: a late reload counts as finished (2026-10-01)

This was first decided as "a reload after the 25 minutes is a give-up." It was changed to **finished** while the spec's assumptions were being checked, because the app also has to work on phones. Phones often reload a tab on their own after it has sat in the background (start at 9:00, lock the phone, open the browser at 9:40, and the tab reloads). The app can't tell that reload from one you did. Calling it a give-up would clash with the sleep rule, where the clock keeps running and a session that finishes while the device sleeps still grows its tree. Now a reload follows the same rule as sleep: the clock runs from Start. Closing the tab or browser, and a crash, still count as giving up.

Trade-off accepted: a reload after 25 minutes grows a tree even if you'd wandered off.

## Addendum: no chime after a reload (2026-10-02)

A late reload grows the tree, with its ring, but plays no chime. After a reload, browsers won't play sound until you press something on the page, and the press that allowed sound before the reload doesn't carry over. The choice was between no chime and a chime on your next tap, which could come much later and feel random. The ring is enough.

## Addendum: a locked phone, then a close (2026-10-02)

Start at 9:00, lock the phone at 9:10, and close the tab at 9:40 without unlocking. Rule 6 (a close is a give-up) and rule 9 (a session that finishes while asleep grows its tree) pull different ways here, and a frozen page can't tell "still locked" from "closed". It counts as a give-up, ended about 9:10, the last moment the page was awake. The alternative, "finished if 25 minutes passed before the app was opened again", would also grow a tree for a close at 9:12 followed by reopening at 10:00.
