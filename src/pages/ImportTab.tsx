import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Map, 
  TrendingUp, 
  RefreshCw,
  Copy,
  Info,
  FileText,
  FileCode,
  Trash2,
  Plus,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Database,
  ArrowRight,
  ListFilter,
  History as HistoryIcon,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import { Snapshot, Player, ImportSession } from "../types";
import { CustomLoadingBar, CustomLoadingOverlay } from "./CustomLoadingBar";

interface ImportTabProps {
  importSessions: ImportSession[];
  onImportSnapshots: (
    newPlayers: Player[],
    newSnapshots: Snapshot[],
    sessions: ImportSession[]
  ) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newFilename: string) => void;
  snapshots: Snapshot[];
}

interface FileDraft {
  id: string;
  filename: string;
  fileSize: number; // in bytes
  fileType: "json" | "csv" | "excel";
  date: string; // YYYY-MM-DD
  dateAutoDetected: boolean;
  source: "DragonStats" | "Farlight" | "Manual";
  rawRows: any[];
  mappedHeaders: Record<string, string>; // rawHeader -> canonicalKey
  snapshots: Snapshot[];
  warnings: string[];
  isExpanded: boolean;
  isMappingExpanded: boolean;
}

// Canonical fields list for headers association
const CANONICAL_FIELDS = [
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

// Helper to format bytes nicely
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Date recognition from title using advanced regular expressions
function extractDateFromFilename(filename: string): string | null {
  // Farlight document format: 701_2026-06-26_2026-06-26 (Server_Start_End)
  const farlightRegex = /\b(\d+)_(20\d{2}[-_]\d{2}[-_]\d{2})_(20\d{2}[-_]\d{2}[-_]\d{2})\b/;
  const matchFarlight = filename.match(farlightRegex);
  if (matchFarlight) {
    // Return the end date, standardizing underscores/dashes to hyphens
    return matchFarlight[3].replace(/_/g, "-");
  }

  // YYYY-MM-DD or YYYY_MM_DD
  const ymdRegex = /\b(20\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])\b/;
  const matchYmd = filename.match(ymdRegex);
  if (matchYmd) {
    return `${matchYmd[1]}-${matchYmd[2]}-${matchYmd[3]}`;
  }

  // DD-MM-YYYY or MM-DD-YYYY
  const dmyRegex = /\b(0[1-9]|[12]\d|3[01])[-_](0[1-9]|1[0-2])[-_](20\d{2})\b/;
  const matchDmy = filename.match(dmyRegex);
  if (matchDmy) {
    // Standardize to YYYY-MM-DD
    return `${matchDmy[3]}-${matchDmy[2]}-${matchDmy[1]}`;
  }

  // Text month like Jul_18_2026 or July-18-2026
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const textMonthRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-_\s]+(\d{1,2})[-_,\s]+(20\d{2})\b/i;
  const matchTextMonth = filename.match(textMonthRegex);
  if (matchTextMonth) {
    const monthStr = matchTextMonth[1].toLowerCase().substring(0, 3);
    const monthIdx = months.indexOf(monthStr);
    const monthNum = String(monthIdx + 1).padStart(2, "0");
    const dayNum = String(matchTextMonth[2]).padStart(2, "0");
    return `${matchTextMonth[3]}-${monthNum}-${dayNum}`;
  }

  // 18_Jul_2026 or 18-July-2026
  const textMonthRegexRev = /\b(\d{1,2})[-_\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-_,\s]+(20\d{2})\b/i;
  const matchTextMonthRev = filename.match(textMonthRegexRev);
  if (matchTextMonthRev) {
    const monthStr = matchTextMonthRev[2].toLowerCase().substring(0, 3);
    const monthIdx = months.indexOf(monthStr);
    const monthNum = String(monthIdx + 1).padStart(2, "0");
    const dayNum = String(matchTextMonthRev[1]).padStart(2, "0");
    return `${matchTextMonthRev[3]}-${monthNum}-${dayNum}`;
  }

  return null;
}

// Extract server, start date, and end date for Farlight documents
function parseFarlightFilenameInfo(filename: string) {
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

// Robust numeric value parser handling numbers, formatted strings ("82,000,000", "15.2M", "100k"), spaces, etc.
function parseNumericValue(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);
  let str = String(val).trim().toLowerCase();
  if (!str) return 0;

  let multiplier = 1;
  if (str.endsWith("m")) {
    multiplier = 1000000;
    str = str.slice(0, -1);
  } else if (str.endsWith("k")) {
    multiplier = 1000;
    str = str.slice(0, -1);
  } else if (str.endsWith("b")) {
    multiplier = 1000000000;
    str = str.slice(0, -1);
  }

  // Strip non-numeric formatting characters except negative sign and decimal point
  str = str.replace(/[,_\s]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * multiplier);
}

function sanitizeDateString(dateInput: string): string {
  if (!dateInput) return new Date().toISOString().split("T")[0];
  const cleaned = dateInput.replace(/[/_]/g, "-").trim();
  const parsed = new Date(cleaned);
  if (isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return parsed.toISOString().split("T")[0];
}

// Parse composite slash-separated value like "50000 / 10000" or just "50000"
function parseCompositeValue(val: any): { t4: number; t5: number } {
  if (val === undefined || val === null) return { t4: 0, t5: 0 };
  const str = String(val).trim();
  if (!str) return { t4: 0, t5: 0 };

  if (str.includes("/")) {
    const parts = str.split("/");
    const t4 = parseNumericValue(parts[0]);
    const t5 = parseNumericValue(parts[1]);
    return { t4, t5 };
  }

  const num = parseNumericValue(str);
  return { t4: num, t5: 0 };
}

// Parse composite healing by summing up T4 and T5 healing or single value
function parseCompositeHealing(val: any): number {
  const parsed = parseCompositeValue(val);
  return parsed.t4 + parsed.t5;
}

// Sample copy-paste templates
const DRAGONSTATS_TEMPLATE = `Lord ID\tLord Name\tAlliance Tag\tPower\tPeak Power\tMerits\tT4 Deaths\tT5 Deaths\tHealing\tDonations\tGathering\tResource Assist\tAlliance Help\tBehemoth Wins
usr_1029384\tJustCassie\tDCLW\t82000000\t82000000\t15200000\t142000\t32000\t2400000\t1320\t71000000\t26000000\t1480\t22
usr_7721054\tAurelian\tDCLW\t51000000\t51000000\t6900000\t69000\t0\t1210000\t1340\t110000000\t18000000\t1680\t16
usr_8830129\tBobTheBuilder\tDCLW\t45000000\t45000000\t1620000\t12400\t0\t410000\t2650\t148000000\t45000000\t2820\t20
usr_9999999\tNewFrontliner\tDCLW\t58000000\t58000000\t9200000\t78000\t8000\t1500000\t920\t31000000\t5000000\t820\t12
usr_1111111\tQuietFarmer\tFARM\t4800000\t5000000\t0\t0\t0\t0\t110\t195000000\t165000000\t480\t0
usr_2222222\tGhostLord\tDCLW\t32000000\t32000000\t0\t0\t0\t0\t0\t1200000\t0\t10\t0`;

const FARLIGHT_TEMPLATE = `CID,Lord Name,Power,Peak Power,Merits,Deaths,Healing,Donations,Gathering,Resource Assist
usr_1029384,JustCassie,85000000,85000000,16500000,185000,2800000,1450,75000000,28000000
usr_5192083,ShadowStrike,34000000,35000000,3800000,26000,620000,950,61000000,5500000
usr_6602184,SleepingDragon,18000000,22000000,110000,500,12000,45,5000000,0
usr_8888888,RagnarLoth,42000000,42000000,4800000,52000,880000,1100,44000000,8000000`;

export default function ImportTab({ 
  importSessions, 
  onImportSnapshots, 
  onDeleteSession, 
  onRenameSession, 
  snapshots 
}: ImportTabProps) {
  const [inputText, setInputText] = useState("");
  const [importSource, setImportSource] = useState<"DragonStats" | "Farlight" | "Manual">("DragonStats");
  const [dragActive, setDragActive] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"files" | "text">("files");

  // Multi-file draft lists
  const [drafts, setDrafts] = useState<FileDraft[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsed" | "success" | "failed">("idle");
  const [showAllDraftRows, setShowAllDraftRows] = useState<Record<string, boolean>>({});

  // Duplicate date verification double-check modal state
  const [duplicateModalState, setDuplicateModalState] = useState<{
    isOpen: boolean;
    draftId: string;
    filename: string;
    date: string;
    matchingSessions: ImportSession[];
    matchingOtherDrafts: FileDraft[];
    totalExistingRecords: number;
    newDateValue: string;
  } | null>(null);

  // Duplicate telemetry date detector across existing sessions and queue drafts
  const getDuplicateDateInfo = (dateStr: string, currentDraftId?: string) => {
    const sanitized = sanitizeDateString(dateStr);
    const matchingSnapshots = snapshots.filter((s) => s.recordedAt && s.recordedAt.startsWith(sanitized));
    const matchingSessionIds = Array.from(new Set(matchingSnapshots.map((s) => s.importId)));
    const matchingSessions = importSessions.filter((sess) => matchingSessionIds.includes(sess.id));
    const matchingOtherDrafts = drafts.filter(
      (d) => d.id !== currentDraftId && sanitizeDateString(d.date) === sanitized
    );

    const isDuplicate = matchingSessions.length > 0 || matchingOtherDrafts.length > 0;
    return {
      sanitizedDate: sanitized,
      matchingSnapshotsCount: matchingSnapshots.length,
      matchingSessions,
      matchingOtherDrafts,
      isDuplicate,
    };
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for the inline "Add Player" form per draft
  const [addPlayerFormStates, setAddPlayerFormStates] = useState<Record<string, Partial<Snapshot>>>({});

  // Loading & Animation states
  const [isCommitLoading, setIsCommitLoading] = useState(false);
  const [commitProgress, setCommitProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState<number | null>(null);

  // File manager / history states
  const [activeMainTab, setActiveMainTab] = useState<"upload" | "manager">("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inspectedSessionId, setInspectedSessionId] = useState<string | null>(null);
  const [inspectSearchQuery, setInspectSearchQuery] = useState("");

  const handleExportSessionCSV = (session: ImportSession) => {
    const sessionSnaps = snapshots.filter((s) => s.importId === session.id);
    if (sessionSnaps.length === 0) {
      alert("No snapshot records found for this document.");
      return;
    }

    const headers = [
      "Lord ID",
      "Lord Name",
      "Alliance Tag",
      "Current Power",
      "Peak Power",
      "Merits",
      "T4 Deaths",
      "T5 Deaths",
      "Healing",
      "Donations",
      "Gathering",
      "Resource Assist",
      "Alliance Help",
      "Behemoth Wins",
      "Build Time",
      "Recorded At"
    ];

    const csvRows = [headers.join(",")];
    sessionSnaps.forEach((s) => {
      const row = [
        s.playerId,
        `"${(s.playerName || "").replace(/"/g, '""')}"`,
        s.allianceTag || "",
        s.currentPower,
        s.highestPower,
        s.merits,
        s.t4Deaths,
        s.t5Deaths,
        s.healing,
        s.donations,
        s.gathering,
        s.resourceAssistance,
        s.allianceHelp,
        s.behemothWins,
        s.buildTime || 0,
        s.recordedAt
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", session.filename.endsWith(".csv") || session.filename.endsWith(".xlsx") ? `${session.filename.split(".")[0]}_export.csv` : `${session.filename}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSessionJSON = (session: ImportSession) => {
    const sessionSnaps = snapshots.filter((s) => s.importId === session.id);
    if (sessionSnaps.length === 0) {
      alert("No snapshot records found for this document.");
      return;
    }

    const jsonContent = JSON.stringify(sessionSnaps, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${session.filename.split(".")[0]}_export.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter sessions
  const filteredSessions = importSessions.filter((session) => {
    const matchesSearch = session.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "ALL" || session.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  // Count total snapshots in filtered sessions
  const filteredSnapshotsTotal = filteredSessions.reduce((acc, s) => {
    return acc + snapshots.filter((snap) => snap.importId === s.id).length;
  }, 0);

  // Fuzzy Header synomyms resolver
  const normalizeHeader = (raw: string): string => {
    if (!raw) return "unknown";
    const s = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!s) return "unknown";
    
    // Exact dictionary for standard Farlight & game export headers
    const exactMap: Record<string, string> = {
      rank: "unknown",
      characterid: "characterId",
      lordid: "characterId",
      charactername: "playerName",
      lordname: "playerName",
      currentpower: "currentPower",
      historicalhighestpower: "highestPower",
      peakpower: "highestPower",
      deathst4t5: "deathsT4T5",
      deathst45: "deathsT4T5",
      totalmerits: "merits",
      merits: "merits",
      gathering: "gathering",
      infantryonly: "unknown",
      cavalryonly: "unknown",
      marksmanonly: "unknown",
      magiconly: "unknown",
      othermerits: "unknown",
      healingt4t5: "healingT4T5",
      healingt45: "healingT4T5",
      alliancedonations: "donations",
      buildtime: "buildTime",
      destructiontime: "destructionTime",
      resourceassistance: "resourceAssistance",
      behemothraidwins: "behemothWins",
      alliancehelp: "allianceHelp",
    };

    if (exactMap[s]) {
      return exactMap[s];
    }

    // Explicitly ignore sub-category troop/merit breakdown columns that shouldn't override Total Merits or Power
    if (
      s.includes("othermerit") ||
      s.includes("infantry") ||
      s.includes("cavalry") ||
      s.includes("marksman") ||
      s.includes("magic") ||
      s === "rank"
    ) {
      return "unknown";
    }
    
    // 1. Lord / Character ID
    const charIdSynonyms = ["id", "uid", "cid", "lordid", "characterid", "playerid", "gameid", "charid", "ingameid", "igid", "lordcharacterid", "accountid", "playercharacterid", "memberid", "govid", "governorid", "userid"];
    if (
      charIdSynonyms.includes(s) ||
      s.includes("characterid") ||
      s.includes("lordid") ||
      s.includes("playerid") ||
      s.includes("governorid") ||
      s.includes("memberid") ||
      s.includes("accountid") ||
      s === "id" ||
      s === "uid"
    ) {
      return "characterId";
    }

    // 2. Lord Name / Player Name
    const nameSynonyms = ["name", "username", "character", "lordname", "playername", "player", "charactername", "lord", "char", "nickname", "nick", "ingamename", "ign", "characterlordname", "lordcharactername", "membername", "governorname"];
    if (
      nameSynonyms.includes(s) ||
      s.includes("lordname") ||
      s.includes("playername") ||
      s.includes("charactername") ||
      s.includes("membername") ||
      s.includes("governorname") ||
      s === "name" ||
      s === "username" ||
      s === "ign"
    ) {
      return "playerName";
    }

    // 3. Alliance Tag
    const allianceSynonyms = ["alliancetag", "alliance", "guild", "tag", "guildtag", "clantag", "clan", "alliancegroup", "alliances", "alliancename"];
    if (
      allianceSynonyms.includes(s) ||
      s.includes("alliancetag") ||
      s.includes("guildtag") ||
      s.includes("clantag") ||
      s === "alliance" ||
      s === "guild" ||
      s === "clan" ||
      s === "tag"
    ) {
      return "allianceTag";
    }

    // 4. Peak / Historical / Highest Power (MUST be checked BEFORE current power)
    const peakPowerSynonyms = ["highestpower", "peakpower", "historicalpower", "maxpower", "historicalhighestpower", "peakpowerlevel", "maxpowerlevel", "highestpowerlevel", "toppower", "highest", "peak"];
    if (
      peakPowerSynonyms.includes(s) ||
      s.includes("highestpower") ||
      s.includes("peakpower") ||
      s.includes("maxpower") ||
      s.includes("historicalpower")
    ) {
      return "highestPower";
    }

    // 5. Current Power
    const powerSynonyms = ["power", "currentpower", "totalpower", "powerlevel", "currpower", "lordpower", "cp", "pow"];
    if (
      powerSynonyms.includes(s) ||
      s.includes("currentpower") ||
      s.includes("powerlevel") ||
      s.includes("currpower") ||
      s === "power" ||
      s === "cp"
    ) {
      return "currentPower";
    }

    // 6. Merits / KP / Kill Points / Honor
    const meritsSynonyms = ["merits", "totalmerits", "honorpoints", "killpoints", "merit", "killpoint", "totalmerit", "kp", "kills", "totalkills", "honor", "m"];
    if (
      meritsSynonyms.includes(s) ||
      s.includes("merit") ||
      s.includes("killpoint") ||
      s.includes("honor") ||
      s === "kp" ||
      s === "kills" ||
      s === "totalkills"
    ) {
      return "merits";
    }

    // 7. Specific T4 Deaths
    const t4DeathsSynonyms = ["t4deaths", "t4casualties", "t4casualty", "t4death", "t4dead", "t4killed", "deathst4"];
    if (t4DeathsSynonyms.includes(s) || s === "t4deaths" || s === "deathst4") {
      return "t4Deaths";
    }

    // 8. Specific T5 Deaths
    const t5DeathsSynonyms = ["t5deaths", "t5casualties", "t5casualty", "t5death", "t5dead", "t5killed", "deathst5"];
    if (t5DeathsSynonyms.includes(s) || s === "t5deaths" || s === "deathst5") {
      return "t5Deaths";
    }

    // 9. Composite or Total Deaths / Casualties
    const deathsT4T5Synonyms = ["deathst4t5", "t4t5deaths", "deathst4andt5", "t4andt5deaths", "deaths", "totaldeaths", "casualties", "totalcasualties", "dead", "totaldead", "troopdeaths", "killedtroops"];
    if (
      deathsT4T5Synonyms.includes(s) ||
      s.includes("deathst4t5") ||
      s.includes("t4t5deaths") ||
      s === "deaths" ||
      s === "totaldeaths" ||
      s === "casualties"
    ) {
      return "deathsT4T5";
    }

    // 10. Composite Healing (T4/T5)
    const healingT4T5Synonyms = ["healingt4t5", "t4t5healing", "healingt4andt5", "t4andt5healing", "healt4t5"];
    if (healingT4T5Synonyms.includes(s) || s.includes("healingt4t5")) {
      return "healingT4T5";
    }

    // 11. Healing
    const healingSynonyms = ["healing", "unitshealed", "hospitalrecoveries", "hospital", "healed", "totalhealed", "heal", "healingunits", "recovered", "hospitalrecovered"];
    if (
      healingSynonyms.includes(s) ||
      s.includes("healed") ||
      s.includes("healing") ||
      s.includes("hospital")
    ) {
      return "healing";
    }

    // 12. Tech Donations
    const donationsSynonyms = ["donations", "techdonations", "allianceinvestment", "alliancedonations", "donation", "techdonation", "invest", "investment", "tech", "alliancetech", "techpoints"];
    if (
      donationsSynonyms.includes(s) ||
      s.includes("donation") ||
      s.includes("invest") ||
      s.includes("tech")
    ) {
      return "donations";
    }

    // 13. Gathering
    const gatheringSynonyms = ["gathering", "resourcesgathered", "collection", "gathered", "gather", "resourcegathering", "resourcegathered", "rssgathered"];
    if (
      gatheringSynonyms.includes(s) ||
      s.includes("gather") ||
      s.includes("collection")
    ) {
      return "gathering";
    }

    // 14. Resource Assistance
    const resAssistSynonyms = ["resourceassist", "resourceassistance", "resourcessent", "aid", "resassistance", "resassist", "assistance", "rssassist", "rssassistance", "resourcesent", "rsssent"];
    if (
      resAssistSynonyms.includes(s) ||
      s.includes("resourceassist") ||
      s.includes("resourcessent") ||
      s.includes("resourcesent") ||
      s.includes("rssassist") ||
      s.includes("rsssent") ||
      s === "aid"
    ) {
      return "resourceAssistance";
    }

    // 15. Alliance Help
    const helpSynonyms = ["alliancehelp", "help", "helpgiven", "helpclicks", "alliancehelps", "helps", "helpgive"];
    if (helpSynonyms.includes(s) || s.includes("help")) {
      return "allianceHelp";
    }

    // 16. Behemoth Wins / Raids
    const behemothSynonyms = ["behemothwins", "behemoths", "raidwins", "behemothattendance", "behemothraidwins", "behemoth", "behemothwin", "raids", "raid"];
    if (behemothSynonyms.includes(s) || s.includes("behemoth") || s.includes("raid")) {
      return "behemothWins";
    }

    // 17. Build Time
    const buildSynonyms = ["buildtime", "buildingtime", "constructiontime", "build", "construction", "building", "buildtimeassistance", "buildtimeassist", "buildingtimeassist"];
    if (
      buildSynonyms.includes(s) ||
      s.includes("buildtime") ||
      s.includes("constructiontime") ||
      s === "build" ||
      s === "construction"
    ) {
      return "buildTime";
    }

    // 18. Destruction Time
    const destructionSynonyms = ["destructiontime", "demolishtime", "demolishingtime", "destruction", "demolish", "destructiontimeassistance", "destructtime", "demolishtimeassist"];
    if (
      destructionSynonyms.includes(s) ||
      s.includes("destructiontime") ||
      s.includes("demolishtime") ||
      s === "destruction" ||
      s === "demolish"
    ) {
      return "destructionTime";
    }

    return "unknown";
  };

  // Rebuild snapshot records from spreadsheet raw rows and column mapping rules
  const buildSnapshotsFromRaw = (
    rawRows: any[],
    mappedHeaders: Record<string, string>,
    date: string,
    source: string,
    draftId: string
  ): { snapshots: Snapshot[]; warnings: string[] } => {
    const warnings: string[] = [];
    const snapshots: Snapshot[] = [];
    const processedIds = new Set<string>();

    rawRows.forEach((row, idx) => {
      if (typeof row !== "object" || row === null) return;

      // Silently skip completely empty rows (common in Excel/Google Sheets exports)
      const rawVals = Object.values(row);
      if (
        rawVals.length === 0 ||
        rawVals.every((v) => v === undefined || v === null || String(v).trim() === "")
      ) {
        return;
      }

      const record: Record<string, any> = {};
      Object.entries(row).forEach(([rawKey, val]) => {
        const canonicalKey = mappedHeaders[rawKey];
        if (canonicalKey && canonicalKey !== "unknown") {
          // Do not overwrite an existing non-empty value with an empty/null value
          if (
            record[canonicalKey] === undefined ||
            (val !== undefined && val !== null && String(val).trim() !== "")
          ) {
            record[canonicalKey] = val;
          }
        }
      });

      const characterId = record.characterId ? String(record.characterId).trim() : "";
      const playerName = record.playerName ? String(record.playerName).trim() : "Unknown Lord";

      if (!characterId) {
        warnings.push(`Row ${idx + 1}: Missing required Character Lord ID. Ignored.`);
        return;
      }

      if (processedIds.has(characterId)) {
        warnings.push(`Row ${idx + 1}: Duplicate Character ID [${characterId}] found. Overwriting with the latest row.`);
        const existingIdx = snapshots.findIndex(sn => sn.playerId === characterId);
        if (existingIdx !== -1) snapshots.splice(existingIdx, 1);
      }
      processedIds.add(characterId);

      const currentPower = parseNumericValue(record.currentPower);
      const highestPower = record.highestPower !== undefined && record.highestPower !== "" 
        ? parseNumericValue(record.highestPower) 
        : currentPower;
      const merits = parseNumericValue(record.merits);

      // Parse composite deaths if present, else fallback to individual t4/t5
      let t4Deaths = parseNumericValue(record.t4Deaths);
      let t5Deaths = parseNumericValue(record.t5Deaths);

      if (record.deathsT4T5 !== undefined && record.deathsT4T5 !== null && String(record.deathsT4T5).trim() !== "") {
        const deathsStr = String(record.deathsT4T5).trim();
        if (deathsStr.includes("/")) {
          const parsed = parseCompositeValue(deathsStr);
          t4Deaths = parsed.t4;
          t5Deaths = parsed.t5;
        } else {
          const totalVal = parseNumericValue(deathsStr);
          // If individual T4 or T5 deaths were not specified, assign totalVal to t4Deaths
          if (t4Deaths === 0 && t5Deaths === 0) {
            t4Deaths = totalVal;
            t5Deaths = 0;
          }
        }
      }

      // Parse composite healing if present, else fallback to individual healing
      let healing = parseNumericValue(record.healing);
      if (record.healingT4T5 !== undefined && record.healingT4T5 !== null && String(record.healingT4T5).trim() !== "") {
        const healingStr = String(record.healingT4T5).trim();
        if (healingStr.includes("/")) {
          healing = parseCompositeHealing(healingStr);
        } else if (healing === 0) {
          healing = parseNumericValue(healingStr);
        }
      }

      const donations = parseNumericValue(record.donations);
      const gathering = parseNumericValue(record.gathering);
      const resourceAssistance = parseNumericValue(record.resourceAssistance);
      const allianceHelp = parseNumericValue(record.allianceHelp);
      const behemothWins = parseNumericValue(record.behemothWins);
      const buildTime = parseNumericValue(record.buildTime);
      const destructionTime = parseNumericValue(record.destructionTime);

      const validDate = sanitizeDateString(date);

      const snap: Snapshot = {
        id: `snap_draft_${characterId}_${draftId}_${idx}`,
        playerId: characterId,
        playerName,
        allianceId: "all_dragon_claw",
        allianceTag: record.allianceTag || "DCLW",
        importId: `import_${draftId}`,
        currentPower,
        highestPower: Math.max(highestPower, currentPower),
        merits,
        t4Deaths,
        t5Deaths,
        healing,
        donations,
        gathering,
        resourceAssistance,
        allianceHelp,
        behemothWins,
        buildTime,
        destructionTime,
        recordedAt: `${validDate}T12:00:00.000Z`,
        createdAt: new Date().toISOString(),
      };

      snapshots.push(snap);
    });

    return { snapshots, warnings };
  };

  // Create workspace file draft objects
  const createDraftFromFile = (
    filename: string,
    fileSize: number,
    fileType: "json" | "csv" | "excel",
    date: string,
    dateAutoDetected: boolean,
    source: "DragonStats" | "Farlight" | "Manual",
    rawRows: any[]
  ) => {
    if (rawRows.length === 0) {
      alert(`File "${filename}" contains no legible rows!`);
      return;
    }

    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Compile unique raw headers from parsed records
    const rawHeadersSet = new Set<string>();
    rawRows.forEach((row) => {
      if (typeof row === "object" && row !== null) {
        Object.keys(row).forEach((k) => rawHeadersSet.add(k));
      }
    });
    const rawHeaders = Array.from(rawHeadersSet);

    // Form fuzzy synonym associations
    const mappedHeaders: Record<string, string> = {};
    rawHeaders.forEach((rh) => {
      mappedHeaders[rh] = normalizeHeader(rh);
    });

    // If json format matches keys perfectly, bypass fuzzing
    if (fileType === "json") {
      rawHeaders.forEach((rh) => {
        const fieldMatch = CANONICAL_FIELDS.find((cf) => cf.key === rh);
        if (fieldMatch) {
          mappedHeaders[rh] = rh;
        }
      });
    }

    const { snapshots, warnings } = buildSnapshotsFromRaw(
      rawRows,
      mappedHeaders,
      date,
      source,
      draftId
    );

    const sanitizedDate = sanitizeDateString(date);
    const dupInfo = getDuplicateDateInfo(sanitizedDate, draftId);

    if (dupInfo.matchingSessions.length > 0) {
      const sessNames = dupInfo.matchingSessions.map((s) => s.filename).join(", ");
      warnings.push(
        `⚠️ DUPLICATE DATE DETECTED: System already has telemetry recorded for ${sanitizedDate} in session "${sessNames}" (${dupInfo.matchingSnapshotsCount} player records).`
      );
    }
    if (dupInfo.matchingOtherDrafts.length > 0) {
      const draftNames = dupInfo.matchingOtherDrafts.map((d) => d.filename).join(", ");
      warnings.push(
        `⚠️ QUEUE DUPLICATE DATE: Another draft file ("${draftNames}") in your staging workspace is also assigned to date ${sanitizedDate}.`
      );
    }

    const newDraft: FileDraft = {
      id: draftId,
      filename,
      fileSize,
      fileType,
      date: sanitizedDate,
      dateAutoDetected,
      source,
      rawRows,
      mappedHeaders,
      snapshots,
      warnings,
      isExpanded: true,
      isMappingExpanded: false,
    };

    setDrafts((prev) => [...prev, newDraft]);
    setImportStatus("parsed");

    // Automatically prompt user with double-check options if duplicate date is detected
    if (dupInfo.isDuplicate) {
      setDuplicateModalState({
        isOpen: true,
        draftId,
        filename,
        date: sanitizedDate,
        matchingSessions: dupInfo.matchingSessions,
        matchingOtherDrafts: dupInfo.matchingOtherDrafts,
        totalExistingRecords: dupInfo.matchingSnapshotsCount,
        newDateValue: sanitizedDate,
      });
    }
  };

  // Handle uploaded batch file list
  const handleFilesUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const filename = file.name;
      const fileSize = file.size;
      const extension = filename.split(".").pop()?.toLowerCase();
      
      const detectedDateStr = extractDateFromFilename(filename);
      const date = detectedDateStr || new Date().toISOString().split("T")[0];
      const dateAutoDetected = !!detectedDateStr;

      let source: "DragonStats" | "Farlight" | "Manual" = "Manual";
      if (filename.toLowerCase().includes("dragon")) {
        source = "DragonStats";
      } else if (filename.toLowerCase().includes("farlight") || !!parseFarlightFilenameInfo(filename)) {
        source = "Farlight";
      }

      const fileType: "json" | "csv" | "excel" = 
        extension === "json" ? "json" :
        (extension === "csv" ? "csv" : "excel");

      const reader = new FileReader();

      if (fileType === "json") {
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            if (!text) return;
            const parsed = JSON.parse(text);
            let rawRows: any[] = [];
            
            if (Array.isArray(parsed)) {
              rawRows = parsed;
            } else if (parsed && typeof parsed === "object") {
              const possibleArray = Object.values(parsed).find((val) => Array.isArray(val));
              if (possibleArray) {
                rawRows = possibleArray as any[];
              } else {
                rawRows = [parsed];
              }
            }

            createDraftFromFile(filename, fileSize, fileType, date, dateAutoDetected, source, rawRows);
          } catch (err) {
            console.error("Failed to parse JSON file", err);
            alert(`Failed to parse JSON in "${filename}": ${err instanceof Error ? err.message : String(err)}`);
          }
        };
        reader.readAsText(file);
      } else {
        // Handle sheets (Excel or CSV) via XLSX
        reader.onload = (e) => {
          try {
            const resultBuffer = e.target?.result as ArrayBuffer;
            if (!resultBuffer) return;
            const data = new Uint8Array(resultBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
              alert(`File "${filename}" contains no valid sheets or data.`);
              return;
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            if (!worksheet) {
              alert(`Sheet "${firstSheetName}" in "${filename}" is empty.`);
              return;
            }

            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
            createDraftFromFile(filename, fileSize, fileType, date, dateAutoDetected, source, rawRows);
          } catch (err) {
            console.error("Failed to parse sheet file", err);
            alert(`Failed to parse spreadsheet in "${filename}": ${err instanceof Error ? err.message : String(err)}`);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFilesUpload(e.target.files);
    }
  };

  // Classic manual raw text paste fallback
  const handleParseText = (textToParse: string) => {
    if (!textToParse.trim()) return;

    const filename = "Direct Paste Ledger";
    const fileSize = textToParse.length;
    const date = new Date().toISOString().split("T")[0];

    const lines = textToParse.trim().split("\n");
    if (lines.length < 2) {
      alert("Text contains insufficient data lines besides the header.");
      return;
    }

    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : ",";
    const headers = firstLine.split(delimiter).map((h) => h.trim());

    const rawRows = lines.slice(1).map((line) => {
      const cells = line.split(delimiter).map((c) => c.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cells[idx] || "";
      });
      return obj;
    });

    createDraftFromFile(filename, fileSize, "csv", date, false, importSource, rawRows);
  };

  // Ingestion Workspace Interactive Editors
  const handleDraftDateChange = (draftId: string, newDate: string) => {
    const sanitizedDate = sanitizeDateString(newDate);
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        const dupInfo = getDuplicateDateInfo(sanitizedDate, draftId);
        const filteredWarnings = d.warnings.filter(
          (w) => !w.includes("DUPLICATE DATE DETECTED") && !w.includes("QUEUE DUPLICATE DATE")
        );

        if (dupInfo.matchingSessions.length > 0) {
          const sessNames = dupInfo.matchingSessions.map((s) => s.filename).join(", ");
          filteredWarnings.push(
            `⚠️ DUPLICATE DATE DETECTED: System already has telemetry recorded for ${sanitizedDate} in session "${sessNames}" (${dupInfo.matchingSnapshotsCount} player records).`
          );
        }
        if (dupInfo.matchingOtherDrafts.length > 0) {
          const draftNames = dupInfo.matchingOtherDrafts.map((d) => d.filename).join(", ");
          filteredWarnings.push(
            `⚠️ QUEUE DUPLICATE DATE: Another draft file ("${draftNames}") in your staging workspace is also assigned to date ${sanitizedDate}.`
          );
        }

        return {
          ...d,
          date: sanitizedDate,
          dateAutoDetected: false,
          warnings: filteredWarnings,
          snapshots: d.snapshots.map((s) => ({
            ...s,
            recordedAt: `${sanitizedDate}T12:00:00.000Z`,
          })),
        };
      })
    );
  };

  const handleDraftNameChange = (draftId: string, newName: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, filename: newName } : d))
    );
  };

  const handleDraftSourceChange = (draftId: string, source: "DragonStats" | "Farlight" | "Manual") => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, source } : d))
    );
  };

  const handleCellChange = (
    draftId: string,
    snapId: string,
    field: keyof Snapshot,
    value: any
  ) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        return {
          ...d,
          snapshots: d.snapshots.map((s) => {
            if (s.id !== snapId) return s;

            let parsedVal = value;
            if (typeof s[field] === "number") {
              parsedVal = parseNumericValue(value);
            }

            let highestPower = s.highestPower;
            if (field === "currentPower") {
              highestPower = Math.max(s.highestPower, parsedVal);
            }

            return {
              ...s,
              [field]: parsedVal,
              highestPower,
            };
          }),
        };
      })
    );
  };

  const handleDeleteRow = (draftId: string, snapId: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;
        return {
          ...d,
          snapshots: d.snapshots.filter((s) => s.id !== snapId),
        };
      })
    );
  };

  const handleHeaderMapChange = (draftId: string, rawHeader: string, canonicalKey: string) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;

        const updatedMappedHeaders = {
          ...d.mappedHeaders,
          [rawHeader]: canonicalKey,
        };

        const { snapshots, warnings } = buildSnapshotsFromRaw(
          d.rawRows,
          updatedMappedHeaders,
          d.date,
          d.source,
          d.id
        );

        return {
          ...d,
          mappedHeaders: updatedMappedHeaders,
          snapshots,
          warnings,
        };
      })
    );
  };

  const toggleDraftExpansion = (draftId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, isExpanded: !d.isExpanded } : d))
    );
  };

  const toggleMappingExpansion = (draftId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, isMappingExpanded: !d.isMappingExpanded } : d))
    );
  };

  const handleDeleteDraft = (draftId: string) => {
    const updated = drafts.filter((d) => d.id !== draftId);
    setDrafts(updated);
    if (updated.length === 0) {
      setImportStatus("idle");
    }
  };

  // Manual Add Player to draft logic
  const handleUpdateAddPlayerForm = (draftId: string, field: string, value: any) => {
    setAddPlayerFormStates((prev) => ({
      ...prev,
      [draftId]: {
        ...(prev[draftId] || {}),
        [field]: value,
      },
    }));
  };

  const handleAddPlayerSubmit = (draftId: string) => {
    const formFields = addPlayerFormStates[draftId] || {};
    const characterId = (formFields.playerId || "").trim();
    const playerName = (formFields.playerName || "").trim() || "Manually Added Lord";
    const allianceTag = (formFields.allianceTag || "").trim() || "DCLW";

    if (!characterId) {
      alert("Lord Character ID is strictly required to register a manual record.");
      return;
    }

    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== draftId) return d;

        if (d.snapshots.some((s) => s.playerId === characterId)) {
          alert(`Character ID "${characterId}" is already registered in this file draft.`);
          return d;
        }

        const validDate = sanitizeDateString(d.date);
        const newSnap: Snapshot = {
          id: `snap_draft_${characterId}_${d.id}_manual_${Date.now()}`,
          playerId: characterId,
          playerName,
          allianceId: "all_dragon_claw",
          allianceTag,
          importId: `import_${d.id}`,
          currentPower: parseNumericValue(formFields.currentPower),
          highestPower: parseNumericValue(formFields.currentPower),
          merits: parseNumericValue(formFields.merits),
          t4Deaths: parseNumericValue(formFields.t4Deaths),
          t5Deaths: parseNumericValue(formFields.t5Deaths),
          healing: parseNumericValue(formFields.healing),
          donations: parseNumericValue(formFields.donations),
          gathering: parseNumericValue(formFields.gathering),
          resourceAssistance: parseNumericValue(formFields.resourceAssistance),
          allianceHelp: parseNumericValue(formFields.allianceHelp),
          behemothWins: parseNumericValue(formFields.behemothWins),
          recordedAt: `${validDate}T12:00:00.000Z`,
          createdAt: new Date().toISOString(),
        };

        return {
          ...d,
          snapshots: [...d.snapshots, newSnap],
        };
      })
    );

    // Reset specific draft form state
    setAddPlayerFormStates((prev) => ({
      ...prev,
      [draftId]: {},
    }));
  };

  // Global transactional bulk commit with Custom Loading Animation
  const handleBulkCommit = (forceCommit = false) => {
    if (drafts.length === 0) return;

    if (!forceCommit) {
      const duplicateDraft = drafts.find((d) => getDuplicateDateInfo(d.date, d.id).isDuplicate);
      if (duplicateDraft) {
        const dupInfo = getDuplicateDateInfo(duplicateDraft.date, duplicateDraft.id);
        setDuplicateModalState({
          isOpen: true,
          draftId: duplicateDraft.id,
          filename: duplicateDraft.filename,
          date: dupInfo.sanitizedDate,
          matchingSessions: dupInfo.matchingSessions,
          matchingOtherDrafts: dupInfo.matchingOtherDrafts,
          totalExistingRecords: dupInfo.matchingSnapshotsCount,
          newDateValue: dupInfo.sanitizedDate,
        });
        return;
      }
    }

    setIsCommitLoading(true);
    setCommitProgress(15);

    const interval = setInterval(() => {
      setCommitProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setCommitProgress(100);

      const allPlayers: Player[] = [];
      const allSnapshots: Snapshot[] = [];
      const sessionsList: ImportSession[] = [];

      drafts.forEach((draft) => {
        draft.snapshots.forEach((s) => {
          allSnapshots.push(s);
          allPlayers.push({
            characterId: s.playerId,
            currentName: s.playerName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });

        const draftSession: ImportSession = {
          id: `import_${draft.id}`,
          filename: draft.filename,
          uploadedBy: "Officer Sam",
          importedAt: new Date().toISOString(),
          rowCount: draft.snapshots.length,
          status: draft.warnings.length > 0 ? "COMPLETED_WITH_WARNINGS" : "COMPLETED",
          warnings: draft.warnings,
          source: draft.source,
        };
        sessionsList.push(draftSession);
      });

      onImportSnapshots(allPlayers, allSnapshots, sessionsList);
      setImportStatus("success");

      setTimeout(() => {
        setIsCommitLoading(false);
        setDrafts([]);
        setInputText("");
        setImportStatus("idle");
      }, 500);
    }, 1200);
  };

  // Metrics calculators
  const totalSnapshotsCount = drafts.reduce((acc, d) => acc + d.snapshots.length, 0);
  const totalWarningsCount = drafts.reduce((acc, d) => acc + d.warnings.length, 0);

  const handleApplyPresetText = (type: "dragon" | "farlight") => {
    if (type === "dragon") {
      setInputText(DRAGONSTATS_TEMPLATE);
      setImportSource("DragonStats");
    } else {
      setInputText(FARLIGHT_TEMPLATE);
      setImportSource("Farlight");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Status / Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gothic-velvet p-5 rounded-xl border border-gothic-silver/20">
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-display text-gothic-silver tracking-wide flex items-center gap-2">
            <Database size={22} className="text-[#89A6B8]" />
            Ingestion & Telemetry Workspace
          </h1>
          <p className="text-xs text-gothic-rose/90">
            Upload telemetry documents to parse characters, synchronize seasonal dates, and clean data records prior to ledger commit.
          </p>
        </div>

        {/* Global actions depending on state */}
        {activeMainTab === "upload" && importStatus === "parsed" && (
          <div className="flex flex-wrap gap-2.5">
            <button
              id="clear-ingestion-queue-btn"
              onClick={() => {
                setDrafts([]);
                setImportStatus("idle");
              }}
              className="px-4 py-2 bg-gothic-ink hover:bg-red-950/20 hover:text-red-400 border border-gothic-silver/20 hover:border-red-900/50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Clear Queue
            </button>
            <button
              id="add-more-ingestion-files-btn"
              onClick={() => {
                setImportStatus("idle");
              }}
              className="px-4 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 border border-gothic-silver/20 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} /> Add More Files
            </button>
            <button
              id="global-bulk-commit-btn"
              onClick={() => handleBulkCommit()}
              disabled={totalSnapshotsCount === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/20"
            >
              <CheckCircle size={14} />
              Commit All ({totalSnapshotsCount} Snapshots)
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Switch */}
      <div className="flex gap-2 border-b border-gothic-silver/20 pb-px">
        <button
          onClick={() => setActiveMainTab("upload")}
          className={`px-4 py-2 text-xs font-semibold tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === "upload"
              ? "border-gothic-silver text-gothic-silver"
              : "border-transparent text-gothic-rose/50 hover:text-gothic-rose/90"
          }`}
        >
          Upload New Telemetry
        </button>
        <button
          onClick={() => setActiveMainTab("manager")}
          className={`px-4 py-2 text-xs font-semibold tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMainTab === "manager"
              ? "border-gothic-silver text-gothic-silver"
              : "border-transparent text-gothic-rose/50 hover:text-gothic-rose/90"
          }`}
        >
          <HistoryIcon size={14} /> Document History & Manager
          {importSessions.length > 0 && (
            <span className="bg-gothic-silver/10 text-gothic-silver text-[10px] font-mono px-1.5 py-0.5 rounded border border-gothic-silver/20">
              {importSessions.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Container Switch */}
      {activeMainTab === "upload" ? (
        <AnimatePresence mode="wait">
        
        {/* State A: Upload & Drag and Drop Workspace */}
        {importStatus === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Interactive Drag & Drop Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Document Ingestion Zone Selection Tabs */}
              <div className="flex bg-gothic-void p-1 rounded-lg border border-gothic-silver/20 max-w-sm">
                <button
                  onClick={() => setActiveSubTab("files")}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                    activeSubTab === "files"
                      ? "bg-gothic-ink text-gothic-silver shadow"
                      : "text-gothic-rose/50 hover:text-gothic-rose/90"
                  }`}
                >
                  Document Drag & Drop
                </button>
                <button
                  onClick={() => setActiveSubTab("text")}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                    activeSubTab === "text"
                      ? "bg-gothic-ink text-gothic-silver shadow"
                      : "text-gothic-rose/50 hover:text-gothic-rose/90"
                  }`}
                >
                  Raw Text Copy-Paste
                </button>
              </div>

              {activeSubTab === "files" ? (
                /* Native File Upload Area */
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleButtonClick}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[360px] ${
                    dragActive 
                      ? "border-gothic-silver bg-gothic-silver/5 shadow-[0_0_15px_rgba(231,203,156,0.1)]"
                      : "border-gothic-silver/20 bg-gothic-velvet hover:border-[#89A6B8]/50 hover:bg-gothic-ink/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="p-4 rounded-full bg-gothic-void border border-gothic-silver/20 text-gothic-silver mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>

                  <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">
                    Drag and Drop Ingestion Files
                  </h3>
                  <p className="text-xs text-[#C8CCD2] mt-2 max-w-md mx-auto leading-relaxed">
                    Select multiple spreadsheet <span className="text-[#7FB685] font-mono">.xlsx</span>, <span className="text-[#7FA8C9] font-mono">.csv</span>, or metadata <span className="text-[#D4B26A] font-mono">.json</span> files. Date markers are resolved from the filenames.
                  </p>
                  
                  <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-rose/50 rounded-md">Excel (.xlsx/.xls)</span>
                    <span className="px-3 py-1 bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-rose/50 rounded-md">CSV Spreadsheet</span>
                    <span className="px-3 py-1 bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-rose/50 rounded-md">JSON Record Sets</span>
                  </div>

                  <button
                    type="button"
                    className="mt-6 px-4 py-2 bg-gothic-silver hover:bg-opacity-90 text-[#111113] font-bold text-xs rounded-lg transition-all"
                  >
                    Browse Device Storage
                  </button>
                </div>
              ) : (
                /* Legacy Text Paste Tab */
                <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
                  <div className="flex justify-between items-center border-b border-gothic-silver/20 pb-3">
                    <h2 className="text-xs font-semibold text-gothic-rose/50 uppercase tracking-wider flex items-center gap-1.5">
                      <ListFilter size={14} /> Paste Raw Rows
                    </h2>
                    
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApplyPresetText("dragon")}
                        className="px-2 py-0.5 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 hover:text-gothic-silver border border-gothic-silver/20 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy size={10} /> DragonStats Preset
                      </button>
                      <button
                        onClick={() => handleApplyPresetText("farlight")}
                        className="px-2 py-0.5 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 hover:text-gothic-silver border border-gothic-silver/20 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy size={10} /> Farlight Preset
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste spreadsheet lines with headers here (separated by tabs or commas)..."
                    className="w-full h-80 bg-gothic-void border border-gothic-silver/20 text-xs font-mono text-gothic-silver p-3 rounded-lg outline-none focus:border-[#89A6B8] resize-none leading-relaxed"
                  />

                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gothic-rose/50 font-medium flex items-center gap-1">
                      Platform Source:
                      <select
                        value={importSource}
                        onChange={(e) => setImportSource(e.target.value as any)}
                        className="bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-rose/90 p-1.5 rounded outline-none"
                      >
                        <option value="DragonStats">DragonStats Export</option>
                        <option value="Farlight">Farlight CSV</option>
                        <option value="Manual">Custom Sheet</option>
                      </select>
                    </label>

                    <button
                      onClick={() => handleParseText(inputText)}
                      disabled={!inputText.trim()}
                      className="px-5 py-2 bg-gothic-silver disabled:bg-gray-800 disabled:text-gray-500 text-[#111113] font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Parse & Map Pasted Data
                    </button>
                  </div>
                </div>
              )}

              {/* Inactive draft workspace reminder if files exist */}
              {drafts.length > 0 && (
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="text-emerald-400" size={18} />
                    <div>
                      <h4 className="text-xs font-bold text-gothic-silver">Drafts Active ({drafts.length} files)</h4>
                      <p className="text-[11px] text-gothic-rose/90">You have loaded file drafts in memory. You can go view them directly.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImportStatus("parsed")}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                  >
                    Review Workspace <ArrowRight size={12} />
                  </button>
                </div>
              )}

            </div>

            {/* Side Help Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-5 rounded-xl bg-gothic-velvet border border-gothic-silver/20 space-y-4">
                <h3 className="text-sm font-semibold tracking-wider text-gothic-silver uppercase font-display border-b border-gothic-silver/20 pb-2 flex items-center gap-2">
                  <Info size={16} /> Parsing Specifications
                </h3>
                
                <ul className="text-xs text-gothic-rose/90 space-y-3.5 list-none pl-0">
                  <li className="space-y-1">
                    <span className="text-gothic-silver font-semibold block flex items-center gap-1.5">
                      <Check size={12} /> 1. Auto-Date Extraction
                    </span>
                    <span className="text-gothic-rose/50 block pl-4 leading-relaxed">
                      If the document title contains dates like <code className="text-[#89A6B8] font-mono">2026-07-15</code> or <code className="text-[#89A6B8] font-mono">Jul_18_2026</code>, the parser automatically aligns all snapshots to that day.
                    </span>
                  </li>
                  <li className="space-y-1">
                    <span className="text-gothic-silver font-semibold block flex items-center gap-1.5">
                      <Check size={12} /> 2. Unified Sheet Reader
                    </span>
                    <span className="text-gothic-rose/50 block pl-4 leading-relaxed">
                      Supports direct reading of Excel formats (<code className="text-[#89A6B8]">.xlsx</code>, <code className="text-[#89A6B8]">.xls</code>) as well as CSV spreadsheets, avoiding complex manual text conversions.
                    </span>
                  </li>
                  <li className="space-y-1">
                    <span className="text-gothic-silver font-semibold block flex items-center gap-1.5">
                      <Check size={12} /> 3. Synonym Header Mappers
                    </span>
                    <span className="text-gothic-rose/50 block pl-4 leading-relaxed">
                      Matches column naming variations (e.g., "Lord ID", "Character ID", "Lord Name", "CID", "Merits", "Kill Points") and normalizes them automatically.
                    </span>
                  </li>
                  <li className="space-y-1">
                    <span className="text-gothic-silver font-semibold block flex items-center gap-1.5">
                      <Check size={12} /> 4. Non-Destructive In-Memory Drafts
                    </span>
                    <span className="text-gothic-rose/50 block pl-4 leading-relaxed">
                      Parsed records stay as active drafts in your workspace where you can edit values, change dates, and filter characters before committing.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* State B: Active Multi-document Draft Review and In-Memory Spreadsheet Editor Workspace */}
        {importStatus === "parsed" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            
            {/* Global metrics ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Loaded Documents", value: drafts.length, color: "text-gothic-silver" },
                { label: "Cumulative Snapshots", value: totalSnapshotsCount, color: "text-[#89A6B8]" },
                { label: "Detected Warnings", value: totalWarningsCount, color: totalWarningsCount > 0 ? "text-amber-400" : "text-emerald-400" }
              ].map((m, idx) => (
                <div key={idx} className="p-4 bg-gothic-velvet rounded-xl border border-gothic-silver/20 text-center">
                  <p className="text-[10px] uppercase font-bold text-gothic-rose/50 tracking-wider">{m.label}</p>
                  <p className={`text-xl font-mono font-bold mt-1.5 ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* List of drafts */}
            <div className="space-y-6">
              {drafts.map((draft) => {
                const addForm = addPlayerFormStates[draft.id] || {};
                const dupInfo = getDuplicateDateInfo(draft.date, draft.id);

                return (
                  <div
                    key={draft.id}
                    className="bg-gothic-velvet rounded-xl border border-gothic-silver/20 overflow-hidden transition-all shadow-md"
                  >
                    
                    {/* Draft Card Header Bar */}
                    <div className="p-4 bg-gothic-ink/40 border-b border-gothic-silver/20 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-gothic-void border border-gothic-silver/20">
                          {draft.fileType === "json" ? (
                            <FileCode size={18} className="text-[#D4B26A]" />
                          ) : draft.fileType === "csv" ? (
                            <FileText size={18} className="text-[#7FA8C9]" />
                          ) : (
                            <FileSpreadsheet size={18} className="text-[#7FB685]" />
                          )}
                        </div>
                        
                        <div className="space-y-0.5">
                          {/* Title Editor */}
                          <input
                            type="text"
                            value={draft.filename}
                            onChange={(e) => handleDraftNameChange(draft.id, e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-[#77777A] focus:border-gothic-silver focus:outline-none text-sm font-bold text-gothic-silver font-mono px-0.5"
                          />
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gothic-rose/50 font-mono">
                            <span>{formatBytes(draft.fileSize)}</span>
                            <span>•</span>
                            <span className="uppercase text-[#89A6B8] font-bold">{draft.fileType}</span>
                            <span>•</span>
                            <span>{draft.snapshots.length} characters found</span>
                            {(() => {
                              const farlightInfo = parseFarlightFilenameInfo(draft.filename);
                              if (farlightInfo) {
                                return (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#89A6B8] bg-[#89A6B8]/10 px-1.5 py-0.2 rounded border border-[#89A6B8]/20 flex items-center gap-1">
                                      Server {farlightInfo.server} ({farlightInfo.startDate} to {farlightInfo.endDate})
                                    </span>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        {/* Duplicate Date Flag Badge */}
                        {dupInfo.isDuplicate && (
                          <div className="px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300">
                            <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                            <span>DUPLICATE DATE: {dupInfo.sanitizedDate}</span>
                          </div>
                        )}

                        {/* Auto-detected Date Notification Indicator */}
                        <div className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border ${
                          draft.dateAutoDetected
                            ? "bg-amber-950/20 border-amber-900/40 text-gothic-silver"
                            : "bg-gothic-void border-gothic-silver/20 text-gothic-rose/50"
                        }`}>
                          <Calendar size={10} />
                          {draft.dateAutoDetected ? "Filename Date Match" : "Manually Assigned Date"}
                        </div>

                        {/* Expand Map Trigger */}
                        <button
                          onClick={() => toggleMappingExpansion(draft.id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1 ${
                            draft.isMappingExpanded
                              ? "bg-gothic-silver border-gothic-silver text-[#111113]"
                              : "bg-gothic-void border-gothic-silver/20 text-gothic-rose/90 hover:bg-gothic-ink"
                          }`}
                        >
                          <Map size={12} />
                          Map Headers
                        </button>

                        {/* Collapsing state trigger */}
                        <button
                          onClick={() => toggleDraftExpansion(draft.id)}
                          className="p-1.5 rounded bg-gothic-void border border-gothic-silver/20 hover:bg-gothic-ink text-gothic-rose/90 cursor-pointer"
                        >
                          {draft.isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Delete draft button */}
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 rounded bg-red-950/10 border border-red-900/30 text-red-400 hover:bg-red-950/30 cursor-pointer"
                          title="Remove File Draft"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Duplicate Date Warning Banner Callout */}
                    {dupInfo.isDuplicate && (
                      <div className="p-3.5 bg-amber-950/30 border-b border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-amber-300 font-mono flex items-center gap-2">
                              Duplicate Telemetry Date Flagged ({dupInfo.sanitizedDate})
                            </h4>
                            <p className="text-gothic-rose/80 text-[11px] leading-relaxed">
                              {dupInfo.matchingSessions.length > 0
                                ? `Telemetry for ${dupInfo.sanitizedDate} is already recorded in session "${dupInfo.matchingSessions.map((s) => s.filename).join(", ")}" (${dupInfo.matchingSnapshotsCount} player records).`
                                : `Another file in your staging workspace ("${dupInfo.matchingOtherDrafts.map((d) => d.filename).join(", ")}") is also assigned to date ${dupInfo.sanitizedDate}.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
                          {dupInfo.matchingSessions.length > 0 && (
                            <button
                              onClick={() => {
                                const oldSess = dupInfo.matchingSessions[0];
                                onDeleteSession(oldSess.id);
                                alert(`Purged old session "${oldSess.filename}" for date ${dupInfo.sanitizedDate}. Staged file can now be committed cleanly.`);
                              }}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-500/40 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Overwrite Old Session
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDuplicateModalState({
                                isOpen: true,
                                draftId: draft.id,
                                filename: draft.filename,
                                date: dupInfo.sanitizedDate,
                                matchingSessions: dupInfo.matchingSessions,
                                matchingOtherDrafts: dupInfo.matchingOtherDrafts,
                                totalExistingRecords: dupInfo.matchingSnapshotsCount,
                                newDateValue: draft.date,
                              });
                            }}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw size={10} /> Double-Check Options
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Column Mapping Section (Collapsible Sub-pane) */}
                    <AnimatePresence>
                      {draft.isMappingExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-b border-gothic-silver/20 bg-gothic-void/60"
                        >
                          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 space-y-1.5">
                              <h4 className="text-xs font-bold text-gothic-silver uppercase tracking-wider font-display flex items-center gap-1">
                                <Map size={12} /> Column Mapping Config
                              </h4>
                              <p className="text-[11px] text-gothic-rose/50 leading-relaxed">
                                Associate original spreadsheet header keys (on the left) with canonical database properties. Any mapped field changes instantly reconstructs the in-memory snap rows.
                              </p>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-2">
                              {Object.entries(draft.mappedHeaders).map(([rawHeader, canonical]) => (
                                <div
                                  key={rawHeader}
                                  className="flex items-center justify-between p-2 rounded bg-gothic-void border border-gothic-silver/20 text-xs font-mono"
                                >
                                  <span className="text-gothic-rose/50 truncate max-w-[120px] font-bold" title={rawHeader}>
                                    {rawHeader}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gothic-rose/50">➔</span>
                                    <select
                                      value={canonical}
                                      onChange={(e) => handleHeaderMapChange(draft.id, rawHeader, e.target.value)}
                                      className="bg-gothic-ink border border-gothic-silver/20 text-[11px] text-gothic-rose/90 px-1.5 py-0.5 rounded outline-none cursor-pointer focus:border-gothic-silver"
                                    >
                                      <option value="unknown">Ignore Column</option>
                                      {CANONICAL_FIELDS.map((f) => (
                                        <option key={f.key} value={f.key}>
                                          {f.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expandable Draft Workspace Content */}
                    <AnimatePresence>
                      {draft.isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-5 grid grid-cols-1 xl:grid-cols-4 gap-6">
                            
                            {/* File draft Sidebar controls */}
                            <div className="xl:col-span-1 space-y-4">
                              <div className="p-4 rounded-xl bg-gothic-void border border-gothic-silver/20 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gothic-rose/50 font-mono border-b border-gothic-silver/20 pb-1.5">
                                  File Context Controls
                                </h4>
                                
                                {/* Snapshot Ledger Date Selector */}
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block">
                                    Ledger Date Record
                                  </label>
                                  <input
                                    type="date"
                                    value={draft.date}
                                    onChange={(e) => handleDraftDateChange(draft.id, e.target.value)}
                                    className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs font-mono text-gothic-silver p-2 rounded-lg outline-none focus:border-gothic-silver"
                                  />
                                  <span className="text-[9px] text-gothic-rose/50 block italic mt-0.5">
                                    Applies timeline marker to all rows.
                                  </span>
                                </div>

                                {/* Import Platform Source */}
                                <div className="space-y-1">
                                  <label className="text-[10px] uppercase font-bold text-gothic-rose/50 block">
                                    Platform Source
                                  </label>
                                  <select
                                    value={draft.source}
                                    onChange={(e) => handleDraftSourceChange(draft.id, e.target.value as any)}
                                    className="w-full bg-gothic-ink border border-gothic-silver/20 text-xs text-gothic-rose/90 p-2 rounded-lg outline-none cursor-pointer focus:border-gothic-silver"
                                  >
                                    <option value="DragonStats">DragonStats Export</option>
                                    <option value="Farlight">Farlight CSV</option>
                                    <option value="Manual">Manual Worksheet</option>
                                  </select>
                                </div>
                              </div>

                              {/* Warning Logs accordion */}
                              {draft.warnings.length > 0 && (
                                <div className="p-4 rounded-xl bg-amber-950/10 border border-amber-900/30 space-y-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 font-mono">
                                    <AlertTriangle size={12} /> Parsing Warnings ({draft.warnings.length})
                                  </h4>
                                  <div className="text-[10px] font-mono text-amber-300 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                    {draft.warnings.map((warn, wIdx) => (
                                      <p key={wIdx}>• {warn}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* In-Memory Spreadsheet Table Editor */}
                            <div className="xl:col-span-3 space-y-4">
                              <div className="rounded-lg border border-gothic-silver/20 overflow-hidden bg-gothic-void">
                                <div className="p-3 bg-gothic-velvet border-b border-gothic-silver/20 flex justify-between items-center">
                                  <h4 className="text-[11px] font-bold uppercase text-gothic-rose/50 font-mono tracking-wider">
                                    Spreadsheet Records Editor
                                  </h4>
                                  <span className="text-[10px] font-mono text-gothic-silver bg-gothic-silver/10 px-2 py-0.5 rounded border border-gothic-silver/20">
                                    {draft.snapshots.length} Rows
                                  </span>
                                </div>

                                <div className="overflow-x-auto max-h-96">
                                  <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                      <tr className="bg-gothic-void border-b border-gothic-silver/20 text-[10px] uppercase font-bold text-gothic-rose/50 font-mono">
                                        <th className="p-2 pl-3">Lord ID</th>
                                        <th className="p-2">Lord Name</th>
                                        <th className="p-2 w-16">Tag</th>
                                        <th className="p-2 text-right">Power</th>
                                        <th className="p-2 text-right">Merits</th>
                                        <th className="p-2 text-right">T4 Deaths</th>
                                        <th className="p-2 text-right">T5 Deaths</th>
                                        <th className="p-2 text-right">Healing</th>
                                        <th className="p-2 text-right">Help</th>
                                        <th className="p-2 text-center w-10">Delete</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#232328] font-mono">
                                      {(showAllDraftRows[draft.id] ? draft.snapshots : draft.snapshots.slice(0, 50)).map((snap) => (
                                        <tr key={snap.id} className="hover:bg-gothic-ink/40 text-xs">
                                          {/* ID (Fixed as key) */}
                                          <td className="p-2 pl-3 text-gothic-rose/50 select-all font-semibold">
                                            {snap.playerId}
                                          </td>
                                          
                                          {/* Player Name input */}
                                          <td className="p-1">
                                            <input
                                              type="text"
                                              value={snap.playerName}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "playerName", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-gothic-silver"
                                            />
                                          </td>

                                          {/* Alliance Tag input */}
                                          <td className="p-1">
                                            <input
                                              type="text"
                                              value={snap.allianceTag || ""}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "allianceTag", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-gothic-rose/90"
                                            />
                                          </td>

                                          {/* Current Power input */}
                                          <td className="p-1">
                                            <input
                                              type="number"
                                              value={snap.currentPower}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "currentPower", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-amber-300 font-bold"
                                            />
                                          </td>

                                          {/* Merits input */}
                                          <td className="p-1">
                                            <input
                                              type="number"
                                              value={snap.merits}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "merits", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-cyan-400 font-semibold"
                                            />
                                          </td>

                                          {/* T4 Deaths input */}
                                          <td className="p-1">
                                            <input
                                              type="number"
                                              value={snap.t4Deaths}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "t4Deaths", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-red-400"
                                            />
                                          </td>

                                          {/* T5 Deaths input */}
                                          <td className="p-1">
                                            <input
                                              type="number"
                                              value={snap.t5Deaths}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "t5Deaths", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-red-500 font-semibold"
                                            />
                                          </td>

                                          {/* Healing input */}
                                          <td className="p-1">
                                            <input
                                              type="number"
                                              value={snap.healing}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "healing", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-emerald-400"
                                            />
                                          </td>

                                          {/* Help input */}
                                          <td className="p-1">
                                            <input
                                              type="number"
                                              value={snap.allianceHelp}
                                              onChange={(e) => handleCellChange(draft.id, snap.id, "allianceHelp", e.target.value)}
                                              className="bg-transparent border-0 hover:bg-gothic-ink/60 focus:bg-gothic-ink focus:ring-1 focus:ring-[#E7CB9C] text-xs font-mono w-full px-1.5 py-0.5 rounded outline-none text-right text-gray-300"
                                            />
                                          </td>

                                          {/* Delete button */}
                                          <td className="p-1 text-center">
                                            <button
                                              onClick={() => handleDeleteRow(draft.id, snap.id)}
                                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded transition-colors"
                                              title="Delete record"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {draft.snapshots.length > 50 && (
                                  <div className="p-2.5 bg-gothic-ink border-t border-gothic-silver/20 flex flex-wrap justify-between items-center text-[10px] font-mono text-gothic-rose/70 gap-2">
                                    <span>
                                      Showing {showAllDraftRows[draft.id] ? draft.snapshots.length : 50} of {draft.snapshots.length} parsed records.
                                      {!showAllDraftRows[draft.id] && " (All rows will be saved when committed)"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setShowAllDraftRows(prev => ({ ...prev, [draft.id]: !prev[draft.id] }))}
                                      className="text-gothic-silver hover:text-amber-300 underline cursor-pointer transition-colors"
                                    >
                                      {showAllDraftRows[draft.id] ? "Show First 50 Rows" : `Show All ${draft.snapshots.length} Rows`}
                                    </button>
                                  </div>
                                )}

                                {/* Manual record appending panel */}
                                <div className="p-3.5 bg-gothic-ink/20 border-t border-gothic-silver/20 space-y-2.5">
                                  <h5 className="text-[10px] font-bold text-gothic-silver uppercase font-mono tracking-wider flex items-center gap-1">
                                    <Plus size={12} /> Manually Append Lord Character Row
                                  </h5>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="usr_10293"
                                        value={addForm.playerId || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "playerId", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Lord Name"
                                        value={addForm.playerName || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "playerName", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Tag (e.g. DCLW)"
                                        value={addForm.allianceTag || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "allianceTag", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="Power"
                                        value={addForm.currentPower || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "currentPower", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="Merits"
                                        value={addForm.merits || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "merits", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="T4 Deaths"
                                        value={addForm.t4Deaths || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "t4Deaths", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="T5 Deaths"
                                        value={addForm.t5Deaths || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "t5Deaths", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="Healed"
                                        value={addForm.healing || ""}
                                        onChange={(e) => handleUpdateAddPlayerForm(draft.id, "healing", e.target.value)}
                                        className="w-full bg-gothic-void border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver p-1.5 rounded outline-none focus:border-gothic-silver"
                                      />
                                    </div>
                                    <div className="flex">
                                      <button
                                        onClick={() => handleAddPlayerSubmit(draft.id)}
                                        className="w-full bg-gothic-silver hover:bg-opacity-90 text-[#111113] font-bold text-[10px] rounded p-1.5 transition-all cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        <Plus size={10} /> Add
                                      </button>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })}
            </div>

            {/* Bottom Actions card */}
            <div className="p-6 bg-gothic-velvet rounded-xl border border-gothic-silver/20 text-center space-y-4">
              <Sparkles className="mx-auto text-gothic-silver animate-pulse" size={24} />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-bold text-gothic-silver font-display">Ready for Bulk Assembly</h3>
                <p className="text-xs text-gothic-rose/90">
                  Once you have finished refining individual character cells and aligning ledger timeline dates, execute the global transaction write.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setDrafts([]);
                    setImportStatus("idle");
                  }}
                  className="px-5 py-2.5 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 border border-gothic-silver/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Clear Bulk Workspace
                </button>
                <button
                  onClick={() => handleBulkCommit()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Commit All Snapshots
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* State C: Ingestion Completed Success Screen */}
        {importStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-8 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-center space-y-5 max-w-2xl mx-auto my-12"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle size={36} className="animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-gothic-silver font-display uppercase tracking-wider">
                Bulk Ingestion Successful
              </h3>
              <p className="text-xs text-gothic-rose/90 leading-relaxed">
                Ledger snapshots written to core databases in single atomic transaction. Recalculated player roles, updated streak timelines, and rebuilt evaluation scores automatically.
              </p>
            </div>

            <div className="p-3 bg-gothic-void rounded-lg border border-gothic-silver/20 text-[10px] font-mono text-gothic-rose/50 max-w-sm mx-auto">
              Returning to document upload hub...
            </div>
          </motion.div>
        )}

      </AnimatePresence>
      ) : (
        /* File Manager Layout */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filtering and search controls */}
          <div className="bg-gothic-velvet p-5 rounded-xl border border-gothic-silver/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search uploaded documents by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gothic-void border border-gothic-silver/20 text-xs text-gothic-silver rounded-lg outline-none focus:border-gothic-silver transition-all"
              />
              <Database size={14} className="absolute left-3 top-3 text-gothic-rose/50" />
            </div>

            <div className="flex gap-2.5">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 bg-gothic-void border border-gothic-silver/20 text-xs text-gothic-rose/90 rounded-lg outline-none focus:border-gothic-silver cursor-pointer"
              >
                <option value="ALL">All Sources</option>
                <option value="DragonStats">DragonStats</option>
                <option value="Farlight">Farlight</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gothic-velvet p-4 rounded-xl border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] font-mono text-gothic-rose/50 uppercase tracking-wider block">Total Documents</span>
              <span className="text-xl font-bold font-display text-gothic-silver">{filteredSessions.length} Files</span>
            </div>
            <div className="bg-gothic-velvet p-4 rounded-xl border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] font-mono text-gothic-rose/50 uppercase tracking-wider block">Total Records Loaded</span>
              <span className="text-xl font-bold font-display text-emerald-400">{filteredSnapshotsTotal} Snapshots</span>
            </div>
            <div className="bg-gothic-velvet p-4 rounded-xl border border-gothic-silver/20 space-y-1">
              <span className="text-[10px] font-mono text-gothic-rose/50 uppercase tracking-wider block">Average Density</span>
              <span className="text-xl font-bold font-display text-[#89A6B8]">{Math.round(filteredSnapshotsTotal / (filteredSessions.length || 1))} rows/file</span>
            </div>
          </div>

          {/* List of files */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 bg-gothic-velvet rounded-xl border border-gothic-silver/20">
                <Database className="mx-auto text-[#2D2D33] mb-3" size={32} />
                <p className="text-xs text-gothic-rose/50 font-mono">No telemetry documents matched your filters.</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const sessionSnaps = snapshots.filter((s) => s.importId === session.id);
                const isEditing = editingSessionId === session.id;
                const isConfirming = confirmDeleteId === session.id;
                const isInspecting = inspectedSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className="bg-gothic-velvet rounded-xl border border-gothic-silver/20 overflow-hidden transition-all hover:border-[#383840]"
                  >
                    {/* Main card body */}
                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* File details */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className={`p-3 rounded-lg border bg-gothic-void ${
                          session.source === "Farlight" 
                            ? "border-cyan-900/30 text-cyan-400" 
                            : session.source === "DragonStats"
                            ? "border-gothic-silver/20 text-gothic-silver"
                            : "border-[#D4B26A]/30 text-[#D4B26A]"
                        }`}>
                          {session.source === "Farlight" ? <FileCode size={20} /> : <FileSpreadsheet size={20} />}
                        </div>

                        <div className="space-y-1 flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="bg-gothic-void border border-gothic-silver text-xs text-gothic-silver px-2 py-1 rounded outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (editingName.trim()) {
                                    onRenameSession(session.id, editingName.trim());
                                    setEditingSessionId(null);
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSessionId(null)}
                                className="px-2 py-1 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <h3 className="text-sm font-bold text-gothic-silver font-display flex items-center gap-1.5">
                              {session.filename}
                              <button
                                onClick={() => {
                                  setEditingSessionId(session.id);
                                  setEditingName(session.filename);
                                }}
                                className="text-gothic-rose/50 hover:text-gothic-silver transition-colors p-1"
                                title="Rename document"
                              >
                                <Plus size={12} className="rotate-45" />
                              </button>
                            </h3>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-gothic-rose/50">
                            <span>Imported: {new Date(session.importedAt).toLocaleDateString()}</span>
                            <span>By: {session.uploadedBy}</span>
                            <span className="flex items-center gap-1">
                              Source: 
                              <span className={`px-1 rounded text-[10px] ${
                                session.source === "Farlight" 
                                  ? "bg-cyan-950/40 text-cyan-400" 
                                  : session.source === "DragonStats"
                                  ? "bg-amber-950/40 text-gothic-silver"
                                  : "bg-[#D4B26A]/20 text-[#D4B26A]"
                              }`}>
                                {session.source}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status + Row Count + Actions */}
                      <div className="flex flex-wrap items-center gap-3 md:justify-end">
                        <div className="text-right hidden sm:block mr-2">
                          <span className="text-xs font-bold text-gothic-silver block">{sessionSnaps.length} Records</span>
                          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                            {session.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (isInspecting) {
                                setInspectedSessionId(null);
                              } else {
                                setInspectedSessionId(session.id);
                                setInspectSearchQuery("");
                              }
                            }}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isInspecting
                                ? "bg-gothic-silver/10 border-gothic-silver text-gothic-silver"
                                : "bg-gothic-ink border-gothic-silver/20 text-gothic-rose/50 hover:text-gothic-rose/90 hover:bg-gothic-ink/80"
                            }`}
                            title="Inspect Snapshot Records"
                          >
                            <ListFilter size={14} />
                          </button>

                          <button
                            onClick={() => handleExportSessionCSV(session)}
                            className="px-2.5 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 border border-gothic-silver/20 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            title="Export to CSV"
                          >
                            <FileSpreadsheet size={13} /> <span className="hidden lg:inline text-[10px]">CSV</span>
                          </button>

                          <button
                            onClick={() => handleExportSessionJSON(session)}
                            className="px-2.5 py-2 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 border border-gothic-silver/20 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            title="Export to JSON"
                          >
                            <FileText size={13} /> <span className="hidden lg:inline text-[10px]">JSON</span>
                          </button>

                          <button
                            onClick={() => {
                              if (isConfirming) {
                                setConfirmDeleteId(null);
                              } else {
                                setConfirmDeleteId(session.id);
                              }
                            }}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isConfirming
                                ? "bg-red-950/20 border-red-500/50 text-red-400"
                                : "bg-gothic-ink border-gothic-silver/20 text-gothic-rose/50 hover:text-red-400 hover:border-red-950/50 hover:bg-red-950/10"
                            }`}
                            title="Rollback Document Import"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Warnings panel */}
                    {session.warnings && session.warnings.length > 0 && (
                      <div className="px-5 pb-3 border-t border-gothic-silver/20/40 pt-2 bg-[#1c1c20]/20">
                        <div className="flex items-center gap-2 text-amber-500 text-[10px] font-mono">
                          <AlertTriangle size={12} />
                          <span>This document was imported with {session.warnings.length} warning(s):</span>
                        </div>
                        <ul className="mt-1 list-disc list-inside text-[9px] font-mono text-gothic-rose/90 space-y-0.5">
                          {session.warnings.slice(0, 3).map((w, idx) => (
                            <li key={idx} className="truncate">{w}</li>
                          ))}
                          {session.warnings.length > 3 && (
                            <li className="text-gothic-rose/50 list-none pl-3">and {session.warnings.length - 3} more warnings...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Confirmation Rollback Area */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-red-950/10 border-t border-red-900/30 p-4 space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-red-200 uppercase tracking-wide">Confirm Telemetry Rollback</h4>
                              <p className="text-[11px] text-red-300/80 leading-relaxed">
                                You are about to delete the virtual document <span className="font-mono text-white font-semibold">"{session.filename}"</span>. 
                                This action will permanently purge <span className="font-bold text-white">{sessionSnaps.length} snapshot records</span>. 
                                Any analytical roles, seasonal stats, and recommendations built exclusively on this telemetry slice will be re-evaluated.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 bg-gothic-ink hover:bg-gothic-ink/80 text-gothic-rose/90 rounded border border-gothic-silver/20 text-[10px] font-mono cursor-pointer"
                            >
                              Abort Rollback
                            </button>
                            <button
                              onClick={() => {
                                onDeleteSession(session.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] font-mono cursor-pointer"
                            >
                              Purge & Rollback Records
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inspection Grid Area */}
                    <AnimatePresence>
                      {isInspecting && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-gothic-void border-t border-gothic-silver/20 p-4 space-y-3 overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h4 className="text-xs font-bold text-gothic-silver tracking-wider uppercase font-display">
                              Snapshot Document Inspector
                            </h4>
                            <input
                              type="text"
                              placeholder="Filter records by name or Lord ID..."
                              value={inspectSearchQuery}
                              onChange={(e) => setInspectSearchQuery(e.target.value)}
                              className="px-2.5 py-1 bg-gothic-velvet border border-gothic-silver/20 text-[10px] font-mono text-gothic-silver rounded outline-none focus:border-gothic-silver w-full max-w-xs"
                            />
                          </div>

                          {/* Table of records */}
                          <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gothic-silver/20 rounded-lg">
                            <table className="w-full text-left border-collapse text-[11px] font-mono">
                              <thead>
                                <tr className="bg-gothic-velvet border-b border-gothic-silver/20 text-gothic-rose/50">
                                  <th className="p-2">Lord ID</th>
                                  <th className="p-2">Name</th>
                                  <th className="p-2 text-right">Power</th>
                                  <th className="p-2 text-right">Merits</th>
                                  <th className="p-2 text-right">Deaths</th>
                                  <th className="p-2 text-right">Healed</th>
                                  <th className="p-2 text-right">Donates</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sessionSnaps
                                  .filter((s) => 
                                    s.playerId.toLowerCase().includes(inspectSearchQuery.toLowerCase()) ||
                                    (s.playerName || "").toLowerCase().includes(inspectSearchQuery.toLowerCase())
                                  )
                                  .map((s) => (
                                    <tr key={s.id} className="border-b border-gothic-silver/20/40 hover:bg-gothic-velvet/40 text-gothic-rose/90">
                                      <td className="p-2 text-gothic-rose/50">{s.playerId}</td>
                                      <td className="p-2 font-semibold text-gothic-silver">{s.playerName}</td>
                                      <td className="p-2 text-right font-semibold text-gothic-silver">{s.currentPower.toLocaleString()}</td>
                                      <td className="p-2 text-right text-emerald-400">{s.merits.toLocaleString()}</td>
                                      <td className="p-2 text-right text-red-400">{(s.t4Deaths + s.t5Deaths).toLocaleString()}</td>
                                      <td className="p-2 text-right text-cyan-400">{s.healing.toLocaleString()}</td>
                                      <td className="p-2 text-right">{s.donations.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                {sessionSnaps.length === 0 && (
                                  <tr>
                                    <td colSpan={7} className="p-4 text-center text-gothic-rose/50">
                                      No snapshot records found in this document.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* Duplicate Date Double-Check Modal */}
      <AnimatePresence>
        {duplicateModalState && duplicateModalState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gothic-velvet border border-amber-500/40 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gothic-silver/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gothic-silver font-display uppercase tracking-wider">
                      Duplicate Telemetry Date Flagged
                    </h3>
                    <p className="text-xs text-gothic-rose/60 font-mono mt-0.5">
                      File: <span className="text-amber-300 font-bold">{duplicateModalState.filename}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDuplicateModalState(null)}
                  className="p-1 rounded text-gothic-rose/50 hover:text-gothic-silver hover:bg-gothic-void cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Warning Context Body */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-bold font-mono text-[11px] uppercase tracking-wide">
                      Target Upload Date
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-bold text-[11px]">
                      {duplicateModalState.date}
                    </span>
                  </div>
                  <p className="text-gothic-rose/80 text-[11px]">
                    The system detected that telemetry for date <strong className="text-amber-300">{duplicateModalState.date}</strong> already exists in your database or upload queue. Please choose how you want to handle this upload.
                  </p>
                </div>

                {/* Existing Session Match List */}
                {duplicateModalState.matchingSessions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-gothic-silver uppercase tracking-wider font-mono">
                      Existing Session(s) Recorded for this Date:
                    </p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {duplicateModalState.matchingSessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="p-2.5 bg-gothic-void border border-gothic-silver/20 rounded-lg flex items-center justify-between font-mono text-[11px]"
                        >
                          <div className="truncate max-w-[240px]">
                            <span className="font-bold text-gothic-silver block truncate">{sess.filename}</span>
                            <span className="text-gothic-rose/50 text-[10px]">Imported {new Date(sess.importedAt).toLocaleDateString()}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-gothic-ink border border-gothic-silver/20 rounded text-gothic-silver text-[10px] font-bold shrink-0">
                            {sess.rowCount} rows
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Adjustment Input */}
                <div className="p-3 bg-gothic-void border border-gothic-silver/20 rounded-lg space-y-2">
                  <label className="block text-[11px] font-bold text-gothic-silver font-mono uppercase tracking-wider">
                    Option A: Re-assign File to a Different Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={duplicateModalState.newDateValue}
                      onChange={(e) =>
                        setDuplicateModalState((prev) => (prev ? { ...prev, newDateValue: e.target.value } : null))
                      }
                      className="px-2.5 py-1.5 bg-gothic-velvet border border-gothic-silver/20 text-xs font-mono text-gothic-silver rounded outline-none focus:border-amber-400 w-full"
                    />
                    <button
                      onClick={() => {
                        if (duplicateModalState) {
                          handleDraftDateChange(duplicateModalState.draftId, duplicateModalState.newDateValue);
                          setDuplicateModalState(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                    >
                      Apply Date
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gothic-silver/20">
                <button
                  onClick={() => {
                    if (duplicateModalState) {
                      handleDeleteDraft(duplicateModalState.draftId);
                      setDuplicateModalState(null);
                    }
                  }}
                  className="w-full sm:w-auto px-3 py-2 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded text-xs font-mono font-semibold transition-all cursor-pointer text-center"
                >
                  Discard File
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {duplicateModalState.matchingSessions.length > 0 && (
                    <button
                      onClick={() => {
                        if (duplicateModalState && duplicateModalState.matchingSessions.length > 0) {
                          const oldSess = duplicateModalState.matchingSessions[0];
                          onDeleteSession(oldSess.id);
                          setDuplicateModalState(null);
                          alert(`Purged old session "${oldSess.filename}" for date ${duplicateModalState.date}.`);
                        }
                      }}
                      className="px-3 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      Overwrite Old Session
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDuplicateModalState(null);
                      handleBulkCommit(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs font-mono transition-all cursor-pointer shadow-md"
                  >
                    Proceed & Append
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Transactional Loading Overlay */}
      <CustomLoadingOverlay
        isOpen={isCommitLoading}
        progress={commitProgress}
        title="Committing Telemetry Records to Alliance Ledger"
        statusText="Encrypting & validating character snapshots..."
        subText="Dragon's Call Transactional Synchronizer"
        variant="dragonfire"
        steps={[
          { label: "Parse & Validate Character IDs", completed: commitProgress > 20, active: commitProgress <= 20 },
          { label: "Verify T4/T5 Casualties & Hospital Recovery", completed: commitProgress > 50, active: commitProgress > 20 && commitProgress <= 50 },
          { label: "Recalculate Merit Thresholds & Performance Tiers", completed: commitProgress > 80, active: commitProgress > 50 && commitProgress <= 80 },
          { label: "Commit Snapshot Session to Ledger Database", completed: commitProgress >= 100, active: commitProgress > 80 && commitProgress < 100 }
        ]}
      />

    </div>
  );
}
