# Slop Detector

A Chrome extension that highlights LLM-isms on any webpage. Vibes-based, not ML.

![screenshot placeholder](screenshot.png)

## The story

Built in 30 minutes as part of a weekly-shipping challenge. The constraint this week was *single prompt* — one message to Claude Code, no follow-ups, no edits. Inspired by the rising tide of slop on every webpage I visit.

## How it works

It's pattern matching, not machine learning. A hand-curated ruleset of phrases and words that have measurably spiked in frequency since ChatGPT launched gets run against every text node on the page. There is no classifier, no model, no scoring — just regexes and a tiered confidence system. It will have false positives. That's part of the joke.

## Install

1. Clone or download this repo.
2. Open `chrome://extensions`.
3. Toggle **Developer Mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Visit LinkedIn. The pink will speak.

## What it detects

### Tier 1 — phrases (solid pink underline)

High-confidence constructions that almost never appear in pre-2023 writing.

- **The 'not just' construction** — *"It's not just a tool — it's a movement."*
- **The 'actually works' tic** — *"a workflow that actually works"*
- **The 'quietly' tell** — *"quietly reshaping the industry"*
- **The 'this is by design' tic** — *"this is by design"*
- **The fragment-question opener** — *"The result? A 3x lift."*
- **The ellipsis mic-drop** — *"And the result... pure magic."*
- **LLM disclaimer** — *"As an AI language model..."*
- **The closer flourish** — *"embark on a journey to unlock the potential"*
- **The corporate-poetry phrase** — *"in the realm of"*, *"a testament to"*, *"stand the test of time"*
- **The 'no fluff' signature** — *"no fluff"*

### Tier 2 — vocabulary clusters (dotted pink underline)

Individual words whose frequency has exploded since 2023. Some have legitimate uses — Tier 2 is dotted to mark lower confidence.

- **The delve cluster** — *delve, underscore, intricate, meticulous, commendable*
- **The corporate-grand cluster** — *tapestry, multifaceted, nuanced, holistic, robust, pivotal, paramount*
- **The verb cluster** — *leverage, harness, foster, bolster, streamline, showcase, garner, elucidate*
- **The adjective-stack cluster** — *groundbreaking, transformative, seamless, captivating, compelling*
- **The newly-tainted cluster** — *genuine, fluff, quietly*
- **The hedge phrase** — *"it's important to note"*, *"it's worth noting"*

### Tier 3 — structural (counted in the panel only)

These can't be highlighted inline because they're patterns of the whole text.

- **Em dash density** — em dashes per 100 words. Above 2 is suspicious.
- **Three-fragment cadence** — three consecutive sentences under 40 characters. The *"Bold. Beautiful. Yours."* pattern.

## Sources

The vocabulary cluster is informed by academic studies on LLM-influenced word frequency in PubMed and arXiv (Kobak et al., Geng & Trotta, et al.) — see studies on the explosion in *delve* frequency for the canonical example.

## License

MIT.

## Built with

Manifest V3, vanilla JS, no build step, single prompt.
