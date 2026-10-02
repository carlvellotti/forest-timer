---
name: build
description: Build the next unticked slice on the slice list all the way to checked (built, checks passing, reviewed by a separate agent against the spec, ticked off, committed), then hand back. Use during a build, one slice at a time.
---

Build the next unticked slice on my slice list, and only that slice.
Read AGENTS.md and my spec first.
Build it, then run the checks, this slice's and every earlier one, until they all pass. Never change a check just to make it pass. If one needs to change, stop and tell me why.
When the checks pass, have a separate agent review the slice against my spec, with fresh eyes, and fix what it finds.
If you get stuck, stop and tell me what you tried and what you think is wrong.
When it's done, tick it off in my slice list, add a line under it for anything you filled in that my spec didn't say, and commit.
Then tell me what you built, which boxes in the diagram it added, what you filled in, and anything you couldn't check.
