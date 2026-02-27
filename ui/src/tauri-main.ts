// Tauri desktop entrypoint — imports desktop-specific CSS and shell component.
// The browser build (src/main.ts) is NOT imported here, keeping the two entrypoints independent.

import { parseTauriDeepLink } from "./ui/tauri-deeplink.ts";
// Base UI styles (shared with browser build)
import "./styles.css";
// Tauri desktop shell overrides (must come after base for CSS specificity)
import "./styles/tauri.css";
import "./styles/tauri-titlebar.css";
import "./styles/tauri-sidebar.css";
import "./ui/tauri-shell.ts";

// Configure Tauri-specific behaviour once the Tauri bridge is ready.
// window.__TAURI__ is injected by Tauri when withGlobalTauri = true.
declare global {
  interface Window {
    __TAURI__?: unknown;
    __OPENCLAW_CONTROL_UI_BASE_PATH__?: string;
  }
}

if (window.__TAURI__) {
  // Disable browser context menu in the desktop shell.
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  // Wire Tauri deep-link events to the shell's tab navigation.
  // The shell listens for the custom "openclaw:navigate" event.
  const tauriEvent = await import("@tauri-apps/api/event");
  await tauriEvent.listen("deep-link", (event: { payload: string[] }) => {
    const urls = event.payload;
    for (const url of urls) {
      const result = parseTauriDeepLink(url);
      if (result) {
        window.dispatchEvent(new CustomEvent("openclaw:navigate", { detail: { tab: result.tab } }));
      }
    }
  });

  // Quick-status tray event — navigate to overview tab.
  await tauriEvent.listen("tray:status", () => {
    window.dispatchEvent(new CustomEvent("openclaw:navigate", { detail: { tab: "overview" } }));
  });
}
