import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateSources } from "../src/core/validate.js";
import { createApkgBuildPlan } from "../src/apkg/build-plan.js";
import { loadTemplateBundle } from "../src/apkg/template-loader-node.js";
import { packageApkgFromPlan } from "../src/apkg/package-sqljs.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const outPath = join(root, "out", "cp14-fixture.apkg");
mkdirSync(dirname(outPath), { recursive: true });

const mcq = JSON.parse(readText("fixtures/cp1_mini_mcq.json"));
const caseFixture = JSON.parse(readText("fixtures/cp1_mini_case.json"));
const report = validateSources([mcq, caseFixture]);

if (report.summary.blockers > 0) {
  throw new Error(`Fixture validation has blockers: ${JSON.stringify(report.issues, null, 2)}`);
}

const plan = await createApkgBuildPlan(report);
const templates = loadTemplateBundle(root);
const bytes = await packageApkgFromPlan(plan, templates, {
  outputType: "nodebuffer",
  timestamp: 1780000000,
});

writeFileSync(outPath, bytes);
console.log(`Built test-only CP14 APKG: ${outPath}`);
console.log(JSON.stringify(plan.summary, null, 2));

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}
