# Phase Zero Demo API Contract

Status: Phase 0 baseline  
Namespace: `/regional/demo/...`  
Stack: NestJS + TypeORM + PostgreSQL

## 1. Contract Rules

- New phase-zero demo APIs use `/regional/demo/...`.
- DTOs use camelCase.
- Every mixed real/simulated response exposes `truthStatus` or section-level
  truth labels.
- S12 indicators can be displayed as real public data only when `verified=true`.
- Write APIs must be idempotent or safely replayable where practical.
- Contract and certificate endpoints return demo artifacts only.
- No endpoint represents bank disbursement, legal electronic-contract validity,
  official clearing, or production exchange capability.

## 2. Session And Role

## 2.1 Common Error Shape

All demo endpoints should return this error shape:

```json
{
  "error": {
    "code": "DEMO_VALIDATION_ERROR",
    "message": "Quantity exceeds available demo holding.",
    "details": {
      "field": "quantity"
    }
  }
}
```

Common status codes:

| Status | Use |
| --- | --- |
| `400` | Invalid request body, invalid enum, or missing idempotency key where required. |
| `401` | Missing or invalid demo session. |
| `403` | Role cannot access the requested scope or action. |
| `404` | Demo entity not found in the caller's role scope. |
| `409` | Invalid state transition or idempotency-key conflict. |
| `422` | Valid request shape but domain invariant fails, such as insufficient quantity. |

## 2.2 Role Scope Matrix

| Endpoint Group | Government | Enterprise | Finance | Operator |
| --- | --- | --- | --- | --- |
| Session login/me/switch | Read/switch demo role | Read/switch demo role | Read/switch demo role | Read/switch demo role |
| S12 indicators/source | Read | Read limited public data | Read limited public data | Read |
| Registry holdings/transfer | Read summary only | Read/write own demo holdings | No write | Reset/support only |
| Trading holdings/listings/deals | Read supervision summary | Read/write own demo flow | Buyer-side read where configured | Reset/support only |
| Finance profile/valuation/application | Read aggregated summary | Read/write own intent | Read review queue | Reset/support only |
| Finance review | No write | No write | Write simulated review | Reset/support only |
| Supervision summary | Read | Read own summary | Read finance summary | Read |
| Reset | No | No | No | Write |

Phase 1 may implement a simplified operator reset path, but role checks must not
be frontend-only.

### `POST /regional/demo/session/login`

Request:

```json
{ "account": "gov_demo" }
```

Response:

```json
{
  "sessionId": "demo-session-gov",
  "user": {
    "id": "user-gov-demo",
    "account": "gov_demo",
    "role": "GOVERNMENT",
    "organizationId": "org-gov-demo"
  }
}
```

Allowed golden accounts:

| Account | Role |
| --- | --- |
| `gov_demo` | `GOVERNMENT` |
| `enterprise_demo` | `ENTERPRISE` |
| `finance_demo` | `FINANCE` |

### `POST /regional/demo/session/switch-role`

Demo convenience endpoint. The backend must still return role-scoped data.

Request:

```json
{ "sessionId": "demo-session-gov", "role": "ENTERPRISE" }
```

Response shape is the same as `GET /regional/demo/session/me`, with the updated
role and scoped organization data.

### `GET /regional/demo/session/me`

Returns the current demo user and organization scope.

## 3. S12 Indicators

### `GET /regional/demo/indicators`

Query parameters:

| Name | Meaning |
| --- | --- |
| `regionCode` | Optional province/city code. |
| `dimension` | Optional dimension such as `economy`, `energy`, `ecology`. |
| `verifiedOnly` | Defaults to `true` for real-data display. |

Response item:

```json
{
  "id": "s12-henan-gdp-2025",
  "regionCode": "410000",
  "regionName": "河南省",
  "indicatorCode": "GDP_CURRENT_PRICE",
  "indicatorName": "地区生产总值",
  "dimension": "economy",
  "period": "2025",
  "value": 66632.79,
  "targetValue": null,
  "unit": "亿元",
  "caliber": "初步核算，现价；增长速度按不变价格计算",
  "sourceLabel": "河南省统计局 2025年河南省国民经济和社会发展统计公报",
  "sourceUrl": "https://tjj.henan.gov.cn/2026/04-09/3341308.html",
  "sourceDocument": null,
  "sourceYear": 2026,
  "verified": true,
  "methodologyNote": "统计公报年度宏观指标；用于S12公开指标展示。",
  "truthStatus": "REAL_PUBLIC_DATA",
  "displayOrder": 10
}
```

### `GET /regional/demo/indicators/:id/source`

Returns source details and verification notes for one indicator.

Response:

```json
{
  "id": "s12-zhengzhou-power-consumption-2025",
  "sourceLabel": "郑州市统计局 2025年郑州市国民经济和社会发展统计公报",
  "sourceUrl": "https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml",
  "sourceDocument": null,
  "sourceYear": 2026,
  "caliber": "年度全社会用电量",
  "methodologyNote": "能源活动相关公开指标；不等同于碳排放量。",
  "verified": true,
  "verifiedBy": "Codex source check, 2026-06-17",
  "verifiedAt": "2026-06-17T00:00:00+08:00"
}
```

If `verified=false`, the list endpoint must hide the row when
`verifiedOnly=true`; the source endpoint may return it only to operator or
review contexts with `truthStatus: "UNVERIFIED_SOURCE_CANDIDATE"`.

## 4. Registry And Trading

### `GET /regional/demo/registry/holdings`

Returns role-scoped demo registry holdings.

### `POST /regional/demo/registry/transfers-to-trading`

Transfers a demo holding into the demo trading context.

Rules:

- source holding must be `REGISTRY_AVAILABLE`;
- quantity must be positive and available;
- repeated request with the same `idempotencyKey` returns the existing result.

### `GET /regional/demo/trading/holdings`

Returns demo trading-context holdings.

### `POST /regional/demo/trading/listings`

Creates a demo listing/agreement offer. Requires transferred trading quantity.

### `POST /regional/demo/trading/deals`

Confirms a demo deal and creates or queues:

- `DemoContractPreview`;
- simulated deal-status certificate;
- `RegistryHoldingChange` or equivalent demo trace.

### `GET /regional/demo/trading/deals/:id/contract-preview`

Returns a non-legal `演示合同预览` with the disclaimer
`演示文本，不具法律效力`.

### `GET /regional/demo/trading/deals/:id/status-certificate`

Returns `模拟成交状态凭证`. It must not be named or described as a real
clearing receipt, bank transfer receipt, or official settlement certificate.

## 5. Finance

### `GET /regional/demo/finance/profile/:enterpriseId`

Returns seeded enterprise profile, demo holdings, and internal ESG demo-v1
assessment.

### `POST /regional/demo/finance/valuations`

Request:

```json
{
  "enterpriseId": "org-enterprise-demo",
  "holdingId": "registry-holding-1",
  "quantity": 1000,
  "demoUnitPrice": 42,
  "discountFactor": 0.6
}
```

Formula:

```text
demo asset quantity x demo price x discount factor
```

### `POST /regional/demo/finance/applications`

Creates a financing-intent application. Use `质押意向申请`.

### `POST /regional/demo/finance/applications/:id/review`

Returns `模拟审批结果`. It must not represent bank disbursement or effective
credit approval.

## 6. Supervision And Reset

### `GET /regional/demo/supervision/summary`

Response separates:

- real public S12 indicators;
- simulated S8 activity;
- simulated S10 financing intent;
- internal assessment tags.

### `POST /regional/demo/reset`

Restores golden demo state. Verified S12 source records persist; transaction,
document, finance, and return-dashboard simulated state resets.

## 7. Phase 1 Minimum

Phase 1 may implement only:

- session login/switch/me;
- indicator list and source details;
- reset skeleton;
- static or minimal labelled S8/S10 prototype data if needed by the frontend.

Phase 2 adds the full S8/S10 state-machine APIs.
