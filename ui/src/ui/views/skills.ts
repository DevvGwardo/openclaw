import { html, nothing } from "lit";
import type { SkillMessageMap } from "../controllers/skills.ts";
import { clampText } from "../format.ts";
import type { SkillStatusEntry, SkillStatusReport } from "../types.ts";
import { groupSkills } from "./skills-grouping.ts";
import {
  computeSkillMissing,
  computeSkillReasons,
  renderSkillStatusChips,
} from "./skills-shared.ts";
import { surfaceHero, surfaceMain, surfacePage } from "./surface-page.ts";

export type SkillsProps = {
  loading: boolean;
  report: SkillStatusReport | null;
  error: string | null;
  filter: string;
  edits: Record<string, string>;
  busyKey: string | null;
  messages: SkillMessageMap;
  onFilterChange: (next: string) => void;
  onRefresh: () => void;
  onToggle: (skillKey: string, enabled: boolean) => void;
  onEdit: (skillKey: string, value: string) => void;
  onSaveKey: (skillKey: string) => void;
  onInstall: (skillKey: string, name: string, installId: string) => void;
};

export function renderSkills(props: SkillsProps) {
  const skills = props.report?.skills ?? [];
  const filter = props.filter.trim().toLowerCase();
  const filtered = filter
    ? skills.filter((skill) =>
        [skill.name, skill.description, skill.source].join(" ").toLowerCase().includes(filter),
      )
    : skills;
  const groups = groupSkills(filtered);

  return surfacePage("skills", {
    hero: surfaceHero({
      title: "Skills",
      subtitle: "Bundled, managed, and workspace skills.",
      stats: [
        { label: "Total", value: skills.length },
        { label: "Shown", value: filtered.length },
      ],
      actions: html`
        <button class="btn btn--pill primary" ?disabled=${props.loading} @click=${props.onRefresh}>
          ${props.loading ? "Loading…" : "Refresh"}
        </button>
      `,
    }),
    main: surfaceMain(html`
      <section class="card">
        <div class="filters">
          <label class="field field--flex">
            <span>Filter</span>
            <input
              .value=${props.filter}
              @input=${(e: Event) => props.onFilterChange((e.target as HTMLInputElement).value)}
              placeholder="Search skills"
            />
          </label>
          <div class="muted">${filtered.length} shown</div>
        </div>

        ${props.error ? html`<div class="callout danger mt-3">${props.error}</div>` : nothing}

        ${
          filtered.length === 0
            ? html`
                <div class="muted mt-4">No skills found.</div>
              `
            : html`
              <div class="agent-skills-groups">
                ${groups.map((group) => {
                  const collapsedByDefault = group.id === "workspace" || group.id === "built-in";
                  return html`
                    <details class="agent-skills-group" ?open=${!collapsedByDefault}>
                      <summary class="agent-skills-header">
                        <span>${group.label}</span>
                        <span class="muted">${group.skills.length}</span>
                      </summary>
                      <div class="list skills-grid">
                        ${group.skills.map((skill) => renderSkill(skill, props))}
                      </div>
                    </details>
                  `;
                })}
              </div>
            `
        }
      </section>
    `),
  });
}

function renderSkill(skill: SkillStatusEntry, props: SkillsProps) {
  const busy = props.busyKey === skill.skillKey;
  const apiKey = props.edits[skill.skillKey] ?? "";
  const message = props.messages[skill.skillKey] ?? null;
  const canInstall = skill.install.length > 0 && skill.missing.bins.length > 0;
  const showBundledBadge = Boolean(skill.bundled && skill.source !== "openclaw-bundled");
  const missing = computeSkillMissing(skill);
  const reasons = computeSkillReasons(skill);
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          ${skill.emoji ? `${skill.emoji} ` : ""}${skill.name}
        </div>
        <div class="list-sub">${clampText(skill.description, 140)}</div>
        ${renderSkillStatusChips({ skill, showBundledBadge })}
        ${
          missing.length > 0
            ? html`
              <div class="muted mt-1">
                Missing: ${missing.join(", ")}
              </div>
            `
            : nothing
        }
        ${
          reasons.length > 0
            ? html`
              <div class="muted mt-1">
                Reason: ${reasons.join(", ")}
              </div>
            `
            : nothing
        }
      </div>
      <div class="list-meta">
        <div class="row row--end row--wrap">
          <button
            class="btn"
            ?disabled=${busy}
            @click=${() => props.onToggle(skill.skillKey, skill.disabled)}
          >
            ${skill.disabled ? "Enable" : "Disable"}
          </button>
          ${
            canInstall
              ? html`<button
                class="btn"
                ?disabled=${busy}
                @click=${() => props.onInstall(skill.skillKey, skill.name, skill.install[0].id)}
              >
                ${busy ? "Installing…" : skill.install[0].label}
              </button>`
              : nothing
          }
        </div>
        ${
          message
            ? html`<div
              class="skill-message ${message.kind === "error" ? "skill-message--error" : "skill-message--ok"}"
            >
              ${message.message}
            </div>`
            : nothing
        }
        ${
          skill.primaryEnv
            ? html`
              <div class="field mt-3">
                <span>API key</span>
                <input
                  type="password"
                  .value=${apiKey}
                  @input=${(e: Event) =>
                    props.onEdit(skill.skillKey, (e.target as HTMLInputElement).value)}
                />
              </div>
              <button
                class="btn primary mt-2"
                ?disabled=${busy}
                @click=${() => props.onSaveKey(skill.skillKey)}
              >
                Save key
              </button>
            `
            : nothing
        }
      </div>
    </div>
  `;
}
