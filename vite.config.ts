import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        "**/private/**",
        "**/research/**",
        "**/.cache/**",
        "**/test-results/**",
        "**/playwright-report/**",
      ],
    },
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/private/**",
        "**/.cache/**",
      ],
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("products.generated.json")) return "product-data";
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
} as Parameters<typeof defineConfig>[0]);
