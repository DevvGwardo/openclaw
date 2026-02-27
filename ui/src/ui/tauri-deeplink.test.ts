import { describe, expect, it } from "vitest";
import { parseTauriDeepLink } from "./tauri-deeplink.ts";

describe("parseTauriDeepLink", () => {
  it("parses openclaw://tab/<tabname> form", () => {
    expect(parseTauriDeepLink("openclaw://tab/overview")).toEqual({ tab: "overview" });
    expect(parseTauriDeepLink("openclaw://tab/chat")).toEqual({ tab: "chat" });
  });

  it("parses openclaw:///tab/<tabname> form", () => {
    expect(parseTauriDeepLink("openclaw:///tab/overview")).toEqual({ tab: "overview" });
    expect(parseTauriDeepLink("openclaw:///tab/chat")).toEqual({ tab: "chat" });
  });

  it("returns null for unknown tab", () => {
    expect(parseTauriDeepLink("openclaw://tab/unknown")).toBeNull();
  });

  it("returns null for non-tab host", () => {
    expect(parseTauriDeepLink("openclaw://other/path")).toBeNull();
  });

  it("returns null for wrong protocol", () => {
    expect(parseTauriDeepLink("https://example.com")).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(parseTauriDeepLink("not a url")).toBeNull();
    expect(parseTauriDeepLink("")).toBeNull();
  });
});
