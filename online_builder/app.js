import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { BROWSER_TEMPLATE_BUNDLE } from "./src/browser/template-bundle-vite.js";
import { buildApkgFromSources, downloadApkg, inspectSources } from "./src/browser/pipeline.js";
import { sourcesFromCsv, sourcesFromGoogleSheet, sourcesFromXlsx } from "./src/input/workbook-sources.js";
import { BUILD_METADATA } from "./src/constants/versions.js";

const state = {
  reports: {},
  reportKey: "csv",
  report: null,
  version: null,
  selectedSource: null,
  filter: "all",
  localPayload: null,
  localReport: null,
  selectedFiles: [],
  buildToken: null,
  selectedSources: new Set(),
  currentSources: [],
};

const FRONTEND_VERSION = `${BUILD_METADATA.version} / ${BUILD_METADATA.checkpoint}`;
const el = (id) => document.getElementById(id);

function cssEscape(value) {
  if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function text(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function shortSource(source) {
  const raw = text(source);
  const idx = raw.lastIndexOf(":");
  return idx >= 0 ? raw.slice(idx + 1) : raw;
}

function countIssuesForSource(sourceName) {
  const issues = state.report?.issues || [];
  return issues.reduce(
    (acc, issue) => {
      if (issueAppliesToSource(issue, sourceName)) {
        if (issue.severity === "BLOCKER") acc.blockers += 1;
        if (issue.severity === "WARNING") acc.warnings += 1;
      }
      return acc;
    },
    { blockers: 0, warnings: 0 },
  );
}

function issuesForSource(sourceName) {
  return (state.report?.issues || []).filter((issue) => issueAppliesToSource(issue, sourceName));
}

function rowsForSource(sourceName) {
  return (state.report?.rows || []).filter((row) => row.source === sourceName);
}

function selectedIssues() {
  return (state.report?.issues || []).filter((issue) => {
    const affected = issueAffectedSources(issue);
    return affected.some((source) => state.selectedSources.has(source));
  });
}

function issueAffectedSources(issue) {
  if (Array.isArray(issue.affectedSources)) return issue.affectedSources;
  if (!issue.source) return [];
  const visibleSources = new Set((state.report?.sources || []).map((source) => source.source));
  const sourceText = String(issue.source);
  const exact = [...visibleSources].filter((source) => sourceText === source || sourceText.includes(`${source}:row`));
  return exact.length ? exact : [sourceText];
}

function issueAppliesToSource(issue, sourceName) {
  return issueAffectedSources(issue).includes(sourceName);
}

function selectedRawSources() {
  if (!state.selectedSources.size) return [];
  return state.currentSources.filter((source) => state.selectedSources.has(source.name || source.sourceName));
}

function selectedValidationSummary() {
  const sources = selectedRawSources();
  if (!sources.length) {
    return { normalizedRows: 0, blockers: 0, warnings: 0, sources: 0, ignoredSources: 0 };
  }
  return inspectSources(sources).summary;
}

function statusBadge(blockers, warnings) {
  if (blockers) return `<span class="badge danger">Bị chặn</span>`;
  if (warnings) return `<span class="badge warning">Có cảnh báo</span>`;
  return `<span class="badge ok">Sẵn sàng</span>`;
}

function kindBadge(kind) {
  if (kind === "case") return `<span class="badge case">Case</span>`;
  if (kind === "normal") return `<span class="badge normal">MCQ</span>`;
  return `<span class="badge">Unknown</span>`;
}

async function loadReports() {
  state.reports = {
    local: {
      label: "Nguồn browser",
      description: "Chọn Google Sheet công khai, CSV hoặc XLSX để kiểm tra.",
    },
  };
  state.reportKey = "local";
  const select = el("reportSelect");
  select.innerHTML = Object.entries(state.reports)
    .map(([key, report]) => `<option value="${key}">${report.label}</option>`)
    .join("");
  select.value = state.reportKey;
}

async function loadVersion() {
  state.version = { ...BUILD_METADATA, serverStartedAt: "browser-only", root: "local browser" };
  renderVersionPill();
}

function renderVersionPill() {
  const serverVersion = state.version?.version || "unknown";
  el("versionPill").textContent = `${FRONTEND_VERSION} | browser-only`;
}

async function loadReport(key) {
  if (key === "local" && state.localReport) {
    state.reportKey = "local";
    state.report = state.localReport;
    state.selectedSource = state.report.sources?.[0]?.source || null;
    selectAllSources();
    render();
    return;
  }
  state.reportKey = "local";
  state.report = emptyReport();
  state.localReport = state.report;
  state.selectedSource = null;
  render();
}

function emptyReport() {
  return {
    summary: { normalizedRows: 0, blockers: 0, warnings: 0, sources: 0, ignoredSources: 0 },
    sources: [],
    ignoredSources: [],
    issues: [],
    rows: [],
  };
}

function selectAllSources() {
  state.selectedSources = new Set(
    (state.report?.sources || [])
      .filter((source) => !source.ignored)
      .map((source) => source.source),
  );
}

function render() {
  const meta = state.reports[state.reportKey] || {};
  const summary = state.report.summary || {};
  el("reportTitle").textContent = meta.label || "Report";
  el("reportDescription").textContent = meta.description || "";
  el("sourceCount").textContent = summary.sources ?? 0;
  el("rowCount").textContent = summary.normalizedRows ?? 0;
  el("blockerCount").textContent = summary.blockers ?? 0;
  el("warningCount").textContent = summary.warnings ?? 0;

  const hasBlockers = Number(summary.blockers || 0) > 0;
  el("scanStepText").textContent = state.reportKey === "local" ? "Đã đọc file thật" : "Đã tải report CP2";
  el("validateStep").className = `process-step ${hasBlockers ? "error" : "ok"}`;
  el("validateStepText").textContent = hasBlockers
    ? `${summary.blockers} blocker cần sửa`
    : `${summary.normalizedRows} dòng sẵn sàng`;
  updateBuildState();

  renderSourceTable();
  renderDetail();
  renderDeckTree();
  renderIssueList();
}

function renderSourceTable() {
  const tbody = el("sourceTable");
  const sources = (state.report.sources || []).filter((source) => !source.ignored);
  const filtered = sources.filter((source) => {
    const counts = countIssuesForSource(source.source);
    if (state.filter === "problem") return counts.blockers || counts.warnings;
    if (state.filter === "ok") return !counts.blockers && !counts.warnings;
    return true;
  });

  tbody.innerHTML = filtered
    .map((source) => {
      const counts = countIssuesForSource(source.source);
      const classes = [
        source.source === state.selectedSource ? "selected" : "",
        counts.blockers ? "has-blocker" : "",
        !counts.blockers && counts.warnings ? "has-warning" : "",
      ].filter(Boolean).join(" ");
      return `
        <tr class="${classes}" data-source="${escapeHtml(source.source)}">
          <td class="check-col"><input type="checkbox" ${state.selectedSources.has(source.source) ? "checked" : ""} aria-label="chọn nguồn"></td>
          <td><div class="truncate" title="${escapeHtml(source.source)}">${escapeHtml(shortSource(source.source))}</div></td>
          <td><div class="truncate" title="${escapeHtml(source.deck_path)}">${escapeHtml(source.deck_path)}</div></td>
          <td>${kindBadge(source.kind)}</td>
          <td>${source.source_rows}</td>
          <td>${source.approved_rows}</td>
          <td>${source.normalized_rows}</td>
          <td>${counts.blockers ? `<span class="badge danger">${counts.blockers}</span>` : "0"}</td>
          <td>${counts.warnings ? `<span class="badge warning">${counts.warnings}</span>` : "0"}</td>
          <td>${statusBadge(counts.blockers, counts.warnings)}</td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.selectedSources.add(row.dataset.source);
      else state.selectedSources.delete(row.dataset.source);
      updateBuildState();
      updateSelectAllState();
    });
    row.addEventListener("click", (event) => {
      if (event.target.tagName === "INPUT") return;
      state.selectedSource = row.dataset.source;
      render();
    });
  });
}

function updateSelectAllState() {
  const allSources = (state.report?.sources || []).filter((source) => !source.ignored);
  const selectedCount = allSources.filter((source) => state.selectedSources.has(source.source)).length;
  el("selectAll").checked = allSources.length > 0 && selectedCount === allSources.length;
  el("selectAll").indeterminate = selectedCount > 0 && selectedCount < allSources.length;
}

function updateBuildState() {
  const summary = selectedValidationSummary();
  const hasBlockers = Number(summary.blockers || 0) > 0;
  const canBuild = state.currentSources.length > 0 && !hasBlockers && state.selectedSources.size > 0;
  el("buildBtn").disabled = !canBuild;
  el("buildStep").className = `process-step ${canBuild ? "ok" : "locked"}`;
  el("buildStepText").textContent = hasBlockers
    ? "Bị khóa do blocker"
    : !state.currentSources.length
    ? "Kiểm tra nguồn thật để build"
    : !state.selectedSources.size
    ? "Chưa chọn nguồn"
    : `${state.selectedSources.size} nguồn sẵn sàng`;
  updateSelectAllState();
}

function renderDetail() {
  const source = (state.report.sources || []).find((item) => item.source === state.selectedSource);
  if (!source) {
    el("detailTitle").textContent = "Chọn một sheet";
    el("detailBody").innerHTML = `<div class="empty-state">Chọn một dòng trong bảng để xem chi tiết.</div>`;
    return;
  }

  const issues = issuesForSource(source.source);
  const rows = rowsForSource(source.source);
  const counts = countIssuesForSource(source.source);
  el("detailTitle").textContent = shortSource(source.source);

  const sampleRow = rows[0];
  const sampleTitle = sampleRow
    ? sampleRow.kind === "case"
      ? sampleRow.fields.CaseTitle || sampleRow.fields.CaseStem
      : sampleRow.fields.Ques
    : "";

  el("detailBody").innerHTML = `
    <dl class="kv">
      <dt>Deck</dt><dd>${escapeHtml(source.deck_path)}</dd>
      <dt>Loại</dt><dd>${kindBadge(source.kind)}</dd>
      <dt>Dòng</dt><dd>${source.source_rows} nguồn / ${source.approved_rows} Approved / ${source.normalized_rows} thẻ</dd>
      <dt>Trạng thái</dt><dd>${statusBadge(counts.blockers, counts.warnings)}</dd>
    </dl>
    ${
      sampleRow
        ? `<div class="issue-card">
            <div class="issue-title">Thẻ mẫu <span class="badge ok">${escapeHtml(sampleRow.card_uid)}</span></div>
            <div class="issue-meta">${escapeHtml(sampleTitle).slice(0, 420)}</div>
          </div>`
        : `<div class="empty-state">Không có dòng hợp lệ trong nguồn này.</div>`
    }
    <div style="height: 10px"></div>
    ${
      issues.length
        ? issues.map(renderIssueCard).join("")
        : `<div class="issue-card"><div class="issue-title">Không có lỗi</div><div class="issue-meta">Nguồn này sẵn sàng cho bước build.</div></div>`
    }
  `;
}

function renderIssueCard(issue) {
  const cls = issue.severity === "BLOCKER" ? "blocker" : "warning";
  const badge = issue.severity === "BLOCKER"
    ? `<span class="badge danger">BLOCKER</span>`
    : `<span class="badge warning">WARNING</span>`;
  return `
    <div class="issue-card ${cls}">
      <div class="issue-title">${escapeHtml(issue.code)} ${badge}</div>
      <div class="issue-meta">
        ${escapeHtml(issue.message)}<br>
        Dòng: ${escapeHtml(text(issue.row, "-"))}
        ${issue.column ? ` · Field: ${escapeHtml(issue.column)}` : ""}
        ${issue.card_uid ? ` · CardUID: ${escapeHtml(issue.card_uid)}` : ""}
      </div>
    </div>
  `;
}

function renderDeckTree() {
  const rows = state.report.rows || [];
  const tree = {};
  for (const row of rows) {
    const parts = row.deck_path.split("::");
    let node = tree;
    for (const part of parts) {
      node[part] ||= { count: 0, children: {} };
      node[part].count += 1;
      node = node[part].children;
    }
  }
  el("deckTree").innerHTML = renderTreeLevel(tree, 0) || `<div class="empty-state">Chưa có deck hợp lệ.</div>`;
}

function renderTreeLevel(level, depth) {
  return Object.entries(level)
    .sort(([a], [b]) => a.localeCompare(b, "vi"))
    .map(([name, node]) => `
      <div class="tree-node tree-indent-${Math.min(depth, 2)}">
        <span>${depth === 0 ? "-" : "+"}</span>
        <strong>${escapeHtml(name)}</strong>
        <span class="count">${node.count} thẻ</span>
      </div>
      ${renderTreeLevel(node.children, depth + 1)}
    `)
    .join("");
}

function renderIssueList() {
  const issues = selectedIssues();
  el("issueList").innerHTML = issues.length
    ? issues.map(renderIssueCard).join("")
    : `<div class="empty-state">Không có issue trong các nguồn đang chọn. Có thể build APKG.</div>`;
}

function renderAboutPanel() {
  const report = state.report || {};
  const summary = report.summary || {};
  const visibleSources = report.sources || [];
  const ignoredSources = report.ignoredSources || [];
  const version = state.version || {};
  const sourceItems = visibleSources.length
    ? visibleSources.map((source) => `
        <div class="about-source-item">
          <span class="source-name" title="${escapeHtml(source.source)}">${escapeHtml(shortSource(source.source))}</span>
          ${kindBadge(source.kind)}
          <span class="badge ok">${escapeHtml(String(source.normalizedRows || 0))} thẻ</span>
        </div>
      `).join("")
    : `<div class="empty-state">Không có source đang hiển thị.</div>`;
  const ignoredItems = ignoredSources.length
    ? ignoredSources.map((source) => `
        <div class="about-source-item">
          <span class="source-name" title="${escapeHtml(source.source)}">${escapeHtml(shortSource(source.source))}</span>
          <span class="badge">Ignored</span>
          <span>${escapeHtml(source.ignoredReason || "-")}</span>
        </div>
      `).join("")
    : `<div class="empty-state">Không có ignored source trong report hiện tại.</div>`;

  el("aboutBody").innerHTML = `
    <dl class="about-grid">
      <dt>Frontend</dt><dd>${escapeHtml(FRONTEND_VERSION)}</dd>
      <dt>Backend</dt><dd>${escapeHtml(version.version || "unknown")}</dd>
      <dt>Server start</dt><dd>${escapeHtml(version.serverStartedAt || "-")}</dd>
      <dt>Root</dt><dd>${escapeHtml(version.root || "-")}</dd>
      <dt>Report</dt><dd>${escapeHtml(state.reportKey || "-")}</dd>
      <dt>Chế độ</dt><dd>Browser-only</dd>
      <dt>Summary</dt><dd>${summary.sources || 0} nguồn / ${summary.normalizedRows || 0} thẻ / ${summary.ignoredSources || 0} ignored</dd>
    </dl>
    <div class="about-section-title">Sources đang hiển thị</div>
    <div class="about-source-list">${sourceItems}</div>
    <div class="about-section-title">Ignored sources</div>
    <div class="about-source-list">${ignoredItems}</div>
  `;
}

async function openAboutPanel() {
  await loadVersion();
  renderAboutPanel();
  el("aboutPanel").hidden = false;
}

function closeAboutPanel() {
  el("aboutPanel").hidden = true;
}

function escapeHtml(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function copySummary() {
  const summary = state.report.summary || {};
  const line = `Sheet-to-Anki ${state.reports[state.reportKey]?.label}: ${summary.normalizedRows || 0} dòng, ${summary.blockers || 0} blocker, ${summary.warnings || 0} warning`;
  navigator.clipboard?.writeText(line);
}

function getLocalPayload() {
  const mode = el("localMode").value;
  const lines = el("localPaths").value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (mode === "google") {
    return {
      mode,
      spreadsheet: lines[0] || "",
    };
  }
  return {
    mode,
    paths: lines,
    deckPath: el("csvDeckPath").value.trim(),
  };
}

async function validateLocalSource(payload = getLocalPayload(), options = {}) {
  if (payload.mode === "google" && !payload.spreadsheet) {
    setLocalMessage("Bạn cần nhập Spreadsheet URL hoặc ID.", "error");
    return;
  }
  el("validateLocalBtn").disabled = true;
  setLocalMessage("Đang tải và kiểm tra Google Sheet công khai...", "");
  try {
    const sources = await sourcesFromGoogleSheet(payload.spreadsheet);
    applySources(sources, "Google Sheet công khai");
  } catch (error) {
    if (!options.fromSelect) {
      setLocalMessage(error.message, "error");
    }
  } finally {
    el("validateLocalBtn").disabled = false;
  }
}

async function validateUploadedFiles() {
  const mode = el("localMode").value;
  if (!state.selectedFiles.length) {
    setLocalMessage("Bạn cần chọn ít nhất một file.", "error");
    return;
  }
  if (mode === "csv" && !el("csvDeckPath").value.trim()) {
    setLocalMessage("CSV cần có deck path, ví dụ: 0 Nhi::Case.", "error");
    return;
  }

  el("validateLocalBtn").disabled = true;
  setLocalMessage(`Đang đọc và kiểm tra ${state.selectedFiles.length} file ngay trên trình duyệt...`, "");
  try {
    const sources = [];
    for (const file of state.selectedFiles) {
      if (mode === "csv") {
        const parsed = sourcesFromCsv(await file.text(), { name: file.name });
        parsed[0].deckPath = el("csvDeckPath").value.trim();
        sources.push(...parsed);
      } else {
        sources.push(...await sourcesFromXlsx(await file.arrayBuffer()));
      }
    }
    applySources(sources, `${state.selectedFiles.length} file đã chọn`);
  } catch (error) {
    setLocalMessage(error.message, "error");
  } finally {
    el("validateLocalBtn").disabled = false;
  }
}

function applySources(sources, label) {
  state.currentSources = sources;
  const report = inspectSources(sources);
  state.report = toUiReport(report);
  state.localReport = state.report;
  state.reports.local = { label, description: "Dữ liệu được xử lý cục bộ trong trình duyệt." };
  state.selectedSource = state.report.sources?.[0]?.source || null;
  selectAllSources();
  el("reportSelect").value = "local";
  render();
  const summary = state.report.summary;
  setLocalMessage(
    `Đã kiểm tra ${summary.normalizedRows || 0} thẻ, ${summary.blockers || 0} blocker, ${summary.warnings || 0} warning.`,
    summary.blockers ? "error" : "ok",
  );
}

function toUiReport(report) {
  const mapSource = (source) => ({
    ...source,
    deck_path: source.deckPath,
    source_rows: source.sourceRows,
    approved_rows: source.approvedRows,
    normalized_rows: source.normalizedRows,
    ignored_reason: source.ignoredReason,
  });
  return {
    ...report,
    sources: report.sources.map(mapSource),
    ignoredSources: report.ignoredSources.map(mapSource),
    rows: report.rows.map((row) => ({ ...row, deck_path: row.deckPath, card_uid: row.cardUid })),
    issues: report.issues.map((issue) => ({ ...issue, card_uid: issue.cardUid })),
  };
}

function acceptFiles(fileList) {
  const input = el("sourceFileInput");
  const mode = el("localMode").value;
  const expectedExtension = mode === "csv" ? ".csv" : ".xlsx";
  const incoming = Array.from(fileList || []);
  const invalid = incoming.find((file) => !file.name.toLowerCase().endsWith(expectedExtension));
  if (invalid) {
    setLocalMessage(`File ${invalid.name} không đúng định dạng ${expectedExtension}.`, "error");
    input.value = "";
    return;
  }
  const existing = new Map(state.selectedFiles.map((file) => [`${file.name}:${file.size}:${file.lastModified}`, file]));
  incoming.forEach((file) => existing.set(`${file.name}:${file.size}:${file.lastModified}`, file));
  state.selectedFiles = Array.from(existing.values());
  input.value = "";
  renderSelectedFiles();
  setLocalMessage(`Đã chọn ${state.selectedFiles.length} file ${expectedExtension}.`, "");
}

function renderSelectedFiles() {
  const list = el("selectedFileList");
  if (!state.selectedFiles.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = state.selectedFiles.map((file, index) => `
    <div class="selected-file">
      <span class="file-type">${escapeHtml(file.name.split(".").pop().toUpperCase())}</span>
      <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
      <button type="button" class="remove-file" data-index="${index}" aria-label="Bỏ file ${escapeHtml(file.name)}" title="Bỏ file">&times;</button>
    </div>
  `).join("");
  list.querySelectorAll(".remove-file").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedFiles.splice(Number(button.dataset.index), 1);
      el("sourceFileInput").value = "";
      renderSelectedFiles();
    });
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function buildApkg() {
  if (!state.currentSources.length || !state.selectedSources.size) return;
  const warnings = selectedIssues().filter((issue) => issue.severity === "WARNING");
  if (warnings.some((issue) => issue.code === "MISSING_STATUS_CONFIRMATION_REQUIRED")) {
    const ok = window.confirm("Sheet chua co cot Status, du lieu co the chua duoc kiem tra. Ban chac chan muon build?");
    if (!ok) return;
  }
  el("buildBtn").disabled = true;
  setLocalMessage("Đang tạo và kiểm tra APKG...", "");
  try {
    const result = await buildApkgFromSources(state.currentSources, {
      selectedSources: Array.from(state.selectedSources),
      templateBundle: BROWSER_TEMPLATE_BUNDLE,
      sqlJsConfig: { locateFile: () => sqlWasmUrl },
    });
    const build = result.plan.summary;
    setLocalMessage(
      `Đã tạo ${build.notes || 0} thẻ trong ${build.decks || 0} deck.`,
      "ok",
    );
    downloadApkg(result.bytes, `sheet-to-anki-${new Date().toISOString().slice(0, 10)}.apkg`);
  } catch (error) {
    setLocalMessage(error.message, "error");
  } finally {
    updateBuildState();
  }
}

function ensureLocalReportOption() {
  const select = el("reportSelect");
  if (!select.querySelector('option[value="local"]')) {
    const option = document.createElement("option");
    option.value = "local";
    option.textContent = "Nguồn thật";
    select.prepend(option);
  }
}

function setLocalMessage(message, kind) {
  const messageEl = el("localMessage");
  messageEl.textContent = message;
  messageEl.className = `local-message ${kind || ""}`.trim();
}

function updateLocalMode() {
  const mode = el("localMode").value;
  const isCsv = mode === "csv";
  const isGoogle = mode === "google";
  el("sourceSecondaryRow").style.display = isCsv ? "grid" : "none";
  el("csvDeckField").style.display = isCsv ? "grid" : "none";
  el("googleCredentialsField").style.display = "none";
  el("googleTabsField").style.display = "none";
  el("localPaths").closest("label").style.display = isGoogle ? "grid" : "none";
  el("filePickerPanel").hidden = isGoogle;
  document.querySelector(".source-row-primary").classList.toggle("file-mode", !isGoogle);
  el("sourceFileInput").accept = isCsv ? ".csv,text/csv" : ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  el("fileDropHint").textContent = isCsv
    ? "Chọn một hoặc nhiều file CSV. Tất cả sẽ dùng deck path bên dưới."
    : "Chọn một hoặc nhiều file XLSX. Tên sheet dùng dấu > để tạo subdeck, ví dụ 0 Nhi > Hô hấp.";
  state.selectedFiles = [];
  el("sourceFileInput").value = "";
  renderSelectedFiles();
  el("sourceInputLabel").textContent = isGoogle
    ? "Spreadsheet URL hoặc ID"
    : "Đường dẫn file, mỗi dòng một file";
  el("localPaths").placeholder = isGoogle
    ? "https://docs.google.com/spreadsheets/d/..."
    : "input/my_export.xlsx";
  setLocalMessage(
    isGoogle
      ? "Dán link Google Sheet đã chia sẻ công khai. Sheet riêng tư chưa được hỗ trợ trong bản browser-only."
      : isCsv
      ? "CSV không có tên sheet nên cần deck path. Có thể nhập nhiều CSV, mỗi dòng một file."
      : "XLSX sẽ lấy tên từng sheet làm deck; dấu > trong tên sheet sẽ thành :: trong Anki. Sheet README/CONFIG sẽ được bỏ qua.",
    "",
  );
}

function bindEvents() {
  el("menuToggle").addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
  });
  el("reportSelect").addEventListener("change", (event) => loadReport(event.target.value));
  el("refreshBtn").addEventListener("click", () => {
    if (el("localMode").value === "google") validateLocalSource();
    else validateUploadedFiles();
  });
  el("aboutBtn").addEventListener("click", openAboutPanel);
  el("versionPill").addEventListener("click", openAboutPanel);
  el("aboutCloseBtn").addEventListener("click", closeAboutPanel);
  el("aboutPanel").addEventListener("click", (event) => {
    if (event.target === el("aboutPanel")) closeAboutPanel();
  });
  el("copyReportBtn").addEventListener("click", copySummary);
  el("validateLocalBtn").addEventListener("click", () => {
    if (el("localMode").value === "google") validateLocalSource();
    else validateUploadedFiles();
  });
  el("buildBtn").addEventListener("click", buildApkg);
  el("selectAll").addEventListener("change", (event) => {
    if (event.target.checked) selectAllSources();
    else state.selectedSources.clear();
    renderSourceTable();
    updateBuildState();
  });
  el("localMode").addEventListener("change", updateLocalMode);
  el("chooseFileBtn").addEventListener("click", (event) => {
    event.stopPropagation();
    el("sourceFileInput").click();
  });
  el("sourceFileInput").addEventListener("change", (event) => acceptFiles(event.target.files));
  el("fileDropZone").addEventListener("click", () => el("sourceFileInput").click());
  el("fileDropZone").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      el("sourceFileInput").click();
    }
  });
  ["dragenter", "dragover"].forEach((name) => el("fileDropZone").addEventListener(name, (event) => {
    event.preventDefault();
    el("fileDropZone").classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((name) => el("fileDropZone").addEventListener(name, (event) => {
    event.preventDefault();
    el("fileDropZone").classList.remove("dragging");
  }));
  el("fileDropZone").addEventListener("drop", (event) => acceptFiles(event.dataTransfer.files));
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.dataset.filter;
      renderSourceTable();
    });
  });
}

async function init() {
  bindEvents();
  updateLocalMode();
  await loadVersion();
  await loadReports();
  await loadReport(state.reportKey);
}

init().catch((error) => {
  console.error(error);
  el("detailBody").innerHTML = `<div class="issue-card blocker"><div class="issue-title">Lỗi tải dữ liệu</div><div class="issue-meta">${escapeHtml(error.message)}</div></div>`;
});
