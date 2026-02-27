// Custom draggable titlebar for the Tauri desktop shell.
// Uses @tauri-apps/api/window for native window controls.

import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

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

    const logo = html`
      <svg
        class="tauri-titlebar__logo"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tbl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff4d4d" />
            <stop offset="100%" stop-color="#991b1b" />
          </linearGradient>
        </defs>
        <path
          d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z"
          fill="url(#tbl-grad)"
        />
        <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#tbl-grad)" />
        <path
          d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z"
          fill="url(#tbl-grad)"
        />
        <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round" />
        <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" stroke-width="3" stroke-linecap="round" />
        <circle cx="45" cy="35" r="6" fill="#050810" />
        <circle cx="75" cy="35" r="6" fill="#050810" />
        <circle cx="46" cy="34" r="2.5" fill="#00e5cc" />
        <circle cx="76" cy="34" r="2.5" fill="#00e5cc" />
      </svg>
    `;

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
