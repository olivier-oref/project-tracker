// Port and environment of the e2e app server, shared by playwright.config.mjs (webServer) and
// scripts/e2e-warm.mjs (long-lived dev server), so both serve the app exactly the same way.
export const E2E_PORT = Number(process.env.E2E_PORT) || 4046; // parallel agents use 4047+

/** Server env on top of the loaded .env.test.local (see e2e/env.mjs for the DB guard). */
export function e2eServerEnv(env) {
  return {
    ...env,
    NEXT_DIST_DIR: '.next-e2e',
    AUTH_TRUST_HOST: 'true',
    AUTH_URL: `http://localhost:${E2E_PORT}`,
    NEXTAUTH_URL: `http://localhost:${E2E_PORT}`,
    // No real invite emails: src/lib/email.ts skips sending when the key is empty.
    RESEND_API_KEY: '',
    // Google sign-in is never exercised; placeholders keep the provider from reading real ones.
    AUTH_GOOGLE_ID: 'e2e-disabled',
    AUTH_GOOGLE_SECRET: 'e2e-disabled',
  };
}
