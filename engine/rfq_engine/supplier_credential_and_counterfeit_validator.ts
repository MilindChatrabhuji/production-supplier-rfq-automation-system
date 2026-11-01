/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/rfq_engine/supplier_credential_and_counterfeit_validator.ts
 *
 * Comprehensive supplier credentials validation, FDA establishment verification,
 * CE MDR conformity validation, and anti-counterfeit trademark compliance engine.
 */

import { SupplierCredentials } from './types';

export interface ValidationResult {
  supplierId: string;
  isApprovedForManufacturing: boolean;
  overallComplianceScorePercent: number; // 0 - 100
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  passedAudits: string[];
  failedAudits: string[];
  remediationRequirements: string[];
  auditedAtIso: string;
}

export class SupplierCredentialAndCounterfeitValidator {
  /**
   * Evaluates candidate supplier credentials against international manufacturing,
   * regulatory compliance, and anti-counterfeiting benchmarks.
   */
  public static validateSupplier(supplier: SupplierCredentials): ValidationResult {
    const passed: string[] = [];
    const failed: string[] = [];
    const remediation: string[] = [];
    let score = 0;

    // 1. ISO 9001 General Quality Management System (15 pts)
    if (supplier.certifications.iso9001Certified) {
      passed.push('ISO 9001:2015 Quality Management System Verified');
      score += 15;
    } else {
      failed.push('Missing ISO 9001 Certification');
      remediation.push('Supplier must provide accredited ISO 9001 certificate or undergo initial audit.');
    }

    // 2. ISO 13485 Medical Device QMS (25 pts)
    if (supplier.certifications.iso13485Certified) {
      passed.push('ISO 13485:2016 Medical Device Quality Management System Verified');
      score += 25;
    } else {
      failed.push('Lacks ISO 13485 Medical Device Certification');
      remediation.push('Mandatory for Class I/II medical device private-labeling.');
    }

    // 3. FDA Establishment Registration & Listing (20 pts)
    if (supplier.certifications.fdaEstablishmentRegistered && supplier.certifications.fdaRegistrationNumber) {
      passed.push(`FDA Establishment Registered: FEI #${supplier.certifications.fdaRegistrationNumber}`);
      score += 20;
    } else {
      failed.push('FDA Establishment Registration Unverified');
      remediation.push('Supplier must complete FDA 21 CFR Part 807 foreign establishment registration before US import.');
    }

    // 4. CE MDR 2017/745 Declaration of Conformity (15 pts)
    if (supplier.certifications.ceMdrDeclarationVerified) {
      passed.push('CE MDR 2017/745 Declaration of Conformity Validated');
      score += 15;
    } else {
      failed.push('CE MDR Declaration of Conformity Missing');
      remediation.push('Notified Body CE certificate required for EU economic area distribution.');
    }

    // 5. Anti-Counterfeiting & Trademark Authorization (15 pts)
    if (
      supplier.trademarkAuthorization.authorizedOemOdm &&
      supplier.trademarkAuthorization.whiteLabelAgreementInPlace &&
      supplier.trademarkAuthorization.intellectualPropertyNonCompeteSigned
    ) {
      passed.push('Anti-Counterfeiting & Trademark Protection: Full OEM/ODM IP Agreement Signed');
      score += 15;
    } else {
      failed.push('Incomplete Anti-Counterfeiting & Trademark Protection Protocols');
      remediation.push('Execute Bilateral Intellectual Property Non-Disclosure & Non-Compete Agreement.');
    }

    // 6. Third-Party Facility Audit History (10 pts)
    if (supplier.auditHistory && supplier.auditHistory.overallAuditScorePercent >= 80) {
      passed.push(`Third-Party Audit Passed: ${supplier.auditHistory.auditingAgency} (${supplier.auditHistory.overallAuditScorePercent}%)`);
      score += 10;
    } else {
      failed.push('Third-Party Facility Audit Sub-Threshold (<80%) or Missing');
      remediation.push('Schedule on-site comprehensive SMETA or ISO audit by accredited inspection body.');
    }

    let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CRITICAL';
    let isApproved = false;

    if (score >= 85) {
      riskTier = 'LOW';
      isApproved = true;
    } else if (score >= 70) {
      riskTier = 'MEDIUM';
      isApproved = true; // Conditional approval with remediation
    } else if (score >= 50) {
      riskTier = 'HIGH';
      isApproved = false;
    } else {
      riskTier = 'CRITICAL';
      isApproved = false;
    }

    return {
      supplierId: supplier.supplierId,
      isApprovedForManufacturing: isApproved,
      overallComplianceScorePercent: score,
      riskTier,
      passedAudits: passed,
      failedAudits: failed,
      remediationRequirements: remediation,
      auditedAtIso: new Date().toISOString()
    };
  }

  /**
   * Anti-counterfeit tooling serial number verification.
   * Generates a tamper-evident hash for tooling cavity validation.
   */
  public static generateToolingSecurityToken(toolingId: string, factoryId: string, cavityCount: number): string {
    const raw = `${toolingId}::${factoryId}::cavities=${cavityCount}::salt=ANTI_COUNTERFEIT_NEXUS_2026`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
    return `TOOL-SEC-${hex}-${toolingId.slice(-4)}`;
  }
}
