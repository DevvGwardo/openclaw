import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { resolveGatewayUrlFromTauri } from "./tauri-bootstrap.ts";

describe("resolveGatewayUrlFromTauri", () => {
  afterEach(() => {
    delete (window as unknown as { __TAURI__?: unknown }).__TAURI__;
    vi.resetAllMocks();
  });

  it("returns null when __TAURI__ is undefined", async () => {
    const result = await resolveGatewayUrlFromTauri();
    expect(result).toBeNull();
  });

  it("returns null when invoke throws", async () => {
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {};
    vi.mocked(invoke).mockRejectedValue(new Error("IPC error"));
    const result = await resolveGatewayUrlFromTauri();
    expect(result).toBeNull();
  });

  it("returns URL string when invoke succeeds", async () => {
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {};
    vi.mocked(invoke).mockResolvedValue("ws://localhost:18789");
    const result = await resolveGatewayUrlFromTauri();
    expect(result).toBe("ws://localhost:18789");
  });

  it("returns null when invoke returns empty string", async () => {
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {};
    vi.mocked(invoke).mockResolvedValue("");
    const result = await resolveGatewayUrlFromTauri();
    expect(result).toBeNull();
  });
});
