import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type {
  ChannelAccountSnapshot,
  ChannelUiMetaEntry,
  ChannelsStatusSnapshot,
  DiscordStatus,
  GoogleChatStatus,
  IMessageStatus,
  NostrProfile,
  NostrStatus,
  SignalStatus,
  SlackStatus,
  TelegramStatus,
  WhatsAppStatus,
} from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { renderDiscordBody } from "./channels.discord.ts";
import { renderGoogleChatBody } from "./channels.googlechat.ts";
import { renderIMessageBody } from "./channels.imessage.ts";
import { renderNostrBody } from "./channels.nostr.ts";
import {
  channelEnabled,
  deriveChannelStatus,
  getChannelIcon,
  renderChannelAccountCount,
  shouldAutoExpand,
} from "./channels.shared.ts";
import { renderSignalBody } from "./channels.signal.ts";
import { renderSlackBody } from "./channels.slack.ts";
import { renderTelegramBody } from "./channels.telegram.ts";
import type { ChannelKey, ChannelsChannelData, ChannelsProps } from "./channels.types.ts";
import { renderWhatsAppBody, whatsappPrimaryAction } from "./channels.whatsapp.ts";
import { surfaceMain, surfacePage } from "./surface-page.ts";

export function renderChannels(props: ChannelsProps) {
  const channels = props.snapshot?.channels as Record<string, unknown> | null;
  const whatsapp = (channels?.whatsapp ?? undefined) as WhatsAppStatus | undefined;
  const telegram = (channels?.telegram ?? undefined) as TelegramStatus | undefined;
  const discord = (channels?.discord ?? null) as DiscordStatus | null;
  const googlechat = (channels?.googlechat ?? null) as GoogleChatStatus | null;
  const slack = (channels?.slack ?? null) as SlackStatus | null;
  const signal = (channels?.signal ?? null) as SignalStatus | null;
  const imessage = (channels?.imessage ?? null) as IMessageStatus | null;
  const nostr = (channels?.nostr ?? null) as NostrStatus | null;
  const channelOrder = resolveChannelOrder(props.snapshot);
  const orderedChannels = channelOrder
    .map((key, index) => ({
      key,
      enabled: channelEnabled(key, props),
      order: index,
    }))
    .toSorted((a, b) => {
      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return a.order - b.order;
    });

  const activeCount = orderedChannels.filter((c) => c.enabled).length;
  // Count channels with an explicit connected=true in their status
  const connectedCount = orderedChannels.filter((c) => {
    const st = channels?.[c.key] as Record<string, unknown> | undefined;
    return typeof st?.connected === "boolean" && st.connected;
  }).length;

  const data: ChannelsChannelData = {
    whatsapp,
    telegram,
    discord,
    googlechat,
    slack,
    signal,
    imessage,
    nostr,
    channelAccounts: props.snapshot?.channelAccounts ?? null,
  };

  const metaMap = resolveChannelMetaMap(props.snapshot);
  const activeChannels = orderedChannels.filter((c) => c.enabled);
  const inactiveChannels = orderedChannels.filter((c) => !c.enabled);

  const header = html`
    <div class="channels-header">
      <h2 class="channels-header__title">Channels</h2>
      <button
        class="btn btn--sm"
        @click=${() => props.onRefresh(true)}
      >
        Refresh All
      </button>
    </div>
    <div class="channels-header__stats">
      <span>${activeCount} active</span>
      <span class="channels-header__stat-dot"></span>
      <span>${connectedCount} connected</span>
      <span class="channels-header__stat-dot"></span>
      <span>Updated ${props.lastSuccessAt ? formatRelativeTimestamp(props.lastSuccessAt) : "never"}</span>
    </div>
  `;

  const main = surfaceMain(html`
    ${header}

    <section class="grid-channels">
      ${activeChannels.map((channel, idx) =>
        renderChannelCard(channel, idx, props, data, channels, metaMap),
      )}
    </section>

    ${
      activeChannels.length > 0 && inactiveChannels.length > 0
        ? html`
            <div class="channels-divider">Not configured</div>
          `
        : nothing
    }

    ${
      inactiveChannels.length > 0
        ? html`
        <section class="grid-channels grid-channels--inactive">
          ${inactiveChannels.map((channel, idx) =>
            renderChannelCard(channel, idx + activeChannels.length, props, data, channels, metaMap),
          )}
        </section>
      `
        : nothing
    }
  `);

  return surfacePage("channels", { hero: nothing, main });
}

function renderChannelCard(
  channel: { key: ChannelKey; enabled: boolean },
  idx: number,
  props: ChannelsProps,
  data: ChannelsChannelData,
  channels: Record<string, unknown> | null,
  metaMap: Record<string, ChannelUiMetaEntry>,
) {
  const animDelay = (idx + 1) * 50 + 50; // 100ms, 150ms, 200ms …
  const channelLabel = resolveChannelLabel(props.snapshot, channel.key);
  const stParams = getChannelStatusParams(channel.key, channels);
  const isExpanded = shouldAutoExpand(stParams);
  const status = deriveChannelStatus(stParams);
  const primaryAction = getPrimaryAction(channel.key, props);
  const icon = getChannelIcon(channel.key, metaMap[channel.key]);

  return html`
    <details
      class="channel-card-v2${channel.enabled ? "" : " channel-card-v2--disabled"}"
      ?open=${isExpanded}
      style="animation: rise 0.3s var(--ease-out) ${animDelay}ms backwards;"
    >
      <summary class="channel-card-v2__summary">
        <span class="channel-card-v2__icon">${icon}</span>
        <span class="channel-card__dot channel-card__dot--${status.dot}"></span>
        <span class="channel-card-v2__name">${channelLabel}</span>
        <span class="channel-card__badge channel-card__badge--${status.badgeVariant}">${status.badge}</span>
        <span class="channel-card-v2__spacer"></span>
        ${primaryAction}
        <span class="channel-card-v2__chevron">▸</span>
      </summary>
      <div class="channel-card-v2__body">
        ${renderChannelBody(channel.key, props, data)}
      </div>
    </details>
  `;
}

function resolveChannelOrder(snapshot: ChannelsStatusSnapshot | null): ChannelKey[] {
  if (snapshot?.channelMeta?.length) {
    return snapshot.channelMeta.map((entry) => entry.id);
  }
  if (snapshot?.channelOrder?.length) {
    return snapshot.channelOrder;
  }
  return ["whatsapp", "telegram", "discord", "googlechat", "slack", "signal", "imessage", "nostr"];
}

/** Extract typed status params for a channel key from the raw snapshot channels object. */
function getChannelStatusParams(key: ChannelKey, channels: Record<string, unknown> | null) {
  const st = channels?.[key] as Record<string, unknown> | undefined;
  return {
    configured: typeof st?.configured === "boolean" ? st.configured : undefined,
    running: typeof st?.running === "boolean" ? st.running : undefined,
    connected: typeof st?.connected === "boolean" ? st.connected : undefined,
    lastError: typeof st?.lastError === "string" ? st.lastError : undefined,
  };
}

/** Return the primary action button rendered in the summary row for a given channel. */
function getPrimaryAction(key: ChannelKey, props: ChannelsProps) {
  if (key === "whatsapp") {
    return whatsappPrimaryAction(props);
  }
  // No per-row Probe — "Refresh All" in header handles this
  return nothing;
}

function renderChannelBody(key: ChannelKey, props: ChannelsProps, data: ChannelsChannelData) {
  const accountCountLabel = renderChannelAccountCount(key, data.channelAccounts);
  switch (key) {
    case "whatsapp":
      return renderWhatsAppBody({
        props,
        whatsapp: data.whatsapp,
        accountCountLabel,
      });
    case "telegram":
      return renderTelegramBody({
        props,
        telegram: data.telegram,
        telegramAccounts: data.channelAccounts?.telegram ?? [],
        accountCountLabel,
      });
    case "discord":
      return renderDiscordBody({
        props,
        discord: data.discord,
        accountCountLabel,
      });
    case "googlechat":
      return renderGoogleChatBody({
        props,
        googleChat: data.googlechat,
        accountCountLabel,
      });
    case "slack":
      return renderSlackBody({
        props,
        slack: data.slack,
        accountCountLabel,
      });
    case "signal":
      return renderSignalBody({
        props,
        signal: data.signal,
        accountCountLabel,
      });
    case "imessage":
      return renderIMessageBody({
        props,
        imessage: data.imessage,
        accountCountLabel,
      });
    case "nostr": {
      const nostrAccounts = data.channelAccounts?.nostr ?? [];
      const primaryAccount = nostrAccounts[0];
      const accountId = primaryAccount?.accountId ?? "default";
      const profile =
        (primaryAccount as { profile?: NostrProfile | null } | undefined)?.profile ?? null;
      const showForm =
        props.nostrProfileAccountId === accountId ? props.nostrProfileFormState : null;
      const profileFormCallbacks = showForm
        ? {
            onFieldChange: props.onNostrProfileFieldChange,
            onSave: props.onNostrProfileSave,
            onImport: props.onNostrProfileImport,
            onCancel: props.onNostrProfileCancel,
            onToggleAdvanced: props.onNostrProfileToggleAdvanced,
          }
        : null;
      return renderNostrBody({
        props,
        nostr: data.nostr,
        nostrAccounts,
        accountCountLabel,
        profileFormState: showForm,
        profileFormCallbacks,
        onEditProfile: () => props.onNostrProfileEdit(accountId, profile),
      });
    }
    default:
      return renderGenericChannelBody(key, props, data.channelAccounts ?? {});
  }
}

function renderGenericChannelBody(
  key: ChannelKey,
  props: ChannelsProps,
  channelAccounts: Record<string, ChannelAccountSnapshot[]>,
) {
  const status = props.snapshot?.channels?.[key] as Record<string, unknown> | undefined;
  const configured = typeof status?.configured === "boolean" ? status.configured : undefined;
  const running = typeof status?.running === "boolean" ? status.running : undefined;
  const connected = typeof status?.connected === "boolean" ? status.connected : undefined;
  const lastError = typeof status?.lastError === "string" ? status.lastError : undefined;
  const accounts = channelAccounts[key] ?? [];
  const accountCountLabel = renderChannelAccountCount(key, channelAccounts);

  return html`
    ${accountCountLabel}

    ${
      accounts.length > 0
        ? html`
          <div class="account-card-list">
            ${accounts.map((account) => renderGenericAccount(account))}
          </div>
        `
        : html`
          <div class="status-list channel-card__status-list">
            <div>
              <span class="label">Configured</span>
              <span class="${configured ? "status-value--yes" : "status-value--no"}">
                ${configured == null ? "n/a" : configured ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span class="label">Running</span>
              <span class="${running ? "status-value--yes" : "status-value--no"}">
                ${running == null ? "n/a" : running ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span class="label">Connected</span>
              <span class="${connected ? "status-value--yes" : "status-value--no"}">
                ${connected == null ? "n/a" : connected ? "Yes" : "No"}
              </span>
            </div>
          </div>
        `
    }

    ${
      lastError
        ? html`<div class="callout danger channel-card__callout">${lastError}</div>`
        : nothing
    }

    ${renderChannelConfigSection({ channelId: key, props, isConfigured: configured ?? false })}
  `;
}

function resolveChannelMetaMap(
  snapshot: ChannelsStatusSnapshot | null,
): Record<string, ChannelUiMetaEntry> {
  if (!snapshot?.channelMeta?.length) {
    return {};
  }
  return Object.fromEntries(snapshot.channelMeta.map((entry) => [entry.id, entry]));
}

function resolveChannelLabel(snapshot: ChannelsStatusSnapshot | null, key: string): string {
  const meta = resolveChannelMetaMap(snapshot)[key];
  return meta?.label ?? snapshot?.channelLabels?.[key] ?? key;
}

const RECENT_ACTIVITY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

function hasRecentActivity(account: ChannelAccountSnapshot): boolean {
  if (!account.lastInboundAt) {
    return false;
  }
  return Date.now() - account.lastInboundAt < RECENT_ACTIVITY_THRESHOLD_MS;
}

function deriveRunningStatus(account: ChannelAccountSnapshot): "Yes" | "No" | "Active" {
  if (account.running) {
    return "Yes";
  }
  // If we have recent inbound activity, the channel is effectively running
  if (hasRecentActivity(account)) {
    return "Active";
  }
  return "No";
}

function deriveConnectedStatus(account: ChannelAccountSnapshot): "Yes" | "No" | "Active" | "n/a" {
  if (account.connected === true) {
    return "Yes";
  }
  if (account.connected === false) {
    return "No";
  }
  // If connected is null/undefined but we have recent activity, show as active
  if (hasRecentActivity(account)) {
    return "Active";
  }
  return "n/a";
}

function renderGenericAccount(account: ChannelAccountSnapshot) {
  const runningStatus = deriveRunningStatus(account);
  const connectedStatus = deriveConnectedStatus(account);

  return html`
    <div class="account-card">
      <div class="account-card-header">
        <div class="account-card-title">${account.name || account.accountId}</div>
        <div class="account-card-id">${account.accountId}</div>
      </div>
      <div class="status-list account-card-status">
        <div>
          <span class="label">Running</span>
          <span>${runningStatus}</span>
        </div>
        <div>
          <span class="label">Configured</span>
          <span>${account.configured ? "Yes" : "No"}</span>
        </div>
        <div>
          <span class="label">Connected</span>
          <span>${connectedStatus}</span>
        </div>
        <div>
          <span class="label">Last inbound</span>
          <span>${account.lastInboundAt ? formatRelativeTimestamp(account.lastInboundAt) : "n/a"}</span>
        </div>
        ${
          account.lastError
            ? html`
              <div class="account-card-error">
                ${account.lastError}
              </div>
            `
            : nothing
        }
      </div>
    </div>
  `;
}
