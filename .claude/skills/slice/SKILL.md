---
name: slice
description: Slice a spec into vertical slices, each with the checks that prove it's done, for review before building. Use after the spec and project setup, before the first build, or for any new feature's spec. Adapted from Matt Pocock's to-tickets skill (github.com/mattpocock/skills, MIT).
---

Slice my spec into parts I can build one at a time.
Make each slice vertical: a thin path through the whole app (screen, logic and data) that I can open and try when it's done. Never one layer at a time.
Put the core loop first, and keep each slice small enough to build and check in one go.
For each slice, list the checks that prove it's done, taken from the examples in my spec. If a slice has nothing to check it against, flag it as a gap in my spec.
Note which slices have to come before which.
For each slice, note which boxes in my spec's architecture diagram it adds or connects.
Show me the list and wait for my feedback before saving it. Then save it next to my spec in docs/specs/, with the same date, ending in "-slices.md".
As each slice is built and its checks pass, tick it off in that file.
