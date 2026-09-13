# ComplyWise Mobile (Android Production Client)

Enterprise Industrial Regulatory Intelligence Platform — Native Android Application.

This application is the complete mobile client for the ComplyWise regulatory intelligence platform, connected to the deployed backend (`https://comply-wise-one.vercel.app/api/v1`).

The backend remains the **single source of truth** for all regulatory rules, applicability logic, AST evaluation, and statutory evidence.

---

## 🏛 Architecture Overview

```
Mobile Application (Android / Expo Router)
  ↓ HTTPS (JSON Envelope Pattern: {"data": ..., "meta": ...})
Django REST API (Backend on Vercel)
  ↓
PostgreSQL / Supabase / Regulatory Knowledge Engine / Applicability / Assistant
```

### Architectural Guardrails

1. **Zero Regulatory Logic in Mobile**: Applicability decisions, business classification, and rule evaluation are performed strictly server-side in Django.
2. **Zero Direct AI / DB Calls**: The mobile app communicates exclusively with the Django REST API. No direct OpenAI or PostgreSQL connections exist in client code.
3. **Hardware-Backed Secret Isolation**: Authentication tokens are stored exclusively in the **Android Keystore** via `expo-secure-store` (`EncryptedSharedPreferences`). No plaintext tokens in AsyncStorage.
4. **Pure Light Mode Executive Design**: Soft background `#F7F9FC` / `#F8FAFC`, card surfaces `#FFFFFF`, navy typography `#0F172A`, cyan/teal accents `#0891B2`, restrained amber badges `#D97706`. Zero dark mode leakage or neon styling.
5. **Honest System Transparency**: Limitations such as unconfigured document uploads (HTTP 501) and regulatory change monitoring are explicitly surfaced rather than masked with fake previews.

---

## 📱 Complete Screen Hierarchy & Routing

```
mobile/app/
├── _layout.tsx                     # Root gate: AuthProvider + BusinessProvider + Splash Gate
├── index.tsx                       # Initial entry point
│
├── (auth)/                         # Authentication Route Group
│   ├── _layout.tsx                 # Auth stack configuration
│   ├── signin.tsx                  # Sign In Screen (POST /api/v1/auth/login)
│   └── register.tsx                # Organization Registration Screen (POST /api/v1/auth/register)
│
├── (onboarding)/                   # Assessment & Entity Profiling Flow
│   ├── _layout.tsx                 # Onboarding stack layout
│   ├── setup.tsx                   # Business Identity, Jurisdiction, Constitution & Products
│   ├── questions.tsx               # Dynamic Smart Questions Wizard (GET/POST .../onboarding/...)
│   ├── analysis.tsx                # Processing screen triggering POST /api/v1/businesses/{id}/evaluate
│   └── results.tsx                 # Scorecard Overview (Figma 1:468 - Readiness & Mandate Summary)
│
└── (app)/                          # Authenticated Core Application Shell
    ├── _layout.tsx                 # Stack hosting Tabs + Detail + Profile
    ├── index.tsx                   # Redirect to (tabs)
    ├── profile.tsx                 # Profile & Organization Switcher (GET /api/v1/user/home)
    ├── compliance/
    │   └── [id].tsx                # Requirement Detail (Answers 4 questions: Why, Need, Next, Evidence)
    └── (tabs)/                     # Main Bottom Tab Navigation
        ├── _layout.tsx             # Floating light-theme bottom tab bar (5 tabs)
        ├── index.tsx               # Home / Dashboard Tab (GET .../dashboard)
        ├── compliance.tsx          # Compliance Tab with search and status filtering
        ├── work.tsx                # Work Hub Tab (Documents [honest 501], Workflows, Calendar)
        ├── discover.tsx            # Discover Tab (Standards/BIS, Schemes/Subsidies, Updates)
        └── assistant.tsx           # AI Regulatory Copilot Tab (POST /api/v1/assistant/chat)
```

---

## 🗂 Source Code Layout (`src/`)

```
src/
├── api/
│   ├── client.ts                   # Central HTTP client (unwraps envelope, auto-injects auth header)
│   └── index.ts
├── components/
│   ├── auth/                       # AuthScreenContainer, AuthTextInput, PrimaryButton, FormError
│   ├── common/                     # Badge, Card, CitationCard, Header, BusinessPickerModal, EmptyState
│   └── index.ts
├── config/
│   ├── env.ts                      # Central environment resolution (EXPO_PUBLIC_API_BASE_URL)
│   └── index.ts
├── features/
│   ├── auth/                       # AuthContext, AuthProvider, useAuth, auth API
│   ├── business/                   # BusinessContext, BusinessProvider, useBusiness, business API
│   ├── onboarding/                 # Dynamic smart questions & evaluation API
│   ├── dashboard/                  # Dashboard aggregation API
│   ├── compliance/                 # Compliance list & requirement detail API
│   ├── work/                       # Documents, workflows, calendar API
│   ├── discover/                   # Standards, schemes, updates API
│   └── assistant/                  # Grounded statutory chat API
├── storage/
│   ├── secureStore.ts              # Encrypted hardware Keystore abstraction
│   └── index.ts
├── theme/
│   ├── colors.ts                   # Light-mode palette (Navy, Slate, Teal, Amber, Emerald)
│   ├── typography.ts               # Scale & line heights
│   ├── spacing.ts                  # Layout grid tokens
│   └── borderRadius.ts
└── types/                          # Complete TypeScript domain contracts
```

---

## 🧪 Verification & Automated Tests

All tests and validation checks pass with zero errors:

| Check | Command | Result |
|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` | `tsc --noEmit` exits **0** (0 errors) |
| **ESLint Static Analysis** | `npm run lint` | `eslint .` exits **0** (0 errors) |
| **Automated Unit Tests** | `npm test` | **11 / 11 tests pass** in ~200ms |
| **Public Config Inspection** | `npx expo config --type public` | Validated for Expo 57 & Android |
| **Hermes Android Bundle Export**| `npx expo export --platform android`| Produced 3.2MB Hermes `.hbc` binary (**0 bundling errors**) |

---

## 🚀 Running the App

### Option A: Physical Android Device (Recommended)

1. Ensure your phone and computer are on the same Wi-Fi network, or use Expo tunnel mode:
   ```bash
   npx expo start --tunnel
   ```
2. Open the **Expo Go** app on your physical Android device.
3. Scan the QR code displayed in the terminal.

### Option B: Android Emulator (Android Studio)

```bash
npm run android
```

---

## 🔌 API Endpoints Consumed

- **Auth**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- **Businesses**: `GET /api/v1/user/home`, `GET /api/v1/businesses`, `POST /api/v1/businesses`, `GET /api/v1/businesses/{id}/profile`, `POST /api/v1/businesses/{id}/profile`
- **Onboarding & Evaluation**: `GET /api/v1/businesses/{id}/onboarding/questions`, `POST /api/v1/businesses/{id}/onboarding/answers`, `POST /api/v1/businesses/{id}/onboarding/products-activities`, `POST /api/v1/businesses/{id}/evaluate`
- **Dashboard**: `GET /api/v1/businesses/{id}/dashboard`
- **Compliance**: `GET /api/v1/businesses/{id}/compliance`, `GET /api/v1/businesses/{id}/compliance/{req_id}`
- **Work**: `GET /api/v1/businesses/{id}/documents`, `GET /api/v1/businesses/{id}/workflows`, `GET /api/v1/businesses/{id}/calendar`
- **Discover**: `GET /api/v1/standards/search`, `GET /api/v1/businesses/{id}/schemes`, `GET /api/v1/regulatory-updates`
- **AI Copilot**: `POST /api/v1/assistant/chat`
