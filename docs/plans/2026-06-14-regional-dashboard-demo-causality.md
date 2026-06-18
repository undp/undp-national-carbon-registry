# Regional Dashboard Demo Causality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the 0-to-50 dashboard playback follow a credible regional carbon governance story instead of a visually animated but weakly connected dataset.

**Architecture:** Keep the change in the frontend demo layer. Replace the thin event records with city baselines, actors, project provenance, trade counterparties, and a derived governance score. Drive map color, map markers, KPI panels, project rows, trade rows, and insight cards from one snapshot.

**Tech Stack:** React, TypeScript, SCSS, existing Henan GeoJSON projection, Vite build.

### Task 1: Demo Model

**Files:**
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`

**Steps:**
1. Add city baseline fields: role, coordinate, baseline emissions, governance target, starting governance score, and dominant sector.
2. Add actor/project pools so account, project, issue, trade, and retirement events have plausible owners and counterparties.
3. Replace round-robin `demoEvents` with a planned sequence:
   - 15 account/project registration events across buyer and seller cities.
   - 10 issuance events tied to project cities.
   - 15 trades from seller project cities to buyer compliance cities.
   - 10 retirements tied to buyer compliance cities.
4. Include buyer, seller, sellerCity, buyerCity, projectOwner, accountOwner, sector, and governance impact fields.

### Task 2: Snapshot Derivation

**Files:**
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`

**Steps:**
1. Derive city states from the event timeline.
2. Track account counts, project counts, issued credits, sold credits, bought credits, retired credits, trade value, and latest event per city.
3. Compute a demo governance score from baseline pressure plus event effects.
4. Keep the final totals close to the previous demo scale, but make the distribution explainable.

### Task 3: Map and Tables

**Files:**
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Modify: `web/src/Pages/CommandCenter/commandCenter.scss`

**Steps:**
1. Remove fixed `index % 4` region coloring.
2. Give each map region a class based on the derived city governance band: pressure, improving, balanced, leading.
3. Make markers show active cities and event direction instead of hard-coded "Zhengzhou account / Luoyang issuance" labels.
4. Change recent trades table columns to show seller to buyer, volume, amount, and average price.
5. Update map and footer boundary text to say the color is demo inference, not a real city ranking.

### Task 4: Verification

**Files:**
- No code files expected.

**Steps:**
1. Run `cd web && yarn build`.
2. Sync changed frontend files to omarchy.
3. Rebuild and restart omarchy preview.
4. Capture a 1920x1080 screenshot at the final playback state.
5. Dump DOM and assert final text includes trade counterparties, final progress, and governance boundary wording.
