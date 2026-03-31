<h1 align="center">xivanalysis — Level Sync Support</h1>
<p align="center"><em>An experimental version focused on level sync analysis</em></p>

---

> **This is NOT the official xivanalysis.**
> For the original tool, visit **[xivanalysis.com](https://xivanalysis.com/)**.

---

## About This Project

This project is a modified version of xivanalysis extended to handle **level sync scenarios** — situations where a player's effective level is below the job maximum, causing certain skills and traits to be unavailable.

The original xivanalysis assumes players are always at max level. This project addresses the false suggestions and incorrect analysis that arise when parsing logs from level sync content.

## Key Changes from Original

- **Level gating on modules** — Modules check a player's effective level before evaluating skills. Skills unavailable due to level sync no longer produce false suggestions.
- **ActionTimeline / CooldownDowntime / Defensives** — These modules now respect level gates and exclude abilities the player could not have accessed.
- **Skill data annotations** — Job skill data has been reviewed and tagged with level requirements where relevant.

## Current Status

**Work in progress — features are still being adjusted and may change without notice.**

- [ ] Full level-gate coverage across all 21 jobs
- [ ] Trait-gating logic (traits that modify skill behavior at specific levels)
- [ ] Handling of skills that change function at different levels (e.g., upgraded actions)
- [ ] Broader testing against level sync logs
