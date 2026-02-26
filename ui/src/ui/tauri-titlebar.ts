// Custom draggable titlebar for the Tauri desktop shell.
// Uses @tauri-apps/api/window for native window controls.

import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// Detect OS at module load time for correct button layout/styling.
const isWindows = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");

@customElement("tauri-titlebar")
export class TauriTitlebar extends LitElement {
  // Title shown in the center/left of the bar
  @property({ type: String }) title = "OpenClaw";
  // Optional breadcrumb: current tab name
  @property({ type: String, attribute: "current-tab" }) currentTab = "";
  // Whether the app is connected to the gateway
  @property({ type: Boolean }) connected = false;

  @state() private maximized = false;

  // No shadow DOM — styles come from tauri-titlebar.css loaded globally
  createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    void this._syncMaximized();
  }

  private async _syncMaximized() {
    if (!window.__TAURI__) {
      return;
    }
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const win = getCurrentWindow();
      this.maximized = await win.isMaximized();
      // Keep in sync when the user resizes
      void win.onResized(() => {
        void win.isMaximized().then((isMax: boolean) => {
          this.maximized = isMax;
        });
      });
    } catch {
      // Not in Tauri context
    }
  }

  // Arrow functions to avoid unbound-method lint errors
  private _minimize = async () => {
    if (!window.__TAURI__) {
      return;
    }
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().minimize();
  };

  private _toggleMaximize = async () => {
    if (!window.__TAURI__) {
      return;
    }
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    if (await win.isMaximized()) {
      await win.unmaximize();
    } else {
      await win.maximize();
    }
  };

  private _close = async () => {
    if (!window.__TAURI__) {
      return;
    }
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  };

  private _renderMacControls() {
    return html`
      <div class="tauri-titlebar__controls">
        <button
          class="tauri-titlebar__btn tauri-titlebar__btn--close"
          title="Close"
          @click=${this._close}
        ></button>
        <button
          class="tauri-titlebar__btn tauri-titlebar__btn--minimize"
          title="Minimize"
          @click=${this._minimize}
        ></button>
        <button
          class="tauri-titlebar__btn tauri-titlebar__btn--maximize"
          title=${this.maximized ? "Restore" : "Maximize"}
          @click=${this._toggleMaximize}
        ></button>
      </div>
    `;
  }

  private _renderWindowsControls() {
    return html`
      <div class="tauri-titlebar__controls">
        <button
          class="tauri-titlebar__btn tauri-titlebar__btn--minimize"
          title="Minimize"
          @click=${this._minimize}
        >
          &#x2212;
        </button>
        <button
          class="tauri-titlebar__btn tauri-titlebar__btn--maximize"
          title=${this.maximized ? "Restore" : "Maximize"}
          @click=${this._toggleMaximize}
        >
          ${
            this.maximized
              ? html`
                  &#x2752;
                `
              : html`
                  &#x2750;
                `
          }
        </button>
        <button
          class="tauri-titlebar__btn tauri-titlebar__btn--close"
          title="Close"
          @click=${this._close}
        >
          &#x2715;
        </button>
      </div>
    `;
  }

  override render() {
    const displayTitle = this.currentTab ? `${this.title} · ${this.currentTab}` : this.title;

    return html`
      <div class="tauri-titlebar ${isWindows ? "tauri-titlebar--windows" : ""}">
        ${!isWindows ? this._renderMacControls() : nothing}
        <div class="tauri-titlebar__title">${displayTitle}</div>
        ${isWindows ? this._renderWindowsControls() : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tauri-titlebar": TauriTitlebar;
  }
}
