/**
 * ComplyWise Mobile - Central Environment Configuration
 *
 * Authority: TRD_v2.0 §30, FRONTEND_INSTRUCTIONS.md §4
 *
 * Single point of truth for environment settings and API target URLs.
 * Strictly no secrets (AI keys, DB credentials, signing keys) are ever
 * stored or bundled into the client application.
 */

export type Environment = 'development' | 'preview' | 'production';

export interface AppConfig {
  environment: Environment;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  appName: string;
  appVersion: string;
  enableDebugLogging: boolean;
}

const DEPLOYED_API_BASE_URL = 'https://comply-wise-one.vercel.app/api/v1';

const currentEnvironment: Environment =
  (process.env.EXPO_PUBLIC_ENV as Environment) || 'development';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const config: AppConfig = {
  environment: currentEnvironment,
  apiBaseUrl: configuredApiUrl ? configuredApiUrl.replace(/\/+$/, '') : DEPLOYED_API_BASE_URL,
  apiTimeoutMs: 45000,
  appName: 'ComplyWise',
  appVersion: '1.0.0',
  enableDebugLogging: currentEnvironment !== 'production',
};

export default config;
