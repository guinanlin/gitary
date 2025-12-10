import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { dependencies } from "../package.json";
import { renderChunksWithStrategy } from "./splitChunks";
import monacoEditorPluginRaw from "vite-plugin-monaco-editor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

console.log("dependencies", dependencies);
export default defineConfig({
  root: resolve(__dirname, ".."),
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
        replacement: resolve(__dirname, "../src"),
      },
      {
        find: "xbook",
        replacement: resolve(__dirname, "../src/xbook"),
      },
      {
        find: "libs",
        replacement: resolve(__dirname, "../libs"),
      },
      {
        find: /^react$/,
        replacement: resolve(__dirname, "../node_modules/react"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: resolve(__dirname, "../node_modules/react/jsx-runtime"),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: resolve(__dirname, "../node_modules/react/jsx-dev-runtime"),
      },
      {
        find: /^rxjs$/,
        replacement: resolve(__dirname, "../node_modules/rxjs"),
      },
      {
        find: /^rxjs\/(.*)$/,
        replacement: resolve(__dirname, "../node_modules/rxjs/$1"),
      },
    ],
  },
  publicDir: resolve(__dirname, "../public"),
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    minify: "esbuild",
    outDir: "../../dist",
    rollupOptions: {
      input: resolve(__dirname, "../index.html"),
      output: {
        manualChunks: renderChunksWithStrategy(dependencies),
      },
    },
  },
});
