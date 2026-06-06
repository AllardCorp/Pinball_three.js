import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Les tests backend d'intégration ont besoin d'un environnement dédié.
// On charge donc un fichier local non versionné pour éviter toute écriture
// accidentelle sur la base de développement.
config({ path: ".env.test.local" });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
