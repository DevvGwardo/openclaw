// Tauri desktop entrypoint — imports desktop-specific CSS and shell component.
// The browser build (src/main.ts) is NOT imported here, keeping the two entrypoints independent.

import "./styles/tauri.css";
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
      try {
        const parsed = new URL(url);
        // openclaw://tab/<tabname>
        if (parsed.protocol === "openclaw:" && parsed.pathname.startsWith("//tab/")) {
          const tab = parsed.pathname.replace("//tab/", "").split("/")[0];
          window.dispatchEvent(new CustomEvent("openclaw:navigate", { detail: { tab } }));
        }
      } catch {
        // ignore malformed URLs
      }
    }
  });

  // Quick-status tray event — navigate to overview tab.
  await tauriEvent.listen("tray:status", () => {
    window.dispatchEvent(new CustomEvent("openclaw:navigate", { detail: { tab: "overview" } }));
  });
}
