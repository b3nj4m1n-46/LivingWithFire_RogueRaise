-- =============================================================================
-- Source Reliability Table for DoltgreSQL Staging Database
-- Per-source reliability weights for confidence scoring (Task 024)
-- Run against: postgresql://doltgres@localhost:5433/lwf_staging
-- =============================================================================

CREATE TABLE source_reliability (
  source_id_code        VARCHAR(20) PRIMARY KEY,        -- e.g., FIRE-01
  methodology_type      VARCHAR(50),                    -- experimental, literature_review, expert_opinion, meta_analysis, field_observation, modeling
  peer_reviewed         BOOLEAN DEFAULT false,
  sample_size           VARCHAR(20),                    -- numeric or 'unknown'
  geographic_scope      VARCHAR(100),                   -- e.g., 'Pacific Northwest', 'California', 'National'
  geographic_specificity VARCHAR(20),                   -- local, regional, national, global
  temporal_currency     VARCHAR(20),                    -- current (<=5yr), recent (5-15yr), dated (>15yr)
  publication_year      INTEGER,
  reliability_score     NUMERIC(3,2) DEFAULT 0.50,      -- 0.00 to 1.00
  reliability_reasoning TEXT,                            -- steward's justification
  auto_score            NUMERIC(3,2),                   -- AI-suggested score (before steward override)
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by            VARCHAR(100) DEFAULT 'system'
);

CREATE INDEX idx_reliability_score ON source_reliability(reliability_score);
