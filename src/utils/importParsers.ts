import { Snapshot } from "../types";

export const CANONICAL_FIELDS = [
  { key: "characterId", label: "Lord ID (Required)" },
  { key: "playerName", label: "Lord Name" },
  { key: "allianceTag", label: "Alliance Tag" },
  { key: "currentPower", label: "Current Power" },
  { key: "highestPower", label: "Peak Power" },
  { key: "merits", label: "Merits" },
  { key: "deathsT4T5", label: "Deaths (T4/T5)" },
  { key: "t4Deaths", label: "T4 Deaths" },
  { key: "t5Deaths", label: "T5 Deaths" },
  { key: "healingT4T5", label: "Healing (T4/T5)" },
  { key: "healing", label: "Healing" },
  { key: "donations", label: "Donations" },
  { key: "gathering", label: "Gathering" },
  { key: "resourceAssistance", label: "Resource Assist" },
  { key: "allianceHelp", label: "Alliance Helps (Count)" },
  { key: "behemothWins", label: "Behemoth Wins (Count)" },
  { key: "buildTime", label: "Build Time (Sec)" },
  { key: "destructionTime", label: "Destruction Time (Sec)" },
];

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export function extractDateFromFilename(filename: string): string | null {
  const farlightRegex = /\b(\d+)_(20\d{2}[-_]\d{2}[-_]\d{2})_(20\d{2}[-_]\d{2}[-_]\d{2})\b/;
  const matchFarlight = filename.match(farlightRegex);
  if (matchFarlight) return matchFarlight[3].replace(/_/g, "-");

  const ymdRegex = /\b(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])\b/;
  const matchYmd = filename.match(ymdRegex);
  if (matchYmd) return `${matchYmd[1]}-${matchYmd[2]}-${matchYmd[3]}`;

  const dmyRegex = /\b(0[1-9]|[12]\d|3[01])[-_](0[1-9]|1[0-2])[-_](20\d{2})\b/;
  const matchDmy = filename.match(dmyRegex);
  if (matchDmy) return `${matchDmy[3]}-${matchDmy[2]}-${matchDmy[1]}`;

  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const textMonthRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-_\s]+(\d{1,2})[-_,\s]+(20\d{2})\b/i;
  const matchTextMonth = filename.match(textMonthRegex);
  if (matchTextMonth) {
    const monthNum = String(months.indexOf(matchTextMonth[1].toLowerCase().substring(0, 3)) + 1).padStart(2, "0");
    return `${matchTextMonth[3]}-${monthNum}-${String(matchTextMonth[2]).padStart(2, "0")}`;
  }

  const textMonthRegexRev = /\b(\d{1,2})[-_\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-_,\s]+(20\d{2})\b/i;
  const matchTextMonthRev = filename.match(textMonthRegexRev);
  if (matchTextMonthRev) {
    const monthNum = String(months.indexOf(matchTextMonthRev[2].toLowerCase().substring(0, 3)) + 1).padStart(2, "0");
    return `${matchTextMonthRev[3]}-${monthNum}-${String(matchTextMonthRev[1]).padStart(2, "0")}`;
  }
  return null;
}

export function parseFarlightFilenameInfo(filename: string) {
  const farlightRegex = /\b(\d+)_(20\d{2}[-_]\d{2}[-_]\d{2})_(20\d{2}[-_]\d{2}[-_]\d{2})\b/;
  const match = filename.match(farlightRegex);
  if (match) {
    return {
      server: match[1],
      startDate: match[2].replace(/_/g, "-"),
      endDate: match[3].replace(/_/g, "-")
    };
  }
  return null;
}

export function parseNumericValue(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);
  let str = String(val).trim().toLowerCase();
  if (!str) return 0;

  let multiplier = 1;
  if (str.endsWith("m")) { multiplier = 1000000; str = str.slice(0, -1); } 
  else if (str.endsWith("k")) { multiplier = 1000; str = str.slice(0, -1); } 
  else if (str.endsWith("b")) { multiplier = 1000000000; str = str.slice(0, -1); }

  str = str.replace(/[,_\s]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * multiplier);
}

export function sanitizeDateString(dateInput: string): string {
  if (!dateInput) return new Date().toISOString().split("T")[0];
  const cleaned = dateInput.replace(/[/_]/g, "-").trim();
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? new Date().toISOString().split("T")[0] : parsed.toISOString().split("T")[0];
}

export function parseCompositeValue(val: any): { t4: number; t5: number } {
  if (val === undefined || val === null) return { t4: 0, t5: 0 };
  const str = String(val).trim();
  if (!str) return { t4: 0, t5: 0 };
  if (str.includes("/")) {
    const parts = str.split("/");
    return { t4: parseNumericValue(parts[0]), t5: parseNumericValue(parts[1]) };
  }
  return { t4: parseNumericValue(str), t5: 0 };
}

export function normalizeHeader(raw: string): string {
  if (!raw) return "unknown";
  const s = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!s) return "unknown";
  
  const exactMap: Record<string, string> = {
    rank: "unknown", characterid: "characterId", lordid: "characterId",
    charactername: "playerName", lordname: "playerName", currentpower: "currentPower",
    historicalhighestpower: "highestPower", peakpower: "highestPower", deathst4t5: "deathsT4T5",
    deathst45: "deathsT4T5", totalmerits: "merits", merits: "merits", gathering: "gathering",
    healingt4t5: "healingT4T5", healingt45: "healingT4T5", alliancedonations: "donations",
    buildtime: "buildTime", destructiontime: "destructionTime", resourceassistance: "resourceAssistance",
    behemothraidwins: "behemothWins", alliancehelp: "allianceHelp",
  };

  if (exactMap[s]) return exactMap[s];
  if (s.includes("othermerit") || s.includes("infantry") || s.includes("cavalry") || s.includes("marksman") || s.includes("magic")) return "unknown";
  if (["id", "uid", "cid"].includes(s) || s.includes("characterid") || s.includes("lordid") || s.includes("playerid")) return "characterId";
  if (["name", "username", "ign"].includes(s) || s.includes("lordname") || s.includes("playername") || s.includes("charactername")) return "playerName";
  if (s.includes("alliancetag") || s.includes("guildtag") || ["alliance", "guild", "clan", "tag"].includes(s)) return "allianceTag";
  if (s.includes("highestpower") || s.includes("peakpower") || s.includes("maxpower")) return "highestPower";
  if (["power", "cp"].includes(s) || s.includes("currentpower") || s.includes("powerlevel")) return "currentPower";
  if (["kp", "kills", "totalkills"].includes(s) || s.includes("merit") || s.includes("honor")) return "merits";
  if (["t4deaths", "deathst4"].includes(s)) return "t4Deaths";
  if (["t5deaths", "deathst5"].includes(s)) return "t5Deaths";
  if (s.includes("deathst4t5") || ["deaths", "casualties"].includes(s)) return "deathsT4T5";
  if (s.includes("healingt4t5")) return "healingT4T5";
  if (s.includes("healed") || s.includes("healing") || s.includes("hospital")) return "healing";
  if (s.includes("donation") || s.includes("invest") || s.includes("tech")) return "donations";
  if (s.includes("gather") || s.includes("collection")) return "gathering";
  if (s.includes("resourceassist") || s.includes("resourcessent") || s === "aid") return "resourceAssistance";
  if (s.includes("help")) return "allianceHelp";
  if (s.includes("behemoth") || s.includes("raid")) return "behemothWins";
  if (s.includes("buildtime") || ["build", "construction"].includes(s)) return "buildTime";
  if (s.includes("destructiontime") || ["destruction", "demolish"].includes(s)) return "destructionTime";

  return "unknown";
}

export function buildSnapshotsFromRaw(
  rawRows: any[],
  mappedHeaders: Record<string, string>,
  date: string,
  source: string,
  draftId: string
): { snapshots: Snapshot[]; warnings: string[] } {
  const warnings: string[] = [];
  const snapshots: Snapshot[] = [];
  const processedIds = new Set<string>();

  rawRows.forEach((row, idx) => {
    if (typeof row !== "object" || row === null) return;
    const rawVals = Object.values(row);
    if (rawVals.length === 0 || rawVals.every((v) => v === undefined || v === null || String(v).trim() === "")) return;

    const record: Record<string, any> = {};
    Object.entries(row).forEach(([rawKey, val]) => {
      const canonicalKey = mappedHeaders[rawKey];
      if (canonicalKey && canonicalKey !== "unknown") {
        if (record[canonicalKey] === undefined || (val !== undefined && val !== null && String(val).trim() !== "")) {
          record[canonicalKey] = val;
        }
      }
    });

    const characterId = record.characterId ? String(record.characterId).trim() : "";
    if (!characterId) {
      warnings.push(`Row ${idx + 1}: Missing required Character Lord ID. Ignored.`);
      return;
    }

    if (processedIds.has(characterId)) {
      warnings.push(`Row ${idx + 1}: Duplicate Character ID [${characterId}]. Overwriting with latest.`);
      const existingIdx = snapshots.findIndex(sn => sn.playerId === characterId);
      if (existingIdx !== -1) snapshots.splice(existingIdx, 1);
    }
    processedIds.add(characterId);

    let t4Deaths = parseNumericValue(record.t4Deaths);
    let t5Deaths = parseNumericValue(record.t5Deaths);
    if (record.deathsT4T5) {
      const deathsStr = String(record.deathsT4T5).trim();
      if (deathsStr.includes("/")) {
        const parsed = parseCompositeValue(deathsStr);
        t4Deaths = parsed.t4; t5Deaths = parsed.t5;
      } else if (t4Deaths === 0 && t5Deaths === 0) {
        t4Deaths = parseNumericValue(deathsStr);
      }
    }

    let healing = parseNumericValue(record.healing);
    if (record.healingT4T5) {
      const healingStr = String(record.healingT4T5).trim();
      healing = healingStr.includes("/") ? parseCompositeValue(healingStr).t4 + parseCompositeValue(healingStr).t5 : (healing === 0 ? parseNumericValue(healingStr) : healing);
    }

    const currentPower = parseNumericValue(record.currentPower);
    const highestPower = record.highestPower !== undefined && record.highestPower !== "" ? parseNumericValue(record.highestPower) : currentPower;

    snapshots.push({
      id: `snap_draft_${characterId}_${draftId}_${idx}`,
      playerId: characterId,
      playerName: record.playerName ? String(record.playerName).trim() : "Unknown Lord",
      allianceId: "all_dragon_claw",
      allianceTag: record.allianceTag || "DCLW",
      importId: `import_${draftId}`,
      currentPower,
      highestPower: Math.max(highestPower, currentPower),
      merits: parseNumericValue(record.merits),
      t4Deaths,
      t5Deaths,
      healing,
      donations: parseNumericValue(record.donations),
      gathering: parseNumericValue(record.gathering),
      resourceAssistance: parseNumericValue(record.resourceAssistance),
      allianceHelp: parseNumericValue(record.allianceHelp),
      behemothWins: parseNumericValue(record.behemothWins),
      buildTime: parseNumericValue(record.buildTime),
      destructionTime: parseNumericValue(record.destructionTime),
      recordedAt: `${sanitizeDateString(date)}T12:00:00.000Z`,
      createdAt: new Date().toISOString(),
    });
  });

  return { snapshots, warnings };
}