// Tauri desktop shell — extends OpenClawApp to reuse all state/lifecycle.
// Overrides render() to compose: titlebar + sidebar + content area (from renderApp).
// The browser topbar/nav is CSS-hidden in [data-tauri] context; the sidebar handles navigation.

import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { renderApp } from "./app-render.ts";
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
        ?connected=${this.connected}
      ></tauri-titlebar>

      <div class="tauri-shell__body">
        <tauri-sidebar
          .activeTab=${this.tab}
          .collapsed=${this.settings.navCollapsed}
          .connected=${this.connected}
          .theme=${this.theme}
          .version=${version}
          @tab-change=${this._handleTabChange}
          @toggle-collapse=${this._handleToggleCollapse}
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
        </div>
        ${version ? html`<span>v${version}</span>` : ""}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tauri-shell": TauriShell;
  }
}
