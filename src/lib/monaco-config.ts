/**
 * Monaco Editor Configuration for Air-gapped Deployment
 *
 * This configuration bundles Monaco workers into the application,
 * making it work without CDN access (air-gapped mode).
 *
 * Workers are required for Monaco's language features like
 * JSON validation, syntax highlighting, etc.
 */

import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

// Import workers using Vite's ?worker syntax for bundling
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

/**
 * Configure Monaco environment to use bundled workers.
 * This allows Monaco to work without network access.
 */
self.MonacoEnvironment = {
  getWorker(_, label) {
    // Return appropriate worker based on language
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    // Default editor worker for other languages
    return new editorWorker();
  },
};

/**
 * Configure loader to use the bundled monaco instance
 * instead of loading from CDN.
 */
loader.config({ monaco });

/**
 * Initialize Monaco with custom configuration.
 * Call this before mounting any Monaco editors.
 */
export async function initMonaco() {
  return loader.init();
}

export { monaco };
