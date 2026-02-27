import { html, nothing } from "lit";
import type { ChannelAccountSnapshot } from "../types.ts";
import type { ChannelKey, ChannelsProps } from "./channels.types.ts";

export function shouldAutoExpand(params: {
  configured?: boolean;
  running?: boolean;
  connected?: boolean | null;
  lastError?: string | null;
}): boolean {
  return !!(params.configured || params.running || params.connected || params.lastError);
}

/** Generic "Probe" primary action used by all non-WhatsApp channels in the summary row. */
export function channelPrimaryAction(props: ChannelsProps) {
  return html`<button
    class="btn btn--xs"
    @click=${(e: Event) => {
      e.stopPropagation();
      props.onRefresh(true);
    }}
  >
    Probe
  </button>`;
}

export type ChannelStatusInfo = {
  dot: "ok" | "warn" | "error" | "off";
  badge: string;
  badgeVariant: "ok" | "warn" | "error" | "off";
};

/**
 * Derive status dot + badge from channel health fields.
 * Pass the channel-specific configured/running/connected/lastError values.
 */
export function deriveChannelStatus(params: {
  configured?: boolean;
  running?: boolean;
  connected?: boolean | null;
  lastError?: string | null;
}): ChannelStatusInfo {
  const { configured, running, connected, lastError } = params;

  if (lastError) {
    return { dot: "error", badge: "Error", badgeVariant: "error" };
  }
  if (!configured) {
    return { dot: "off", badge: "Offline", badgeVariant: "off" };
  }
  if (running) {
    // connected=null/undefined means the channel doesn't track connection state
    if (connected === false) {
      return { dot: "warn", badge: "Running", badgeVariant: "warn" };
    }
    return { dot: "ok", badge: "Running", badgeVariant: "ok" };
  }
  // configured but not running
  return { dot: "warn", badge: "Stopped", badgeVariant: "warn" };
}

export function channelEnabled(key: ChannelKey, props: ChannelsProps) {
  const snapshot = props.snapshot;
  const channels = snapshot?.channels as Record<string, unknown> | null;
  if (!snapshot || !channels) {
    return false;
  }
  const channelStatus = channels[key] as Record<string, unknown> | undefined;
  const configured = typeof channelStatus?.configured === "boolean" && channelStatus.configured;
  const running = typeof channelStatus?.running === "boolean" && channelStatus.running;
  const connected = typeof channelStatus?.connected === "boolean" && channelStatus.connected;
  const accounts = snapshot.channelAccounts?.[key] ?? [];
  const accountActive = accounts.some(
    (account) => account.configured || account.running || account.connected,
  );
  return configured || running || connected || accountActive;
}

export function getChannelAccountCount(
  key: ChannelKey,
  channelAccounts?: Record<string, ChannelAccountSnapshot[]> | null,
): number {
  return channelAccounts?.[key]?.length ?? 0;
}

export function renderChannelAccountCount(
  key: ChannelKey,
  channelAccounts?: Record<string, ChannelAccountSnapshot[]> | null,
) {
  const count = getChannelAccountCount(key, channelAccounts);
  if (count < 2) {
    return nothing;
  }
  return html`<div class="account-count">Accounts (${count})</div>`;
}
