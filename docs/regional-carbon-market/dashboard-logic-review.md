# Regional Dashboard Logic Review

## Original Concerns

The command-center playback was challenged on four logic points:

1. Projects and account activity appeared to come only from Zhengzhou.
2. Issued credits appeared to come only from Luoyang.
3. OTC agreement trades did not clearly show transaction counterparties.
4. Map coloring looked fixed instead of being connected to carbon-governance state.

## Implemented Logic

The frontend demo sequence now uses one event timeline for the visual story:

- registration events distribute projects and accounts across Henan cities;
- issuance events are tied to project-supply cities;
- OTC trades move credits from seller/project cities to buyer/compliance cities;
- retirements are tied back to buyer/compliance cities;
- the map derives city color bands from the same city state used by KPI, table, and insight panels.

The backend projection now also returns city-level `regionalMetrics` when source rows contain enough company and location evidence. Recent trade rows are enriched with `sellerName`, `buyerName`, `sellerCity`, `buyerCity`, and `counterparty` so the UI can show the transacting parties instead of a generic sector label.

## Remaining Boundary

The regional color score is still a governance display score, not a verified emissions ranking. It should be treated as:

- real projection when backed by account, project, issuance, trade, and retirement rows with city evidence;
- demo inference when running from the frontend playback dataset;
- not a production regulatory rating until a formal emissions baseline, city inventory, and scoring methodology are approved.

The dashboard continues to avoid unsupported exchange claims. It shows executed OTC agreement trade metadata and registry lifecycle aggregates. It does not show order-book depth, matching, platform clearing, bank settlement, bid/ask quotes, or official listed-agreement trading workflows.

## Review Checklist

- Confirm that the final playback contains multiple project cities, not only Zhengzhou.
- Confirm that issuance is distributed across project cities, not only Luoyang.
- Confirm that recent OTC trade rows display seller and buyer.
- Confirm that map colors change from derived city state, not index-based fixed colors.
- Confirm that boundary text says map colors are demo inference when real emissions baselines are missing.
- Confirm that unsupported exchange, clearing, and bank-settlement claims are absent.
