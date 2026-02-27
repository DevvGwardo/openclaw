// Custom draggable titlebar for the Tauri desktop shell.
// Uses @tauri-apps/api/window for native window controls.

import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { renderLobsterLogo } from "./icons.ts";

// Detect OS at module load time for correct button layout/styling.
const isWindows = typeof navigator !== "undefined" && navigator.userAgent.includes("Windows");

// Access Tauri window API via the global __TAURI__ object (withGlobalTauri is enabled).
function getTauriWindow() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (window as any).__TAURI__;
  if (!t) {
    return null;
  }
  return t.window?.getCurrentWindow?.() ?? null;
}

@customElement("tauri-titlebar")
export class TauriTitlebar extends LitElement {
  // Title shown in the center/left of the bar
  @property({ type: String }) title = "OpenClaw";
  // Optional breadcrumb: current tab name
  @property({ type: String, attribute: "current-tab" }) currentTab = "";

  @state() private maximized = false;

  private _unlistenResize: (() => void) | null = null;
  private _resizeTimer: ReturnType<typeof setTimeout> | null = null;

  // No shadow DOM — styles come from tauri-titlebar.css loaded globally
  createRenderRoot() {
    return this;
  }

  // Drag via startDragging() IPC — must fire synchronously from mousedown.
  // Do NOT combine with data-tauri-drag-region / -webkit-app-region: drag
  // as WRY's native drag and the JS API conflict on macOS.
  private _dragHandler = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".tauri-titlebar__btn")) {
      return;
    }
    e.preventDefault();
    getTauriWindow()?.startDragging();
  };

  override connectedCallback() {
    super.connectedCallback();
    void this._syncMaximized();
    this.addEventListener("mousedown", this._dragHandler);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unlistenResize?.();
    this._unlistenResize = null;
    if (this._resizeTimer !== null) {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }
    this.removeEventListener("mousedown", this._dragHandler);
  }

  private async _syncMaximized() {
    const win = getTauriWindow();
    if (!win) {
      return;
    }
    try {
      this.maximized = await win.isMaximized();
      // Clean up any previous listener before registering a new one.
      this._unlistenResize?.();
      // Debounce: only check maximized state 200ms after resize stops,
      // and skip if the value hasn't changed. Without this, onResized fires
      // 60+ IPC calls/sec with a Lit re-render on every frame.
      this._unlistenResize = await win.onResized(() => {
        if (this._resizeTimer !== null) {
          clearTimeout(this._resizeTimer);
        }
        this._resizeTimer = setTimeout(async () => {
          this._resizeTimer = null;
          const isMax = await win.isMaximized();
          if (isMax !== this.maximized) {
            this.maximized = isMax;
          }
        }, 200);
      });
    } catch {
      // Not in Tauri context
    }
  }

  // Arrow functions to avoid unbound-method lint errors
  private _minimize = async () => {
    const win = getTauriWindow();
    if (!win) {
      return;
    }
    await win.minimize();
  };

  private _toggleMaximize = async () => {
    const win = getTauriWindow();
    if (!win) {
      return;
    }
    if (await win.isMaximized()) {
      await win.unmaximize();
    } else {
      await win.maximize();
    }
  };

  private _close = async () => {
    const win = getTauriWindow();
    if (!win) {
      return;
    }
    await win.close();
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

    const logo = renderLobsterLogo("tbl-grad", "tauri-titlebar__logo");

    return html`
      <div class="tauri-titlebar ${isWindows ? "tauri-titlebar--windows" : ""}">
        ${!isWindows ? this._renderMacControls() : nothing}
        <div class="tauri-titlebar__title">${logo}${displayTitle}</div>
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
