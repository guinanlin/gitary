// Import standalone editor features (commands, find, folding, etc.)
// Keep this single include; the heavy part is languages, which we curate below.
import "monaco-editor/esm/vs/editor/editor.all.js";

// Core API (no implicit global)
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// Language contributions
// Use minimal but useful set; add more here only when needed.
import "monaco-editor/esm/vs/language/typescript/monaco.contribution"; // ts + js
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";
import "monaco-editor/esm/vs/language/css/monaco.contribution"; // css + scss + less

// Basic languages (tokenizers only, no worker)
import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution";
import "monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution";
// Basic languages (tokenizers only, no worker)
const languageLoaders: Record<string, () => Promise<void>> = {
  python: () => import("monaco-editor/esm/vs/basic-languages/python/python.contribution").then(() => {}),
  java: () => import("monaco-editor/esm/vs/basic-languages/java/java.contribution").then(() => {}),
  cpp: () => import("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution").then(() => {}),
  go: () => import("monaco-editor/esm/vs/basic-languages/go/go.contribution").then(() => {}),
  rust: () => import("monaco-editor/esm/vs/basic-languages/rust/rust.contribution").then(() => {}),
  php: () => import("monaco-editor/esm/vs/basic-languages/php/php.contribution").then(() => {}),
  ruby: () => import("monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution").then(() => {}),
  lua: () => import("monaco-editor/esm/vs/basic-languages/lua/lua.contribution").then(() => {}),
  perl: () => import("monaco-editor/esm/vs/basic-languages/perl/perl.contribution").then(() => {}),
  csharp: () => import("monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution").then(() => {}),
  fsharp: () => import("monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution").then(() => {}),
  swift: () => import("monaco-editor/esm/vs/basic-languages/swift/swift.contribution").then(() => {}),
  kotlin: () => import("monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution").then(() => {}),
  scala: () => import("monaco-editor/esm/vs/basic-languages/scala/scala.contribution").then(() => {}),
  coffee: () => import("monaco-editor/esm/vs/basic-languages/coffee/coffee.contribution").then(() => {}),
  powershell: () => import("monaco-editor/esm/vs/basic-languages/powershell/powershell.contribution").then(() => {}),
  bat: () => import("monaco-editor/esm/vs/basic-languages/bat/bat.contribution").then(() => {}),
  xml: () => import("monaco-editor/esm/vs/basic-languages/xml/xml.contribution").then(() => {}),
  sql: () => import("monaco-editor/esm/vs/basic-languages/sql/sql.contribution").then(() => {}),
  shell: () => import("monaco-editor/esm/vs/basic-languages/shell/shell.contribution").then(() => {}),
  ini: () => import("monaco-editor/esm/vs/basic-languages/ini/ini.contribution").then(() => {}),
};

const loadedLanguages = new Set<string>();

export const loadLanguage = async (language: string) => {
  if (loadedLanguages.has(language)) return;
  const loader = languageLoaders[language];
  if (loader) {
    await loader();
    loadedLanguages.add(language);
  }
};

export { monaco };
