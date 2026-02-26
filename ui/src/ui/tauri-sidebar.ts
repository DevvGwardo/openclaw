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
      <svg
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="none"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
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
        <nav class="tauri-sidebar__nav" role="navigation" aria-label="Main navigation">
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
                    return html`
                      <button
                        class="tauri-sidebar__item ${active ? "tauri-sidebar__item--active" : ""}"
                        title=${titleForTab(tab)}
                        aria-current=${active ? "page" : "false"}
                        @click=${() => this._handleTabClick(tab)}
                      >
                        <span class="tauri-sidebar__item-icon">${icons[iconForTab(tab)]}</span>
                        <span class="tauri-sidebar__item-label">${titleForTab(tab)}</span>
                      </button>
                    `;
                  },
                )}
              </div>
            `,
          )}
        </nav>

        <!-- Footer: connection status + theme toggle -->
        <div class="tauri-sidebar__footer">
          <span
            class="tauri-sidebar__status-dot ${this.connected ? "tauri-sidebar__status-dot--connected" : ""}"
            title=${this.connected ? "Connected to gateway" : "Disconnected"}
          ></span>
          <span class="tauri-sidebar__status-label">
            ${this.connected ? "Connected" : "Disconnected"}
          </span>
          <button
            class="tauri-sidebar__theme-btn"
            title="Toggle theme"
            @click=${this._handleThemeToggle}
          >
            ${this._renderThemeIcon(this.theme)}
          </button>
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
