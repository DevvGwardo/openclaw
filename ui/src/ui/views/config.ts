import { html, nothing } from "lit";
import type { ConfigUiHints } from "../types.ts";
import { hintForPath, humanize, schemaType, type JsonSchema } from "./config-form.shared.ts";
import { analyzeConfigSchema, renderConfigForm, SECTION_META } from "./config-form.ts";
import { getTagFilters, toggleTagFilter } from "./config-search.ts";

export type ConfigProps = {
  raw: string;
  originalRaw: string;
  valid: boolean | null;
  issues: unknown[];
  loading: boolean;
  saving: boolean;
  applying: boolean;
  updating: boolean;
  connected: boolean;
  schema: unknown;
  schemaLoading: boolean;
  uiHints: ConfigUiHints;
  formMode: "form" | "raw";
  formValue: Record<string, unknown> | null;
  originalValue: Record<string, unknown> | null;
  privacyMode: boolean;
  searchQuery: string;
  activeSection: string | null;
  activeSubsection: string | null;
  onRawChange: (next: string) => void;
  onFormModeChange: (mode: "form" | "raw") => void;
  onFormPatch: (path: Array<string | number>, value: unknown) => void;
  onSearchChange: (query: string) => void;
  onSectionChange: (section: string | null) => void;
  onSubsectionChange: (section: string | null) => void;
  onReload: () => void;
  onSave: () => void;
  onApply: () => void;
  onUpdate: () => void;
};

const TAG_SEARCH_PRESETS = [
  "security",
  "auth",
  "network",
  "access",
  "privacy",
  "observability",
  "performance",
  "reliability",
  "storage",
  "models",
  "media",
  "automation",
  "channels",
  "tools",
  "advanced",
] as const;

// SVG Icons (Lucide-style)
const configIcons = {
  all: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  `,
  env: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      ></path>
    </svg>
  `,
  update: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,
  agents: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
      ></path>
      <circle cx="8" cy="14" r="1"></circle>
      <circle cx="16" cy="14" r="1"></circle>
    </svg>
  `,
  auth: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `,
  channels: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `,
  messages: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  `,
  commands: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  `,
  hooks: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  `,
  skills: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      ></polygon>
    </svg>
  `,
  tools: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      ></path>
    </svg>
  `,
  gateway: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,
  wizard: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="M17.8 11.8 19 13"></path>
      <path d="M15 9h0"></path>
      <path d="M17.8 6.2 19 5"></path>
      <path d="m3 21 9-9"></path>
      <path d="M12.2 6.2 11 5"></path>
    </svg>
  `,
  meta: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  `,
  logging: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `,
  browser: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="21.17" y1="8" x2="12" y2="8"></line>
      <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
      <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
    </svg>
  `,
  ui: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  `,
  models: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      ></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `,
  bindings: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
      <line x1="6" y1="6" x2="6.01" y2="6"></line>
      <line x1="6" y1="18" x2="6.01" y2="18"></line>
    </svg>
  `,
  broadcast: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
      <circle cx="12" cy="12" r="2"></circle>
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
    </svg>
  `,
  audio: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>
  `,
  session: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  `,
  cron: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  `,
  web: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      ></path>
    </svg>
  `,
  discovery: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,
  canvasHost: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  `,
  talk: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  `,
  plugins: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v6"></path>
      <path d="m4.93 10.93 4.24 4.24"></path>
      <path d="M2 12h6"></path>
      <path d="m4.93 13.07 4.24-4.24"></path>
      <path d="M12 22v-6"></path>
      <path d="m19.07 13.07-4.24-4.24"></path>
      <path d="M22 12h-6"></path>
      <path d="m19.07 10.93-4.24 4.24"></path>
    </svg>
  `,
  default: html`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  `,
};

// Section definitions
const SECTIONS: Array<{ key: string; label: string }> = [
  { key: "env", label: "Environment" },
  { key: "update", label: "Updates" },
  { key: "agents", label: "Agents" },
  { key: "auth", label: "Authentication" },
  { key: "channels", label: "Channels" },
  { key: "messages", label: "Messages" },
  { key: "commands", label: "Commands" },
  { key: "hooks", label: "Hooks" },
  { key: "skills", label: "Skills" },
  { key: "tools", label: "Tools" },
  { key: "gateway", label: "Gateway" },
  { key: "wizard", label: "Setup Wizard" },
];

type SubsectionEntry = {
  key: string;
  label: string;
  description?: string;
  order: number;
};

const ALL_SUBSECTION = "__all__";

function getSectionIcon(key: string) {
  return configIcons[key as keyof typeof configIcons] ?? configIcons.default;
}

function resolveSectionMeta(
  key: string,
  schema?: JsonSchema,
): {
  label: string;
  description?: string;
} {
  const meta = SECTION_META[key];
  if (meta) {
    return meta;
  }
  return {
    label: schema?.title ?? humanize(key),
    description: schema?.description ?? "",
  };
}

function resolveSubsections(params: {
  key: string;
  schema: JsonSchema | undefined;
  uiHints: ConfigUiHints;
}): SubsectionEntry[] {
  const { key, schema, uiHints } = params;
  if (!schema || schemaType(schema) !== "object" || !schema.properties) {
    return [];
  }
  const entries = Object.entries(schema.properties).map(([subKey, node]) => {
    const hint = hintForPath([key, subKey], uiHints);
    const label = hint?.label ?? node.title ?? humanize(subKey);
    const description = hint?.help ?? node.description ?? "";
    const order = hint?.order ?? 50;
    return { key: subKey, label, description, order };
  });
  entries.sort((a, b) => (a.order !== b.order ? a.order - b.order : a.key.localeCompare(b.key)));
  return entries;
}

type DiffChangeType = "added" | "removed" | "modified";
type DiffEntry = { path: string; from: unknown; to: unknown; type: DiffChangeType };

function classifyChange(from: unknown, to: unknown): DiffChangeType {
  const fromEmpty = from == null;
  const toEmpty = to == null;
  if (fromEmpty && !toEmpty) {
    return "added";
  }
  if (!fromEmpty && toEmpty) {
    return "removed";
  }
  return "modified";
}

function computeDiff(
  original: Record<string, unknown> | null,
  current: Record<string, unknown> | null,
): DiffEntry[] {
  if (!original || !current) {
    return [];
  }
  const changes: DiffEntry[] = [];

  function compare(orig: unknown, curr: unknown, path: string) {
    if (orig === curr) {
      return;
    }
    if (typeof orig !== typeof curr) {
      changes.push({ path, from: orig, to: curr, type: classifyChange(orig, curr) });
      return;
    }
    if (typeof orig !== "object" || orig === null || curr === null) {
      if (orig !== curr) {
        changes.push({ path, from: orig, to: curr, type: classifyChange(orig, curr) });
      }
      return;
    }
    if (Array.isArray(orig) && Array.isArray(curr)) {
      if (JSON.stringify(orig) !== JSON.stringify(curr)) {
        changes.push({ path, from: orig, to: curr, type: classifyChange(orig, curr) });
      }
      return;
    }
    const origObj = orig as Record<string, unknown>;
    const currObj = curr as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(origObj), ...Object.keys(currObj)]);
    for (const key of allKeys) {
      compare(origObj[key], currObj[key], path ? `${path}.${key}` : key);
    }
  }

  compare(original, current, "");
  return changes;
}

function truncateValue(value: unknown, maxLen = 40): string {
  let str: string;
  try {
    const json = JSON.stringify(value);
    str = json ?? String(value);
  } catch {
    str = String(value);
  }
  if (str.length <= maxLen) {
    return str;
  }
  return str.slice(0, maxLen - 3) + "...";
}

function parsePath(path: string): Array<string | number> {
  if (!path) {
    return [];
  }
  return path.split(".").map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

function maybeMaskSensitiveValue(params: {
  value: unknown;
  path: string;
  uiHints: ConfigUiHints;
  privacyMode: boolean;
}): unknown {
  const { value, path, uiHints, privacyMode } = params;
  if (!privacyMode) {
    return value;
  }
  const hint = hintForPath(parsePath(path), uiHints);
  if (hint?.sensitive) {
    return "••••••••";
  }
  return value;
}

export function renderConfig(props: ConfigProps) {
  const validity = props.valid == null ? "unknown" : props.valid ? "valid" : "invalid";
  const analysis = analyzeConfigSchema(props.schema);
  const formUnsafe = analysis.schema ? analysis.unsupportedPaths.length > 0 : false;

  // Get available sections from schema
  const schemaProps = analysis.schema?.properties ?? {};
  const availableSections = SECTIONS.filter((s) => s.key in schemaProps);

  // Add any sections in schema but not in our list
  const knownKeys = new Set(SECTIONS.map((s) => s.key));
  const extraSections = Object.keys(schemaProps)
    .filter((k) => !knownKeys.has(k))
    .map((k) => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

  const allSections = [...availableSections, ...extraSections];

  const activeSectionSchema =
    props.activeSection && analysis.schema && schemaType(analysis.schema) === "object"
      ? analysis.schema.properties?.[props.activeSection]
      : undefined;
  const activeSectionMeta = props.activeSection
    ? resolveSectionMeta(props.activeSection, activeSectionSchema)
    : null;
  const subsections = props.activeSection
    ? resolveSubsections({
        key: props.activeSection,
        schema: activeSectionSchema,
        uiHints: props.uiHints,
      })
    : [];
  const allowSubnav =
    props.formMode === "form" && Boolean(props.activeSection) && subsections.length > 0;
  const isAllSubsection = props.activeSubsection === ALL_SUBSECTION;
  const effectiveSubsection = props.searchQuery
    ? null
    : isAllSubsection
      ? null
      : (props.activeSubsection ?? subsections[0]?.key ?? null);

  // Compute diff for showing changes (works for both form and raw modes)
  const diff = props.formMode === "form" ? computeDiff(props.originalValue, props.formValue) : [];
  const hasRawChanges = props.formMode === "raw" && props.raw !== props.originalRaw;
  const hasChanges = props.formMode === "form" ? diff.length > 0 : hasRawChanges;

  // Save/apply buttons require actual changes to be enabled.
  const canSaveForm = Boolean(props.formValue) && !props.loading && Boolean(analysis.schema);
  const canSave =
    props.connected &&
    !props.saving &&
    hasChanges &&
    (props.formMode === "raw" ? true : canSaveForm);
  const canApply =
    props.connected &&
    !props.applying &&
    !props.updating &&
    hasChanges &&
    (props.formMode === "raw" ? true : canSaveForm);
  const canUpdate = props.connected && !props.applying && !props.updating;

  const selectedTags = new Set(getTagFilters(props.searchQuery));

  return html`
    <div class="config-page">
      <!-- ===== TOP SEARCH BAR ===== -->
      <div class="config-topbar">
        <div class="config-topbar__search-wrap">
          <div class="config-topbar__search">
            <svg
              class="config-topbar__search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              class="config-topbar__search-input"
              placeholder="Search settings…"
              .value=${props.searchQuery
                .replace(/(^|\s)tag:[^\s]+/gi, " ")
                .replace(/\s+/g, " ")
                .trim()}
              @input=${(e: Event) => {
                // Combine new text with existing tag filters
                const newText = (e.target as HTMLInputElement).value;
                const tagPart = props.searchQuery.match(/((?:^|\s)tag:[^\s]+)+/gi)?.join(" ") ?? "";
                const combined = [newText.trim(), tagPart.trim()].filter(Boolean).join(" ");
                props.onSearchChange(combined);
              }}
            />
            <!-- Active tag chips inside search bar -->
            ${
              selectedTags.size > 0
                ? html`
                    <div class="config-topbar__active-tags">
                      ${Array.from(selectedTags).map(
                        (tag) => html`
                          <span class="config-topbar__tag-chip">
                            <span class="config-topbar__tag-chip-label">tag:${tag}</span>
                            <button
                              class="config-topbar__tag-chip-remove"
                              type="button"
                              aria-label="Remove tag filter: ${tag}"
                              @click=${() => {
                                props.onSearchChange(toggleTagFilter(props.searchQuery, tag));
                              }}
                            >×</button>
                          </span>
                        `,
                      )}
                    </div>
                  `
                : nothing
            }
            ${
              props.searchQuery
                ? html`
                    <button
                      class="config-topbar__search-clear"
                      type="button"
                      aria-label="Clear search"
                      @click=${() => props.onSearchChange("")}
                    >×</button>
                  `
                : nothing
            }
          </div>
          <!-- Suggested tag chips shown below search bar -->
          <div class="config-topbar__tag-presets" aria-label="Suggested tag filters">
            ${TAG_SEARCH_PRESETS.map((tag) => {
              const active = selectedTags.has(tag);
              return html`
                <button
                  type="button"
                  class="config-topbar__tag-preset ${active ? "active" : ""}"
                  aria-pressed=${active ? "true" : "false"}
                  @click=${() => {
                    props.onSearchChange(toggleTagFilter(props.searchQuery, tag));
                  }}
                >
                  ${tag}
                </button>
              `;
            })}
          </div>
        </div>

        <!-- Connection status + config path (right side of topbar) -->
        <div class="config-topbar__meta">
          <span
            class="config-topbar__validity pill pill--sm ${
              validity === "valid"
                ? "pill--ok"
                : validity === "invalid"
                  ? "pill--danger"
                  : "pill--neutral"
            }"
          >
            ${
              validity === "valid"
                ? html`
                    <span class="pill__dot pill__dot--ok"></span>Valid
                  `
                : validity === "invalid"
                  ? html`
                      <span class="pill__dot pill__dot--danger"></span>Invalid
                    `
                  : html`
                      <span class="pill__dot pill__dot--neutral"></span>
                    `
            }
          </span>
          <span class="config-topbar__path">~/.openclaw/openclaw.json</span>
        </div>
      </div>

      <!-- ===== SECTION TAB BAR ===== -->
      <nav class="config-tabs" aria-label="Config sections">
        <!-- Wide viewport: scrollable button tabs -->
        <div class="config-tabs__bar">
          <button
            class="config-tab ${props.activeSection === null ? "active" : ""}"
            @click=${() => props.onSectionChange(null)}
            aria-selected=${props.activeSection === null ? "true" : "false"}
            role="tab"
          >
            <span class="config-tab__icon">${configIcons.all}</span>
            <span class="config-tab__label">All</span>
          </button>
          ${allSections.map(
            (section) => html`
              <button
                class="config-tab ${props.activeSection === section.key ? "active" : ""}"
                @click=${() => props.onSectionChange(section.key)}
                aria-selected=${props.activeSection === section.key ? "true" : "false"}
                role="tab"
              >
                <span class="config-tab__icon">${getSectionIcon(section.key)}</span>
                <span class="config-tab__label">${section.label}</span>
              </button>
            `,
          )}
        </div>
        <!-- Narrow viewport: dropdown select -->
        <select
          class="config-tabs__select"
          aria-label="Select config section"
          @change=${(e: Event) => {
            const val = (e.target as HTMLSelectElement).value;
            props.onSectionChange(val === "" ? null : val);
          }}
        >
          <option value="" ?selected=${props.activeSection === null}>All Settings</option>
          ${allSections.map(
            (section) => html`
              <option value="${section.key}" ?selected=${props.activeSection === section.key}>
                ${section.label}
              </option>
            `,
          )}
        </select>
      </nav>

      <!-- ===== SUBSECTION NAV (secondary row, only when in a section) ===== -->
      ${
        allowSubnav
          ? html`
              <div class="config-subnav">
                <button
                  class="config-subnav__item ${effectiveSubsection === null ? "active" : ""}"
                  @click=${() => props.onSubsectionChange(ALL_SUBSECTION)}
                >
                  All
                </button>
                ${subsections.map(
                  (entry) => html`
                    <button
                      class="config-subnav__item ${
                        effectiveSubsection === entry.key ? "active" : ""
                      }"
                      title=${entry.description || entry.label}
                      @click=${() => props.onSubsectionChange(entry.key)}
                    >
                      ${entry.label}
                    </button>
                  `,
                )}
              </div>
            `
          : nothing
      }

      <!-- ===== ACTION BAR ===== -->
      <div class="config-actions">
        <div class="config-actions__left">
          <!-- Connection status -->
          <span class="config-status">
            <span
              class="config-status-dot ${
                props.connected ? "config-status-dot--connected" : "config-status-dot--disconnected"
              }"
            ></span>
            ${props.connected ? "Connected" : "Disconnected"}
          </span>
          <!-- Changes indicator -->
          ${
            hasChanges
              ? html`
                  <span class="config-changes-badge config-changes-badge--pulse">
                    ${
                      props.formMode === "raw"
                        ? "Unsaved changes"
                        : `${diff.length} change${diff.length !== 1 ? "s" : ""}`
                    }
                  </span>
                `
              : html`
                  <span class="config-saved-badge">✓ All saved</span>
                `
          }
        </div>
        <div class="config-actions__right">
          <!-- Form/Raw mode toggle (segmented control) -->
          <div class="config-mode-toggle" role="group" aria-label="Edit mode">
            <button
              class="config-mode-toggle__btn ${props.formMode === "form" ? "active" : ""}"
              ?disabled=${props.schemaLoading || !props.schema}
              @click=${() => props.onFormModeChange("form")}
            >
              Form
            </button>
            <button
              class="config-mode-toggle__btn ${props.formMode === "raw" ? "active" : ""}"
              @click=${() => props.onFormModeChange("raw")}
            >
              Raw
            </button>
          </div>
          <!-- Reload -->
          <button class="btn btn--sm" ?disabled=${props.loading} @click=${props.onReload}>
            ${props.loading ? "Loading…" : "Reload"}
          </button>
          <!-- Save + Apply grouped -->
          <div class="config-actions__btn-group">
            <button class="btn btn--sm primary" ?disabled=${!canSave} @click=${props.onSave}>
              ${props.saving ? "Saving…" : "Save"}
            </button>
            <button class="btn btn--sm" ?disabled=${!canApply} @click=${props.onApply}>
              ${props.applying ? "Applying…" : "Apply"}
            </button>
          </div>
          <!-- Update (less prominent) -->
          <button class="btn btn--sm btn--ghost" ?disabled=${!canUpdate} @click=${props.onUpdate}>
            ${props.updating ? "Updating…" : "Update"}
          </button>
        </div>
      </div>

      <!-- ===== SCROLLABLE MAIN CONTENT ===== -->
      <main class="config-main">
        <!-- Diff panel (form mode only) -->
        ${
          hasChanges && props.formMode === "form"
            ? html`
                <details class="config-diff">
                  <summary class="config-diff__summary">
                    <span>${(() => {
                      const added = diff.filter((d) => d.type === "added").length;
                      const removed = diff.filter((d) => d.type === "removed").length;
                      const modified = diff.filter((d) => d.type === "modified").length;
                      const parts: string[] = [];
                      if (added) {
                        parts.push(`${added} added`);
                      }
                      if (removed) {
                        parts.push(`${removed} removed`);
                      }
                      if (modified) {
                        parts.push(`${modified} modified`);
                      }
                      return `${diff.length} change${diff.length !== 1 ? "s" : ""} (${parts.join(", ")})`;
                    })()}</span>
                    <svg
                      class="config-diff__chevron"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </summary>
                  <div class="config-diff__content">
                    ${diff.map(
                      (change) => html`
                        <div class="config-diff__item config-diff__item--${change.type}">
                          <span class="config-diff__type-icon" aria-hidden="true">${
                            change.type === "added" ? "+" : change.type === "removed" ? "−" : "~"
                          }</span>
                          <div class="config-diff__body">
                            <div class="config-diff__path">${change.path}</div>
                            <div class="config-diff__values">
                              ${
                                change.type !== "added"
                                  ? html`<span class="config-diff__from"
                                      >${truncateValue(
                                        maybeMaskSensitiveValue({
                                          value: change.from,
                                          path: change.path,
                                          uiHints: props.uiHints,
                                          privacyMode: props.privacyMode,
                                        }),
                                      )}</span
                                    >
                                      <span class="config-diff__arrow">→</span>`
                                  : nothing
                              }
                              ${
                                change.type !== "removed"
                                  ? html`<span class="config-diff__to"
                                      >${truncateValue(
                                        maybeMaskSensitiveValue({
                                          value: change.to,
                                          path: change.path,
                                          uiHints: props.uiHints,
                                          privacyMode: props.privacyMode,
                                        }),
                                      )}</span
                                    >`
                                  : nothing
                              }
                            </div>
                          </div>
                        </div>
                      `,
                    )}
                  </div>
                </details>
              `
            : nothing
        }

        <!-- Section hero (active section in form mode) -->
        ${
          activeSectionMeta && props.formMode === "form"
            ? html`
                <div class="config-section-hero">
                  <div class="config-section-hero__icon">
                    ${getSectionIcon(props.activeSection ?? "")}
                  </div>
                  <div class="config-section-hero__text">
                    <div class="config-section-hero__title">${activeSectionMeta.label}</div>
                    ${
                      activeSectionMeta.description
                        ? html`<div class="config-section-hero__desc">
                            ${activeSectionMeta.description}
                          </div>`
                        : nothing
                    }
                  </div>
                </div>
              `
            : nothing
        }

        <!-- Form content -->
        <div class="config-content">
          ${
            props.formMode === "form" && !props.activeSection && !props.searchQuery
              ? html`
                  <div class="config-all-hero">
                    <div class="config-all-hero__icon-wrap">
                      ${configIcons.all}
                    </div>
                    <div class="config-all-hero__text">
                      <div class="config-all-hero__title">All Settings</div>
                      <div class="config-all-hero__subtitle">
                        ${allSections.length} section${allSections.length !== 1 ? "s" : ""} available
                      </div>
                    </div>
                  </div>
                `
              : nothing
          }
          ${
            props.formMode === "form"
              ? html`
                  ${
                    props.schemaLoading
                      ? html`
                          <div class="config-loading">
                            <div class="config-loading__spinner"></div>
                            <span>Loading settings schema…</span>
                          </div>
                        `
                      : !props.connected && !analysis.schema
                        ? html`
                            <div class="config-empty">
                              <div class="config-empty__icon">⚡</div>
                              <div class="config-empty__text">Connect to your gateway to edit settings</div>
                            </div>
                          `
                        : renderConfigForm({
                            schema: analysis.schema,
                            uiHints: props.uiHints,
                            value: props.formValue,
                            disabled: props.loading || !props.formValue,
                            unsupportedPaths: analysis.unsupportedPaths,
                            onPatch: props.onFormPatch,
                            forceSensitiveMask: props.privacyMode,
                            searchQuery: props.searchQuery,
                            activeSection: props.activeSection,
                            activeSubsection: effectiveSubsection,
                          })
                  }
                  ${
                    formUnsafe
                      ? html`
                          <div class="callout danger config-callout--spaced">
                            Form view can't safely edit some fields. Use Raw to avoid losing config entries.
                          </div>
                        `
                      : nothing
                  }
                `
              : html`
                  <div class="config-raw-editor">
                    <div class="config-raw-editor__header">
                      <span class="config-raw-editor__title">Raw JSON5</span>
                      <span class="config-raw-editor__badge">json5</span>
                      <button
                        class="config-raw-editor__copy"
                        type="button"
                        @click=${() => {
                          navigator.clipboard.writeText(props.raw).catch(() => {});
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <textarea
                      class="config-raw-editor__textarea ${props.privacyMode ? "config-raw-editor__textarea--masked" : ""}"
                      .value=${props.raw}
                      @input=${(e: Event) =>
                        props.onRawChange((e.target as HTMLTextAreaElement).value)}
                    ></textarea>
                    <div class="config-raw-editor__footer">
                      <span>${props.raw.split("\n").length} lines</span>
                      <span>${props.raw.length} chars</span>
                    </div>
                  </div>
                `
          }
        </div>

        ${
          props.issues.length > 0
            ? html`<div class="callout danger config-callout--spaced">
                <pre class="code-block">${JSON.stringify(props.issues, null, 2)}</pre>
              </div>`
            : nothing
        }
      </main>
    </div>
  `;
}
