"""Authored historical HTML fixtures, not captured or verified government sources.

Retained for parser/version regression fixtures and content-fingerprint quarantine.
The fetcher must never use these as a live-acquisition recovery path. Their authored
scheme terms, dates and quotations are not evidence of real current eligibility.
"""

from __future__ import annotations

CENTRAL_MSME_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>All Schemes - Ministry of Micro, Small &amp; Medium Enterprises</title>
</head>
<body>
  <div class="main-content">
    <h1>Schemes of Ministry of MSME - Government of India</h1>
    <div class="scheme-list">

      <article class="scheme-card" data-code="SCHEME-CGTMSE">
        <h2 class="scheme-title">Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)</h2>
        <div class="scheme-authority">Ministry of MSME &amp; SIDBI</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">ALL</div>
        <div class="scheme-scales">MICRO, SMALL</div>
        <div class="scheme-benefit-type">CREDIT_GUARANTEE</div>
        <div class="scheme-benefit-desc">Collateral-free credit facility up to Rs. 5 Crore with 75% to 85% credit guarantee coverage for term loans and working capital.</div>
        <div class="scheme-eligibility">New and existing Micro and Small Enterprises engaged in manufacturing or service activities with valid Udyam Registration.</div>
        <div class="scheme-evidence">Notification Ref: MSME/CGTMSE/2023/Cir-18. Collateral-free credit facility extended up to Rs. 500 Lakhs with guarantee fee concession of 10% for women and aspirational districts.</div>
        <div class="scheme-app-route">Apply directly through Scheduled Commercial Banks, Regional Rural Banks, and SIDBI.</div>
        <a class="scheme-link" href="https://www.cgtmse.in">https://www.cgtmse.in</a>
        <span class="scheme-dates" data-from="2020-07-01" data-to="2029-03-31">Effective: July 2020 to March 2029</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-ZED-CERTIFICATION">
        <h2 class="scheme-title">MSME Sustainable (ZED) Certification Scheme</h2>
        <div class="scheme-authority">Ministry of MSME</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">MANUFACTURING</div>
        <div class="scheme-scales">MICRO, SMALL, MEDIUM</div>
        <div class="scheme-benefit-type">QUALITY_CERTIFICATION</div>
        <div class="scheme-benefit-desc">Financial assistance up to 80% (Micro), 60% (Small), and 50% (Medium) subsidy on certification cost, with additional 10% for Women/SC/ST entrepreneurs.</div>
        <div class="scheme-eligibility">Manufacturing MSMEs with valid Udyam Registration aiming to upgrade product quality, waste reduction, and energy efficiency.</div>
        <div class="scheme-evidence">Gazette Reference: MSME ZED Guidelines 2022 §4.1. Financial assistance provides up to Rs. 50,000 for Bronze, Rs. 2,00,000 for Silver, and Rs. 5,00,000 for Gold certification.</div>
        <div class="scheme-app-route">Apply online through the MSME Champions Portal at zed.msme.gov.in.</div>
        <a class="scheme-link" href="https://zed.msme.gov.in">https://zed.msme.gov.in</a>
        <span class="scheme-dates" data-from="2022-04-28" data-to="2027-03-31">Effective: April 2022 to March 2027</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-PMEGP">
        <h2 class="scheme-title">Prime Minister's Employment Generation Programme (PMEGP)</h2>
        <div class="scheme-authority">KVIC &amp; Ministry of MSME</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">ALL</div>
        <div class="scheme-scales">MICRO</div>
        <div class="scheme-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="scheme-benefit-desc">Margin money capital subsidy ranging from 15% to 35% of project cost (up to Rs. 50 Lakhs project cost for manufacturing and Rs. 20 Lakhs for service).</div>
        <div class="scheme-eligibility">Any individual above 18 years setting up a new micro-enterprise. Beneficiary contribution is 5% to 10% of project cost.</div>
        <div class="scheme-evidence">PMEGP Guidelines 2022 Revised §3. Maximum admissible project cost enhanced to Rs. 50 Lakhs for manufacturing units with 25% urban and 35% rural subsidy for special categories.</div>
        <div class="scheme-app-route">Apply online through KVIC PMEGP e-Portal.</div>
        <a class="scheme-link" href="https://www.kviconline.gov.in/pmegpeportal">https://www.kviconline.gov.in/pmegpeportal</a>
        <span class="scheme-dates" data-from="2021-04-01" data-to="2026-03-31">Effective: April 2021 to March 2026</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-CLCSS-TECH">
        <h2 class="scheme-title">Credit Linked Capital Subsidy for Technology Upgradation (CLCSS)</h2>
        <div class="scheme-authority">Office of Development Commissioner MSME</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">MANUFACTURING</div>
        <div class="scheme-scales">MICRO, SMALL</div>
        <div class="scheme-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="scheme-benefit-desc">15% upfront capital subsidy on institutional finance up to Rs. 1 Crore availed for modern state-of-the-art plant and machinery.</div>
        <div class="scheme-eligibility">Existing Micro and Small enterprises upgrading plant &amp; machinery with approved energy-efficient technologies.</div>
        <div class="scheme-evidence">Office Memo DC-MSME/CLCSS/Tech/2023. 15% upfront capital subsidy capped at Rs. 15 Lakhs for modernization of manufacturing plant and machinery.</div>
        <div class="scheme-app-route">Apply through Primary Lending Institutions (SIDBI, NABARD, Public Sector Banks).</div>
        <a class="scheme-link" href="https://msme.gov.in/schemes/clcss">https://msme.gov.in/schemes/clcss</a>
        <span class="scheme-dates" data-from="2022-01-01" data-to="2027-12-31">Effective: Jan 2022 to Dec 2027</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-MSME-SAMADHAAN">
        <h2 class="scheme-title">MSME Samadhaan - Delayed Payments Redressal Scheme</h2>
        <div class="scheme-authority">Ministry of Micro, Small and Medium Enterprises</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">ALL</div>
        <div class="scheme-scales">MICRO, SMALL</div>
        <div class="scheme-benefit-type">STATUTORY_PROTECTION</div>
        <div class="scheme-benefit-desc">Statutory right to receive compound interest at 3 times bank rate on delayed payments exceeding 45 days, with binding quasi-judicial MSEFC recovery awards.</div>
        <div class="scheme-eligibility">Any registered Micro or Small enterprise holding valid Udyam Registration filing against commercial buyers.</div>
        <div class="scheme-evidence">MSMED Act 2006 Sections 15-24 and Samadhaan Portal Guidelines. Buyer liability mandatory after 45 days with statutory penal interest.</div>
        <div class="scheme-app-route">File delayed payment petition directly on the MSME Samadhaan portal.</div>
        <a class="scheme-link" href="https://samadhaan.msme.gov.in">https://samadhaan.msme.gov.in</a>
        <span class="scheme-dates" data-from="2017-10-30" data-to="2030-03-31">Effective: Perpetual Statutory Mechanism</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-PMS-MARKETING">
        <h2 class="scheme-title">Procurement and Marketing Support (PMS) Scheme</h2>
        <div class="scheme-authority">Development Commissioner (MSME)</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">ALL</div>
        <div class="scheme-scales">MICRO, SMALL</div>
        <div class="scheme-benefit-type">MARKETING_GRANT</div>
        <div class="scheme-benefit-desc">100% space rent subsidy up to Rs. 1.5 Lakhs for participating in state and national trade fairs, plus GeM adoption grants.</div>
        <div class="scheme-eligibility">Micro and Small manufacturing and service units with active Udyam registration looking to expand customer reach.</div>
        <div class="scheme-evidence">PMS Guidelines 2023 §5. Financial assistance covers stall charges, travel, and packaging development for trade exhibitions.</div>
        <div class="scheme-app-route">Apply online through MSME Champions Portal.</div>
        <a class="scheme-link" href="https://champions.gov.in">https://champions.gov.in</a>
        <span class="scheme-dates" data-from="2022-04-01" data-to="2027-03-31">Effective: April 2022 to March 2027</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-MUDRA-TARUN">
        <h2 class="scheme-title">Pradhan Mantri MUDRA Yojana (PMMY - Tarun Plus)</h2>
        <div class="scheme-authority">Department of Financial Services &amp; Ministry of MSME</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">ALL</div>
        <div class="scheme-scales">MICRO, SMALL</div>
        <div class="scheme-benefit-type">CREDIT_FACILITY</div>
        <div class="scheme-benefit-desc">Collateral-free institutional term loans and working capital from Rs. 10 Lakhs up to Rs. 20 Lakhs with concessional interest rates.</div>
        <div class="scheme-eligibility">Non-corporate, non-farm Micro and Small enterprises in manufacturing, processing, trading, and services.</div>
        <div class="scheme-evidence">PMMY Enhanced Guidelines Budget 2024. Tarun Plus ceiling enhanced to Rs. 20 Lakhs for entrepreneurs who have previously repaid Tarun loans.</div>
        <div class="scheme-app-route">Apply via Udyami Mitra portal or any public/private commercial bank.</div>
        <a class="scheme-link" href="https://www.mudra.org.in">https://www.mudra.org.in</a>
        <span class="scheme-dates" data-from="2024-07-23" data-to="2029-03-31">Effective: July 2024 to March 2029</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-TREDS-FACTORING">
        <h2 class="scheme-title">Trade Receivables Discounting System (TReDS) Factoring Support</h2>
        <div class="scheme-authority">Reserve Bank of India &amp; Ministry of MSME</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">ALL</div>
        <div class="scheme-scales">MICRO, SMALL, MEDIUM</div>
        <div class="scheme-benefit-type">WORKING_CAPITAL</div>
        <div class="scheme-benefit-desc">Without-recourse immediate liquidity discounting of commercial trade bills within 48-72 hours against Corporates and CPSEs at competitive auction rates.</div>
        <div class="scheme-eligibility">All operational MSMEs supplying goods or services to corporate buyers, government departments, and PSUs.</div>
        <div class="scheme-evidence">RBI TReDS Guidelines &amp; MSME Mandate. Mandatory onboarding for all CPSEs and companies with turnover above Rs. 250 Crores.</div>
        <div class="scheme-app-route">Onboard directly on RXIL, M1xchange, or Invoicemart TReDS platforms.</div>
        <a class="scheme-link" href="https://www.rxil.in">https://www.rxil.in</a>
        <span class="scheme-dates" data-from="2021-01-01" data-to="2030-12-31">Effective: Continuous Regulatory Platform</span>
      </article>

      <article class="scheme-card" data-code="SCHEME-PM-SURYA-GHAR-MSME">
        <h2 class="scheme-title">PM Surya Ghar: MSME Rooftop Clean Solar Capital Incentive</h2>
        <div class="scheme-authority">Ministry of New and Renewable Energy &amp; MSME</div>
        <div class="scheme-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">MANUFACTURING</div>
        <div class="scheme-scales">MICRO, SMALL, MEDIUM</div>
        <div class="scheme-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="scheme-benefit-desc">Concessional collateral-free financing at 7% p.a. and capital subsidy up to 30% for installing industrial rooftop solar panels up to 500 kW capacity.</div>
        <div class="scheme-eligibility">Manufacturing units with connected power load > 10 kW looking to replace grid power expenditure.</div>
        <div class="scheme-evidence">MNRE Industrial Solar Circular 2024/03. Priority green credit facility linked with SIDBI for industrial MSME power cost reduction.</div>
        <div class="scheme-app-route">Apply via National Portal for Rooftop Solar and SIDBI Green Finance.</div>
        <a class="scheme-link" href="https://pmsuryaghar.gov.in">https://pmsuryaghar.gov.in</a>
        <span class="scheme-dates" data-from="2024-02-15" data-to="2028-03-31">Effective: Feb 2024 to March 2028</span>
      </article>

    </div>
  </div>
</body>
</html>
"""

MSME_CHAMPIONS_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Government Schemes - MSME Champions Portal</title>
</head>
<body>
  <div class="container">
    <h1>CHAMPIONS: Unified MSME Support and Scheme Repositories</h1>
    <div class="catalog-grid">

      <div class="scheme-entry" data-code="SCHEME-NABL-TESTING">
        <h3 class="entry-title">MSME Quality Certification &amp; NABL Laboratory Testing Subsidy</h3>
        <div class="entry-authority">Office of Development Commissioner (MSME)</div>
        <div class="entry-jurisdiction">CENTRAL</div>
        <div class="entry-sectors">MANUFACTURING, ENGINEERING, CHEMICALS, FOOD_PROCESSING, ELECTRONICS</div>
        <div class="entry-scales">MICRO, SMALL, MEDIUM</div>
        <div class="entry-benefit-type">QUALITY_CERTIFICATION</div>
        <div class="entry-benefit">Reimbursement of 75% of actual testing fees charged by NABL-accredited testing laboratories, up to Rs. 1,50,000 per financial year.</div>
        <div class="entry-eligibility">Enterprises acquiring NABL accredited laboratory test reports for BIS certification, export conformity, or regulatory compliance.</div>
        <div class="entry-evidence">Circular Champions/Quality/2023-24. Testing subsidy covers type testing and periodic surveillance renewals at accredited national labs.</div>
        <div class="entry-route">Submit invoices and test certificates directly on the CHAMPIONS single-window portal.</div>
        <a class="entry-url" href="https://champions.gov.in/Government-Schemes.htm">https://champions.gov.in/Government-Schemes.htm</a>
        <div class="entry-validity" data-from="2022-04-01" data-to="2027-03-31">Active (April 2022 - March 2027)</div>
      </div>

      <div class="scheme-entry" data-code="SCHEME-MSE-CDP">
        <h3 class="entry-title">Micro and Small Enterprises Cluster Development Programme (MSE-CDP)</h3>
        <div class="entry-authority">Ministry of MSME</div>
        <div class="entry-jurisdiction">CENTRAL</div>
        <div class="entry-sectors">ALL</div>
        <div class="entry-scales">MICRO, SMALL</div>
        <div class="entry-benefit-type">INFRASTRUCTURE_GRANT</div>
        <div class="entry-benefit">Grant assistance up to 70% to 80% of project cost (up to Rs. 30 Crore) for Common Facility Centres (CFC) and Infrastructure Development in industrial estates.</div>
        <div class="entry-eligibility">Consortium of at least 20 MSME manufacturing units or State Industrial Development Corporations.</div>
        <div class="entry-evidence">MSE-CDP Guidelines 2022. Common facility centres support testing labs, tooling rooms, effluent treatment, and design studios.</div>
        <div class="entry-route">Apply through State Directorate of Industries or online via Champions portal.</div>
        <a class="entry-url" href="https://cluster.msme.gov.in">https://cluster.msme.gov.in</a>
        <div class="entry-validity" data-from="2022-05-01" data-to="2028-03-31">Active (May 2022 - March 2028)</div>
      </div>

      <div class="scheme-entry" data-code="SCHEME-LEAN-COMPETITIVENESS">
        <h3 class="entry-title">MSME Competitive (Lean) Scheme</h3>
        <div class="entry-authority">Ministry of MSME</div>
        <div class="entry-jurisdiction">CENTRAL</div>
        <div class="entry-sectors">MANUFACTURING</div>
        <div class="entry-scales">MICRO, SMALL, MEDIUM</div>
        <div class="entry-benefit-type">CONSULTANCY_SUBSIDY</div>
        <div class="entry-benefit">Financial support up to 90% of implementation fees for 5S, Kaizen, Kanban, Poka-Yoke and Value Stream Mapping to eliminate production waste.</div>
        <div class="entry-eligibility">Manufacturing MSMEs with valid Udyam Registration looking to boost plant productivity and lower defect rates.</div>
        <div class="entry-evidence">Lean Scheme Guidelines 2023 §6. Basic, Intermediate, and Advanced lean certification stages with approved QCI lean consultants.</div>
        <div class="entry-route">Register and enroll online on the MSME Champions portal.</div>
        <a class="entry-url" href="https://lean.msme.gov.in">https://lean.msme.gov.in</a>
        <div class="entry-validity" data-from="2023-03-10" data-to="2027-03-31">Active (March 2023 - March 2027)</div>
      </div>

      <div class="scheme-entry" data-code="SCHEME-IPR-ASSISTANCE">
        <h3 class="entry-title">MSME Intellectual Property Rights (IPR) Assistance Scheme</h3>
        <div class="entry-authority">Office of Development Commissioner MSME</div>
        <div class="entry-jurisdiction">CENTRAL</div>
        <div class="entry-sectors">ALL</div>
        <div class="entry-scales">MICRO, SMALL, MEDIUM</div>
        <div class="entry-benefit-type">IP_REIMBURSEMENT</div>
        <div class="entry-benefit">Reimbursement of patent application costs up to Rs. 1 Lakh (Domestic) and Rs. 5 Lakhs (Foreign), plus Rs. 20,000 for Trademarks.</div>
        <div class="entry-eligibility">MSMEs holding valid granted patents, registered trademarks, or geographical indications.</div>
        <div class="entry-evidence">IPR Scheme Guidelines 2022 §4. Financial support to stimulate innovation and protect proprietary industrial designs and brands.</div>
        <div class="entry-route">Submit proof of grant and expenditure on the MSME Champions portal.</div>
        <a class="entry-url" href="https://champions.gov.in/Government-Schemes.htm">https://champions.gov.in/Government-Schemes.htm</a>
        <div class="entry-validity" data-from="2022-04-01" data-to="2027-03-31">Active (April 2022 - March 2027)</div>
      </div>

    </div>
  </div>
</body>
</html>
"""

DPIIT_OFFERINGS_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Offerings and Incentive Schemes - DPIIT</title>
</head>
<body>
  <div class="dpiit-portal">
    <h1>Department for Promotion of Industry and Internal Trade (DPIIT) Schemes</h1>
    <section class="offerings-list">

      <div class="offering-box" data-code="SCHEME-DPIIT-UNNATI">
        <h2 class="offering-title">Uttar Poorva Transformative Industrialization Scheme (UNNATI)</h2>
        <div class="offering-authority">DPIIT, Ministry of Commerce and Industry</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">MANUFACTURING, SERVICES</div>
        <div class="offering-scales">MICRO, SMALL, MEDIUM, LARGE</div>
        <div class="offering-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="offering-benefit-desc">Capital Investment Incentive up to 30% to 50% of Eligible Plant &amp; Machinery (up to Rs. 10 Crore), plus 3% to 5% Central Interest Subvention for up to 7 years.</div>
        <div class="offering-eligibility">New industrial units and existing units undertaking substantial expansion in designated zones.</div>
        <div class="offering-evidence">Gazette Notification DPIIT F.No. 10(3)/2024-DBA-II. Central Capital Investment Incentive (CCII) and Central Interest Subvention (CIS) for eligible investments.</div>
        <div class="offering-app-route">Register and apply online on the National Single Window System (NSWS) DPIIT UNNATI portal.</div>
        <a class="offering-link" href="https://dpiit.gov.in/offerings/unnati">https://dpiit.gov.in/offerings/unnati</a>
        <span class="offering-validity" data-from="2024-03-09" data-to="2034-03-31">Active (March 2024 - March 2034)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-DPIIT-BHAVYA">
        <h2 class="offering-title">BHAVYA Scheme: Boosting Hardware, Advanced Value-addition and Yield in Automotive</h2>
        <div class="offering-authority">DPIIT &amp; Ministry of Heavy Industries</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">AUTOMOTIVE, ENGINEERING, MACHINING</div>
        <div class="offering-scales">MICRO, SMALL, MEDIUM, LARGE</div>
        <div class="offering-benefit-type">PRODUCTION_INCENTIVE</div>
        <div class="offering-benefit-desc">Tiered incentive of 8% to 15% on incremental sales of advanced automotive and precision engineered components, plus technology transfer subsidy.</div>
        <div class="offering-eligibility">Automotive component and precision machining manufacturers meeting minimum domestic value addition (DVA) thresholds of 50%.</div>
        <div class="offering-evidence">DPIIT Industrial Circular BHAVYA/Auto-Adv/2024. Advanced Automotive Technology incentive with priority processing for Tier-2 and Tier-3 MSME suppliers.</div>
        <div class="offering-app-route">Apply online through NSWS DPIIT Automotive Portal.</div>
        <a class="offering-link" href="https://dpiit.gov.in/offerings/bhavya">https://dpiit.gov.in/offerings/bhavya</a>
        <span class="offering-validity" data-from="2024-01-01" data-to="2029-12-31">Active (Jan 2024 - Dec 2029)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-DPIIT-STARTUP-SEED">
        <h2 class="offering-title">Startup India Seed Fund Scheme (SISFS)</h2>
        <div class="offering-authority">DPIIT, Ministry of Commerce and Industry</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">ALL</div>
        <div class="offering-scales">MICRO, SMALL</div>
        <div class="offering-benefit-type">CAPITAL_GRANT</div>
        <div class="offering-benefit-desc">Financial assistance up to Rs. 20 Lakhs as grant for proof of concept, prototype development, product trials, and up to Rs. 50 Lakhs investment via convertible debentures.</div>
        <div class="offering-eligibility">DPIIT-recognized startups incorporated not more than 2 years ago, with a business idea to develop a product or service with market fit.</div>
        <div class="offering-evidence">SISFS Guidelines 2021 §4. Startup India Seed Fund provides seed funding through approved incubators across India.</div>
        <div class="offering-app-route">Apply directly through the Startup India Seed Fund Portal.</div>
        <a class="offering-link" href="https://seedfund.startupindia.gov.in">https://seedfund.startupindia.gov.in</a>
        <span class="offering-validity" data-from="2021-04-01" data-to="2026-03-31">Active (April 2021 - March 2026)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-PMFME-FOOD">
        <h2 class="offering-title">PM Formalisation of Micro Food Processing Enterprises (PMFME) Scheme</h2>
        <div class="offering-authority">Ministry of Food Processing Industries (MoFPI) &amp; DPIIT</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="scheme-sectors">FOOD_PROCESSING</div>
        <div class="offering-scales">MICRO</div>
        <div class="offering-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="offering-benefit-desc">Credit-linked capital subsidy at 35% of eligible project cost with a maximum ceiling of Rs. 10 Lakhs per micro food processing unit.</div>
        <div class="offering-eligibility">Existing and new micro food enterprises (grains, spices, fruits, dairy, bakery, snacks) with beneficiary contribution of 10%.</div>
        <div class="offering-evidence">MoFPI PMFME Operational Guidelines 2022. Upgradation of micro food processing units under One District One Product (ODOP) framework.</div>
        <div class="offering-app-route">Apply online through the MoFPI PMFME Portal.</div>
        <a class="offering-link" href="https://pmfme.mofpi.gov.in">https://pmfme.mofpi.gov.in</a>
        <span class="offering-validity" data-from="2020-06-29" data-to="2026-03-31">Active (June 2020 - March 2026)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-PMKSY-COLDCHAIN">
        <h2 class="offering-title">Pradhan Mantri Kisan SAMPADA Yojana - Integrated Cold Chain &amp; Value Addition</h2>
        <div class="offering-authority">Ministry of Food Processing Industries (MoFPI)</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">FOOD_PROCESSING</div>
        <div class="offering-scales">MICRO, SMALL, MEDIUM</div>
        <div class="offering-benefit-type">INFRASTRUCTURE_GRANT</div>
        <div class="offering-benefit-desc">Financial grant up to 35% to 50% of plant and machinery cost (up to Rs. 10 Crore) for modern cold storage, deep freeze, and processing machinery.</div>
        <div class="offering-eligibility">Enterprises setting up integrated pack houses, ripening chambers,IQF, cold storages, and dehydration lines.</div>
        <div class="offering-evidence">PMKSY Revised Guidelines 2022 §3. Grant assistance provides 35% for general areas and 50% for North East and difficult regions.</div>
        <div class="offering-app-route">Apply through SAMPADA portal during open call for proposals.</div>
        <a class="offering-link" href="https://mofpi.gov.in/pmksy">https://mofpi.gov.in/pmksy</a>
        <span class="offering-validity" data-from="2021-04-01" data-to="2026-03-31">Active (April 2021 - March 2026)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-SPECS-ELECTRONICS">
        <h2 class="offering-title">Scheme for Promotion of Manufacturing of Electronic Components and Semiconductors (SPECS)</h2>
        <div class="offering-authority">Ministry of Electronics &amp; IT (MeitY) &amp; DPIIT</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">ELECTRONICS</div>
        <div class="offering-scales">MICRO, SMALL, MEDIUM, LARGE</div>
        <div class="offering-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="offering-benefit-desc">Direct financial incentive of 25% on capital expenditure for plant, machinery, equipment, associated utilities and technology transfer.</div>
        <div class="offering-eligibility">Manufacturing units producing passive components, semiconductor discrete devices, PCB bare boards, and sensors.</div>
        <div class="offering-evidence">MeitY SPECS Notification No. W-38/15/2020-IPHW. 25% reimbursement on net capital expenditure for eligible hardware electronic components.</div>
        <div class="offering-app-route">Apply online through MeitY Electronic Manufacturing Portal.</div>
        <a class="offering-link" href="https://www.meity.gov.in/esdm/specs">https://www.meity.gov.in/esdm/specs</a>
        <span class="offering-validity" data-from="2020-04-01" data-to="2027-03-31">Active (April 2020 - March 2027)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-PLI-AUTO-COMPONENTS">
        <h2 class="offering-title">Production Linked Incentive (PLI) for Automotive and Component Manufacturers</h2>
        <div class="offering-authority">Ministry of Heavy Industries &amp; DPIIT</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">AUTOMOTIVE, ENGINEERING</div>
        <div class="offering-scales">SMALL, MEDIUM, LARGE</div>
        <div class="offering-benefit-type">PRODUCTION_INCENTIVE</div>
        <div class="offering-benefit-desc">Cash incentive of 8% to 18% on determined sales value of eligible Advanced Automotive Technology (AAT) parts for 5 consecutive years.</div>
        <div class="offering-eligibility">Automotive engineering manufacturers and precision component suppliers making qualifying capital investments.</div>
        <div class="offering-evidence">Gazette Notification MHI S.O. 3968(E). Champion OEM and Component Champion incentive structure with mandatory 50% domestic value addition.</div>
        <div class="offering-app-route">Apply through MHI Automotive Portal.</div>
        <a class="offering-link" href="https://auto.heavyindustries.gov.in">https://auto.heavyindustries.gov.in</a>
        <span class="offering-validity" data-from="2022-04-01" data-to="2027-03-31">Active (April 2022 - March 2027)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-ATUFS-TEXTILE">
        <h2 class="offering-title">Amended Technology Upgradation Fund Scheme (ATUFS) for Textiles</h2>
        <div class="offering-authority">Ministry of Textiles &amp; DPIIT</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">TEXTILE</div>
        <div class="offering-scales">MICRO, SMALL, MEDIUM</div>
        <div class="offering-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="offering-benefit-desc">One-time capital investment subsidy of 10% to 15% (up to Rs. 30 Crore) on benchmarked machinery for garmenting and technical textiles.</div>
        <div class="offering-eligibility">Ginning, spinning, weaving, garment manufacturing, and processing units investing in state-of-the-art machinery.</div>
        <div class="offering-evidence">Ministry of Textiles Resolution No. 6/5/2015-TUFS. One-time capital investment subsidy for notified modern textile technology.</div>
        <div class="offering-app-route">Apply online through i-TUFS single-window software.</div>
        <a class="offering-link" href="https://txcindia.gov.in">https://txcindia.gov.in</a>
        <span class="offering-validity" data-from="2021-01-01" data-to="2026-12-31">Active (Jan 2021 - Dec 2026)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-RODTEP-EXPORTS">
        <h2 class="offering-title">Remission of Duties and Taxes on Exported Products (RoDTEP)</h2>
        <div class="offering-authority">DGFT, Ministry of Commerce and Industry</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">EXPORT</div>
        <div class="offering-scales">MICRO, SMALL, MEDIUM, LARGE</div>
        <div class="offering-benefit-type">DUTY_REMISSION</div>
        <div class="offering-benefit-desc">Transferable electronic duty credit scrip ranging from 0.5% to 4.3% of FOB export value to rebate embedded central, state, and local levies.</div>
        <div class="offering-eligibility">All manufacturer and merchant exporters shipping goods from India with eligible shipping bills under ICEGATE.</div>
        <div class="offering-evidence">DGFT Notification No. 19/2015-2020. Rebate of state electricity duty, VAT on fuel, and mandi tax embedded in export goods manufacturing.</div>
        <div class="offering-app-route">Claimed directly through Indian Customs ICEGATE electronic shipping ledger.</div>
        <a class="offering-link" href="https://icegate.gov.in">https://icegate.gov.in</a>
        <span class="offering-validity" data-from="2021-01-01" data-to="2026-09-30">Active (Jan 2021 - Sept 2026)</span>
      </div>

      <div class="offering-box" data-code="SCHEME-PLI-PHARMA-BULK">
        <h2 class="offering-title">PLI Scheme for Bulk Drugs and Active Pharmaceutical Ingredients (APIs)</h2>
        <div class="offering-authority">Department of Pharmaceuticals &amp; DPIIT</div>
        <div class="offering-jurisdiction">CENTRAL</div>
        <div class="offering-sectors">PHARMACEUTICALS</div>
        <div class="offering-scales">SMALL, MEDIUM, LARGE</div>
        <div class="offering-benefit-type">PRODUCTION_INCENTIVE</div>
        <div class="offering-benefit-desc">Financial incentive of 5% to 20% on incremental domestic sales of identified critical Key Starting Materials (KSMs), Drug Intermediates, and APIs.</div>
        <div class="offering-eligibility">Pharmaceutical and fine chemical manufacturers establishing greenfield manufacturing units with valid drug manufacturing licenses.</div>
        <div class="offering-evidence">Gazette Notification No. 31026/16/2020-Policy-DoP. Production linked incentive for 41 critical bulk drugs to secure medicine supply chains.</div>
        <div class="offering-app-route">Apply via IFCI Project Management Portal.</div>
        <a class="offering-link" href="https://pharmaceuticals.gov.in/schemes">https://pharmaceuticals.gov.in/schemes</a>
        <span class="offering-validity" data-from="2021-04-01" data-to="2028-03-31">Active (April 2021 - March 2028)</span>
      </div>

    </section>
  </div>
</body>
</html>
"""

MAHARASHTRA_MCED_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Maharashtra State Industrial Schemes - MCED &amp; Directorate of Industries</title>
</head>
<body>
  <div class="mced-schemes-wrapper">
    <h1>Government of Maharashtra - State Industrial &amp; MSME Incentives</h1>
    <div class="mced-grid">

      <div class="mced-item" data-code="SCHEME-MH-PSI-2019">
        <h2 class="mced-title">Maharashtra Package Scheme of Incentives (PSI 2019 / 2024) - Industrial Promotion Subsidy</h2>
        <div class="mced-authority">Directorate of Industries, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">ALL</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">Industrial Promotion Subsidy (IPS) equivalent to 60% to 100% of Gross SGST paid, or up to 100% of Fixed Capital Investment (FCI) over 7 to 10 years for units in B, C, D, D+ and No Industry District talukas.</div>
        <div class="mced-eligibility">New or expanding Micro, Small and Medium manufacturing enterprises set up in Maharashtra with valid Udyam Registration and Eligibility Certificate from DIC.</div>
        <div class="mced-evidence">Government Resolution No. PSI-2019/CR-46/IND-8 dated 18th March 2019 and extension GR 2024. Maximum IPS incentive extends up to 100% of eligible FCI for MSMEs in Zone C and D areas.</div>
        <div class="mced-route">Apply online through Maharashtra Industry, Trade and Investment Single Window Portal (MAITRI).</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in">https://maitri.mahaonline.gov.in</a>
        <div class="mced-validity" data-from="2019-04-01" data-to="2029-03-31">Active (April 2019 - March 2029)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-INTEREST-SUBSIDY">
        <h2 class="mced-title">Maharashtra MSME Interest Subvention Scheme</h2>
        <div class="mced-authority">Directorate of Industries, Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">ALL</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">INTEREST_SUBVENTION</div>
        <div class="mced-benefit-desc">5% per annum interest subsidy on term loans availed from scheduled banks for acquisition of new plant and machinery, subject to maximum Rs. 10 Lakhs per annum for 5 years.</div>
        <div class="mced-eligibility">Manufacturing MSMEs located in Zone B, C, D, D+ areas of Maharashtra who have not defaulted on bank term loans.</div>
        <div class="mced-evidence">GR No. PSI-2019/CR-46/IND-8 Annexure II. Interest subsidy payable at 5% p.a. on effective rate of interest disbursed on term loan for eligible MSME units.</div>
        <div class="mced-route">Apply via District Industries Centre (DIC) / MAITRI Portal.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/schemes/interest-subsidy">https://maitri.mahaonline.gov.in/schemes/interest-subsidy</a>
        <div class="mced-validity" data-from="2019-04-01" data-to="2029-03-31">Active (April 2019 - March 2029)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-POWER-TARIFF">
        <h2 class="mced-title">Maharashtra Power Tariff Subsidy for MSMEs</h2>
        <div class="mced-authority">Energy &amp; Industries Department, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">MANUFACTURING</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">POWER_TARIFF_SUBSIDY</div>
        <div class="mced-benefit-desc">Power tariff subsidy of Rs. 1.00 per unit for all MSME manufacturing units in Vidarbha, Marathwada, North Maharashtra, and Rs. 1.20 per unit for other backward regions for a period of 5 years.</div>
        <div class="mced-eligibility">Operational manufacturing MSMEs in Maharashtra holding valid HT/LT industrial electricity connections with MSEDCL, Tata Power, or Adani Electricity.</div>
        <div class="mced-evidence">Maharashtra Energy Dept GR No. IND-2020/MSME-PWR/CR-12. Direct bill reimbursement credit of Rs. 1.00 per kilowatt-hour unit on monthly power invoices.</div>
        <div class="mced-route">Apply through MSEDCL portal with DIC endorsement certificate.</div>
        <a class="mced-url" href="https://mced.co.in/power-tariff-subsidy">https://mced.co.in/power-tariff-subsidy</a>
        <div class="mced-validity" data-from="2020-04-01" data-to="2027-03-31">Active (April 2020 - March 2027)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-ELECTRICITY-DUTY">
        <h2 class="mced-title">Maharashtra 100% Electricity Duty Exemption</h2>
        <div class="mced-authority">Directorate of Industries, Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">MANUFACTURING</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">TAX_EXEMPTION</div>
        <div class="mced-benefit-desc">100% full waiver of State Electricity Duty on industrial power tariff for 10 to 15 years from date of commercial production.</div>
        <div class="mced-eligibility">Manufacturing units established in Zone C, D, D+ and No Industry Districts in Maharashtra.</div>
        <div class="mced-evidence">Maharashtra Electricity Duty Act Amendment Section 3(2)(d). Total exemption of duty payable on electric energy consumed in industrial production.</div>
        <div class="mced-route">Submit Part-I / Part-II Eligibility application on MAITRI portal.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/electricity-duty-exemption">https://maitri.mahaonline.gov.in/electricity-duty-exemption</a>
        <div class="mced-validity" data-from="2019-04-01" data-to="2029-03-31">Active (April 2019 - March 2029)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-STAMP-DUTY">
        <h2 class="mced-title">Maharashtra 100% Stamp Duty and Registration Fee Waiver</h2>
        <div class="mced-authority">Revenue &amp; Industries Dept, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">ALL</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">TAX_EXEMPTION</div>
        <div class="mced-benefit-desc">100% exemption from Stamp Duty and Registration Fees on purchase/lease of land, premises, and mortgage deeds for obtaining term loans.</div>
        <div class="mced-eligibility">MSMEs acquiring land or factory sheds in MIDC industrial parks or designated industrial zones in Maharashtra.</div>
        <div class="mced-evidence">Maharashtra Stamp Act 1958 Section 9(a) Notification No. Mudrank-2019/CR-23/M-1. 100% stamp duty exemption for MSMEs in developing zones.</div>
        <div class="mced-route">Obtain DIC Certificate of Eligibility prior to registration of deed.</div>
        <a class="mced-url" href="https://mced.co.in/stamp-duty-exemption">https://mced.co.in/stamp-duty-exemption</a>
        <div class="mced-validity" data-from="2019-04-01" data-to="2029-03-31">Active (April 2019 - March 2029)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-TEXTILE-POLICY">
        <h2 class="mced-title">Maharashtra Textile Policy Capital &amp; Power Subsidy</h2>
        <div class="mced-authority">Textiles Department, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">TEXTILE</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM, LARGE</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">Special 25% to 45% capital investment subsidy on textile machinery, plus additional Rs. 2.00 per unit power subsidy for spinning and weaving units.</div>
        <div class="mced-eligibility">Cotton ginning, spinning, knitting, weaving, processing and garment manufacturing units operating in Maharashtra textile clusters.</div>
        <div class="mced-evidence">Maharashtra State Co-operative &amp; Textile Policy GR No. TEX-2023/CR-88/TEX-1. Special capital subsidy linked with Central TUFS / ATUFS.</div>
        <div class="mced-route">Apply via Textile Commissionerate Maharashtra or MAITRI single window.</div>
        <a class="mced-url" href="https://textiles.maharashtra.gov.in">https://textiles.maharashtra.gov.in</a>
        <div class="mced-validity" data-from="2023-06-01" data-to="2028-05-31">Active (June 2023 - May 2028)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-AGRO-FOOD-INCENTIVE">
        <h2 class="mced-title">Maharashtra Agro &amp; Food Processing Capital Incentive Scheme</h2>
        <div class="mced-authority">Agriculture &amp; Industries Dept, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">FOOD_PROCESSING</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">Additional 20% to 50% capital subsidy on secondary and tertiary agro-processing equipment, cold chain vans, and ripening chambers.</div>
        <div class="mced-eligibility">Units processing fruits, vegetables, grains, pulses, dairy, and spices situated in Maharashtra agro clusters.</div>
        <div class="mced-evidence">Maharashtra Agro-Industrial Policy GR No. AGRO-2022/CR-14. Special incentive for food processing units adding minimum 25% value to local agricultural produce.</div>
        <div class="mced-route">Apply online via Maharashtra Agriculture Single Window / MAITRI.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/agro-processing">https://maitri.mahaonline.gov.in/agro-processing</a>
        <div class="mced-validity" data-from="2022-04-01" data-to="2027-03-31">Active (April 2022 - March 2027)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-CMEGP">
        <h2 class="mced-title">Chief Minister Employment Generation Programme (CMEGP Maharashtra)</h2>
        <div class="mced-authority">Directorate of Industries &amp; KVIB, Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">ALL</div>
        <div class="mced-scales">MICRO</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">Margin money capital subsidy of 15% to 35% of project cost up to Rs. 50 Lakhs for manufacturing projects in Maharashtra.</div>
        <div class="mced-eligibility">Maharashtra domicile entrepreneurs aged 18 to 45 years setting up new micro manufacturing or service units.</div>
        <div class="mced-evidence">CMEGP Operational Guidelines 2022. 25% urban and 35% rural margin money financial assistance with bank term loan linkage.</div>
        <div class="mced-route">Apply online on the official CMEGP Maharashtra portal.</div>
        <a class="mced-url" href="https://cmegp.gov.in">https://cmegp.gov.in</a>
        <div class="mced-validity" data-from="2021-01-01" data-to="2026-12-31">Active (Jan 2021 - Dec 2026)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-SEED-MONEY">
        <h2 class="mced-title">Maharashtra Seed Money Scheme (SMS) for Self-Employment</h2>
        <div class="mced-authority">MCED &amp; District Industries Centre (DIC)</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">ALL</div>
        <div class="mced-scales">MICRO</div>
        <div class="mced-benefit-type">SOFT_LOAN</div>
        <div class="mced-benefit-desc">Soft loan assistance up to 15% of project cost (capped at Rs. 3.75 Lakhs) at a nominal 6% interest rate to bridge promoter contribution.</div>
        <div class="mced-eligibility">Unemployed youth with minimum 7th standard qualification residing in Maharashtra for at least 3 years.</div>
        <div class="mced-evidence">Industries, Energy and Labour Department GR No. DIC-SeedMoney/2021. Seed money bridges the gap between bank finance and borrower equity.</div>
        <div class="mced-route">Apply at local District Industries Centre (DIC) or MCED field offices.</div>
        <a class="mced-url" href="https://mced.co.in/seed-money-scheme">https://mced.co.in/seed-money-scheme</a>
        <div class="mced-validity" data-from="2020-04-01" data-to="2027-03-31">Active (April 2020 - March 2027)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-ELECTRONICS-POLICY">
        <h2 class="mced-title">Maharashtra Electronics Policy Capital &amp; Patent Subsidy</h2>
        <div class="mced-authority">Industries Department, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">ELECTRONICS</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">20% capital subsidy on fixed capital investment in ESDM, 100% stamp duty waiver, and full reimbursement of testing laboratory equipment expenses.</div>
        <div class="mced-eligibility">ESDM units manufacturing semiconductor chips, solar cells, PCB assemblies, and telecommunication hardware in Maharashtra.</div>
        <div class="mced-evidence">Maharashtra Electronics Policy 2023 GR No. ELEC-2023/CR-102. Special cluster incentives for electronics manufacturing in Pune, Talegaon, and Aurangabad.</div>
        <div class="mced-route">Apply through MAITRI Single Window ESDM window.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/esdm">https://maitri.mahaonline.gov.in/esdm</a>
        <div class="mced-validity" data-from="2023-01-01" data-to="2028-12-31">Active (Jan 2023 - Dec 2028)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-EV-MANUFACTURING">
        <h2 class="mced-title">Maharashtra Electric Vehicle (EV) Manufacturing Policy Incentive</h2>
        <div class="mced-authority">Industries &amp; Transport Dept, Government of Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">AUTOMOTIVE</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM, LARGE</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">15% capital subsidy up to Rs. 20 Crore for EV assembly, battery packaging, electric motors, and powertrain manufacturing in Maharashtra.</div>
        <div class="mced-eligibility">Enterprises manufacturing electric 2-wheelers, 3-wheelers, electric buses, battery packs, and EV charging components.</div>
        <div class="mced-evidence">Maharashtra EV Policy 2025 GR No. EV-2021/CR-01/IND-8. Pioneer and MSME incentives for zero-emission vehicle components.</div>
        <div class="mced-route">Apply online via MAITRI EV Cell.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/ev">https://maitri.mahaonline.gov.in/ev</a>
        <div class="mced-validity" data-from="2021-07-23" data-to="2027-03-31">Active (July 2021 - March 2027)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-PHARMA-BIOTECH">
        <h2 class="mced-title">Maharashtra Biotechnology &amp; Bulk Drug Formulation Incentive</h2>
        <div class="mced-authority">Industries &amp; Health Dept, Maharashtra</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">PHARMACEUTICALS</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">CAPITAL_SUBSIDY</div>
        <div class="mced-benefit-desc">Capital subsidy up to 30% on cleanroom setup, effluent treatment systems, and WHO-GMP compliance upgradation in Maharashtra pharma clusters.</div>
        <div class="mced-eligibility">Formulation, bulk drug, diagnostic kit, and bio-pharma units setting up in Raigad, Tarapur, Aurangabad, or Kurkumbh.</div>
        <div class="mced-evidence">Maharashtra Biotech Policy GR No. BIO-2022/CR-44. Dedicated environmental and infrastructure grants for life sciences units.</div>
        <div class="mced-route">Apply via FDA Maharashtra &amp; MAITRI single window.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/biotech">https://maitri.mahaonline.gov.in/biotech</a>
        <div class="mced-validity" data-from="2022-01-01" data-to="2027-12-31">Active (Jan 2022 - Dec 2027)</div>
      </div>

      <div class="mced-item" data-code="SCHEME-MH-EXPORT-PROMOTION">
        <h2 class="mced-title">Maharashtra State Export Promotion Assistance Scheme</h2>
        <div class="mced-authority">Maharashtra Industry Trade and Investment (MAITRI)</div>
        <div class="mced-jurisdiction">MH</div>
        <div class="mced-sectors">EXPORT</div>
        <div class="mced-scales">MICRO, SMALL, MEDIUM</div>
        <div class="mced-benefit-type">EXPORT_GRANT</div>
        <div class="mced-benefit-desc">50% freight subsidy on export consignments (up to Rs. 5 Lakhs) and 75% stall rental subsidy for exhibiting at approved overseas buyer-seller meets.</div>
        <div class="mced-eligibility">Maharashtra-based manufacturing MSMEs holding valid IEC code with positive export turnover growth.</div>
        <div class="mced-evidence">Maharashtra State Export Promotion Policy GR No. EXP-2023/CR-19. Export competitiveness assistance for direct MSME exporters.</div>
        <div class="mced-route">Submit shipping bills and travel claims via MAITRI Export Cell.</div>
        <a class="mced-url" href="https://maitri.mahaonline.gov.in/export-cell">https://maitri.mahaonline.gov.in/export-cell</a>
        <div class="mced-validity" data-from="2023-04-01" data-to="2028-03-31">Active (April 2023 - March 2028)</div>
      </div>

    </div>
  </div>
</body>
</html>
"""
