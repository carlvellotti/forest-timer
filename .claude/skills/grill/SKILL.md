---
name: grill
description: Interview me relentlessly about an app or feature until we share an understanding, one question at a time, each with a recommended answer, keeping a word-for-word record and writing CONTEXT.md terms and decision records as we go. Use before writing a spec, for a new app or any new feature. Adapted from Matt Pocock's grill-me skill (github.com/mattpocock/skills, MIT).
---

Interview me relentlessly about every aspect of this until we reach a shared understanding. Walk down each branch of the decision tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for my answer before continuing.

If a fact can be found by reading my files, look it up rather than asking me. The decisions, though, are mine.

As we settle a word for something in my app, add it to CONTEXT.md. When a decision is hard to reverse, would surprise someone later, and was a real trade-off, write it up in docs/adr/.

Keep a running record of every question and my answer, word for word, in docs/specs/ as today's date plus "-notes.md".

Do not start building until I confirm we have a shared understanding.
