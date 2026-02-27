import type { Tab } from "./navigation.ts";
import { TAB_PATHS } from "./navigation.ts";

function isValidTab(value: string): value is Tab {
  return Object.prototype.hasOwnProperty.call(TAB_PATHS, value);
}

/**
 * Parse a Tauri deep-link URL into a tab navigation target.
 * Handles both URL forms:
 *   openclaw://tab/<tabname>  — host="tab", tab from pathname first segment
 *   openclaw:///tab/<tabname> — host="",    tab from pathname /tab/<tabname>
 * Returns null for unknown tabs, wrong protocol, or malformed URLs.
 */
export function parseTauriDeepLink(url: string): { tab: Tab } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "openclaw:") {
    return null;
  }

  let tabName: string;
  if (parsed.host === "tab") {
    // openclaw://tab/<tabname>
    tabName = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (parsed.host === "" && parsed.pathname.startsWith("/tab/")) {
    // openclaw:///tab/<tabname>
    tabName = parsed.pathname.slice("/tab/".length).split("/")[0] ?? "";
  } else {
    return null;
  }

  if (!tabName || !isValidTab(tabName)) {
    return null;
  }
  return { tab: tabName };
}
