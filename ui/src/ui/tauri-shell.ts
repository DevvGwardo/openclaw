// Tauri desktop shell — extends OpenClawApp to reuse all state/lifecycle.
// Overrides render() to compose: titlebar + sidebar + content area (from renderApp).
// The browser topbar/nav is CSS-hidden in [data-tauri] context; the sidebar handles navigation.

import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { renderApp, renderAppOverlays } from "./app-render.ts";
import type { AppViewState } from "./app-view-state.ts";
import { OpenClawApp } from "./app.ts";
import { titleForTab, type Tab } from "./navigation.ts";
import "./tauri-sidebar.ts";
import "./tauri-titlebar.ts";

@customElement("tauri-shell")
export class TauriShell extends OpenClawApp {
  // No shadow DOM (inherits createRenderRoot from OpenClawApp)

  override connectedCallback() {
    super.connectedCallback();
    // Listen for deep-link navigation events from tauri-main.ts
    window.addEventListener("openclaw:navigate", this._onNavigate);
  }

  override disconnectedCallback() {
    window.removeEventListener("openclaw:navigate", this._onNavigate);
    super.disconnectedCallback();
  }

  private _onNavigate = (event: Event) => {
    const detail = (event as CustomEvent<{ tab?: string }>).detail;
    if (detail?.tab) {
      this.setTab(detail.tab as Tab);
    }
  };

  // Arrow functions to avoid unbound-method lint errors in templates
  private _handleTabChange = (event: Event) => {
    const tab = (event as CustomEvent<string>).detail;
    if (tab) {
      this.setTab(tab as Tab);
    }
  };

  private _handleToggleCollapse = () => {
    this.applySettings({
      ...this.settings,
      navCollapsed: !this.settings.navCollapsed,
    });
  };

  private _handleThemeToggle = () => {
    // Cycle: system → light → dark → system
    const next = this.theme === "system" ? "light" : this.theme === "light" ? "dark" : "system";
    this.setTheme(next);
  };

  private _handlePrivacyToggle = () => {
    this.applySettings({
      ...this.settings,
      privacyMode: !(this.settings.privacyMode ?? false),
    });
  };

  override render() {
    const version =
      (typeof this.hello?.server?.version === "string" && this.hello.server.version.trim()) || "";
    const currentTabTitle = titleForTab(this.tab);

    // renderApp provides all tab view content (including the browser topbar/nav,
    // which is hidden in Tauri context via CSS in tauri.css).
    const tabContent = renderApp(this as unknown as AppViewState);

    return html`
      <tauri-titlebar
        title="OpenClaw"
        current-tab=${currentTabTitle}
      ></tauri-titlebar>

      <div class="tauri-shell__body">
        <tauri-sidebar
          .activeTab=${this.tab}
          .collapsed=${this.settings.navCollapsed}
          .connected=${this.connected}
          .privacyMode=${this.settings.privacyMode ?? false}
          .theme=${this.theme}
          .version=${version}
          @tab-change=${this._handleTabChange}
          @toggle-collapse=${this._handleToggleCollapse}
          @privacy-toggle=${this._handlePrivacyToggle}
          @theme-toggle=${this._handleThemeToggle}
        ></tauri-sidebar>

        <div class="tauri-shell__content">
          ${tabContent}
        </div>
      </div>

      <div class="tauri-shell__footer">
        <div class="tauri-shell__footer-status">
          <span
            class="tauri-shell__footer-dot ${this.connected ? "tauri-shell__footer-dot--connected" : ""}"
          ></span>
          <span>${this.connected ? "Connected" : "Disconnected"}</span>
          <button
            class="tauri-shell__footer-btn ${this.settings.privacyMode ? "tauri-shell__footer-btn--active" : ""}"
            title="${this.settings.privacyMode ? "Privacy mode on" : "Privacy mode off"}"
            aria-label="Toggle privacy mode"
            aria-pressed="${this.settings.privacyMode ? "true" : "false"}"
            @click=${this._handlePrivacyToggle}
          >
            ${
              this.settings.privacyMode
                ? html`
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      width="14"
                      height="14"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  `
                : html`
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      width="14"
                      height="14"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  `
            }
          </button>
        </div>
        ${version ? html`<span>v${version}</span>` : ""}
      </div>

      ${renderAppOverlays(this as unknown as AppViewState)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tauri-shell": TauriShell;
  }
}
