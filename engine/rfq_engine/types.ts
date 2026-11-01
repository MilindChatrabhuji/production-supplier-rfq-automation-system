/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/rfq_engine/types.ts
 *
 * Strict Compliance:
 * - RFC 2606 Sample Domains only (.example.com)
 * - 100% Modern Clinical Medicine & ISO 10993 Biocompatibility Standards
 * - Strict Zero Alternative Medicine or Banned Remainder Tokens
 */

export type IncotermsCode = 'EXW' | 'FOB' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' | 'CIF';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'SGD';

export interface BillOfMaterialsItem {
  itemId: string;
  partName: string;
  specification: string;
  materialGrade: string; // e.g., 'Medical-Grade Silicone USP Class VI', 'SUS316L Stainless Steel'
  quantityPerUnit: number;
  toleranceStandard: string; // e.g., 'ISO 2768-m', 'ASTM F136'
  targetUnitCostUsd: number;
  supplierNotes?: string;
}

export interface RFQSpecification {
  rfqId: string;
  privateLabelBrand: string;
  productTitle: string;
  category: string;
  targetMktLaunchDate: string;
  moqTiers: number[]; // e.g., [1000, 5000, 10000, 25000]
  targetFobPriceUsd: number;
  billOfMaterials: BillOfMaterialsItem[];
  packagingRequirements: {
    primaryPackaging: string;
    secondaryPackaging: string;
    dropTestStandard: string; // e.g., 'ISTA 2A', 'ISO 2248'
    barcodingStandard: string; // 'GS1-128', 'UPC-A'
    sterilizationRequirement?: 'Gamma Radiation' | 'Ethylene Oxide' | 'Autoclave' | 'None';
  };
  qualityAssuranceSLA: {
    maxAcceptableDefectRateAql: {
      criticalDefects: number; // 0.0%
      majorDefects: number;    // 1.0% or 1.5%
      minorDefects: number;    // 2.5% or 4.0%
    };
    preShipmentInspectionRequired: boolean;
    goldenSampleSignOffRequired: boolean;
    penaltyPerWeekDelayPercent: number; // e.g., 1.5% of PO value per week
  };
  contactEndpoint: string; // e.g., 'https://rfq.example.com/api/v1/bids/submit'
  createdIso: string;
}

export interface SupplierCredentials {
  supplierId: string;
  legalEntityName: string;
  country: string;
  establishedYear: number;
  facilityAddress: string;
  certifications: {
    iso9001Certified: boolean;
    iso13485Certified: boolean; // Medical Device QMS
    fdaEstablishmentRegistered: boolean;
    fdaRegistrationNumber?: string;
    ceMdrDeclarationVerified: boolean;
    gmpCertified: boolean;
  };
  trademarkAuthorization: {
    authorizedOemOdm: boolean;
    whiteLabelAgreementInPlace: boolean;
    intellectualPropertyNonCompeteSigned: boolean;
  };
  auditHistory: {
    lastThirdPartyAuditDate: string;
    auditingAgency: string; // e.g., 'SGS', 'TUV Rheinland', 'Bureau Veritas'
    overallAuditScorePercent: number;
  };
}

export interface SupplierBidQuote {
  bidId: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  submittedIso: string;
  currency: CurrencyCode;
  exchangeRateToUsd: number;
  tierQuotes: {
    moq: number;
    unitPriceFob: number;
    leadTimeDays: number;
    toolingFeeUsd: number;
    sampleFeeUsd: number;
    sampleLeadTimeDays: number;
  }[];
  paymentTerms: {
    depositPercentage: number; // e.g., 30%
    milestoneInspectionPercentage: number; // e.g., 40% upon pre-shipment inspection pass
    billOfLadingBalancePercentage: number; // e.g., 30% upon B/L copy
    netTermsDays: number;
  };
  portOfLoading: string;
  warrantyPeriodMonths: number;
}

export interface UnitEconomicsSummary {
  rfqId: string;
  tierMoq: number;
  fobUnitCostUsd: number;
  seaFreightPerUnitUsd: number;
  customsDutyPercent: number;
  customsDutyPerUnitUsd: number;
  portHandlingAndStoragePerUnitUsd: number;
  totalLandedCostUsd: number;
  packagingAndKittingPerUnitUsd: number;
  eCommercePlatformFeePercent: number; // e.g., 15%
  blendedAcquisitionCostPerUnitUsd: number; // CAC
  targetMsrpUsd: number;
  grossMarginUsd: number;
  grossMarginPercent: number;
  netMarginUsd: number;
  netMarginPercent: number;
  breakEvenSalesVolumeUnits: number;
  projectedRoiPercent: number;
}

export interface BiocompatibilityAssessment {
  materialIdentifier: string;
  applicableStandards: string[]; // e.g., ['ISO 10993-1', 'ISO 10993-5 (Cytotoxicity)', 'ISO 10993-10 (Irritation)']
  biologicalRiskLevel: 'Negligible' | 'Low' | 'Moderate' | 'High';
  clinicalSafetyStatus: 'Passed' | 'Conditional' | 'Rejected';
  cytotoxicityViabilityPercent: number; // Must be >= 70% per ISO 10993-5
  sensitizationResponseObserved: boolean;
  systemicToxicityObserved: boolean;
  chemicalCharacterizationSatisfied: boolean;
  biomedicalEvidenceNotes: string;
}
