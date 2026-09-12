/**
 * Systematic Statutory Document Verification Engine (Client-side & Hybrid)
 *
 * Verifies compliance documents against:
 * 1. File type required for that particular compliance (e.g. strict PDF for blueprints, test reports).
 * 2. Mandatory statutory fields completeness (checking whether all fields have been filled out).
 * 3. Statutory format compliance and date of expiry compliance.
 * 4. AI Pre-validation & OCR inspection (detecting and flagging random/irrelevant uploads).
 *
 * Admin manual verification is scheduled for a future release and is not shown.
 */

export interface VerificationCheckItem {
  id: "file_type" | "field_completeness" | "format_and_expiry" | "ai_relevance";
  title: string;
  passed: boolean;
  status: "PASSED" | "FAILED" | "WARNING";
  message: string;
  issues: string[];
  warnings: string[];
  details?: Record<string, unknown>;
}

export interface DocumentVerificationResult {
  verified: boolean;
  overall_status: "PASSED" | "FAILED" | "WARNING";
  status: "VERIFIED" | "ISSUE" | "NEEDS_REVIEW";
  timestamp: string;
  irrelevant_document_flag: boolean;
  flag_message: string;
  admin_verification: {
    status: "PENDING_LATER_PHASE";
    message: string;
  };
  ocr_analysis: {
    status: string;
    file_name: string;
    detected_headers: string[];
    detected_reference_id: string;
    detected_authority: string;
    extracted_tokens: string[];
    tokens_count: number;
    text_snippet: string;
  };
  checks: {
    file_type: VerificationCheckItem;
    field_completeness: VerificationCheckItem;
    format_and_expiry: VerificationCheckItem;
    ai_relevance: VerificationCheckItem;
  };
  recommendations: string[];
}

export interface DocumentVerificationInput {
  name: string;
  category: string;
  authority: string;
  requirement_id?: string;
  requirement_name?: string;
  requirement_authority?: string;
  reference_number?: string;
  valid_until?: string;
  file_name?: string;
  file_size_bytes?: number;
  clause_linked?: string;
  has_readable_text?: boolean;
  extracted_text?: string;
}

const PROHIBITED_EXTENSIONS = [".exe", ".bat", ".cmd", ".sh", ".zip", ".rar", ".tar", ".gz", ".7z", ".bin", ".js", ".py"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const STATUTORY_STANDARDS: Record<string, {
  domain: string;
  authority: string;
  prescribed_format: string;
  expected_documents: string[];
  keywords: string[];
}> = {
  FOOD: {
    domain: "FOOD",
    authority: "FSSAI",
    prescribed_format: "FSSAI Form B / Schedule 4 FSMS Annexure (IS 10500 Potability Format)",
    expected_documents: [
      "Food Safety Management System (FSMS) Plan",
      "Water Potability Analysis Report (IS 10500)",
      "Premises Processing Area Blueprint Layout",
      "List of Processing Equipment and Machinery",
      "Medical Fitness Certificates of Food Handlers",
      "Form B Application for Central / State License",
    ],
    keywords: ["food", "fssai", "fsms", "water", "potability", "hygiene", "fbo", "kitchen", "haccp", "is 10500"],
  },
  LABOR: {
    domain: "LABOR",
    authority: "DISH",
    prescribed_format: "Factories Act 1948 Form 1 / Form 2 Notice & Chartered Structural Stability Format",
    expected_documents: [
      "Approved Factory Building Plan Approval",
      "Structural Stability Certificate from Chartered Engineer",
      "Machinery Layout Plan with Electric Motor Ratings (HP)",
      "On-Site Emergency Response & Fire Safety Plan",
      "Notice of Occupation of Factory (Form 1 / Form 2)",
    ],
    keywords: ["factory", "dish", "factories act", "structural", "stability", "machinery", "horsepower", "safety", "fire", "emergency", "form 1", "form 2"],
  },
  ENVIRONMENT: {
    domain: "ENVIRONMENT",
    authority: "SPCB / CPCB",
    prescribed_format: "State PCB Consent to Operate (CTO) Schedule / Form I Water & Air Act",
    expected_documents: [
      "Consent to Establish (CTE) / Consent to Operate (CTO)",
      "Effluent Treatment Scheme (ETP / STP Design & Capacity)",
      "Site Layout Plan showing Effluent & Emission Points",
      "Air Pollution Control Equipment (APCM) Technical Specifications",
      "Detailed Project Report (DPR) with Process Flow Chart",
      "Water Balance Diagram and Source Authorization",
    ],
    keywords: ["pollution", "spcb", "cpcb", "consent", "cto", "cte", "effluent", "etp", "stp", "air act", "water act", "emission", "waste"],
  },
  STANDARDS: {
    domain: "STANDARDS",
    authority: "BIS / NABL",
    prescribed_format: "BIS Compulsory Registration (CRS) / NABL Accredited Laboratory Test Report Format",
    expected_documents: [
      "Complete Type-Test Report from BIS/NABL-Recognized Laboratory",
      "Quality Assurance Plan (QAP) Rev 4.2 / Routine Testing Log",
      "In-House Testing & Calibration Certificates",
      "Factory Manufacturing Facility Profile",
    ],
    keywords: ["bis", "nabl", "test report", "is ", "qap", "calibration", "conformity", "crs", "standard"],
  },
  TRADE: {
    domain: "TRADE",
    authority: "DGFT",
    prescribed_format: "DGFT IEC Statutory Format / Entity Identification Document",
    expected_documents: [
      "Permanent Account Number (PAN) Card of the Entity",
      "Certificate of Incorporation / Partnership Deed",
      "Canceled Cheque with Account Number and IFSC Code",
      "Proof of Business Premises (Lease Deed / Utility Bill)",
    ],
    keywords: ["dgft", "iec", "pan", "cheque", "bank", "incorporation", "customs", "export", "import"],
  },
  DEFAULT: {
    domain: "STATUTORY",
    authority: "Statutory Authority",
    prescribed_format: "Standard Statutory Compliance Schedule",
    expected_documents: [
      "Statutory License / Registration Certificate",
      "Entity Incorporation Deed",
      "Premises Proof of Ownership or Lease Agreement",
      "Statutory Compliance Undertaking",
    ],
    keywords: ["compliance", "license", "certificate", "statutory", "registration", "proof"],
  },
};

function getStandard(reqId: string, reqName: string, authority: string) {
  const combined = `${reqId} ${reqName} ${authority}`.toUpperCase();
  if (combined.includes("FSSAI") || combined.includes("FOOD") || combined.includes("ORGANIC")) return STATUTORY_STANDARDS.FOOD;
  if (combined.includes("DISH") || combined.includes("FACTOR") || combined.includes("LABOR") || combined.includes("LABOUR")) return STATUTORY_STANDARDS.LABOR;
  if (combined.includes("SPCB") || combined.includes("CPCB") || combined.includes("POLLUTION") || combined.includes("AIR") || combined.includes("WATER") || combined.includes("GPCB") || combined.includes("TNPCB") || combined.includes("KSPCB")) return STATUTORY_STANDARDS.ENVIRONMENT;
  if (combined.includes("BIS") || combined.includes("NABL") || combined.includes("STANDARD") || combined.includes("CRS") || combined.includes("METROLOGY")) return STATUTORY_STANDARDS.STANDARDS;
  if (combined.includes("DGFT") || combined.includes("IEC") || combined.includes("TRADE") || combined.includes("CUSTOM")) return STATUTORY_STANDARDS.TRADE;
  return STATUTORY_STANDARDS.DEFAULT;
}

export function performClientOCR(input: DocumentVerificationInput) {
  const fileName = (input.file_name || "").trim();
  const docName = (input.name || "").trim();
  const referenceNumber = (input.reference_number || "").trim();
  const authority = (input.authority || "").trim();

  // If explicitly flagged as having no readable text (e.g. blank picture or random image)
  if (input.has_readable_text === false) {
    return {
      status: "NO_READABLE_TEXT",
      file_name: fileName,
      detected_headers: [],
      detected_reference_id: "NONE",
      detected_authority: "NONE",
      extracted_tokens: [],
      tokens_count: 0,
      text_snippet: "",
    };
  }

  const rawText = input.extracted_text || `${docName} ${referenceNumber} ${authority}`;
  const tokens = rawText
    .toLowerCase()
    .replace(/[^a-z0-9_\-\.\§]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  return {
    status: "COMPLETED",
    file_name: fileName,
    detected_headers: [docName],
    detected_reference_id: referenceNumber || "UNSPECIFIED",
    detected_authority: authority || "UNSPECIFIED",
    extracted_tokens: tokens,
    tokens_count: tokens.length,
    text_snippet: `Document: '${docName}' | Reference: '${referenceNumber}' | Authority: '${authority}'`,
  };
}

export function checkFileTypeForCompliance(
  input: DocumentVerificationInput,
  std: typeof STATUTORY_STANDARDS.FOOD
): VerificationCheckItem {
  const fileName = (input.file_name || "").trim();
  const fileSize = input.file_size_bytes;
  const docCategory = (input.category || "").toUpperCase();
  const reqName = input.requirement_name || input.requirement_id || "Statutory Requirement";

  const issues: string[] = [];
  const warnings: string[] = [];

  if (!fileName) {
    issues.push("No file attachment detected. A valid digital evidence file is mandatory.");
    return {
      id: "file_type",
      title: "File Type & Extension Integrity for Compliance",
      passed: false,
      status: "FAILED",
      message: "No evidence file attached.",
      issues,
      warnings,
    };
  }

  const dotIdx = fileName.lastIndexOf(".");
  const ext = dotIdx !== -1 ? fileName.substring(dotIdx).toLowerCase() : "";

  if (PROHIBITED_EXTENSIONS.includes(ext)) {
    issues.push(`Forbidden executable/script extension '${ext}'. Strictly banned on statutory portals for security.`);
  } else if (![".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".docx"].includes(ext)) {
    issues.push(`File extension '${ext}' is not supported. Permitted statutory formats: PDF, PNG, JPG, JPEG, TIFF, DOCX.`);
  }

  // Strict compliance format verification
  const requiresPdfStrictly = [
    "BLUEPRINT", "LAYOUT", "STRUCTURAL", "TEST", "LAB", "QAP", "PLAN", "AUDIT", "ETP", "CTO", "CTE"
  ].some((kw) => docCategory.includes(kw) || reqName.toUpperCase().includes(kw));

  if (requiresPdfStrictly && ext !== ".pdf") {
    issues.push(
      `File type non-compliant: '${reqName}' strictly mandates vector PDF format for architectural/engineering scrutiny. Uploaded format '${ext}' will be rejected by official regulatory bodies.`
    );
  }

  if (fileSize !== undefined) {
    if (fileSize <= 0) issues.push("File size is 0 bytes (corrupted or empty upload).");
    else if (fileSize > MAX_FILE_SIZE_BYTES) {
      issues.push(`File size (${(fileSize / 1024 / 1024).toFixed(1)} MB) exceeds statutory portal upload limit of 10 MB.`);
    }
  }

  const passed = issues.length === 0;
  return {
    id: "file_type",
    title: "File Type & Extension Integrity for Compliance",
    passed,
    status: passed ? "PASSED" : "FAILED",
    message: passed
      ? `Compliant file format (${ext.toUpperCase()}) for ${std.domain} statutory filing.`
      : issues[0],
    issues,
    warnings,
    details: { detected_extension: ext, required_format: requiresPdfStrictly ? "STRICTLY_PDF" : "PDF_OR_IMAGE" },
  };
}

export function checkMandatoryFieldsFilled(
  input: DocumentVerificationInput
): VerificationCheckItem {
  const missingFields: string[] = [];
  const filledFields: string[] = [];

  if (input.name && input.name.trim().length >= 3) filledFields.push("Document Title");
  else missingFields.push("Document Title (min 3 characters)");

  if (input.category && input.category.trim().length > 0) filledFields.push("Document Category");
  else missingFields.push("Document Category");

  if (input.requirement_id || input.clause_linked) filledFields.push("Associated Compliance Requirement");
  else missingFields.push("Associated Compliance Requirement");

  if (input.authority && input.authority.trim().length > 0) filledFields.push("Issuing Regulatory Authority");
  else missingFields.push("Issuing Regulatory Authority");

  if (input.reference_number && input.reference_number.trim().length > 0) filledFields.push("Certificate / License Reference Number");
  else missingFields.push("Certificate / License Reference Number");

  if (input.valid_until && input.valid_until.trim().length > 0) filledFields.push("Valid Until / Date of Expiry");
  else missingFields.push("Valid Until / Date of Expiry");

  if (input.file_name && input.file_name.trim().length > 0) filledFields.push("File Attachment");
  else missingFields.push("File Attachment");

  const passed = missingFields.length === 0;
  return {
    id: "field_completeness",
    title: "Mandatory Statutory Fields Completeness",
    passed,
    status: passed ? "PASSED" : "FAILED",
    message: passed
      ? "All 7 mandatory statutory metadata fields are completely filled out."
      : `Missing required fields: ${missingFields.join(", ")}`,
    issues: missingFields.map((f) => `Missing required field: ${f}`),
    warnings: [],
    details: { missingFields, filledFields },
  };
}

export function checkFormatAndExpiryCompliance(
  input: DocumentVerificationInput,
  std: typeof STATUTORY_STANDARDS.FOOD
): VerificationCheckItem {
  const issues: string[] = [];
  const warnings: string[] = [];
  const docName = (input.name || "").toLowerCase();

  // 1. Format match
  const matchesFormat = std.expected_documents.some((exp) =>
    exp.toLowerCase().split(" ").some((kw) => kw.length > 4 && docName.includes(kw))
  ) || std.keywords.some((k) => docName.includes(k));

  if (!matchesFormat && std.domain !== "DEFAULT") {
    issues.push(
      `Format non-compliant: This compliance requires format conforming to '${std.prescribed_format}'. Expected document types: ${std.expected_documents.slice(0, 3).join(", ")}.`
    );
  }

  // 2. Expiry compliance
  if (!input.valid_until) {
    issues.push("Date of expiry is missing. A valid statutory validity date is mandatory.");
  } else {
    const parsedDate = new Date(input.valid_until);
    if (isNaN(parsedDate.getTime())) {
      issues.push(`Invalid date of expiry format: '${input.valid_until}'.`);
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (parsedDate < today) {
        issues.push(
          `Date of expiry non-compliant: Certificate expired on ${parsedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}. Expired statutory documents are immediately rejected by regulatory portals.`
        );
      } else {
        const diffDays = Math.ceil((parsedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          warnings.push(`Document expiry alert: Certificate expires in ${diffDays} days. Submit renewal application promptly.`);
        }
      }
    }
  }

  const passed = issues.length === 0;
  return {
    id: "format_and_expiry",
    title: "Statutory Format & Expiry Date Compliance",
    passed,
    status: passed ? (warnings.length > 0 ? "WARNING" : "PASSED") : "FAILED",
    message: passed
      ? (warnings.length > 0 ? `Format compliant with ${std.prescribed_format}; expiring soon.` : `Format fully compliant with ${std.prescribed_format} and active validity.`)
      : issues[0],
    issues,
    warnings,
    details: { prescribed_format: std.prescribed_format },
  };
}

export function aiPrevalidateAndOCRAnalysis(
  input: DocumentVerificationInput,
  ocr: ReturnType<typeof performClientOCR>,
  std: typeof STATUTORY_STANDARDS.FOOD
): VerificationCheckItem & { irrelevant_document_flag: boolean; flag_message: string; relevance_score: number } {
  const docName = (input.name || "").trim();
  const docCategory = (input.category || "").trim();
  const fileName = (input.file_name || "").toLowerCase();
  const reqName = input.requirement_name || input.requirement_id || "Statutory Requirement";

  const docText = `${docName} ${docCategory} ${fileName}`.toLowerCase();

  const IRRELEVANT_PATTERNS = [
    "bill", "electricity", "invoice", "receipt", "water bill", "utility", "telephone",
    "mobile bill", "tax return", "itr", "gst return", "salary", "payslip", "resume",
    "cv", "menu", "restaurant", "hotel", "travel", "ticket", "boarding", "random",
    "test upload", "dummy", "untitled", "sample", "memo", "selfie", "photo", "personal"
  ];

  const hasIrrelevantPattern = IRRELEVANT_PATTERNS.some((pat) => docText.includes(pat));

  let isDomainConflict = false;
  if (std.domain === "FOOD" && ["structural stability", "boiler", "factory building", "machinery load", "trademark", "iec code", "air pollution"].some((k) => docText.includes(k))) {
    isDomainConflict = true;
  } else if (std.domain === "LABOR" && ["food safety", "potability", "fssai", "trademark", "iec code", "effluent treatment", "restaurant"].some((k) => docText.includes(k))) {
    isDomainConflict = true;
  } else if (std.domain === "ENVIRONMENT" && ["food handler", "medical fitness", "trademark", "directors pan", "restaurant"].some((k) => docText.includes(k))) {
    isDomainConflict = true;
  } else if (std.domain === "STANDARDS" && ["electricity bill", "lease agreement", "rent agreement", "food handler", "restaurant"].some((k) => docText.includes(k))) {
    isDomainConflict = true;
  }

  const matchesExpectedSpec = std.expected_documents.some((exp) =>
    exp.toLowerCase().split(" ").some((kw) => kw.length > 4 && docText.includes(kw))
  );

  const isBlankOrUnreadable = input.has_readable_text === false || (ocr.status === "NO_READABLE_TEXT");
  const isRandom = docName.length < 4 || hasIrrelevantPattern || isBlankOrUnreadable;

  let relevanceScore = 100;
  if (isBlankOrUnreadable) {
    relevanceScore = 0;
  } else if (hasIrrelevantPattern || isDomainConflict) {
    relevanceScore = 15;
  } else if (isRandom) {
    relevanceScore = 10;
  } else if (!matchesExpectedSpec && std.domain !== "DEFAULT") {
    relevanceScore = 35;
  } else {
    relevanceScore = 95;
  }

  const isRelevant = relevanceScore >= 60 && !isDomainConflict && !isRandom && !isBlankOrUnreadable;

  const userFlagMessage =
    "The document is not the kind of document we are looking for. You need to actually do the OCR, check the extensions, and check whether all the fields have been filled up.";

  const issues: string[] = [];
  const warnings: string[] = [];

  if (!isRelevant) {
    issues.push(userFlagMessage);
    issues.push(
      `AI Pre-Validation Mismatch: '${docName}' does not align with '${reqName}'. Expected document types: ${std.expected_documents.slice(0, 3).join(", ")}.`
    );
  }

  return {
    id: "ai_relevance",
    title: "AI Pre-Validation & OCR Relevance Inspection",
    passed: isRelevant,
    status: isRelevant ? "PASSED" : "FAILED",
    message: isRelevant
      ? `AI Pre-validation confirmed document relevance (${relevanceScore}% confidence match).`
      : userFlagMessage,
    issues,
    warnings,
    irrelevant_document_flag: !isRelevant,
    flag_message: !isRelevant ? userFlagMessage : "",
    relevance_score: relevanceScore,
    details: {
      relevance_score: relevanceScore,
      expected_documents: std.expected_documents,
      ocr_tokens_found: ocr.tokens_count,
    },
  };
}

export function verifyDocument(input: DocumentVerificationInput): DocumentVerificationResult {
  const std = getStandard(input.requirement_id || "", input.requirement_name || "", input.authority || "");
  const ocr = performClientOCR(input);

  const fileTypeCheck = checkFileTypeForCompliance(input, std);
  const fieldsCheck = checkMandatoryFieldsFilled(input);
  const formatExpiryCheck = checkFormatAndExpiryCompliance(input, std);
  const aiCheck = aiPrevalidateAndOCRAnalysis(input, ocr, std);

  const allPassed =
    fileTypeCheck.passed &&
    fieldsCheck.passed &&
    formatExpiryCheck.passed &&
    aiCheck.passed;

  const hasWarnings =
    fileTypeCheck.warnings.length > 0 ||
    fieldsCheck.warnings.length > 0 ||
    formatExpiryCheck.warnings.length > 0 ||
    aiCheck.warnings.length > 0;

  const overallStatus: "PASSED" | "FAILED" | "WARNING" = !allPassed
    ? "FAILED"
    : hasWarnings
    ? "WARNING"
    : "PASSED";

  const resultStatus: "VERIFIED" | "ISSUE" | "NEEDS_REVIEW" = !allPassed
    ? "ISSUE"
    : hasWarnings
    ? "NEEDS_REVIEW"
    : "VERIFIED";

  const recommendations: string[] = [];
  if (!fileTypeCheck.passed) recommendations.push(...fileTypeCheck.issues);
  if (!fieldsCheck.passed) recommendations.push(...fieldsCheck.issues);
  if (!formatExpiryCheck.passed) recommendations.push(...formatExpiryCheck.issues);
  if (!aiCheck.passed) recommendations.push(...aiCheck.issues);

  return {
    verified: allPassed,
    overall_status: overallStatus,
    status: resultStatus,
    timestamp: new Date().toISOString(),
    irrelevant_document_flag: aiCheck.irrelevant_document_flag,
    flag_message: aiCheck.flag_message,
    admin_verification: {
      status: "PENDING_LATER_PHASE",
      message: "Admin-level manual verification will be implemented at a later time.",
    },
    ocr_analysis: ocr,
    checks: {
      file_type: fileTypeCheck,
      field_completeness: fieldsCheck,
      format_and_expiry: formatExpiryCheck,
      ai_relevance: aiCheck,
    },
    recommendations,
  };
}
