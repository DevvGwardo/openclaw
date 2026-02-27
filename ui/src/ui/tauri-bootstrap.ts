/**
 * Resolve gateway URL from Tauri backend IPC.
 * Returns null if not in Tauri context or if IPC fails.
 */
export async function resolveGatewayUrlFromTauri(): Promise<string | null> {
  if (!window.__TAURI__) {
    return null;
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const url = await invoke<string>("get_gateway_url");
    return url?.trim() || null;
  } catch {
    return null;
  }
}
