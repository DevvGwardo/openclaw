/**
 * surface-page.ts — Shared page scaffold helpers for Control UI tabs.
 *
 * Provides reusable render helpers that produce the standardised 4-block
 * page structure used across all major tabs:
 *
 *   <div class="surface-page surface-page--{tab}">
 *     <section class="surface-hero">…</section>
 *     <section class="surface-kpis">…</section>
 *     <section class="surface-main">…</section>
 *     <section class="surface-actions">…</section>
 *   </div>
 *
 * Tabs import these helpers and pass their own content into each slot.
 * CSS lives in ui/src/styles/components.css (surface-* classes).
 */

import { html, nothing, type TemplateResult } from "lit";

// ── Types ──────────────────────────────────────────────────────────────────

/** A single labelled stat shown in the hero strip. */
export type SurfaceHeroStat = {
  label: string;
  value: string | number | TemplateResult;
};

/** Status dot variant shown at the left side of the hero strip. */
export type SurfaceHeroStatus = {
  label: string;
  /** true = ok (green pulsing dot), false = offline (amber dot) */
  ok: boolean;
};

/** Options for surfaceHero(). */
export type SurfaceHeroOptions = {
  /** Optional status indicator on the left. */
  status?: SurfaceHeroStatus;
  /** Optional title text (shown when no status dot is used). */
  title?: string;
  /** Optional subtitle / secondary text below title. */
  subtitle?: string;
  /** Right-side stats row — up to 4 items separated by dividers. */
  stats?: SurfaceHeroStat[];
  /** Extra content rendered at the right edge (e.g. a refresh button). */
  actions?: TemplateResult;
};

/** Icon colour palette for KPI cards, matching overview-dash-card colours. */
export type SurfaceKpiIconColor = "teal" | "blue" | "amber" | "green" | "red" | "purple";

/** A single KPI card displayed in the surface-kpis section. */
export type SurfaceKpiCard = {
  /** SVG icon template (24×24 viewBox recommended). */
  icon?: TemplateResult;
  iconColor?: SurfaceKpiIconColor;
  value: string | number | TemplateResult;
  label: string;
  /** Optional secondary line below label. */
  sub?: string;
  /** Stagger delay index (0–3) — controls animation-delay. */
  index?: number;
};

/** A single action pill in the surface-actions section. */
export type SurfaceActionPill = {
  label: string;
  /** Emoji / text icon placed before the label. */
  icon?: string;
  /** Internal hash href (e.g. "#/channels"). Mutually exclusive with onClick. */
  href?: string;
  /** Click handler for non-link pills. */
  onClick?: (e: Event) => void;
};

/** Slot content for surfacePage(). */
export type SurfacePageSlots = {
  hero: TemplateResult | typeof nothing;
  kpis?: TemplateResult | typeof nothing;
  main: TemplateResult | typeof nothing;
  actions?: TemplateResult | typeof nothing;
};

// ── Primitive helpers ──────────────────────────────────────────────────────

/**
 * Renders a single stat item for the hero strip.
 * Used internally by surfaceHero() and available for custom hero layouts.
 */
export function surfaceHeroStat(stat: SurfaceHeroStat): TemplateResult {
  return html`
    <div class="surface-hero__stat">
      <span class="surface-hero__stat-label">${stat.label}</span>
      <span class="surface-hero__stat-value">${stat.value}</span>
    </div>
  `;
}

/**
 * Renders a vertical divider between hero stats.
 */
export function surfaceHeroDivider(): TemplateResult {
  return html`
    <div class="surface-hero__divider"></div>
  `;
}

/**
 * Renders a single KPI card for the surface-kpis grid.
 */
export function surfaceKpiCard(card: SurfaceKpiCard): TemplateResult {
  const delay = (card.index ?? 0) * 50 + 100;
  return html`
    <div class="surface-kpi-card" style="animation-delay: ${delay}ms;">
      ${
        card.icon
          ? html`
            <div class="surface-kpi-card__icon surface-kpi-card__icon--${card.iconColor ?? "teal"}">
              ${card.icon}
            </div>
          `
          : nothing
      }
      <div class="surface-kpi-card__content">
        <div class="surface-kpi-card__value">${card.value}</div>
        <div class="surface-kpi-card__label">${card.label}</div>
        ${card.sub ? html`<div class="surface-kpi-card__sub">${card.sub}</div>` : nothing}
      </div>
    </div>
  `;
}

/**
 * Renders a single action pill.
 */
export function surfaceActionPill(pill: SurfaceActionPill): TemplateResult {
  const icon = pill.icon
    ? html`<span class="surface-action-pill__icon">${pill.icon}</span>`
    : nothing;

  if (pill.href) {
    return html`
      <a class="surface-action-pill" href="${pill.href}">
        ${icon}${pill.label}
      </a>
    `;
  }
  return html`
    <button class="surface-action-pill" @click=${pill.onClick}>
      ${icon}${pill.label}
    </button>
  `;
}

// ── Section helpers ────────────────────────────────────────────────────────

/**
 * Renders the full-width hero status strip.
 *
 * If opts.status is provided, a status dot + label is rendered on the left.
 * If opts.title is provided (and no status), the title is rendered instead.
 * Stats are rendered on the right, separated by dividers.
 */
export function surfaceHero(opts: SurfaceHeroOptions): TemplateResult {
  const left = opts.status
    ? html`
        <div class="surface-hero__status">
          <span
            class="surface-hero__dot surface-hero__dot--${opts.status.ok ? "ok" : "offline"}"
          ></span>
          <span class="surface-hero__label">${opts.status.label}</span>
          ${opts.subtitle ? html`<span class="surface-hero__sub">${opts.subtitle}</span>` : nothing}
        </div>
      `
    : opts.title || opts.subtitle
      ? html`
        <div class="surface-hero__title-block">
          ${opts.title ? html`<div class="surface-hero__title">${opts.title}</div>` : nothing}
          ${opts.subtitle ? html`<div class="surface-hero__sub">${opts.subtitle}</div>` : nothing}
        </div>
      `
      : nothing;

  const statsRow =
    opts.stats && opts.stats.length > 0
      ? html`
          <div class="surface-hero__stats">
            ${opts.stats.map((s, i) =>
              i === 0 ? surfaceHeroStat(s) : html`${surfaceHeroDivider()}${surfaceHeroStat(s)}`,
            )}
          </div>
        `
      : nothing;

  return html`
    <section class="surface-hero">
      ${left}
      <div class="surface-hero__right">
        ${statsRow}
        ${opts.actions ?? nothing}
      </div>
    </section>
  `;
}

/**
 * Renders the compact KPI card row.
 * Accepts an array of SurfaceKpiCard descriptors or a pre-rendered TemplateResult.
 */
export function surfaceKpis(cards: SurfaceKpiCard[] | TemplateResult): TemplateResult {
  const content = Array.isArray(cards)
    ? cards.map((c, i) => surfaceKpiCard({ ...c, index: i }))
    : cards;
  return html`<section class="surface-kpis">${content}</section>`;
}

/**
 * Renders the primary content region — the tab's main controls and data.
 */
export function surfaceMain(content: TemplateResult | typeof nothing): TemplateResult {
  return html`<section class="surface-main">${content}</section>`;
}

/**
 * Renders the quick-action pill row.
 * Accepts an array of SurfaceActionPill descriptors or a pre-rendered TemplateResult.
 */
export function surfaceActions(pills: SurfaceActionPill[] | TemplateResult): TemplateResult {
  const content = Array.isArray(pills) ? pills.map(surfaceActionPill) : pills;
  return html`<section class="surface-actions">${content}</section>`;
}

// ── Full page scaffold ─────────────────────────────────────────────────────

/**
 * Wraps pre-rendered section slots in the standard surface-page container.
 *
 * @param tab   Tab identifier used as the BEM modifier (e.g. "channels").
 * @param slots Pre-rendered section content. `hero` and `main` are required.
 *
 * @example
 * ```ts
 * return surfacePage("instances", {
 *   hero: surfaceHero({ status: { label: "Online", ok: true }, stats: [...] }),
 *   kpis: surfaceKpis([...]),
 *   main: html`<div>...</div>`,
 *   actions: surfaceActions([{ label: "Refresh", icon: "↻", onClick: props.onRefresh }]),
 * });
 * ```
 */
export function surfacePage(tab: string, slots: SurfacePageSlots): TemplateResult {
  return html`
    <div class="surface-page surface-page--${tab}">
      ${slots.hero}
      ${slots.kpis ?? nothing}
      ${slots.main}
      ${slots.actions ?? nothing}
    </div>
  `;
}
