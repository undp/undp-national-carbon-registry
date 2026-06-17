#!/usr/bin/env bash
set -euo pipefail

cat <<'JSON'
{
  "s8": {
    "registryHolding": {
      "id": "reg-holding-enterprise-forest-2025",
      "assetName": "区域绿色权益演示资产-林业2025",
      "availableQuantity": 4000,
      "truthStatus": "SIMULATED_DEMO_DATA"
    },
    "tradingHolding": {
      "id": "trading-holding-1",
      "registryHoldingId": "reg-holding-enterprise-forest-2025",
      "availableQuantity": 200,
      "truthStatus": "SIMULATED_DEMO_DATA"
    },
    "listing": {
      "id": "listing-1",
      "quantity": 800,
      "unitPrice": 42,
      "status": "DEAL_CONFIRMED",
      "truthStatus": "SIMULATED_DEMO_DATA"
    },
    "deal": {
      "id": "deal-1",
      "quantity": 800,
      "totalAmount": 33600,
      "status": "CONFIRMED",
      "truthStatus": "SIMULATED_DEMO_DATA"
    },
    "contractPreview": {
      "title": "演示合同预览",
      "legalEffect": "演示文本，不具法律效力",
      "truthStatus": "SIMULATED_DEMO_DOCUMENT"
    },
    "statusCertificate": {
      "title": "模拟成交状态凭证",
      "settlementBoundary": "不含资金清算或银行结算",
      "truthStatus": "SIMULATED_DEMO_DOCUMENT"
    }
  },
  "s10": {
    "valuation": {
      "id": "valuation-1",
      "assessedAmount": 25200,
      "disclaimer": "融资测算结果仅用于演示",
      "truthStatus": "SIMULATED_DEMO_DATA"
    },
    "application": {
      "id": "finance-application-1",
      "status": "SIMULATED_APPROVED",
      "pledgeStatus": "PLEDGE_LOCKED",
      "reviewDisclaimer": "模拟审批不代表银行授信",
      "truthStatus": "SIMULATED_DEMO_DATA"
    }
  },
  "supervisionSummary": {
    "publicIndicators": {
      "truthStatus": "REAL_PUBLIC_DATA",
      "count": 5
    },
    "simulatedTradingActivity": {
      "truthStatus": "SIMULATED_DEMO_DATA",
      "transferCount": 1,
      "listingCount": 1,
      "dealCount": 1,
      "totalConfirmedQuantity": 800
    },
    "simulatedFinancingIntent": {
      "truthStatus": "SIMULATED_DEMO_DATA",
      "applicationCount": 1,
      "approvedCount": 1,
      "pledgeLockedCount": 1
    },
    "internalAssessmentTags": {
      "truthStatus": "INTERNAL_DEMO_LOGIC",
      "tags": ["demo-v1", "simulated-activity-separated", "operator-resettable"]
    }
  }
}
JSON
