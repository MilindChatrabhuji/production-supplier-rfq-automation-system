/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/rfq_engine/clinical_evidence_and_biocompatibility_scorer.ts
 *
 * Strict Compliance:
 * - 100% Modern Evidence-Based Clinical Medicine & Biological Evaluation
 * - ISO 10993 Biocompatibility Standards & FDA 21 CFR 820 QSR
 * - Strictly Zero Alternative Remedy or Non-Evidence Based References
 */

import { BiocompatibilityAssessment } from './types';

export interface MaterialTestReport {
  materialIdentifier: string;
  manufacturerName: string;
  testLaboratoryName: string;
  testStandardIso: string;
  inVitroCytotoxicityViabilityPercent: number; // ISO 10993-5 test (Threshold >= 70%)
  intracutaneousReactivityScore: number;     // ISO 10993-10 test (Threshold < 1.0)
  delayedHypersensitivityIndex: number;     // ISO 10993-10 Guinea Pig Maximization (Threshold = 0)
  acuteSystemicToxicityPassed: boolean;      // ISO 10993-11 test
  pyrogenicityLALEndotoxinEuPerMl: number;   // USP <85> (Threshold < 0.5 EU/mL)
  extractableOrganicCompoundsPpm: number;    // ISO 10993-18 (Threshold < 10 ppm)
  evaluationDateIso: string;
}

export interface ClinicalEvidenceScoringResult {
  materialIdentifier: string;
  assessment: BiocompatibilityAssessment;
  overallBiomedicalScorePercent: number;
  isClinicallyClearedForBodyContact: boolean;
  clearanceCategory: 'Skin Contact (Surface)' | 'Mucosal Membrane' | 'Blood Path Indirect' | 'Implant (Long-term)' | 'Non-Contact';
  clinicalObservations: string[];
  regulatoryCitations: string[];
}

export class ClinicalEvidenceAndBiocompatibilityScorer {
  /**
   * Evaluates material test laboratory reports against ISO 10993 clinical safety endpoints.
   */
  public static evaluateBiocompatibility(report: MaterialTestReport): ClinicalEvidenceScoringResult {
    const observations: string[] = [];
    const citations: string[] = [
      'ISO 10993-1:2018 - Biological evaluation of medical devices: Evaluation and testing within a risk management process',
      'ISO 10993-5:2009 - Tests for in vitro cytotoxicity',
      'ISO 10993-10:2021 - Tests for skin sensitization',
      'ISO 10993-11:2017 - Tests for systemic toxicity',
      'USP <85> - Bacterial Endotoxins Test',
      'FDA Guidance: Use of International Standard ISO 10993-1 (September 2020)'
    ];

    let score = 0;
    let cytotoxicPass = false;
    let sensitizationPass = false;
    let systemicPass = false;
    let endotoxinPass = false;

    // 1. In Vitro Cytotoxicity Assessment (30 pts)
    if (report.inVitroCytotoxicityViabilityPercent >= 70.0) {
      score += 30;
      cytotoxicPass = true;
      observations.push(`In Vitro Cytotoxicity: ${report.inVitroCytotoxicityViabilityPercent.toFixed(1)}% cell viability exceeds ISO 10993-5 minimum threshold (>= 70%).`);
    } else {
      observations.push(`In Vitro Cytotoxicity FAILED: ${report.inVitroCytotoxicityViabilityPercent.toFixed(1)}% cell viability indicates cytotoxic leachables.`);
    }

    // 2. Skin Sensitization & Intracutaneous Irritation (25 pts)
    if (report.intracutaneousReactivityScore < 1.0 && report.delayedHypersensitivityIndex === 0) {
      score += 25;
      sensitizationPass = true;
      observations.push('Skin Sensitization: Zero hypersensitivity response observed per ISO 10993-10.');
    } else {
      observations.push('Skin Sensitization FAILED: Irritation or delayed hypersensitivity detected.');
    }

    // 3. Acute Systemic Toxicity (20 pts)
    if (report.acuteSystemicToxicityPassed) {
      score += 20;
      systemicPass = true;
      observations.push('Systemic Toxicity: Passed ISO 10993-11 protocol with zero adverse systemic reaction.');
    } else {
      observations.push('Systemic Toxicity FAILED: Toxicological endpoints breached.');
    }

    // 4. Pyrogenicity & Endotoxins (15 pts)
    if (report.pyrogenicityLALEndotoxinEuPerMl < 0.5) {
      score += 15;
      endotoxinPass = true;
      observations.push(`Bacterial Endotoxin: ${report.pyrogenicityLALEndotoxinEuPerMl} EU/mL complies with USP <85> limit (< 0.5 EU/mL).`);
    } else {
      observations.push(`Endotoxin Alert: ${report.pyrogenicityLALEndotoxinEuPerMl} EU/mL exceeds pyrogen safety threshold.`);
    }

    // 5. Chemical Characterization & Extractables (10 pts)
    if (report.extractableOrganicCompoundsPpm < 10.0) {
      score += 10;
      observations.push(`Chemical Characterization: ${report.extractableOrganicCompoundsPpm} ppm extractables within safe toxicological threshold (ISO 10993-18).`);
    } else {
      observations.push(`Chemical Characterization WARNING: Elevated extractables (${report.extractableOrganicCompoundsPpm} ppm).`);
    }

    const isCleared = cytotoxicPass && sensitizationPass && systemicPass && endotoxinPass && score >= 85;

    let safetyStatus: 'Passed' | 'Conditional' | 'Rejected' = 'Rejected';
    if (isCleared) {
      safetyStatus = 'Passed';
    } else if (score >= 65) {
      safetyStatus = 'Conditional';
    }

    let riskLevel: 'Negligible' | 'Low' | 'Moderate' | 'High' = 'High';
    if (score >= 90) riskLevel = 'Negligible';
    else if (score >= 75) riskLevel = 'Low';
    else if (score >= 60) riskLevel = 'Moderate';

    const assessment: BiocompatibilityAssessment = {
      materialIdentifier: report.materialIdentifier,
      applicableStandards: [
        'ISO 10993-1',
        'ISO 10993-5 (Cytotoxicity)',
        'ISO 10993-10 (Sensitization)',
        'ISO 10993-11 (Systemic Toxicity)',
        'ISO 10993-18 (Chemical Characterization)'
      ],
      biologicalRiskLevel: riskLevel,
      clinicalSafetyStatus: safetyStatus,
      cytotoxicityViabilityPercent: report.inVitroCytotoxicityViabilityPercent,
      sensitizationResponseObserved: !sensitizationPass,
      systemicToxicityObserved: !systemicPass,
      chemicalCharacterizationSatisfied: report.extractableOrganicCompoundsPpm < 10.0,
      biomedicalEvidenceNotes: `Verified across 5 ISO 10993 biological endpoints. Final composite score: ${score}/100.`
    };

    return {
      materialIdentifier: report.materialIdentifier,
      assessment,
      overallBiomedicalScorePercent: score,
      isClinicallyClearedForBodyContact: isCleared,
      clearanceCategory: 'Skin Contact (Surface)',
      clinicalObservations: observations,
      regulatoryCitations: citations
    };
  }
}
