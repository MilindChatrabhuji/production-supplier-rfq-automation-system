/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/rfq_engine/unit_economics_and_margin_matrix_engine.ts
 *
 * Unit economics calculator, landed cost amortization, gross/net margin analyzer,
 * break-even sales volume sensitivity modeling for private-label brands.
 */

import { UnitEconomicsSummary } from './types';

export interface UnitEconomicsInput {
  rfqId: string;
  tierMoq: number;
  fobUnitCostUsd: number;
  containerCbmTotal?: number; // Total volume in cubic meters
  unitWeightKg?: number;
  oceanFreightPerCbmUsd?: number; // e.g., $95/CBM
  unitsPerCbm?: number;          // e.g., 350 units/CBM
  customsTariffPercent?: number;  // e.g., 4.2% HTS code duty
  portHandlingPerUnitUsd?: number; // e.g., $0.25
  packagingAndKittingUsd?: number; // e.g., $0.50
  targetMsrpUsd: number;
  marketplaceFeePercent?: number; // e.g., 15% Amazon/Shopify blended
  estimatedCacUsd?: number;       // Customer acquisition cost per unit
  fixedToolingAmortizationUsd?: number; // Total tooling divided by production run
}

export class UnitEconomicsAndMarginMatrixEngine {
  /**
   * Computes complete unit economics, landed cost, and break-even metrics.
   */
  public static calculateUnitEconomics(input: UnitEconomicsInput): UnitEconomicsSummary {
    const unitsPerCbm = input.unitsPerCbm || 300;
    const oceanFreightPerCbm = input.oceanFreightPerCbmUsd || 85.0;
    const seaFreightPerUnit = oceanFreightPerCbm / unitsPerCbm;

    const tariffPercent = input.customsTariffPercent || 3.5;
    const customsDutyPerUnit = (input.fobUnitCostUsd * tariffPercent) / 100;

    const portHandling = input.portHandlingPerUnitUsd || 0.30;
    const packagingKitting = input.packagingAndKittingUsd || 0.45;
    const toolingAmortization = input.fixedToolingAmortizationUsd || 0.0;

    // Total Landed Cost per Unit = FOB + Sea Freight + Customs Duty + Port Handling + Packaging + Tooling
    const totalLandedCost =
      input.fobUnitCostUsd +
      seaFreightPerUnit +
      customsDutyPerUnit +
      portHandling +
      packagingKitting +
      toolingAmortization;

    const targetMsrp = input.targetMsrpUsd;
    const platformFeePercent = input.marketplaceFeePercent || 15.0;
    const platformFeeUsd = (targetMsrp * platformFeePercent) / 100;
    const blendedCac = input.estimatedCacUsd || targetMsrp * 0.20; // 20% estimated advertising spend

    // Gross Margin = Target MSRP - Total Landed Cost
    const grossMarginUsd = targetMsrp - totalLandedCost;
    const grossMarginPercent = (grossMarginUsd / targetMsrp) * 100;

    // Net Margin = Target MSRP - (Total Landed Cost + Platform Fee + CAC)
    const totalOpexPerUnit = platformFeeUsd + blendedCac;
    const netMarginUsd = targetMsrp - (totalLandedCost + totalOpexPerUnit);
    const netMarginPercent = (netMarginUsd / targetMsrp) * 100;

    // Fixed costs estimate (e.g. brand setup, photography, compliance testing = $4,500)
    const fixedBrandSetupInvestmentUsd = 4500.0;
    const contributionMarginPerUnit = netMarginUsd > 0 ? netMarginUsd : 0.01;
    const breakEvenSalesVolume = Math.ceil(fixedBrandSetupInvestmentUsd / contributionMarginPerUnit);

    // Projected Return on Investment (Cash-on-Cash)
    const totalCashOutlayPerRun = totalLandedCost * input.tierMoq + fixedBrandSetupInvestmentUsd;
    const projectedGrossRevenue = targetMsrp * input.tierMoq;
    const totalNetProfit = netMarginUsd * input.tierMoq - fixedBrandSetupInvestmentUsd;
    const projectedRoiPercent = (totalNetProfit / totalCashOutlayPerRun) * 100;

    return {
      rfqId: input.rfqId,
      tierMoq: input.tierMoq,
      fobUnitCostUsd: Number(input.fobUnitCostUsd.toFixed(2)),
      seaFreightPerUnitUsd: Number(seaFreightPerUnit.toFixed(2)),
      customsDutyPercent: Number(tariffPercent.toFixed(1)),
      customsDutyPerUnitUsd: Number(customsDutyPerUnit.toFixed(2)),
      portHandlingAndStoragePerUnitUsd: Number(portHandling.toFixed(2)),
      totalLandedCostUsd: Number(totalLandedCost.toFixed(2)),
      packagingAndKittingPerUnitUsd: Number(packagingKitting.toFixed(2)),
      eCommercePlatformFeePercent: Number(platformFeePercent.toFixed(1)),
      blendedAcquisitionCostPerUnitUsd: Number(blendedCac.toFixed(2)),
      targetMsrpUsd: Number(targetMsrp.toFixed(2)),
      grossMarginUsd: Number(grossMarginUsd.toFixed(2)),
      grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
      netMarginUsd: Number(netMarginUsd.toFixed(2)),
      netMarginPercent: Number(netMarginPercent.toFixed(1)),
      breakEvenSalesVolumeUnits: breakEvenSalesVolume,
      projectedRoiPercent: Number(projectedRoiPercent.toFixed(1))
    };
  }

  /**
   * Generates a comparative matrix across multiple production volume tiers.
   */
  public static generateVolumeTierMatrix(
    rfqId: string,
    fobCostByTier: { moq: number; fobPrice: number }[],
    targetMsrp: number
  ): UnitEconomicsSummary[] {
    return fobCostByTier.map(tier =>
      this.calculateUnitEconomics({
        rfqId,
        tierMoq: tier.moq,
        fobUnitCostUsd: tier.fobPrice,
        targetMsrpUsd: targetMsrp
      })
    );
  }
}
