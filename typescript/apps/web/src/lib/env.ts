/**
 * Runtime environment configuration
 *
 * In production: reads from window.__ENV__ (injected at container startup)
 * In development: falls back to import.meta.env (Vite build-time)
 */

declare global {
  interface Window {
    __ENV__?: {
      VITE_API_URL?: string;
      VITE_VAPI_PUBLIC_KEY?: string;
    };
  }
}

function getEnv(key: string): string {
  // First try runtime config (production)
  const runtimeValue = window.__ENV__?.[key as keyof typeof window.__ENV__];
  if (runtimeValue && !runtimeValue.startsWith('__')) {
    return runtimeValue;
  }

  // Fall back to build-time config (development)
  return import.meta.env[key] || '';
}

export const env = {
  VITE_API_URL: getEnv('VITE_API_URL'),
  VITE_VAPI_PUBLIC_KEY: getEnv('VITE_VAPI_PUBLIC_KEY'),
};
