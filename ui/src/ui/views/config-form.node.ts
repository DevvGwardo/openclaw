import { html, nothing, type TemplateResult } from "lit";
import type { ConfigUiHints } from "../types.ts";
import {
  defaultValue,
  hintForPath,
  humanize,
  pathKey,
  schemaType,
  type JsonSchema,
} from "./config-form.shared.ts";

const META_KEYS = new Set(["title", "description", "default", "nullable", "tags", "x-tags"]);

function isAnySchema(schema: JsonSchema): boolean {
  const keys = Object.keys(schema ?? {}).filter((key) => !META_KEYS.has(key));
  return keys.length === 0;
}

function jsonValue(value: unknown): string {
  if (value === undefined) {
    return "";
  }
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    return "";
  }
}

// SVG Icons as template literals
const icons = {
  chevronDown: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,
  plus: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,
  minus: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,
  trash: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `,
  edit: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `,
  // Eye icon for showing sensitive values
  eye: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `,
  // Eye-off icon for hiding sensitive values
  eyeOff: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      ></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `,
  // Undo/reset icon for resetting to default
  undo: html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 7v6h6"></path>
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
    </svg>
  `,
};

type FieldMeta = {
  label: string;
  help?: string;
  tags: string[];
};

export type ConfigSearchCriteria = {
  text: string;
  tags: string[];
};

function hasSearchCriteria(criteria: ConfigSearchCriteria | undefined): boolean {
  return Boolean(criteria && (criteria.text.length > 0 || criteria.tags.length > 0));
}

export function parseConfigSearchQuery(query: string): ConfigSearchCriteria {
  const tags: string[] = [];
  const seen = new Set<string>();
  const raw = query.trim();
  const stripped = raw.replace(/(^|\s)tag:([^\s]+)/gi, (_, leading: string, token: string) => {
    const normalized = token.trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      tags.push(normalized);
    }
    return leading;
  });
  return {
    text: stripped.trim().toLowerCase(),
    tags,
  };
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") {
      continue;
    }
    const tag = value.trim();
    if (!tag) {
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

function resolveFieldMeta(
  path: Array<string | number>,
  schema: JsonSchema,
  hints: ConfigUiHints,
): FieldMeta {
  const hint = hintForPath(path, hints);
  const label = hint?.label ?? schema.title ?? humanize(String(path.at(-1)));
  const help = hint?.help ?? schema.description;
  const schemaTags = normalizeTags(schema["x-tags"] ?? schema.tags);
  const hintTags = normalizeTags(hint?.tags);
  return {
    label,
    help,
    tags: hintTags.length > 0 ? hintTags : schemaTags,
  };
}

function matchesText(text: string, candidates: Array<string | undefined>): boolean {
  if (!text) {
    return true;
  }
  for (const candidate of candidates) {
    if (candidate && candidate.toLowerCase().includes(text)) {
      return true;
    }
  }
  return false;
}

function matchesTags(filterTags: string[], fieldTags: string[]): boolean {
  if (filterTags.length === 0) {
    return true;
  }
  const normalized = new Set(fieldTags.map((tag) => tag.toLowerCase()));
  return filterTags.every((tag) => normalized.has(tag));
}

function matchesNodeSelf(params: {
  schema: JsonSchema;
  path: Array<string | number>;
  hints: ConfigUiHints;
  criteria: ConfigSearchCriteria;
}): boolean {
  const { schema, path, hints, criteria } = params;
  if (!hasSearchCriteria(criteria)) {
    return true;
  }
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  if (!matchesTags(criteria.tags, tags)) {
    return false;
  }

  if (!criteria.text) {
    return true;
  }

  const pathLabel = path
    .filter((segment): segment is string => typeof segment === "string")
    .join(".");
  const enumText =
    schema.enum && schema.enum.length > 0
      ? schema.enum.map((value) => String(value)).join(" ")
      : "";

  return matchesText(criteria.text, [
    label,
    help,
    schema.title,
    schema.description,
    pathLabel,
    enumText,
  ]);
}

export function matchesNodeSearch(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  criteria: ConfigSearchCriteria;
}): boolean {
  const { schema, value, path, hints, criteria } = params;
  if (!hasSearchCriteria(criteria)) {
    return true;
  }
  if (matchesNodeSelf({ schema, path, hints, criteria })) {
    return true;
  }

  const type = schemaType(schema);
  if (type === "object") {
    const fallback = value ?? schema.default;
    const obj =
      fallback && typeof fallback === "object" && !Array.isArray(fallback)
        ? (fallback as Record<string, unknown>)
        : {};
    const props = schema.properties ?? {};
    for (const [propKey, node] of Object.entries(props)) {
      if (
        matchesNodeSearch({
          schema: node,
          value: obj[propKey],
          path: [...path, propKey],
          hints,
          criteria,
        })
      ) {
        return true;
      }
    }
    const additional = schema.additionalProperties;
    if (additional && typeof additional === "object") {
      const reserved = new Set(Object.keys(props));
      for (const [entryKey, entryValue] of Object.entries(obj)) {
        if (reserved.has(entryKey)) {
          continue;
        }
        if (
          matchesNodeSearch({
            schema: additional,
            value: entryValue,
            path: [...path, entryKey],
            hints,
            criteria,
          })
        ) {
          return true;
        }
      }
    }
    return false;
  }

  if (type === "array") {
    const itemsSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
    if (!itemsSchema) {
      return false;
    }
    const arr = Array.isArray(value) ? value : Array.isArray(schema.default) ? schema.default : [];
    if (arr.length === 0) {
      return false;
    }
    for (let idx = 0; idx < arr.length; idx += 1) {
      if (
        matchesNodeSearch({
          schema: itemsSchema,
          value: arr[idx],
          path: [...path, idx],
          hints,
          criteria,
        })
      ) {
        return true;
      }
    }
  }

  return false;
}

function renderTags(tags: string[]): TemplateResult | typeof nothing {
  if (tags.length === 0) {
    return nothing;
  }
  return html`
    <div class="cfg-tags">
      ${tags.map((tag) => html`<span class="cfg-tag">${tag}</span>`)}
    </div>
  `;
}

// Inline info icon for help text — 12px, muted, no external CSS needed
const helpInfoIcon = html`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    style="width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px; opacity: 0.55"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
`;

// Renders help text with an info icon prefix.
// For long descriptions (>120 chars), wraps in an expandable <details>.
function renderHelpText(help: string | undefined): TemplateResult | typeof nothing {
  if (!help) {
    return nothing;
  }

  const LONG_THRESHOLD = 120;
  if (help.length > LONG_THRESHOLD) {
    // Truncate at word boundary or character limit for the summary
    const truncated = help.slice(0, 80).replace(/\s+\S*$/, "") + "…";
    return html`
      <details style="margin:0;">
        <summary
          class="cfg-field__help"
          style="display:flex;align-items:flex-start;gap:5px;cursor:pointer;list-style:none;user-select:none;"
        >
          ${helpInfoIcon}
          <span>${truncated}</span>
          <span
            style="color:var(--color-accent,#4f8ef7);font-size:11px;white-space:nowrap;margin-left:auto;padding-left:8px;"
            >more</span
          >
        </summary>
        <div
          class="cfg-field__help"
          style="margin-top:4px;padding-left:17px;border-left:2px solid var(--color-border,rgba(255 255 255/.08));"
        >
          ${help}
        </div>
      </details>
    `;
  }

  return html`
    <div class="cfg-field__help" style="display:flex;align-items:flex-start;gap:5px;">
      ${helpInfoIcon}
      <span>${help}</span>
    </div>
  `;
}

// Group header for field groups within an object section
function renderGroupHeader(groupName: string): TemplateResult {
  return html`
    <div
      style="
        display:flex;
        align-items:center;
        gap:8px;
        padding:4px 0 6px;
        margin-top:6px;
        font-size:10px;
        font-weight:700;
        letter-spacing:0.08em;
        text-transform:uppercase;
        color:var(--color-text-muted,#888);
        border-bottom:1px solid var(--color-border,rgba(255 255 255/.08));
      "
    >
      ${groupName}
    </div>
  `;
}

export function renderNode(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  unsupported: Set<string>;
  disabled: boolean;
  showLabel?: boolean;
  searchCriteria?: ConfigSearchCriteria;
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult | typeof nothing {
  const { schema, value, path, hints, unsupported, disabled, onPatch } = params;
  const showLabel = params.showLabel ?? true;
  const type = schemaType(schema);
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  const key = pathKey(path);
  const criteria = params.searchCriteria;

  if (unsupported.has(key)) {
    return html`<div class="cfg-field cfg-field--error">
      <div class="cfg-field__label">${label}</div>
      <div class="cfg-field__error">Unsupported schema node. Use Raw mode.</div>
    </div>`;
  }
  if (
    criteria &&
    hasSearchCriteria(criteria) &&
    !matchesNodeSearch({ schema, value, path, hints, criteria })
  ) {
    return nothing;
  }

  // Handle anyOf/oneOf unions
  if (schema.anyOf || schema.oneOf) {
    const variants = schema.anyOf ?? schema.oneOf ?? [];
    const nonNull = variants.filter(
      (v) => !(v.type === "null" || (Array.isArray(v.type) && v.type.includes("null"))),
    );

    if (nonNull.length === 1) {
      return renderNode({ ...params, schema: nonNull[0] });
    }

    // Check if it's a set of literal values (enum-like)
    const extractLiteral = (v: JsonSchema): unknown => {
      if (v.const !== undefined) {
        return v.const;
      }
      if (v.enum && v.enum.length === 1) {
        return v.enum[0];
      }
      return undefined;
    };
    const literals = nonNull.map(extractLiteral);
    const allLiterals = literals.every((v) => v !== undefined);

    if (allLiterals && literals.length > 0 && literals.length <= 5) {
      // Use segmented control for small sets
      const resolvedValue = value ?? schema.default;
      return html`
        <div class="cfg-field">
          ${showLabel ? html`<label class="cfg-field__label">${label}</label>` : nothing}
          ${renderHelpText(help)}
          ${renderTags(tags)}
          <div class="cfg-segmented">
            ${literals.map(
              (lit) => html`
              <button
                type="button"
                class="cfg-segmented__btn ${
                  // oxlint-disable typescript/no-base-to-string
                  lit === resolvedValue || String(lit) === String(resolvedValue) ? "active" : ""
                }"
                ?disabled=${disabled}
                @click=${() => onPatch(path, lit)}
              >
                ${
                  // oxlint-disable typescript/no-base-to-string
                  String(lit)
                }
              </button>
            `,
            )}
          </div>
        </div>
      `;
    }

    if (allLiterals && literals.length > 5) {
      // Use dropdown for larger sets
      return renderSelect({ ...params, options: literals, value: value ?? schema.default });
    }

    // Handle mixed primitive types
    const primitiveTypes = new Set(nonNull.map((variant) => schemaType(variant)).filter(Boolean));
    const normalizedTypes = new Set(
      [...primitiveTypes].map((v) => (v === "integer" ? "number" : v)),
    );

    if ([...normalizedTypes].every((v) => ["string", "number", "boolean"].includes(v as string))) {
      const hasString = normalizedTypes.has("string");
      const hasNumber = normalizedTypes.has("number");
      const hasBoolean = normalizedTypes.has("boolean");

      if (hasBoolean && normalizedTypes.size === 1) {
        return renderNode({
          ...params,
          schema: { ...schema, type: "boolean", anyOf: undefined, oneOf: undefined },
        });
      }

      if (hasString || hasNumber) {
        return renderTextInput({
          ...params,
          inputType: hasNumber && !hasString ? "number" : "text",
        });
      }
    }
  }

  // Enum - use segmented for small, dropdown for large
  if (schema.enum) {
    const options = schema.enum;
    if (options.length <= 5) {
      const resolvedValue = value ?? schema.default;
      return html`
        <div class="cfg-field">
          ${showLabel ? html`<label class="cfg-field__label">${label}</label>` : nothing}
          ${renderHelpText(help)}
          ${renderTags(tags)}
          <div class="cfg-segmented">
            ${options.map(
              (opt) => html`
              <button
                type="button"
                class="cfg-segmented__btn ${opt === resolvedValue || String(opt) === String(resolvedValue) ? "active" : ""}"
                ?disabled=${disabled}
                @click=${() => onPatch(path, opt)}
              >
                ${String(opt)}
              </button>
            `,
            )}
          </div>
        </div>
      `;
    }
    return renderSelect({ ...params, options, value: value ?? schema.default });
  }

  // Object type - collapsible section
  if (type === "object") {
    return renderObject(params);
  }

  // Array type
  if (type === "array") {
    return renderArray(params);
  }

  // Boolean - toggle row
  if (type === "boolean") {
    const displayValue =
      typeof value === "boolean"
        ? value
        : typeof schema.default === "boolean"
          ? schema.default
          : false;
    return html`
      <label class="cfg-toggle-row ${disabled ? "disabled" : ""}">
        <div class="cfg-toggle-row__content">
          <span class="cfg-toggle-row__label">${label}</span>
          ${help ? html`<span class="cfg-toggle-row__help">${help}</span>` : nothing}
          ${renderTags(tags)}
        </div>
        <div class="cfg-toggle">
          <input
            type="checkbox"
            .checked=${displayValue}
            ?disabled=${disabled}
            @change=${(e: Event) => onPatch(path, (e.target as HTMLInputElement).checked)}
          />
          <span class="cfg-toggle__track"></span>
        </div>
      </label>
    `;
  }

  // Number/Integer
  if (type === "number" || type === "integer") {
    return renderNumberInput(params);
  }

  // String
  if (type === "string") {
    return renderTextInput({ ...params, inputType: "text" });
  }

  // Fallback
  return html`
    <div class="cfg-field cfg-field--error">
      <div class="cfg-field__label">${label}</div>
      <div class="cfg-field__error">Unsupported type: ${type}. Use Raw mode.</div>
    </div>
  `;
}

function renderTextInput(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  disabled: boolean;
  showLabel?: boolean;
  searchCriteria?: ConfigSearchCriteria;
  inputType: "text" | "number";
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult {
  const { schema, value, path, hints, disabled, onPatch, inputType } = params;
  const showLabel = params.showLabel ?? true;
  const hint = hintForPath(path, hints);
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  const isSensitive =
    (hint?.sensitive ?? false) && !/^\$\{[^}]*\}$/.test(String(value ?? "").trim());
  const placeholder =
    hint?.placeholder ??
    // oxlint-disable typescript/no-base-to-string
    (isSensitive
      ? "••••"
      : schema.default !== undefined
        ? `Default: ${String(schema.default)}`
        : "");
  const displayValue = value ?? "";

  // Handler to toggle sensitive field visibility
  const handleSensitiveToggle = (e: Event) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const wrap = btn.closest(".cfg-input-wrap") as HTMLElement;
    const input = wrap?.querySelector("input.cfg-input") as HTMLInputElement;
    const showEl = btn.querySelector("[data-eye='show']") as HTMLElement;
    const hideEl = btn.querySelector("[data-eye='hide']") as HTMLElement;
    if (!input) {
      return;
    }
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    if (showEl) {
      showEl.hidden = !isHidden;
    }
    if (hideEl) {
      hideEl.hidden = isHidden;
    }
    btn.title = isHidden ? "Hide value" : "Show value";
  };

  return html`
    <div class="cfg-field">
      ${showLabel ? html`<label class="cfg-field__label">${label}</label>` : nothing}
      ${renderHelpText(help)}
      ${renderTags(tags)}
      <div class="cfg-input-wrap">
        <input
          type=${isSensitive ? "password" : inputType}
          class="cfg-input"
          placeholder=${placeholder}
          .value=${displayValue == null ? "" : String(displayValue)}
          ?disabled=${disabled}
          @input=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value;
            if (inputType === "number") {
              if (raw.trim() === "") {
                onPatch(path, undefined);
                return;
              }
              const parsed = Number(raw);
              onPatch(path, Number.isNaN(parsed) ? raw : parsed);
              return;
            }
            onPatch(path, raw);
          }}
          @change=${(e: Event) => {
            if (inputType === "number") {
              return;
            }
            const raw = (e.target as HTMLInputElement).value;
            onPatch(path, raw.trim());
          }}
        />
        ${
          isSensitive
            ? html`
          <button
            type="button"
            class="cfg-input__reset"
            title="Show value"
            style="display:flex;align-items:center;justify-content:center;gap:0;padding:9px 10px;"
            ?disabled=${disabled}
            @click=${handleSensitiveToggle}
          >
            <span data-eye="show" style="display:flex;width:16px;height:16px;">${icons.eye}</span>
            <span data-eye="hide" hidden style="display:flex;width:16px;height:16px;">${icons.eyeOff}</span>
          </button>
        `
            : nothing
        }
        ${
          schema.default !== undefined
            ? html`
          <button
            type="button"
            class="cfg-input__reset"
            title="Reset to default: ${String(schema.default)}"
            style="display:flex;align-items:center;justify-content:center;gap:0;padding:9px 10px;"
            ?disabled=${disabled}
            @click=${() => onPatch(path, schema.default)}
          >
            <span style="display:flex;width:16px;height:16px;">${icons.undo}</span>
          </button>
        `
            : nothing
        }
      </div>
    </div>
  `;
}

function renderNumberInput(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  disabled: boolean;
  showLabel?: boolean;
  searchCriteria?: ConfigSearchCriteria;
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult {
  const { schema, value, path, hints, disabled, onPatch } = params;
  const showLabel = params.showLabel ?? true;
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  const displayValue = value ?? schema.default ?? "";
  const numValue = typeof displayValue === "number" ? displayValue : 0;
  const hasDefault = schema.default !== undefined;

  return html`
    <div class="cfg-field">
      ${showLabel ? html`<label class="cfg-field__label">${label}</label>` : nothing}
      ${renderHelpText(help)}
      ${renderTags(tags)}
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="cfg-number">
          <button
            type="button"
            class="cfg-number__btn"
            ?disabled=${disabled}
            @click=${() => onPatch(path, numValue - 1)}
          >−</button>
          <input
            type="number"
            class="cfg-number__input"
            .value=${displayValue == null ? "" : String(displayValue)}
            ?disabled=${disabled}
            @input=${(e: Event) => {
              const raw = (e.target as HTMLInputElement).value;
              const parsed = raw === "" ? undefined : Number(raw);
              onPatch(path, parsed);
            }}
          />
          <button
            type="button"
            class="cfg-number__btn"
            ?disabled=${disabled}
            @click=${() => onPatch(path, numValue + 1)}
          >+</button>
        </div>
        ${
          hasDefault
            ? html`
          <button
            type="button"
            class="cfg-input__reset"
            title="Reset to default: ${String(schema.default)}"
            style="display:flex;align-items:center;justify-content:center;gap:0;padding:9px 10px;"
            ?disabled=${disabled}
            @click=${() => onPatch(path, schema.default)}
          >
            <span style="display:flex;width:16px;height:16px;">${icons.undo}</span>
          </button>
        `
            : nothing
        }
      </div>
    </div>
  `;
}

function renderSelect(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  disabled: boolean;
  showLabel?: boolean;
  searchCriteria?: ConfigSearchCriteria;
  options: unknown[];
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult {
  const { schema, value, path, hints, disabled, options, onPatch } = params;
  const showLabel = params.showLabel ?? true;
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  const resolvedValue = value ?? schema.default;
  const currentIndex = options.findIndex(
    (opt) => opt === resolvedValue || String(opt) === String(resolvedValue),
  );
  const unset = "__unset__";

  return html`
    <div class="cfg-field">
      ${showLabel ? html`<label class="cfg-field__label">${label}</label>` : nothing}
      ${renderHelpText(help)}
      ${renderTags(tags)}
      <select
        class="cfg-select"
        ?disabled=${disabled}
        .value=${currentIndex >= 0 ? String(currentIndex) : unset}
        @change=${(e: Event) => {
          const val = (e.target as HTMLSelectElement).value;
          onPatch(path, val === unset ? undefined : options[Number(val)]);
        }}
      >
        <option value=${unset}>Select...</option>
        ${options.map(
          (opt, idx) => html`
          <option value=${String(idx)}>${String(opt)}</option>
        `,
        )}
      </select>
    </div>
  `;
}

function renderObject(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  unsupported: Set<string>;
  disabled: boolean;
  showLabel?: boolean;
  searchCriteria?: ConfigSearchCriteria;
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult {
  const { schema, value, path, hints, unsupported, disabled, onPatch, searchCriteria } = params;
  const showLabel = params.showLabel ?? true;
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  const selfMatched =
    searchCriteria && hasSearchCriteria(searchCriteria)
      ? matchesNodeSelf({ schema, path, hints, criteria: searchCriteria })
      : false;
  const childSearchCriteria = selfMatched ? undefined : searchCriteria;

  const fallback = value ?? schema.default;
  const obj =
    fallback && typeof fallback === "object" && !Array.isArray(fallback)
      ? (fallback as Record<string, unknown>)
      : {};
  const props = schema.properties ?? {};
  const entries = Object.entries(props);

  // Sort by hint order
  const sorted = entries.toSorted((a, b) => {
    const orderA = hintForPath([...path, a[0]], hints)?.order ?? 0;
    const orderB = hintForPath([...path, b[0]], hints)?.order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a[0].localeCompare(b[0]);
  });

  const reserved = new Set(Object.keys(props));
  const additional = schema.additionalProperties;
  const allowExtra = Boolean(additional) && typeof additional === "object";

  // Build field list with optional group headers between groups
  let _lastGroup: string | undefined;
  const fields = html`
    ${sorted.map(([propKey, node]) => {
      const groupLabel = hintForPath([...path, propKey], hints)?.group;
      const showHeader = groupLabel !== _lastGroup;
      if (showHeader) {
        _lastGroup = groupLabel;
      }
      const header = showHeader && groupLabel ? renderGroupHeader(groupLabel) : nothing;
      return html`${header}${renderNode({
        schema: node,
        value: obj[propKey],
        path: [...path, propKey],
        hints,
        unsupported,
        disabled,
        searchCriteria: childSearchCriteria,
        onPatch,
      })}`;
    })}
    ${
      allowExtra
        ? renderMapField({
            schema: additional,
            value: obj,
            path,
            hints,
            unsupported,
            disabled,
            reservedKeys: reserved,
            searchCriteria: childSearchCriteria,
            onPatch,
          })
        : nothing
    }
  `;

  // For top-level, don't wrap in collapsible
  if (path.length === 1) {
    return html`
      <div class="cfg-fields">
        ${fields}
      </div>
    `;
  }

  if (!showLabel) {
    return html`
      <div class="cfg-fields cfg-fields--inline">
        ${fields}
      </div>
    `;
  }

  // Nested objects get collapsible treatment
  return html`
    <details class="cfg-object" ?open=${path.length <= 2}>
      <summary class="cfg-object__header">
        <span class="cfg-object__title-wrap">
          <span class="cfg-object__title">${label}</span>
          ${renderTags(tags)}
        </span>
        <span class="cfg-object__chevron">${icons.chevronDown}</span>
      </summary>
      ${help ? html`<div class="cfg-object__help">${help}</div>` : nothing}
      <div class="cfg-object__content">
        ${fields}
      </div>
    </details>
  `;
}

function renderArray(params: {
  schema: JsonSchema;
  value: unknown;
  path: Array<string | number>;
  hints: ConfigUiHints;
  unsupported: Set<string>;
  disabled: boolean;
  showLabel?: boolean;
  searchCriteria?: ConfigSearchCriteria;
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult {
  const { schema, value, path, hints, unsupported, disabled, onPatch, searchCriteria } = params;
  const showLabel = params.showLabel ?? true;
  const { label, help, tags } = resolveFieldMeta(path, schema, hints);
  const selfMatched =
    searchCriteria && hasSearchCriteria(searchCriteria)
      ? matchesNodeSelf({ schema, path, hints, criteria: searchCriteria })
      : false;
  const childSearchCriteria = selfMatched ? undefined : searchCriteria;

  const itemsSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
  if (!itemsSchema) {
    return html`
      <div class="cfg-field cfg-field--error">
        <div class="cfg-field__label">${label}</div>
        <div class="cfg-field__error">Unsupported array schema. Use Raw mode.</div>
      </div>
    `;
  }

  const arr = Array.isArray(value) ? value : Array.isArray(schema.default) ? schema.default : [];

  return html`
    <div class="cfg-array">
      <div class="cfg-array__header">
        <div class="cfg-array__title">
          ${showLabel ? html`<span class="cfg-array__label">${label}</span>` : nothing}
          ${renderTags(tags)}
        </div>
        <span class="cfg-array__count">${arr.length} item${arr.length !== 1 ? "s" : ""}</span>
        <button
          type="button"
          class="cfg-array__add"
          ?disabled=${disabled}
          @click=${() => {
            const next = [...arr, defaultValue(itemsSchema)];
            onPatch(path, next);
          }}
        >
          <span class="cfg-array__add-icon">${icons.plus}</span>
          Add
        </button>
      </div>
      ${help ? html`<div class="cfg-array__help">${help}</div>` : nothing}

      ${
        arr.length === 0
          ? html`
              <div class="cfg-array__empty">No items yet. Click "Add" to create one.</div>
            `
          : html`
        <div class="cfg-array__items">
          ${arr.map(
            (item, idx) => html`
            <div class="cfg-array__item">
              <div class="cfg-array__item-header">
                <span class="cfg-array__item-index">#${idx + 1}</span>
                <button
                  type="button"
                  class="cfg-array__item-remove"
                  title="Remove item"
                  ?disabled=${disabled}
                  @click=${() => {
                    const next = [...arr];
                    next.splice(idx, 1);
                    onPatch(path, next);
                  }}
                >
                  ${icons.trash}
                </button>
              </div>
              <div class="cfg-array__item-content">
                ${renderNode({
                  schema: itemsSchema,
                  value: item,
                  path: [...path, idx],
                  hints,
                  unsupported,
                  disabled,
                  searchCriteria: childSearchCriteria,
                  showLabel: false,
                  onPatch,
                })}
              </div>
            </div>
          `,
          )}
        </div>
      `
      }
    </div>
  `;
}

function renderMapField(params: {
  schema: JsonSchema;
  value: Record<string, unknown>;
  path: Array<string | number>;
  hints: ConfigUiHints;
  unsupported: Set<string>;
  disabled: boolean;
  reservedKeys: Set<string>;
  searchCriteria?: ConfigSearchCriteria;
  onPatch: (path: Array<string | number>, value: unknown) => void;
}): TemplateResult {
  const {
    schema,
    value,
    path,
    hints,
    unsupported,
    disabled,
    reservedKeys,
    onPatch,
    searchCriteria,
  } = params;
  const anySchema = isAnySchema(schema);
  const entries = Object.entries(value ?? {}).filter(([key]) => !reservedKeys.has(key));
  const visibleEntries =
    searchCriteria && hasSearchCriteria(searchCriteria)
      ? entries.filter(([key, entryValue]) =>
          matchesNodeSearch({
            schema,
            value: entryValue,
            path: [...path, key],
            hints,
            criteria: searchCriteria,
          }),
        )
      : entries;

  return html`
    <div class="cfg-map">
      <div class="cfg-map__header">
        <span class="cfg-map__label">Custom entries</span>
        <button
          type="button"
          class="cfg-map__add"
          ?disabled=${disabled}
          @click=${() => {
            const next = { ...value };
            let index = 1;
            let key = `custom-${index}`;
            while (key in next) {
              index += 1;
              key = `custom-${index}`;
            }
            next[key] = anySchema ? {} : defaultValue(schema);
            onPatch(path, next);
          }}
        >
          <span class="cfg-map__add-icon">${icons.plus}</span>
          Add Entry
        </button>
      </div>

      ${
        visibleEntries.length === 0
          ? html`
              <div class="cfg-map__empty">No custom entries.</div>
            `
          : html`
        <div class="cfg-map__items">
          ${visibleEntries.map(([key, entryValue]) => {
            const valuePath = [...path, key];
            const fallback = jsonValue(entryValue);
            return html`
              <div class="cfg-map__item">
                <div class="cfg-map__item-header">
                  <div class="cfg-map__item-key">
                    <input
                      type="text"
                      class="cfg-input cfg-input--sm"
                      placeholder="Key"
                      .value=${key}
                      ?disabled=${disabled}
                      @change=${(e: Event) => {
                        const nextKey = (e.target as HTMLInputElement).value.trim();
                        if (!nextKey || nextKey === key) {
                          return;
                        }
                        const next = { ...value };
                        if (nextKey in next) {
                          return;
                        }
                        next[nextKey] = next[key];
                        delete next[key];
                        onPatch(path, next);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    class="cfg-map__item-remove"
                    title="Remove entry"
                    ?disabled=${disabled}
                    @click=${() => {
                      const next = { ...value };
                      delete next[key];
                      onPatch(path, next);
                    }}
                  >
                    ${icons.trash}
                  </button>
                </div>
                <div class="cfg-map__item-value">
                  ${
                    anySchema
                      ? html`
                        <textarea
                          class="cfg-textarea cfg-textarea--sm"
                          placeholder="JSON value"
                          rows="2"
                          .value=${fallback}
                          ?disabled=${disabled}
                          @change=${(e: Event) => {
                            const target = e.target as HTMLTextAreaElement;
                            const raw = target.value.trim();
                            if (!raw) {
                              onPatch(valuePath, undefined);
                              return;
                            }
                            try {
                              onPatch(valuePath, JSON.parse(raw));
                            } catch {
                              target.value = fallback;
                            }
                          }}
                        ></textarea>
                      `
                      : renderNode({
                          schema,
                          value: entryValue,
                          path: valuePath,
                          hints,
                          unsupported,
                          disabled,
                          searchCriteria,
                          showLabel: false,
                          onPatch,
                        })
                  }
                </div>
              </div>
            `;
          })}
        </div>
      `
      }
    </div>
  `;
}
