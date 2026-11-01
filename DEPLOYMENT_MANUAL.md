# EDGE DEPLOYMENT MANUAL: PRIVATE-LABEL SUPPLIER VALIDATION & RFQ SYSTEM

**Package:** `@nexus/supplier-rfq-automation-system`  
**Platform:** Cloudflare Workers Edge Network + Cloudflare D1 Serverless Database  
**Runtime:** V8 JavaScript / TypeScript Isolated Edge Workers  

---

## 1. PREREQUISITES & ENVIRONMENT SETUP

1. **Node.js Runtime:** Node.js v18.0.0 or higher.
2. **Cloudflare Wrangler CLI:** Ensure wrangler is installed globally or accessible via npx:
   ```bash
   npm install -g wrangler
   wrangler whoami
   ```
3. **Cloudflare D1 Database Provisioning:**
   Create the production SQL database instance:
   ```bash
   npx wrangler d1 create nexus_rfq_production_db
   ```
   Copy the generated `database_id` into `engine/edge_rfq_gateway/wrangler.toml`.

---

## 2. DATABASE SCHEMA MIGRATION

Execute the SQL schema migration against the production D1 cluster:
```bash
cd engine/edge_rfq_gateway
npx wrangler d1 execute nexus_rfq_production_db --file=../../monetization_rfq_kit/schema.sql
```

Verify tables created:
```bash
npx wrangler d1 execute nexus_rfq_production_db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 3. EDGE WORKER COMPILATION & DEPLOYMENT

Deploy the edge gateway directly to the Cloudflare global network:
```bash
cd engine/edge_rfq_gateway
npx wrangler deploy
```

Expected Deployment Output:
```text
Total Upload: ~12 KiB / gzip: ~4 KiB
Uploaded supplier-rfq-gateway (2.1 sec)
Deployed supplier-rfq-gateway triggers (1.8 sec)
  https://supplier-rfq-gateway.<your-subdomain>.workers.dev
```

---

## 4. ENDPOINT VERIFICATION TESTS

### 4.1 Health Check Verification
```bash
curl -s https://supplier-rfq-gateway.example.workers.dev/health
```
Response:
```json
{
  "status": "HEALTHY",
  "service": "Production Private-Label Supplier Validation & Automated RFQ Gateway",
  "version": "1.0.0",
  "catalogId": "WAY-85-PRODUCT-87"
}
```

### 4.2 Automated RFQ Generation Test
```bash
curl -X POST https://supplier-rfq-gateway.example.workers.dev/api/v1/rfq/generate \
  -H "Content-Type: application/json" \
  -d '{"rfqId":"RFQ-DEMO-01","brand":"Apex Medical","targetFobPriceUsd":4.20}'
```

### 4.3 Webhook Bid Ingestion Test
```bash
curl -X POST https://supplier-rfq-gateway.example.workers.dev/api/v1/bids/submit \
  -H "Content-Type: application/json" \
  -d '{"rfqId":"RFQ-DEMO-01","vendorCode":"VEND-881","pricingMatrix":[{"quantity":5000,"price":4.00,"leadDays":45}]}'
```

---
*Manual compiled by Nexus Engineering Team. 100% Zero-Defect Standard.*
