# Registry Account Holdings Ledger Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the registry-side account, CCER holding, and asset-change ledger read model so the dashboard and future trading flows use registry facts instead of deriving balances ad hoc from project, trade, and retirement totals.

**Architecture:** Treat the registry system as the source of truth for account ownership, holdings, transfers, freezes, retirements, and balance snapshots. First implement a conservative read-model/projection over the existing `Company`, `CreditBlocksEntity`, `CreditTransactionsEntity`, and credit block views; only add new tables if the existing data cannot express a required registry event. Keep trading order book, cash account, fee, and settlement functions out of this plan except for the explicit transfer-in/transfer-out integration boundary.

**Tech Stack:** NestJS, TypeORM, Jest, Postgres, existing regional market API module, existing `credit_blocks_entity`, `credit_transactions_entity`, `credit.block.*` views, smoke seed scripts, React command center.

## Source Of Truth Basis

- `source_of_truth/README.md`: registry system is the factual source for lifecycle ownership and cancellation; trading system is the factual source for orders, trades, funds, market data, and settlement services.
- `source_of_truth/manuals/2023-registry-system-enterprise-account-opening-guide.pdf`: registry account opening and account-binding evidence.
- `source_of_truth/extracted-text/2023-voluntary-emission-reduction-registration-rules-trial.txt`: registry rules for project registration, CCER registration, holding, change, and cancellation.
- `source_of_truth/extracted-text/ccer-registry-system-spa-workflow-markers.txt`: workflow markers for project registration, verification registration, issuance, transfer, offset/cancellation.
- `docs/regional-carbon-market/terminology-guardrails.md`: distinguishes trading account from registry/CCER account and keeps registry transfer separate from market-price metadata.

## Priority Decision

### P0: Registry Account + Holding/Change Ledger

Implement this first. It is the missing fact layer behind:

- city balance;
- transfer-in and transfer-out;
- retirement/cancellation;
- dashboard regional metrics;
- future trading-system integration.

The target balance formula remains:

```text
availableBalance = issuedIn + transferIn - transferOut - retired - frozen
```

For the first pass, `frozen` may be zero unless existing `reservedCreditAmount` can be safely mapped.

### P1: Trading-System To Registry Transfer Interface

After the ledger read model is stable, define the handoff:

```text
executed trade -> registry transfer out/in -> buyer holding -> optional retirement
```

The current `MarketTradeExecutionEntity` remains executed OTC metadata, not an order book or settlement ledger.

### P2: Project Registration / Validation / Verification / Issuance Workflow

Only after account and holdings are stable, expand the upstream workflow that creates issued assets.

### P3: Trading Client, Listed Agreement, Funds, Fees, Settlement

Use the trading client manual later. Do not implement order books, matching, bank binding, fees, or cash settlement as part of this plan.

## Execution Flow

### Task 0: Evidence And Current Schema Audit

**Files:**
- Read: `source_of_truth/README.md`
- Read: `source_of_truth/extracted-text/2023-voluntary-emission-reduction-registration-rules-trial.txt`
- Read: `source_of_truth/extracted-text/ccer-registry-system-spa-workflow-markers.txt`
- Read: `docs/regional-carbon-market/terminology-guardrails.md`
- Read: `backend/services/libs/shared/src/entities/company.entity.ts`
- Read: `backend/services/libs/shared/src/entities/credit.blocks.entity.ts`
- Read: `backend/services/libs/shared/src/entities/credit.transactions.entity.ts`
- Read: `backend/services/libs/shared/src/view-entities/credit.block.balances.view.entity.ts`
- Read: `backend/services/libs/shared/src/view-entities/credit.block.transfers.view.entity.ts`
- Read: `backend/services/libs/shared/src/view-entities/credit.block.retirements.view.entity.ts`

**Steps:**
1. List every existing field that can support account identity, owner, previous owner, project reference, serial number, credit amount, reserved amount, transaction type, status, and create time.
2. Map SOT concepts to existing schema:
   - registry account;
   - CCER account;
   - holding;
   - issuance入账;
   - transfer out;
   - transfer in;
   - freeze/reserve;
   - retirement/cancellation.
3. Mark gaps as one of:
   - expressible from existing data;
   - requires derived projection only;
   - requires new persistent table;
   - out of scope.
4. Do not change code in this task.

**Verification:**
```bash
rg -n "登记账户|持有|变更|注销|转移|签发|冻结" source_of_truth/extracted-text docs/regional-carbon-market -S
rg -n "ownerCompanyId|previousOwnerCompanyId|reservedCreditAmount|CreditTransactionsEntity|CreditBlockBalancesViewEntity" backend/services/libs/shared/src -S
```

### Task 1: Registry Ledger Projection Contract

**Files:**
- Create: `backend/services/libs/shared/src/regional-market/registry-account-ledger.projection.ts`
- Create: `backend/services/libs/shared/src/regional-market/registry-account-ledger.projection.spec.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.module.ts`

**Step 1: Write failing tests**

Add tests for the intended projection contract:

```ts
it("computes account holdings from issued, transferred, retired, and reserved credits", () => {
  const result = projectRegistryAccountLedger({
    companies: [{ companyId: 900010, name: "郑州履约主体", regions: ["郑州市"], provinces: ["河南省"] }],
    blocks: [
      { creditBlockId: "CB-1", ownerCompanyId: 900010, previousOwnerCompanyId: 0, creditAmount: 1500, reservedCreditAmount: 0, projectRefId: "P-1", serialNumber: "SN-1" },
      { creditBlockId: "CB-2", ownerCompanyId: 900010, previousOwnerCompanyId: 900001, creditAmount: 900, reservedCreditAmount: 0, projectRefId: "P-2", serialNumber: "SN-2" },
    ],
    transactions: [
      { id: "RET-1", senderId: 900010, recieverId: 0, type: "Retired", status: "Completed", amount: 300, creditBlockId: "CB-2", projectRefId: "P-2", serialNumber: "SN-2" },
    ],
  });

  expect(result.accounts[0]).toMatchObject({
    companyId: 900010,
    city: "郑州市",
    issuedIn: 1500,
    transferIn: 900,
    transferOut: 0,
    retired: 300,
    frozen: 0,
    availableBalance: 2100,
  });
});
```

**Step 2: Run test to verify RED**

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/registry-account-ledger.projection.spec.ts --runInBand
```

Expected: fail because the projection file does not exist.

**Step 3: Implement minimal projection**

Implement a pure function:

```ts
export type RegistryAccountLedgerInput = {
  companies: Array<Record<string, any>>;
  blocks: Array<Record<string, any>>;
  transactions: Array<Record<string, any>>;
};

export type RegistryAccountLedgerAccount = {
  companyId: number;
  companyName: string;
  province?: string;
  city?: string;
  issuedIn: number;
  transferIn: number;
  transferOut: number;
  retired: number;
  frozen: number;
  availableBalance: number;
};

export function projectRegistryAccountLedger(
  input: RegistryAccountLedgerInput
): { accounts: RegistryAccountLedgerAccount[] } {
  // Minimal implementation from tests.
}
```

Rules:
- `issuedIn`: credit blocks owned by account where `previousOwnerCompanyId` is missing/zero and owner is not zero.
- `transferIn`: credit blocks owned by account where `previousOwnerCompanyId` is another non-zero company.
- `transferOut`: completed transfer transactions where account is sender.
- `retired`: completed retired transactions where account is sender.
- `frozen`: sum `reservedCreditAmount` on owned credit blocks.
- `availableBalance`: owned credit amount minus frozen minus completed retirements, unless tests prove a better mapping.

**Step 4: Run test to verify GREEN**

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/registry-account-ledger.projection.spec.ts --runInBand
```

Expected: pass.

**Step 5: Commit**

```bash
git add backend/services/libs/shared/src/regional-market/registry-account-ledger.projection.ts backend/services/libs/shared/src/regional-market/registry-account-ledger.projection.spec.ts backend/services/libs/shared/src/regional-market/regional-market.module.ts
git commit -m "feat: add registry account ledger projection"
```

### Task 2: Registry Ledger Service

**Files:**
- Create: `backend/services/libs/shared/src/regional-market/registry-account-ledger.service.ts`
- Create: `backend/services/libs/shared/src/regional-market/registry-account-ledger.service.spec.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market.module.ts`

**Step 1: Write failing tests**

Test repository integration with mocks:

```ts
it("loads companies, credit blocks, and completed credit transactions for the ledger projection", async () => {
  const service = new RegistryAccountLedgerService(
    companyRepository,
    creditBlocksRepository,
    creditTransactionsRepository
  );

  await service.getRegistryAccountLedger();

  expect(companyRepository.find).toHaveBeenCalled();
  expect(creditBlocksRepository.find).toHaveBeenCalled();
  expect(creditTransactionsRepository.find).toHaveBeenCalledWith({
    where: { status: "Completed" },
  });
});
```

**Step 2: Run test to verify RED**

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/registry-account-ledger.service.spec.ts --runInBand
```

Expected: fail because service does not exist.

**Step 3: Implement minimal service**

Inject repositories for:
- `Company`
- `CreditBlocksEntity`
- `CreditTransactionsEntity`

Expose:

```ts
async getRegistryAccountLedger() {
  const [companies, blocks, transactions] = await Promise.all([...]);
  return projectRegistryAccountLedger({ companies, blocks, transactions });
}
```

**Step 4: Run tests**

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/registry-account-ledger.service.spec.ts libs/shared/src/regional-market/registry-account-ledger.projection.spec.ts --runInBand
```

Expected: pass.

**Step 5: Commit**

```bash
git add backend/services/libs/shared/src/regional-market/registry-account-ledger.service.ts backend/services/libs/shared/src/regional-market/registry-account-ledger.service.spec.ts backend/services/libs/shared/src/regional-market/regional-market.module.ts
git commit -m "feat: expose registry account ledger service"
```

### Task 3: Registry Ledger API Endpoint

**Files:**
- Modify: `backend/services/src/regional-market-api/regional.market.api.service.ts`
- Modify: `backend/services/src/regional-market-api/regional.market.api.controller.ts`
- Test: `backend/services/src/regional-market-api/regional.market.api.controller.spec.ts`

**Step 1: Write failing controller test**

Add a test for:

```text
GET /regional/registry/accounts/ledger
```

Expected response shape:

```json
{
  "accounts": [
    {
      "companyId": 900010,
      "companyName": "郑州履约主体",
      "province": "河南省",
      "city": "郑州市",
      "issuedIn": 1500,
      "transferIn": 900,
      "transferOut": 0,
      "retired": 300,
      "frozen": 0,
      "availableBalance": 2100
    }
  ]
}
```

**Step 2: Run test to verify RED**

Run:

```bash
cd backend/services
yarn test src/regional-market-api/regional.market.api.controller.spec.ts --runInBand
```

Expected: fail because route/service method is missing.

**Step 3: Implement endpoint**

Add service method:

```ts
getRegistryAccountLedger() {
  return this.registryAccountLedgerService.getRegistryAccountLedger();
}
```

Add controller route:

```ts
@Get("registry/accounts/ledger")
async getRegistryAccountLedger() {
  return this.regionalMarketAPIService.getRegistryAccountLedger();
}
```

**Step 4: Run tests**

Run:

```bash
cd backend/services
yarn test src/regional-market-api/regional.market.api.controller.spec.ts libs/shared/src/regional-market/registry-account-ledger.service.spec.ts --runInBand
```

Expected: pass.

**Step 5: Commit**

```bash
git add backend/services/src/regional-market-api/regional.market.api.service.ts backend/services/src/regional-market-api/regional.market.api.controller.ts backend/services/src/regional-market-api/regional.market.api.controller.spec.ts
git commit -m "feat: add registry account ledger api"
```

### Task 4: Dashboard Regional Metrics Use Registry Ledger

**Files:**
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts`
- Modify: `backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts`

**Step 1: Write failing test**

Add a test proving dashboard city balance comes from the registry ledger projection when available:

```ts
it("uses registry ledger balances for regional availableBalance", async () => {
  // Given project/trade/retirement aggregates match existing dashboard totals
  // And registry ledger returns Zhengzhou availableBalance 2100
  // Expect regionalMetrics Zhengzhou availableBalance to be 2100
});
```

**Step 2: Run test to verify RED**

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/regional-market-projection.service.spec.ts --runInBand
```

Expected: fail because dashboard still derives balance locally.

**Step 3: Inject and use ledger service**

Use the registry ledger as the source for:
- `availableBalance`
- optional future `frozen`
- account-level city mapping when company context exists.

Keep existing signed/traded/retired fields for explanatory breakdown, but do not let them override ledger balance.

**Step 4: Run tests**

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/regional-market-projection.service.spec.ts libs/shared/src/regional-market/registry-account-ledger.service.spec.ts --runInBand
```

Expected: pass.

**Step 5: Commit**

```bash
git add backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts backend/services/libs/shared/src/regional-market/regional-market-projection.service.spec.ts
git commit -m "feat: source regional balances from registry ledger"
```

### Task 5: Smoke Seed And Consistency Assertions

**Files:**
- Modify: `scripts/regional-market-smoke.sh`
- Modify: `scripts/regional-market-smoke.test.sh`

**Step 1: Add failing smoke assertion**

Extend `dashboard-demo-smoke` to assert:

```text
registry ledger Zhengzhou availableBalance = 2100
registry ledger Zhoukou availableBalance = 1200
dashboard regional Zhengzhou availableBalance = registry ledger Zhengzhou availableBalance
dashboard regional Zhoukou availableBalance = registry ledger Zhoukou availableBalance
```

**Step 2: Run smoke to verify RED if API route is not wired**

Run:

```bash
scripts/regional-market-smoke.sh dashboard-demo-smoke
```

Expected: fail until the new endpoint and dashboard integration are wired.

**Step 3: Update seed if needed**

Only update seed rows if existing `credit_blocks_entity` and `credit_transactions_entity` rows cannot express:
- 15 account holders;
- 10 issued 1500-credit blocks;
- 15 completed transfer records;
- 10 completed retirement records;
- pending retirement exclusion.

**Step 4: Run smoke**

Run:

```bash
scripts/regional-market-smoke.sh seed-dashboard-demo
scripts/regional-market-smoke.sh dashboard-demo-smoke
```

Expected: pass.

**Step 5: Commit**

```bash
git add scripts/regional-market-smoke.sh scripts/regional-market-smoke.test.sh
git commit -m "test: assert registry ledger dashboard consistency"
```

### Task 6: Frontend Readiness Boundary

**Files:**
- Modify: `web/src/Pages/CommandCenter/regionalMarketApi.ts`
- Modify: `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- Test: `scripts/e2e/regional-dashboard-ui-smoke.spec.cjs`

**Step 1: Write failing UI/API type expectation**

Extend the frontend type with optional registry ledger status:

```ts
registryLedger?: {
  accounts?: Array<{
    companyId?: number;
    availableBalance?: number;
  }>;
};
```

Add e2e text assertion only if surfaced in UI:

```text
余额口径：登记簿持仓
```

**Step 2: Run build/test to verify RED**

Run:

```bash
cd web
yarn build
```

If no UI text is added, this task may remain API-type only.

**Step 3: Add minimal UI boundary text**

Do not add a new large panel. Add a small footer/boundary tag:

```text
余额口径：登记簿持仓
```

Only show it when registry ledger data is present or dashboard `dataStatus` is real.

**Step 4: Run build**

Run:

```bash
cd web
yarn build
```

Expected: pass.

**Step 5: Commit**

```bash
git add web/src/Pages/CommandCenter/regionalMarketApi.ts web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx scripts/e2e/regional-dashboard-ui-smoke.spec.cjs
git commit -m "feat: label dashboard balance as registry holdings"
```

### Task 7: Documentation Update

**Files:**
- Modify: `docs/regional-carbon-market/registry-exchange-system-design-draft.md`
- Modify: `docs/regional-carbon-market/terminology-guardrails.md`
- Modify: `docs/regional-carbon-market/dashboard-sot-compliance-review.md`

**Steps:**
1. Document the registry account ledger as the dashboard balance source.
2. Document that trading execution metadata is not the source of balance.
3. Document the integration boundary:

```text
交易系统成交确认 -> 登记系统转出/转入 -> 登记簿余额更新 -> 注销/抵销
```

4. Keep listed-agreement trading, bank settlement, fees, and clearing explicitly out of current scope.

**Verification:**

```bash
rg -n "余额口径|登记簿持仓|交易系统成交确认|登记系统转出" docs/regional-carbon-market -S
```

**Commit:**

```bash
git add docs/regional-carbon-market/registry-exchange-system-design-draft.md docs/regional-carbon-market/terminology-guardrails.md docs/regional-carbon-market/dashboard-sot-compliance-review.md
git commit -m "docs: define registry ledger as balance source"
```

## Final Verification

Run:

```bash
cd backend/services
yarn test libs/shared/src/regional-market/registry-account-ledger.projection.spec.ts --runInBand
yarn test libs/shared/src/regional-market/registry-account-ledger.service.spec.ts --runInBand
yarn test libs/shared/src/regional-market/regional-market-projection.service.spec.ts --runInBand
yarn test src/regional-market-api/regional.market.api.controller.spec.ts --runInBand
yarn build

cd ../../..
scripts/regional-market-smoke.sh seed-dashboard-demo
scripts/regional-market-smoke.sh dashboard-demo-smoke

cd web
yarn build
```

Expected:
- all backend tests pass;
- smoke seed and dashboard smoke pass;
- frontend build passes;
- Zhengzhou balance remains `2100`;
- Zhoukou balance remains `1200`;
- dashboard documentation states that balance comes from registry holdings.

## Explicit Non-Goals

- Do not build listed-agreement order book or matching.
- Do not build bank account binding.
- Do not build cash ledger, settlement gateway, fee calculation, or clearing.
- Do not redesign full project registration approval workflow.
- Do not make dashboard depend on frontend-only demo data when real registry ledger data is available.

## Execution Handoff

Plan complete and saved to `docs/plans/2026-06-15-registry-account-holdings-ledger.md`.

Two execution options:

1. **Subagent-Driven (this session)** - dispatch a fresh implementation agent per task, review between tasks, and keep tight checkpoints.
2. **Parallel Session (separate)** - open a new session in this worktree and use `superpowers:executing-plans` to execute the plan task-by-task.

