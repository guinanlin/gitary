import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { dependencies } from "../package.json";
import { renderChunksWithStrategy } from "./splitChunks";
import monacoEditorPluginRaw from "vite-plugin-monaco-editor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const projectRoot = resolve(__dirname, "../../..");
const isPreview = process.argv.includes("preview") || process.env.VITE_PREVIEW === "true";
const gitProviderPath = resolve(__dirname, "../../../packages/git-provider/src/index.ts");

console.log("dependencies", dependencies);
console.log("isPreview:", isPreview, "projectRoot:", projectRoot);
console.log("__dirname:", __dirname);
console.log("dist path:", resolve(projectRoot, "dist"));
console.log("git-provider path:", gitProviderPath);

export default defineConfig({
  root: isPreview ? projectRoot : resolve(__dirname, ".."),
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
          publicPath: "./",
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
      publicPath: "./",
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
      {
        find: "@dty/git-provider",
        replacement: gitProviderPath,
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
    outDir: isPreview ? "dist" : "../../dist",
    rollupOptions: {
      input: resolve(__dirname, "../index.html"),
      output: {
        manualChunks: renderChunksWithStrategy(dependencies),
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    strictPort: false,
    allowedHosts: true,
  },
});
