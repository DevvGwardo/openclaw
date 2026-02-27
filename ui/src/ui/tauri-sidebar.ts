// Desktop sidebar navigation component.
// Renders TAB_GROUPS with icons and delegates tab changes to the shell.

import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { t } from "../i18n/index.ts";
import { icons } from "./icons.ts";
import { TAB_GROUPS, iconForTab, titleForTab, type Tab } from "./navigation.ts";
import type { ThemeMode } from "./theme.ts";

@customElement("tauri-sidebar")
export class TauriSidebar extends LitElement {
  @property({ type: String }) activeTab: Tab = "chat";
  @property({ type: Boolean }) collapsed = false;
  @property({ type: Boolean }) connected = false;
  @property({ type: String }) theme: ThemeMode = "system";
  @property({ type: String }) version = "";

  // No shadow DOM — styles come from tauri-sidebar.css loaded globally
  createRenderRoot() {
    return this;
  }

  // Arrow functions to avoid unbound-method lint errors in templates
  private _handleTabClick = (tab: Tab) => {
    this.dispatchEvent(
      new CustomEvent("tab-change", { detail: tab, bubbles: true, composed: true }),
    );
  };

  private _handleToggleCollapse = () => {
    this.dispatchEvent(new CustomEvent("toggle-collapse", { bubbles: true, composed: true }));
  };

  private _handleThemeToggle = () => {
    this.dispatchEvent(new CustomEvent("theme-toggle", { bubbles: true, composed: true }));
  };

  // Arrow up/down to navigate between nav items; wraps around at edges
  private _handleKeyDown = (event: KeyboardEvent) => {
    const items = Array.from(this.querySelectorAll<HTMLElement>(".tauri-sidebar__item"));
    const currentIndex = items.indexOf(event.target as HTMLElement);
    if (currentIndex === -1) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = items[currentIndex + 1] ?? items[0];
      next.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = items[currentIndex - 1] ?? items[items.length - 1];
      prev.focus();
    }
  };

  private _renderChevronIcon(collapsed: boolean) {
    // Chevron points left (collapse) or right (expand)
    return collapsed
      ? html`
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        `
      : html`
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        `;
  }

  private _renderThemeIcon(theme: ThemeMode) {
    if (theme === "dark") {
      // Moon icon → clicking cycles to light
      return html`
        <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      `;
    }
    if (theme === "light") {
      // Sun icon → clicking cycles to system
      return html`
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      `;
    }
    // System → half-circle
    return html`
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" fill="none" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
      </svg>
    `;
  }

  private _renderLogoIcon() {
    return html`
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sb-lobster" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff4d4d" />
            <stop offset="100%" stop-color="#991b1b" />
          </linearGradient>
        </defs>
        <path
          d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z"
          fill="url(#sb-lobster)"
        />
        <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#sb-lobster)" />
        <path
          d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"
          fill="url(#sb-lobster)"
        />
        <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round" />
        <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round" />
        <circle cx="45" cy="35" r="6" fill="#050810" />
        <circle cx="75" cy="35" r="6" fill="#050810" />
        <circle cx="46" cy="34" r="2.5" fill="#00e5cc" />
        <circle cx="76" cy="34" r="2.5" fill="#00e5cc" />
      </svg>
    `;
  }

  override render() {
    const collapsed = this.collapsed;
    return html`
      <div class="tauri-sidebar ${collapsed ? "tauri-sidebar--collapsed" : ""}">
        <!-- Header: logo + collapse toggle -->
        <div class="tauri-sidebar__header">
          <div class="tauri-sidebar__logo">
            <span class="tauri-sidebar__logo-icon">${this._renderLogoIcon()}</span>
            <span class="tauri-sidebar__logo-text">OpenClaw</span>
          </div>
          <button
            class="tauri-sidebar__toggle"
            title=${collapsed ? "Expand sidebar" : "Collapse sidebar"}
            @click=${this._handleToggleCollapse}
          >
            ${this._renderChevronIcon(collapsed)}
          </button>
        </div>

        <!-- Navigation groups -->
        <nav
          class="tauri-sidebar__nav"
          role="navigation"
          aria-label="Main navigation"
          @keydown=${this._handleKeyDown}
        >
          ${repeat(
            TAB_GROUPS,
            (group) => group.label,
            (group) => html`
              <div class="tauri-sidebar__group">
                <div class="tauri-sidebar__group-label">${t(`nav.${group.label}`)}</div>
                ${repeat(
                  group.tabs as readonly Tab[],
                  (tab) => tab,
                  (tab) => {
                    const active = this.activeTab === tab;
                    const label = titleForTab(tab);
                    return html`
                      <button
                        class="tauri-sidebar__item ${active ? "tauri-sidebar__item--active" : ""}"
                        title=${collapsed ? label : ""}
                        aria-label=${label}
                        aria-current=${active ? "page" : "false"}
                        tabindex="0"
                        role="tab"
                        @click=${() => this._handleTabClick(tab)}
                      >
                        <span class="tauri-sidebar__item-icon">${icons[iconForTab(tab)]}</span>
                        <span class="tauri-sidebar__item-label">${label}</span>
                      </button>
                    `;
                  },
                )}
              </div>
            `,
          )}
        </nav>

        <!-- Footer: theme toggle + version badge -->
        <div class="tauri-sidebar__footer">
          <div class="tauri-sidebar__footer-row">
            <button
              class="tauri-sidebar__theme-btn"
              title="Toggle theme (${this.theme})"
              @click=${this._handleThemeToggle}
            >
              ${this._renderThemeIcon(this.theme)}
              <span class="tauri-sidebar__theme-label">
                ${this.theme === "dark" ? "Dark" : this.theme === "light" ? "Light" : "System"}
              </span>
            </button>
            ${this.version ? html`<span class="tauri-sidebar__version">v${this.version}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tauri-sidebar": TauriSidebar;
  }
}
