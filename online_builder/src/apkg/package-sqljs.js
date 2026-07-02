import initSqlJs from "sql.js";
import JSZip from "jszip";
import { APKG_SCHEMA } from "./sql-schema.js";
import { guidFor } from "./guid.js";

export async function packageApkgFromPlan(plan, templateBundle, options = {}) {
  if (!plan?.notes?.length) throw new Error("APKG build plan has no notes.");
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000);
  const timestampMs = timestamp * 1000;
  let nextId = timestampMs;

  const SQL = await initSqlJs(options.sqlJsConfig || {});
  const db = new SQL.Database();
  db.run(APKG_SCHEMA);
  insertCollection(db, plan, templateBundle, timestamp, timestampMs);

  for (const note of plan.notes) {
    const deck = plan.decks.find((item) => item.name === note.deckName);
    if (!deck) throw new Error(`Missing deck in build plan: ${note.deckName}`);
    const noteId = nextId++;
    const cardId = nextId++;
    const guid = await guidFor(note.guidSource);
    db.run("INSERT INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)", [
      noteId,
      guid,
      note.modelId,
      timestamp,
      -1,
      formatTags(note.tags),
      note.fields.join("\x1f"),
      note.fields[0] || "",
      0,
      0,
      "",
    ]);
    db.run("INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
      cardId,
      noteId,
      deck.id,
      0,
      timestamp,
      -1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      "",
    ]);
  }

  const collectionBytes = db.export();
  db.close();

  const zip = new JSZip();
  zip.file("collection.anki2", collectionBytes);
  zip.file("media", JSON.stringify({}));
  return zip.generateAsync({ type: options.outputType || "uint8array" });
}

function insertCollection(db, plan, templateBundle, timestamp, timestampMs) {
  db.run("INSERT INTO col VALUES(null,?,?,?,?,?,?,?,?,?,?,?,?)", [
    1411124400,
    timestampMs,
    timestampMs,
    11,
    0,
    0,
    0,
    JSON.stringify(defaultConf()),
    JSON.stringify(modelsJson(plan, templateBundle, timestamp)),
    JSON.stringify(decksJson(plan)),
    JSON.stringify(defaultDeckConf()),
    JSON.stringify({}),
  ]);
}

function decksJson(plan) {
  const decks = {
    1: {
      collapsed: false,
      conf: 1,
      desc: "",
      dyn: 0,
      extendNew: 10,
      extendRev: 50,
      id: 1,
      lrnToday: [0, 0],
      mod: 1425279151,
      name: "Default",
      newToday: [0, 0],
      revToday: [0, 0],
      timeToday: [0, 0],
      usn: 0,
    },
  };
  for (const deck of plan.decks) {
    decks[String(deck.id)] = {
      collapsed: false,
      conf: 1,
      desc: "",
      dyn: 0,
      extendNew: 0,
      extendRev: 50,
      id: deck.id,
      lrnToday: [163, 2],
      mod: 1425278051,
      name: deck.name,
      newToday: [163, 2],
      revToday: [163, 0],
      timeToday: [163, 23598],
      usn: -1,
    };
  }
  return decks;
}

function modelsJson(plan, templateBundle, timestamp) {
  const models = {};
  for (const model of plan.models) {
    const templates = templateBundle[model.kind];
    if (!templates) throw new Error(`Missing template bundle for model: ${model.kind}`);
    models[String(model.id)] = {
      css: templates.style,
      did: null,
      flds: model.fields.map((field, index) => ({
        name: field,
        ord: index,
        font: "Liberation Sans",
        media: [],
        rtl: false,
        size: 20,
        sticky: false,
      })),
      id: String(model.id),
      latexPost: "\\end{document}",
      latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
      latexsvg: false,
      mod: timestamp,
      name: model.name,
      req: [model.kind === "case" ? [0, "any", [0, 1, 2]] : [0, "any", [0]]],
      sortf: 0,
      tags: [],
      tmpls: [
        {
          name: "Card 1",
          qfmt: templates.front,
          afmt: templates.back,
          ord: 0,
          bafmt: "",
          bqfmt: "",
          bfont: "",
          bsize: 0,
          did: null,
        },
      ],
      type: 0,
      usn: -1,
      vers: [],
    };
  }
  return models;
}

function defaultConf() {
  return {
    activeDecks: [1],
    addToCur: true,
    collapseTime: 1200,
    curDeck: 1,
    curModel: "1425279151691",
    dueCounts: true,
    estTimes: true,
    newBury: true,
    newSpread: 0,
    nextPos: 1,
    sortBackwards: false,
    sortType: "noteFld",
    timeLim: 0,
  };
}

function defaultDeckConf() {
  return {
    1: {
      autoplay: true,
      id: 1,
      lapse: { delays: [10], leechAction: 0, leechFails: 8, minInt: 1, mult: 0 },
      maxTaken: 60,
      mod: 0,
      name: "Default",
      new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20, separate: true },
      replayq: true,
      rev: { bury: true, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, perDay: 100 },
      timer: 0,
      usn: 0,
    },
  };
}

function formatTags(tags) {
  return ` ${(tags || []).join(" ")} `;
}
