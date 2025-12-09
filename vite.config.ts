import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import { dependencies } from "./package.json";
import { renderChunksWithStrategy } from "./splitChunks";
import monacoEditorPluginRaw from "vite-plugin-monaco-editor";


console.log("dependencies", dependencies);
export default defineConfig({
  root: "apps/web",
  base: "/",
  plugins: [
    react(),
    // Only include essential Monaco workers to reduce bundle size / memory usage
    // Support both CJS and ESM default export shapes
    (monacoEditorPluginRaw as any).default
      ? (monacoEditorPluginRaw as any).default({
          languageWorkers: [
            "editorWorkerService",
            "css",
            "html",
            "json",
            "typescript",
          ],
        })
      : (monacoEditorPluginRaw as any)({
      // Keep base/editor + the most commonly used language workers
      languageWorkers: [
        "editorWorkerService",
        "css",
        "html",
        "json",
        "typescript", // covers both js/ts
      ],
      // Do not expose global monaco by default
      // globalAPI: false,
    }),
    // eslint()
  ],

  define: {
  },
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "apps/web/src"),
      },
      {
        find: "xbook",
        replacement: resolve(__dirname, "apps/web/src/xbook"),
      },
      {
        find: "libs",
        replacement: resolve(__dirname, "apps/web/libs"),
      },
    ],
  },
  publicDir: resolve(__dirname, "apps/web/public"),
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    minify: "esbuild",
    outDir: "../../dist",
    rollupOptions: {
      input: resolve(__dirname, "apps/web/index.html"),
      output: {
        manualChunks: renderChunksWithStrategy(dependencies),
      },
    },
  },
});
