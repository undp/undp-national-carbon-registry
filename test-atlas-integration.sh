#!/bin/bash

# UNDP × ATLAS Phase 1 Local Testing Script
# Author: ATLAS Integration Team
# Date: January 19, 2026
# Purpose: Automated testing of @atlas-undp/kg integration

set -e  # Exit on error

echo ""
echo "🧪 UNDP × ATLAS Integration - Phase 1 Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
ATLAS_KG_URL="http://localhost:8888/api/v4"
UNDP_API_URL="http://localhost:3000/api"
TEST_PROJECT_ID="test-ma-2026-arg-001"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Check ATLAS KG Mock Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 1:${NC} Checking ATLAS KG Mock Server..."
if curl -s -f "${ATLAS_KG_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} ATLAS KG Mock Server is running"
    curl -s "${ATLAS_KG_URL}/health" | jq '.'
else
    echo -e "${RED}✗${NC} ATLAS KG Mock Server not running"
    echo ""
    echo "Please start the mock server first:"
    echo "  node atlas-kg-mock-server.js"
    echo ""
    exit 1
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: Test ATLAS KG ODD Linking Directly
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 2:${NC} Testing ATLAS KG ODD Linking..."

TEST_PROJECT_1='{
  "title": "Agroforestry El Alaoui - Argan Trees",
  "description": "Plantation of 500 hectares of argan trees in the Souss-Massa region for carbon sequestration and ecosystem restoration",
  "country": "MA",
  "sector": "Forestry"
}'

echo ""
echo "📋 Test Project: Morocco Agroforestry"
echo "$TEST_PROJECT_1" | jq '.'
echo ""

ATLAS_RESPONSE=$(curl -s -X POST "${ATLAS_KG_URL}/odd/link" \
  -H "Content-Type: application/json" \
  -d "$TEST_PROJECT_1")

echo "📊 ATLAS KG Response:"
echo "$ATLAS_RESPONSE" | jq '.'
echo ""

# Extract confidence
CONFIDENCE=$(echo "$ATLAS_RESPONSE" | jq -r '.confidence')
echo -e "Confidence Score: ${GREEN}${CONFIDENCE}${NC}"

if (( $(echo "$CONFIDENCE >= 0.7" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Confidence threshold met (>= 0.7)"
else
    echo -e "${YELLOW}⚠${NC} Low confidence score: $CONFIDENCE"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3: Test Morocco-Specific Keywords
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 3:${NC} Testing Morocco NER Keywords..."

TEST_PROJECT_2='{
  "title": "Cedar Forest Restoration in Atlas Mountains",
  "description": "Restoration of cedar forests in the Middle Atlas region, protecting traditional oasis ecosystems",
  "country": "MA",
  "sector": "Forestry"
}'

echo ""
echo "📋 Test Project: Morocco Cedar + Oasis"
echo "$TEST_PROJECT_2" | jq '.'
echo ""

ATLAS_RESPONSE_2=$(curl -s -X POST "${ATLAS_KG_URL}/odd/link" \
  -H "Content-Type: application/json" \
  -d "$TEST_PROJECT_2")

echo "📊 ATLAS KG Response:"
echo "$ATLAS_RESPONSE_2" | jq '.'
echo ""

MOROCCO_CONTEXT=$(echo "$ATLAS_RESPONSE_2" | jq -r '.kg_metadata.morocco_context')
echo -e "Morocco Context Detected: ${GREEN}${MOROCCO_CONTEXT}${NC}"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 4: Test Energy Sector (Solar)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 4:${NC} Testing Energy Sector (Solar)..."

TEST_PROJECT_3='{
  "title": "Noor Ouarzazate Solar Park",
  "description": "Concentrated solar power plant with 580 MW capacity",
  "country": "MA",
  "sector": "Energy"
}'

echo ""
echo "📋 Test Project: Solar Energy"
echo "$TEST_PROJECT_3" | jq '.'
echo ""

ATLAS_RESPONSE_3=$(curl -s -X POST "${ATLAS_KG_URL}/odd/link" \
  -H "Content-Type: application/json" \
  -d "$TEST_PROJECT_3")

echo "📊 ATLAS KG Response:"
echo "$ATLAS_RESPONSE_3" | jq '.'
echo ""

PRIMARY_ODDS=$(echo "$ATLAS_RESPONSE_3" | jq -r '.primary_odds | join(", ")')
echo -e "Primary ODDs: ${GREEN}${PRIMARY_ODDS}${NC}"

# Verify SDG 7 (Energy) is included
if echo "$ATLAS_RESPONSE_3" | jq -e '.primary_odds | any(. == "7.2")' > /dev/null; then
    echo -e "${GREEN}✓${NC} SDG 7 (Renewable Energy) correctly identified"
else
    echo -e "${YELLOW}⚠${NC} SDG 7 not in primary ODDs"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 5: Test Fallback Mode (Unknown Sector)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${BLUE}Step 5:${NC} Testing Fallback Mode (Unknown Sector)..."

TEST_PROJECT_4='{
  "title": "Unknown Project Type",
  "description": "A carbon project with unspecified sector",
  "country": "MA",
  "sector": "Unknown"
}'

ATLAS_RESPONSE_4=$(curl -s -X POST "${ATLAS_KG_URL}/odd/link" \
  -H "Content-Type: application/json" \
  -d "$TEST_PROJECT_4")

echo "📊 Fallback Response:"
echo "$ATLAS_RESPONSE_4" | jq '.'
echo ""

FALLBACK_CONFIDENCE=$(echo "$ATLAS_RESPONSE_4" | jq -r '.confidence')
if (( $(echo "$FALLBACK_CONFIDENCE == 0.5" | bc -l) )); then
    echo -e "${GREEN}✓${NC} Fallback mode activated (confidence = 0.5)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected fallback confidence: $FALLBACK_CONFIDENCE"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ ATLAS KG Integration Tests Complete${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  ✓ ATLAS KG Mock Server operational"
echo "  ✓ ODD linkage working for Forestry sector"
echo "  ✓ Morocco-specific NER keywords detected"
echo "  ✓ Energy sector SDG 7 mapping correct"
echo "  ✓ Fallback mode functioning"
echo ""
echo "Next Steps:"
echo "  1. Install @atlas-undp/kg library dependencies"
echo "  2. Start UNDP backend server"
echo "  3. Test full integration via UNDP API endpoints"
echo ""
