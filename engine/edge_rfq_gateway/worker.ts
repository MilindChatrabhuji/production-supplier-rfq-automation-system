/**
 * Production Private-Label Supplier Validation & Automated RFQ System
 * Package: @nexus/supplier-rfq-automation-system
 * Module: engine/edge_rfq_gateway/worker.ts
 *
 * Cloudflare Workers Edge Gateway for Private-Label Supplier Validation,
 * Webhook Ingestion, and Automated RFQ Distribution.
 */

import { RFQSpecificationBuilderAndDistributor } from '../rfq_engine/rfq_specification_builder_and_distributor';
import { SupplierCredentialAndCounterfeitValidator } from '../rfq_engine/supplier_credential_and_counterfeit_validator';
import { UnitEconomicsAndMarginMatrixEngine } from '../rfq_engine/unit_economics_and_margin_matrix_engine';
import { ClinicalEvidenceAndBiocompatibilityScorer, MaterialTestReport } from '../rfq_engine/clinical_evidence_and_biocompatibility_scorer';
import { SupplierBidIngestionAndNormalizationRouter, RawSupplierPayload } from './supplier_bid_ingestion_and_normalization_router';
import { CounterOfferAndSLAEnforcementRouter } from './counter_offer_and_sla_enforcement_router';
import { SupplierCredentials } from '../rfq_engine/types';

export interface Env {
  DB?: any; // Cloudflare D1 Database binding
  ENVIRONMENT?: string;
  WEBHOOK_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-RFQ-Token',
      'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    try {
      // Health check endpoint
      if (url.pathname === '/health' || url.pathname === '/api/v1/health') {
        return new Response(
          JSON.stringify({
            status: 'HEALTHY',
            service: 'Production Private-Label Supplier Validation & Automated RFQ Gateway',
            version: '1.0.0',
            catalogId: 'WAY-85-PRODUCT-87',
            edgeNode: 'Cloudflare Workers',
            timestamp: new Date().toISOString()
          }),
          { headers: corsHeaders, status: 200 }
        );
      }

      // Generate Parametric RFQ
      if (url.pathname === '/api/v1/rfq/generate' && method === 'POST') {
        const body: any = await request.json();
        const rfqId = body.rfqId || `RFQ-${Date.now().toString(36).toUpperCase()}`;
        const brand = body.brand || 'Apex MedTech Solutions';
        const title = body.title || 'Precision Clinical Diagnostic Enclosure';

        const builder = new RFQSpecificationBuilderAndDistributor(rfqId, brand, title);
        if (body.targetFobPriceUsd) builder.setTargetFobPrice(body.targetFobPriceUsd);
        if (body.moqTiers) builder.setMoqTiers(body.moqTiers);

        const spec = builder.buildSpecification();
        const doc = builder.generateMarkdownRFQDocument(spec);

        return new Response(JSON.stringify({ status: 'SUCCESS', specification: spec, markdownDocument: doc }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // Supplier Bid Webhook Ingestion
      if (url.pathname === '/api/v1/bids/submit' && method === 'POST') {
        const body = (await request.json()) as RawSupplierPayload;
        const normalized = SupplierBidIngestionAndNormalizationRouter.ingestAndNormalize(body);
        return new Response(JSON.stringify({ status: 'SUCCESS', bid: normalized }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // Automated Counter-Offer Generation
      if (url.pathname === '/api/v1/negotiate/counter-offer' && method === 'POST') {
        const body: any = await request.json();
        if (!body.bid) {
          return new Response(JSON.stringify({ error: 'Missing normalized bid in request body' }), {
            headers: corsHeaders,
            status: 400
          });
        }
        const counter = CounterOfferAndSLAEnforcementRouter.generateCounterOffer(
          body.bid,
          body.targetBudgetUsd || 3.80,
          body.targetLeadDays || 45
        );
        const letter = CounterOfferAndSLAEnforcementRouter.generateContractualLetter(counter);

        return new Response(JSON.stringify({ status: 'SUCCESS', counterOffer: counter, formalLetter: letter }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // Supplier Credentials & Anti-Counterfeit Validation
      if (url.pathname === '/api/v1/suppliers/validate' && method === 'POST') {
        const supplier = (await request.json()) as SupplierCredentials;
        const result = SupplierCredentialAndCounterfeitValidator.validateSupplier(supplier);
        const toolingToken = SupplierCredentialAndCounterfeitValidator.generateToolingSecurityToken(
          'TOOL-8821',
          supplier.supplierId,
          8
        );

        return new Response(JSON.stringify({ status: 'SUCCESS', validation: result, toolingToken }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // Unit Economics Calculation
      if (url.pathname === '/api/v1/economics/calculate' && method === 'POST') {
        const body: any = await request.json();
        const economics = UnitEconomicsAndMarginMatrixEngine.calculateUnitEconomics({
          rfqId: body.rfqId || 'RFQ-SAMPLE',
          tierMoq: body.tierMoq || 5000,
          fobUnitCostUsd: body.fobUnitCostUsd || 4.20,
          targetMsrpUsd: body.targetMsrpUsd || 24.99,
          customsTariffPercent: body.customsTariffPercent || 3.5,
          estimatedCacUsd: body.estimatedCacUsd || 4.50
        });

        return new Response(JSON.stringify({ status: 'SUCCESS', economics }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // Biocompatibility ISO 10993 Scoring
      if (url.pathname === '/api/v1/biocompatibility/score' && method === 'POST') {
        const report = (await request.json()) as MaterialTestReport;
        const evaluation = ClinicalEvidenceAndBiocompatibilityScorer.evaluateBiocompatibility(report);

        return new Response(JSON.stringify({ status: 'SUCCESS', clinicalEvaluation: evaluation }), {
          headers: corsHeaders,
          status: 200
        });
      }

      return new Response(
        JSON.stringify({
          error: 'Endpoint not found',
          availableEndpoints: [
            '/health',
            '/api/v1/rfq/generate',
            '/api/v1/bids/submit',
            '/api/v1/negotiate/counter-offer',
            '/api/v1/suppliers/validate',
            '/api/v1/economics/calculate',
            '/api/v1/biocompatibility/score'
          ]
        }),
        { headers: corsHeaders, status: 404 }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Internal edge gateway error', details: err.message }), {
        headers: corsHeaders,
        status: 500
      });
    }
  }
};
