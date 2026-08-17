# Article 6.2 Credit Lifecycle — Business Flow

**Purpose**: this document explains, in business terms, how a unit of mitigation moves through the registry from issuance to final disposition under Article 6.2 of the Paris Agreement — what each action means, why it is available or restricted at each stage, and how the pieces connect. It is a requirements-and-flow narrative, not an implementation guide.

**Decision references**: 2/CMA.3 (Article 6.2 guidance), 3/CMA.3 (cooperative approaches), 4/CMA.6 Annex II (Authorization and Enforcement Framework), 6/CMA.4 Annex I (ITMO identification).

---

## 1. MO Issuance

A project's verified emission reductions are issued into the registry as **Mitigation Outcome (MO)** credit blocks — the base unit every credit in the system starts as. Issuance itself is unchanged by this work; it is noted here only as the starting point of the lifecycle everything below describes.

An MO is, by default, a **domestic** unit: it has not been authorized for use outside the host country, and none of the international bookkeeping described later in this document (corresponding adjustments, first transfer) applies to it yet. Every MO block can only become internationally usable through the ITMO Authorization step described in Section 4.

---

## 2. What an MO block can do

Until a block is authorized for international use, three actions are available on it:

### 2.1 Local (domestic) Transfer

An MO block can be transferred between organisations within the country. This is a purely domestic ownership change — it carries no Article 6.2 implications, because the credit never leaves the host country's accounting boundary.

### 2.2 Retirement (domestic use)

Retiring an MO block permanently removes it from circulation, and the registry records *why* it was retired:

- **Voluntary Cancellation** — the credit is cancelled outside of any NDC or market claim (e.g. a corporate voluntary offset). No accounting adjustment is triggered.
- **Use Towards NDC** — the credit is counted toward the host country's *own* Nationally Determined Contribution. This subtype is exclusive to MO blocks precisely because it stays entirely domestic: it does not constitute an international transfer, and therefore does not require a corresponding adjustment.
- **OMGE Cancellation** — the credit is cancelled specifically in support of Overall Mitigation in Global Emissions, i.e. retired without being counted toward anyone's NDC at all.

An MO block cannot be retired as a **first transfer** — neither toward another Party's NDC nor for Other International Mitigation Purposes (OIMP). Both of those are inherently international, and by definition require the block to first be authorized as an ITMO (Section 4).

### 2.3 ITMO Authorization (request)

An MO block can be put forward for authorization as an **Internationally Transferred Mitigation Outcome (ITMO)** — the step that turns a domestic unit into one that may be used internationally. This is the gateway into everything described in Sections 4–5 below; the request itself is described here as an available MO-block action, and its full mechanics — what has to be in place first, what is chosen at request time, and how it is decided — are covered once the prerequisite (an active Cooperative Approach) has been introduced.

---

## 3. Cooperative Approaches and Initial Reports

ITMO Authorization cannot happen in a vacuum — Article 6.2 requires that international use of mitigation outcomes happen under a **Cooperative Approach**: a bilateral or multilateral arrangement between participating Parties. This section covers how a Cooperative Approach comes into being and reaches the point where it can back an ITMO Authorization. (The Cooperative Approach and Initial Report records themselves were not restructured as part of this work — this section covers the governing idea, not their internal detail.)

### 3.1 Creating a Cooperative Approach

A Cooperative Approach is created identifying its participating Parties and which of them is the host. At creation it starts in **Draft** — it exists as a record, but is not yet usable for any international activity.

A Draft (or Active) Cooperative Approach can have **Authorized Entities** attached to it: specific organisations named as authorized to act under the arrangement. These become relevant later, when a purpose-restricted ITMO retirement (First Transfer For OIMP) requires naming one of them as the recipient (Section 5).

### 3.2 The Initial Report — satisfying the initial-notification requirement

Before a Cooperative Approach can be relied upon for international activity, the host Party must submit an **Initial Report** against it — the registry's implementation of the Article 6.2 ¶18 initial-notification requirement. The report can be revised while the Cooperative Approach remains in Draft, and every revision is kept rather than overwritten, preserving a full history of what was notified and when.

Only once an Initial Report has been **submitted** can the Cooperative Approach transition from **Draft to Active**. This is a deliberate gate: an arrangement cannot back any international mitigation activity — including ITMO Authorization — until its initial notification obligation has been met.

### 3.3 The Active Cooperative Approach's further lifecycle

Once Active, a Cooperative Approach can be:

- **Suspended** — a temporary, reversible hold (it can return to Active).
- **Completed** or **Revoked** — both terminal. Revocation in particular signals that the authorizing Party has withdrawn authorization for ITMOs under that arrangement; a Revoked Cooperative Approach can never again back a new first transfer.

Only an **Active** Cooperative Approach can be selected when authorizing an ITMO — this is the link back to Section 2.3.

---

## 4. ITMO Authorization — comprehensive

This is the step that converts a domestic MO block into an internationally usable ITMO.

### 4.1 Preconditions

- The block being authorized must currently be an **MO** (an already-authorized ITMO block cannot be re-authorized).
- The Cooperative Approach selected to back the authorization must be **Active** (Section 3.3).

### 4.2 What is chosen at request time

- **Amount** — the quantity of credits, up to the block's available balance, to authorize. A partial amount splits the block: the authorized portion becomes a new ITMO block, and the remainder stays behind as MO.
- **Cooperative Approach** — which Active arrangement the authorization is made under. This is what later resolves the destination country/counterparty for a cross-border retirement (Section 5), since the arrangement's participating Parties are already on record.
- **Authorization Purpose** (optional) — what the resulting ITMO is being authorized *for*: use toward the acquiring Party's NDC, Other International Mitigation Purposes, or another stated purpose. This choice is what gates which retirement subtypes are later available on the resulting ITMO block (Section 5). If no purpose is stated, the block is treated as authorized for NDC use.

### 4.3 Decision

The request is reviewed by the host country's Designated National Authority, who may:

- **Approve** it (in full or in part — a partial approval splits the block, as above), which stamps the approved portion as an ITMO carrying the chosen Cooperative Approach and purpose.
- **Reject** it, leaving the block as MO.

While a request is pending, the requesting organisation may also **cancel** it themselves.

---

## 5. ITMO Retirements — comprehensive, purpose-gated

Once a block is an ITMO, it is retired using one of two subtypes named for exactly what they are: a **first transfer** out of the host country. Which one is available is shaped by the purpose the block was authorized for (Section 4.2):

- **First Transfer Towards NDC** — available only when the block's authorization purpose is **NDC**. This represents the acquiring Party counting the ITMO toward its own Nationally Determined Contribution. (Note this is a distinct subtype from the MO-only, purely domestic "Use Towards NDC" described in Section 2.2 — the two look similar in name but represent opposite ends of the domestic/international boundary.)
- **First Transfer For OIMP** (Other International Mitigation Purposes) — available only when the authorization purpose is **OIMP or Other**. This retirement additionally requires naming one of the Cooperative Approach's Authorized Entities (Section 3.1) as the recipient, and resolves its destination from the Cooperative Approach's participating Parties.

These two subtypes are mutually exclusive by purpose: an ITMO authorized for NDC use cannot be retired for OIMP, and vice versa. This is the business rule that prevents an ITMO from being claimed toward more than one Party's accounting in a way inconsistent with what it was actually authorized for.

**Approval of either subtype is the moment the credit is considered to have left the host country.** Everything before this point (issuance, ITMO authorization itself) is domestic bookkeeping; the first transfer is the event that triggers the host country's obligation to record a **Corresponding Adjustment** (Section 7).

---

## 6. Voluntary Cancellation and OMGE Cancellation — available regardless of purpose

Unlike the two purpose-gated subtypes above, **Voluntary Cancellation** and **OMGE Cancellation** are available on a block **regardless of whether it is MO or ITMO, and regardless of what purpose an ITMO was authorized for**. Neither of these represents a Party claiming the credit toward its own NDC, so neither is subject to the NDC/OIMP purpose restriction described in Section 5 — they are cancellations outside that international-claim bookkeeping entirely, and never trigger a first transfer or a corresponding adjustment.

---

## 7. Corresponding Adjustments

A Corresponding Adjustment is the host country's accounting correction for ITMOs that have left the country (Section 5) — it prevents the same mitigation outcome from being counted toward both the host's and the acquiring Party's NDC.

### 7.1 Underlying data

Two pieces of national data feed every Corresponding Adjustment calculation, and both are treated as periodically migrated in from outside the registry rather than entered through it:

- **NDC targets** — the country's own Nationally Determined Contribution ceiling, either a single-year figure or a multi-year budget spanning a defined period.
- **National GHG inventory** — the country's reported emissions for a given year, broken down by sector, used as the baseline the adjustment is applied against.

(As with Cooperative Approaches and Initial Reports, these entities were not restructured as part of this work — the point that matters here is that they are externally sourced, periodically-refreshed inputs, not the specifics of their fields.)

### 7.2 Calculation

A Corresponding Adjustment is calculated for a given year and Cooperative Approach, using whichever method matches the applicable NDC target:

- **Single-year target**: the year's first-transferred ITMOs (net of any acquired) are added to that year's reported inventory, and the result is checked against the year's target — this is the safeguard check.
- **Multi-year budget**: during the budget period, only an *indicative* annual figure is reported (the cumulative first-transferred amount so far, divided by elapsed years) — a full safeguard check as meaningless mid-period. Only once the period's final year is reached is the full cumulative balance reconciled against the whole-period budget.

### 7.3 Review lifecycle

A calculated adjustment starts as **Draft**, where it can still be recalculated in place, and moves to **Submitted** and finally **Approved** by the host country's Designated National Authority — a controlled review step rather than an immediate, final calculation.

### 7.4 Registry-wide reconciliation

Because Corresponding Adjustments are calculated per Cooperative Approach and year, the registry also surfaces an all-time, registry-wide reconciliation view: total first-transferred ITMOs (net of acquired) versus the total already recorded as Corresponding Adjustments (including Draft ones), highlighting any outstanding gap that still needs an adjustment to be calculated and recorded. This gives the Designated National Authority a single place to see whether the country's Corresponding Adjustment bookkeeping is caught up with its actual first-transfer activity.
