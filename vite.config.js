import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Every VITE_* value the app reads. Vite bakes missing ones in as undefined (e.g. a host that still
// defines the old REACT_APP_* names), so dev and build stop here instead of shipping a broken bundle.
const REQUIRED_ENV = [
  "VITE_API_BASE_URL",
  "VITE_LOGIN_URL",
  "VITE_REFRESH_TOKEN_URL",
  "VITE_LOGOUT_URL",
  "VITE_SIGN_UP_URL",
  "VITE_VERIFY_EMAIL_URL",
  "VITE_RESEND_VERIFY_EMAIL_URL",
  "VITE_AUTH_TOKENS_LOCAL_STORAGE_KEY",
];

const requireEnv = (mode) => ({
  name: "require-env",
  configResolved(config) {
    if (mode === "test") return; // tests get their values from `test.env` below
    const env = loadEnv(mode, config.envDir || process.cwd(), "VITE_");
    const missing = REQUIRED_ENV.filter((key) => !env[key]);
    if (missing.length) {
      throw new Error(
        `Missing environment variables: ${missing.join(", ")}. ` +
          "Set them in .env (see .env.example) or in the host's environment settings " +
          "(they were REACT_APP_* before the move to Vite)."
      );
    }
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), requireEnv(mode)],
  server: {
    // The backend's CORS allowlist (SecurityParams.CORS_ALLOWED_ORIGINS) expects this origin
    port: 3000,
    strictPort: true,
  },
  // Render publishes build/, as it did with Create React App
  build: { outDir: "build" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    css: false,
    env: {
      VITE_API_BASE_URL: "http://localhost/api/",
      VITE_LOGIN_URL: "auth/authenticate",
      VITE_REFRESH_TOKEN_URL: "auth/refresh-token",
      VITE_LOGOUT_URL: "auth/logout",
      VITE_SIGN_UP_URL: "auth/register",
      VITE_VERIFY_EMAIL_URL: "email-verification/verify",
      VITE_RESEND_VERIFY_EMAIL_URL: "email-verification/resend",
      VITE_AUTH_TOKENS_LOCAL_STORAGE_KEY: "authTokens",
    },
  },
}));
