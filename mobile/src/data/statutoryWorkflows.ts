/**
 * ComplyWise Mobile - Statutory Workflows & Multi-Stage Pipelines
 * Direct parity with web interactive WorkflowPipeline (PRD §18, TRD §31)
 */

import { StatutoryWorkflow } from '../types/work';

export const DEMO_STATUTORY_WORKFLOWS: StatutoryWorkflow[] = [
  {
    id: 'wf-bis-lic-renewal',
    title: 'BIS Scheme-I Certification & ISI Mark License Renewal',
    standardCode: 'IS 1293:2019',
    authority: 'Bureau of Indian Standards',
    status: 'IN_PROGRESS',
    currentStageIndex: 2, // Stage 3 "Review" is active initially
    totalStages: 5,
    lastUpdated: 'Today, 10:15 AM',
    dueDate: '14 May 2026',
    blocker: 'Awaiting NABL accredited endurance test report re-validation.',
    stages: [
      {
        id: 'stage-1',
        number: 1,
        name: 'Requirement',
        status: 'COMPLETED',
        description: 'Statutory applicability identified under DPIIT mandatory QCO Gazette Order S.O. 1421(E).',
        assignedTo: 'Automated Engine',
        updatedAt: '10 Jan 2025',
        checklist: [
          { label: 'Check HS Code 85366910 against QCO schedule', done: true },
          { label: 'Verify manufacturer jurisdiction & factory address', done: true },
        ],
      },
      {
        id: 'stage-2',
        number: 2,
        name: 'Documents',
        status: 'COMPLETED',
        description: 'Statutory evidence dossier compiled: factory lease, machinery list, and laboratory instruments.',
        assignedTo: 'Dr. Vikramaditya Sharma',
        updatedAt: '18 Jan 2025',
        checklist: [
          { label: 'Upload Factory License & DISH Registration', done: true },
          { label: 'Upload Quality Assurance Plan Rev 4.2', done: true },
          { label: 'Upload In-house testing equipment calibration logs', done: true },
        ],
      },
      {
        id: 'stage-3',
        number: 3,
        name: 'Review',
        status: 'IN_PROGRESS',
        description: 'Internal regulatory audit of test parameters prior to formal portal submission.',
        assignedTo: 'QA Technical Lead',
        updatedAt: 'Today, 10:15 AM',
        estimatedCompletion: '24 Jan 2025',
        actionCta: 'Please Submit Audit',
        checklist: [
          { label: 'Cross-check Clause 13.2 Endurance test parameters', done: true },
          { label: 'Validate Clause 18 Temperature Rise threshold', done: false },
          { label: 'Confirm TM authorization for ISI device mark', done: true },
        ],
      },
      {
        id: 'stage-4',
        number: 4,
        name: 'Application',
        status: 'PENDING',
        description: 'Generation of Form-I application dossier for Manakonline portal submission.',
        assignedTo: 'Regulatory Officer',
        estimatedCompletion: '02 Feb 2025',
        actionCta: 'Draft Form-I Application',
        checklist: [
          { label: 'Generate digitally signed Form-I payload', done: false },
          { label: 'Calculate statutory application & audit inspection fees', done: false },
        ],
      },
      {
        id: 'stage-5',
        number: 5,
        name: 'Submission',
        status: 'PENDING',
        description: 'Formal electronic filing on BIS portal with e-challan payment receipt.',
        assignedTo: 'Legal Signatory',
        estimatedCompletion: '10 Feb 2025',
        actionCta: 'Submit Final Filing',
        checklist: [
          { label: 'Upload treasury challan payment receipt', done: false },
          { label: 'Submit application to Central Regional Office', done: false },
        ],
      },
    ],
  },
  {
    id: 'wf-epr-clearance',
    title: 'CPCB Extended Producer Responsibility (EPR) Annual Filing',
    standardCode: 'E-Waste Rules 2022',
    authority: 'Central Pollution Control Board',
    status: 'WAITING_FOR_USER',
    currentStageIndex: 1, // Stage 2 is active
    totalStages: 4,
    lastUpdated: 'Yesterday, 3:45 PM',
    dueDate: '30 Jun 2026',
    stages: [
      {
        id: 'epr-1',
        number: 1,
        name: 'Target Review',
        status: 'COMPLETED',
        description: 'Annual recycling target determined based on 2-year moving sales volume.',
        assignedTo: 'Automated Engine',
        checklist: [
          { label: 'Verify annual sales volume tonnage', done: true },
          { label: 'Calculate mandated recycling obligation percentage', done: true },
        ],
      },
      {
        id: 'epr-2',
        number: 2,
        name: 'Certificates',
        status: 'IN_PROGRESS',
        description: 'Reconciliation of EPR recycling credit certificates from registered recyclers.',
        assignedTo: 'Operations Lead',
        actionCta: 'Please Submit Audit & Credits',
        checklist: [
          { label: 'Collect recycling certificates from registered TSDF partners', done: true },
          { label: 'Audit material balance ledger with purchase registers', done: false },
          { label: 'Obtain environmental auditor endorsement', done: false },
        ],
      },
      {
        id: 'epr-3',
        number: 3,
        name: 'Portal Filing',
        status: 'PENDING',
        description: 'CPCB EPR Portal annual return filing with DSC token.',
        assignedTo: 'Compliance Officer',
        actionCta: 'Submit Annual Return',
        checklist: [
          { label: 'Submit online annual return Form-1', done: false },
          { label: 'Pay board administrative oversight fees', done: false },
        ],
      },
      {
        id: 'epr-4',
        number: 4,
        name: 'Clearance',
        status: 'PENDING',
        description: 'Issuance of annual EPR compliance acknowledgment slip.',
        assignedTo: 'CPCB Regional Office',
        actionCta: 'Download EPR Compliance Slip',
        checklist: [
          { label: 'Download certified acknowledgment slip', done: false },
        ],
      },
    ],
  },
  {
    id: 'wf-factory-consent',
    title: 'SPCB Factory Consent to Operate (CTO) Renewal',
    standardCode: 'Air & Water Acts 1974/1981',
    authority: 'State Pollution Control Board',
    status: 'IN_PROGRESS',
    currentStageIndex: 1,
    totalStages: 3,
    lastUpdated: 'Sep 11, 2026',
    dueDate: '24 Sep 2026',
    stages: [
      {
        id: 'cto-1',
        number: 1,
        name: 'Testing',
        status: 'COMPLETED',
        description: 'Stack emission and effluent laboratory analysis from NABL accredited lab.',
        assignedTo: 'NABL Certified Lab',
        checklist: [
          { label: 'Collect stack emission samples', done: true },
          { label: 'Test BOD/COD levels against state discharge standards', done: true },
        ],
      },
      {
        id: 'cto-2',
        number: 2,
        name: 'Cess Payment',
        status: 'IN_PROGRESS',
        description: 'Calculate water cess and pay annual fee on state portal.',
        assignedTo: 'Finance Lead',
        actionCta: 'Please Submit Payment Audit',
        checklist: [
          { label: 'Generate OCMMS challan for water cess', done: true },
          { label: 'Confirm fee credit in state treasury account', done: false },
        ],
      },
      {
        id: 'cto-3',
        number: 3,
        name: 'CTO Grant',
        status: 'PENDING',
        description: 'Final consent order issued with 1-year statutory validity.',
        assignedTo: 'Member Secretary SPCB',
        actionCta: 'Accept CTO Order',
        checklist: [
          { label: 'Download renewed CTO order copy', done: false },
        ],
      },
    ],
  },
];
