import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.{ts,mjs}", "<rootDir>/scripts/**/*.test.mjs", "<rootDir>/e2e/**/*.test.mjs"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
};

export default createJestConfig(config);
