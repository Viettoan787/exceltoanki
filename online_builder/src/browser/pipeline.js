import { createApkgBuildPlan } from "../apkg/build-plan.js";
import { packageApkgFromPlan } from "../apkg/package-sqljs.js";
import { validateSources } from "../core/validate.js";

export function inspectSources(sources) {
  return validateSources(sources);
}

export async function buildApkgFromSources(sources, options = {}) {
  const buildSources = filterSourcesForBuild(sources, options.selectedSources);
  const report = validateSources(buildSources);
  if (report.summary.blockers) {
    const error = new Error(`Cannot build APKG: ${report.summary.blockers} validation blocker(s).`);
    error.code = "VALIDATION_BLOCKED";
    error.report = report;
    throw error;
  }

  const plan = await createApkgBuildPlan(report, {
    selectedSources: options.selectedSources,
  });
  const bytes = await packageApkgFromPlan(plan, options.templateBundle, {
    timestamp: options.timestamp,
    sqlJsConfig: options.sqlJsConfig,
    outputType: "uint8array",
  });
  return { bytes, report, plan };
}

function filterSourcesForBuild(sources, selectedSources = []) {
  const selected = new Set(selectedSources || []);
  if (!selected.size) return sources;
  return sources.filter((source) => selected.has(source.name || source.sourceName));
}

export function downloadApkg(bytes, filename = "sheet-to-anki.apkg", documentRef = globalThis.document) {
  if (!documentRef?.createElement || typeof URL.createObjectURL !== "function") {
    throw new Error("Browser download APIs are unavailable.");
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/apkg" }));
  const anchor = documentRef.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
