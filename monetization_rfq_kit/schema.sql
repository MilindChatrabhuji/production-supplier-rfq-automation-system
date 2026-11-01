-- Cloudflare D1 SQL Schema for Private-Label Supplier Validation & Automated RFQ System
-- Package: @nexus/supplier-rfq-automation-system
-- Version: 1.0.0

-- 1. RFQ Specifications Table
CREATE TABLE IF NOT EXISTS rfqs (
  id TEXT PRIMARY KEY,
  private_label_brand TEXT NOT NULL,
  product_title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_launch_date TEXT,
  target_fob_price_usd REAL NOT NULL,
  moq_tiers_json TEXT NOT NULL,
  bill_of_materials_json TEXT NOT NULL,
  packaging_specs_json TEXT,
  qa_sla_json TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Audited Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  country TEXT NOT NULL,
  established_year INTEGER,
  facility_address TEXT,
  iso9001_certified INTEGER DEFAULT 0,
  iso13485_certified INTEGER DEFAULT 0,
  fda_establishment_registered INTEGER DEFAULT 0,
  fda_registration_number TEXT,
  ce_mdr_verified INTEGER DEFAULT 0,
  authorized_oem_odm INTEGER DEFAULT 1,
  ip_non_compete_signed INTEGER DEFAULT 1,
  audit_score_percent INTEGER DEFAULT 0,
  risk_tier TEXT DEFAULT 'LOW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Supplier Ingested Bids Table
CREATE TABLE IF NOT EXISTS supplier_bids (
  id TEXT PRIMARY KEY,
  rfq_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  submitted_currency TEXT DEFAULT 'USD',
  exchange_rate_to_usd REAL DEFAULT 1.0,
  quotes_matrix_json TEXT NOT NULL,
  weighted_competitiveness_score INTEGER DEFAULT 0,
  is_shortlisted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 4. Supplier Credential & Biocompatibility Evaluations
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  material_identifier TEXT,
  cytotoxicity_viability_percent REAL,
  sensitization_passed INTEGER DEFAULT 1,
  systemic_toxicity_passed INTEGER DEFAULT 1,
  biomedical_clearance_status TEXT,
  overall_compliance_score INTEGER DEFAULT 0,
  tooling_security_token TEXT,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 5. Algorithmic Counter-Offers Table
CREATE TABLE IF NOT EXISTS counter_offers (
  id TEXT PRIMARY KEY,
  bid_id TEXT NOT NULL,
  rfq_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  target_moq INTEGER NOT NULL,
  original_quoted_price_usd REAL NOT NULL,
  counter_proposed_price_usd REAL NOT NULL,
  discount_percent REAL,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bid_id) REFERENCES supplier_bids(id)
);

-- 6. Manufacturing Contracts & Escrow Milestones
CREATE TABLE IF NOT EXISTS manufacturing_contracts (
  id TEXT PRIMARY KEY,
  rfq_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  total_po_value_usd REAL NOT NULL,
  tranche_1_advance_released INTEGER DEFAULT 0,
  tranche_2_psi_released INTEGER DEFAULT 0,
  tranche_3_bl_released INTEGER DEFAULT 0,
  psi_audit_agency TEXT,
  psi_result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. B2B Retainer Subscriptions Table
CREATE TABLE IF NOT EXISTS retainer_subscriptions (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  tier_name TEXT NOT NULL, -- SOURCING_SPRINT ($500), MANAGED ($1,500), TURNKEY ($3,000)
  monthly_rate_usd REAL NOT NULL,
  payment_method TEXT NOT NULL, -- UPI / PAYPAL
  payment_status TEXT DEFAULT 'ACTIVE',
  last_billed_at TIMESTAMP,
  next_billing_at TIMESTAMP
);

-- Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bids_rfq ON supplier_bids(rfq_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);
CREATE INDEX IF NOT EXISTS idx_evaluations_supplier ON supplier_evaluations(supplier_id);
