-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- UNDP × ATLAS Phase 1 - PostgreSQL Migration
-- Author: ATLAS Integration Team
-- Date: January 19, 2026
-- Version: 1.0.0
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable JSONB and GIN extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Table: project (UNDP Carbon Registry Projects)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS project (
    -- Core Fields (UNDP Existing)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    project_id VARCHAR(100) UNIQUE NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    sector VARCHAR(100),
    current_stage VARCHAR(50) DEFAULT 'PLANNING',
    
    -- Carbon Credit Fields
    estimated_credits DECIMAL(12, 2),
    issued_credits DECIMAL(12, 2) DEFAULT 0,
    verified_credits DECIMAL(12, 2) DEFAULT 0,
    
    -- Article 6 Paris Agreement
    itmo_eligible BOOLEAN DEFAULT false,
    corresponding_adjustment BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- ATLAS Integration Fields (NEW - Phase 1)
    odd_links JSONB,
    kg_relations JSONB,
    atlas_confidence DECIMAL(3, 2),
    atlas_fallback_mode BOOLEAN DEFAULT false,
    atlas_last_sync TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_country_code CHECK (LENGTH(country_code) = 2),
    CONSTRAINT valid_confidence CHECK (atlas_confidence BETWEEN 0 AND 1),
    CONSTRAINT valid_credits CHECK (issued_credits <= estimated_credits)
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Indexes for Performance
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Standard Indexes
CREATE INDEX idx_project_country ON project(country_code);
CREATE INDEX idx_project_sector ON project(sector);
CREATE INDEX idx_project_stage ON project(current_stage);
CREATE INDEX idx_project_created ON project(created_at DESC);

-- GIN Indexes for JSONB (ATLAS Integration)
CREATE INDEX idx_project_odd_links ON project USING GIN (odd_links);
CREATE INDEX idx_project_kg_relations ON project USING GIN (kg_relations);

-- Text Search Index
CREATE INDEX idx_project_title_trgm ON project USING GIN (title gin_trgm_ops);
CREATE INDEX idx_project_description_trgm ON project USING GIN (description gin_trgm_ops);

-- Composite Index for ATLAS queries
CREATE INDEX idx_project_atlas_sync ON project(atlas_last_sync DESC, atlas_confidence DESC) 
WHERE odd_links IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Table: atlas_kg_logs (Audit Trail for KG Operations)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS atlas_kg_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES project(id) ON DELETE CASCADE,
    operation VARCHAR(50) NOT NULL, -- 'LINK', 'VALIDATE', 'RESYNC'
    
    -- Request Data
    request_payload JSONB,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Response Data
    response_payload JSONB,
    response_status INT,
    response_time_ms INT,
    
    -- ATLAS Metadata
    atlas_version VARCHAR(50),
    kg_nodes_traversed INT,
    morocco_context BOOLEAN DEFAULT false,
    
    -- Error Handling
    error_message TEXT,
    fallback_activated BOOLEAN DEFAULT false,
    
    -- Index
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_atlas_logs_project ON atlas_kg_logs(project_id);
CREATE INDEX idx_atlas_logs_created ON atlas_kg_logs(created_at DESC);
CREATE INDEX idx_atlas_logs_operation ON atlas_kg_logs(operation);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Functions & Triggers
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_updated_at
    BEFORE UPDATE ON project
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Demo Data: Morocco Projects
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO project (
    project_id, title, description, country_code, sector,
    current_stage, estimated_credits, itmo_eligible
) VALUES 
(
    'MA-2026-ARG-001',
    'Agroforesterie El Alaoui - Argan Trees',
    'Plantation of 500 hectares of argan trees in the Souss-Massa region for carbon sequestration and ecosystem restoration. This project combines traditional Berber agroforestry practices with modern carbon credit mechanisms, supporting local women cooperatives and biodiversity conservation.',
    'MA',
    'Forestry',
    'VALIDATION',
    12000.00,
    true
),
(
    'MA-2026-CEDAR-002',
    'Cedar Forest Restoration - Atlas Mountains',
    'Restoration of 300 hectares of cedar forests in the Middle Atlas region, protecting traditional oasis ecosystems and preventing desertification. The project engages local communities in sustainable forest management practices.',
    'MA',
    'Forestry',
    'IMPLEMENTATION',
    8500.00,
    true
),
(
    'MA-2026-SOLAR-003',
    'Noor Ouarzazate Solar Park Extension',
    'Expansion of the concentrated solar power (CSP) plant by 200 MW, bringing total capacity to 780 MW. The project will reduce CO2 emissions by 240,000 tonnes annually and provide clean energy to 500,000 households.',
    'MA',
    'Energy',
    'PLANNING',
    760000.00,
    true
),
(
    'MA-2026-AGRI-004',
    'Climate-Smart Agriculture - Draa Valley',
    'Implementation of sustainable farming practices with agroforestry techniques across 1,200 hectares in the Draa Valley. Combining date palm cultivation with carbon sequestration and water conservation strategies.',
    'MA',
    'Agriculture',
    'VALIDATION',
    15000.00,
    true
),
(
    'MA-2026-WIND-005',
    'Tarfaya Wind Farm Project',
    'Development of 150 MW wind farm in southern Morocco, part of the national renewable energy strategy targeting 52% renewable electricity by 2030.',
    'MA',
    'Energy',
    'PLANNING',
    450000.00,
    true
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Views for ATLAS Integration Monitoring
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE VIEW v_atlas_integration_status AS
SELECT 
    p.project_id,
    p.title,
    p.country_code,
    p.sector,
    CASE 
        WHEN p.odd_links IS NOT NULL THEN 'LINKED'
        ELSE 'PENDING'
    END AS link_status,
    p.atlas_confidence,
    p.atlas_fallback_mode,
    p.atlas_last_sync,
    (p.odd_links->'primary') AS primary_odds,
    (p.odd_links->'secondary') AS secondary_odds,
    p.created_at
FROM project p
ORDER BY p.atlas_last_sync DESC NULLS LAST;

CREATE OR REPLACE VIEW v_atlas_performance_metrics AS
SELECT 
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE odd_links IS NOT NULL) AS linked_projects,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE odd_links IS NOT NULL) / NULLIF(COUNT(*), 0),
        2
    ) AS coverage_percentage,
    AVG(atlas_confidence) FILTER (WHERE atlas_confidence IS NOT NULL) AS avg_confidence,
    COUNT(*) FILTER (WHERE atlas_fallback_mode = true) AS fallback_count,
    MAX(atlas_last_sync) AS last_sync_time
FROM project;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Grant Permissions
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRANT ALL PRIVILEGES ON DATABASE undp_carbon_registry TO undp_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO undp_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO undp_admin;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration Complete
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ UNDP × ATLAS Phase 1 Migration Complete';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database: undp_carbon_registry';
    RAISE NOTICE '📋 Tables: project, atlas_kg_logs';
    RAISE NOTICE '📈 Views: v_atlas_integration_status, v_atlas_performance_metrics';
    RAISE NOTICE '🧪 Demo Data: 5 Morocco carbon projects';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Start ATLAS KG Mock: docker-compose up atlas-kg-mock';
    RAISE NOTICE '  2. Test ODD Linking: curl http://localhost:8888/api/v4/health';
    RAISE NOTICE '  3. Access UI: http://localhost:5173';
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
