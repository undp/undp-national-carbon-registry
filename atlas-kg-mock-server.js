#!/usr/bin/env node
/**
 * ATLAS CORTEX-KG Mock Server for Local Testing
 * 
 * This mock server simulates the ATLAS Knowledge Graph API v4.11.0
 * for testing UNDP × ATLAS integration locally without requiring
 * the full ATLAS stack deployment.
 * 
 * Usage:
 *   node atlas-kg-mock-server.js
 *   Server runs on http://localhost:8080
 */

const http = require('http');
const url = require('url');

const PORT = 8888; // Changed from 8080 to avoid conflict

// Mock ODD mapping database
const ODD_MAPPINGS = {
  'Forestry': {
    primary: ['13.1', '13.2', '15.1', '15.2'],
    secondary: ['2.4', '8.4'],
    confidence: 0.89
  },
  'Agriculture': {
    primary: ['2.3', '2.4', '13.1'],
    secondary: ['15.3', '12.2'],
    confidence: 0.85
  },
  'Energy': {
    primary: ['7.2', '7.3', '13.1'],
    secondary: ['9.4', '12.2'],
    confidence: 0.92
  },
  'Transport': {
    primary: ['11.2', '13.1', '9.1'],
    secondary: ['7.3', '3.6'],
    confidence: 0.81
  },
  'Waste': {
    primary: ['12.4', '12.5', '13.1'],
    secondary: ['11.6', '6.3'],
    confidence: 0.78
  }
};

// Morocco-specific keywords for NER
const MOROCCO_KEYWORDS = {
  'argan': { boost: 0.15, related_odds: ['15.1', '2.4'] },
  'cedar': { boost: 0.12, related_odds: ['15.1', '15.2'] },
  'oasis': { boost: 0.10, related_odds: ['15.3', '6.4'] },
  'souss-massa': { boost: 0.08, related_odds: ['15.1', '2.4'] },
  'atlas mountains': { boost: 0.10, related_odds: ['15.1', '15.4'] },
  'agroforestry': { boost: 0.12, related_odds: ['2.4', '15.1'] },
  'solar': { boost: 0.15, related_odds: ['7.2', '13.1'] },
  'wind': { boost: 0.13, related_odds: ['7.2', '13.1'] }
};

/**
 * Link project to ODDs via Knowledge Graph
 */
function linkProjectToODDs(projectData) {
  const { title = '', description = '', sector = 'Other', country = 'MA' } = projectData;
  
  // Get base ODD mapping from sector
  let mapping = ODD_MAPPINGS[sector] || {
    primary: ['13.1'],
    secondary: [],
    confidence: 0.5
  };
  
  // Boost confidence based on Morocco-specific keywords
  const fullText = `${title} ${description}`.toLowerCase();
  let confidenceBoost = 0;
  const additionalODDs = new Set();
  
  for (const [keyword, meta] of Object.entries(MOROCCO_KEYWORDS)) {
    if (fullText.includes(keyword)) {
      confidenceBoost += meta.boost;
      meta.related_odds.forEach(odd => additionalODDs.add(odd));
    }
  }
  
  // Merge additional ODDs
  const finalPrimaryODDs = [...new Set([...mapping.primary, ...additionalODDs])];
  const finalConfidence = Math.min(0.98, mapping.confidence + confidenceBoost);
  
  // Generate reasoning
  const reasoning = generateReasoning(sector, Array.from(additionalODDs));
  
  return {
    primary_odds: finalPrimaryODDs.slice(0, 5), // Top 5
    secondary_odds: mapping.secondary,
    confidence: parseFloat(finalConfidence.toFixed(2)),
    reasoning,
    sector_mapping: {
      [sector]: mapping.primary
    },
    kg_metadata: {
      atlas_version: '4.11.0-lts-quantique',
      kg_nodes_traversed: Math.floor(Math.random() * 50) + 10,
      inference_method: 'semantic_similarity',
      morocco_context: confidenceBoost > 0
    }
  };
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(sector, additionalODDs) {
  const reasons = [];
  
  switch(sector) {
    case 'Forestry':
      reasons.push('Climate action through carbon sequestration');
      reasons.push('Terrestrial ecosystems restoration');
      break;
    case 'Agriculture':
      reasons.push('Sustainable agriculture and food security');
      reasons.push('Climate-resilient farming practices');
      break;
    case 'Energy':
      reasons.push('Renewable energy transition');
      reasons.push('Greenhouse gas emissions reduction');
      break;
    case 'Transport':
      reasons.push('Sustainable urban transport');
      reasons.push('Reduced emissions from transportation');
      break;
    case 'Waste':
      reasons.push('Circular economy and waste management');
      reasons.push('Methane emissions reduction');
      break;
    default:
      reasons.push('General climate action');
  }
  
  if (additionalODDs.length > 0) {
    reasons.push('Morocco-specific co-benefits identified');
  }
  
  return reasons.join('. ') + '.';
}

/**
 * HTTP Request Handler
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health endpoint
  if (pathname === '/api/v4/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      version: '4.11.0-lts-quantique',
      kg_nodes: 17,
      uptime_seconds: Math.floor(process.uptime()),
      mock_mode: true
    }, null, 2));
    return;
  }
  
  // ODD Link endpoint
  if (pathname === '/api/v4/odd/link' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const projectData = JSON.parse(body);
        const result = linkProjectToODDs(projectData);
        
        res.writeHead(200);
        res.end(JSON.stringify(result, null, 2));
        
        // Log request for debugging
        console.log(`[${new Date().toISOString()}] POST /api/v4/odd/link`);
        console.log(`  Sector: ${projectData.sector || 'Unknown'}`);
        console.log(`  Confidence: ${result.confidence}`);
        console.log(`  Primary ODDs: ${result.primary_odds.join(', ')}`);
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Invalid JSON',
          message: error.message
        }, null, 2));
      }
    });
    
    return;
  }
  
  // 404 Not Found
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    message: `Endpoint ${pathname} not found`,
    available_endpoints: [
      'GET /api/v4/health',
      'POST /api/v4/odd/link'
    ]
  }, null, 2));
});

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ATLAS CORTEX-KG Mock Server v4.11.0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Available Endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/v4/health`);
  console.log(`  POST http://localhost:${PORT}/api/v4/odd/link`);
  console.log('');
  console.log('🧪 Mock Mode: Simulating ATLAS Knowledge Graph');
  console.log('   - 17 ODD nodes');
  console.log('   - Morocco-specific NER keywords');
  console.log('   - Sector-based ODD mapping');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down ATLAS KG Mock Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
