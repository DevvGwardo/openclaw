import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { DiscordStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { deriveChannelStatus } from "./channels.shared.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderDiscordCard(params: {
  props: ChannelsProps;
  discord?: DiscordStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, discord, accountCountLabel } = params;
  const channelStatus = deriveChannelStatus({
    configured: discord?.configured ?? undefined,
    running: discord?.running ?? undefined,
    lastError: discord?.lastError,
  });

  return html`
    <div class="card card--static">
      <div class="channel-card__header">
        <div class="channel-card__title-row">
          <span class="channel-card__dot channel-card__dot--${channelStatus.dot}"></span>
          <div class="card-title">Discord</div>
        </div>
        <span class="channel-card__badge channel-card__badge--${channelStatus.badgeVariant}">
          ${channelStatus.badge}
        </span>
      </div>
      <div class="card-sub">Bot status and channel configuration.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span class="${discord?.configured ? "status-value--yes" : "status-value--no"}">
            ${discord?.configured ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Running</span>
          <span class="${discord?.running ? "status-value--yes" : "status-value--no"}">
            ${discord?.running ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span class="status-value--no">
            ${discord?.lastStartAt ? formatRelativeTimestamp(discord.lastStartAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span class="status-value--no">
            ${discord?.lastProbeAt ? formatRelativeTimestamp(discord.lastProbeAt) : "n/a"}
          </span>
        </div>
      </div>

      ${
        discord?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${discord.lastError}
          </div>`
          : nothing
      }

      ${
        discord?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${discord.probe.ok ? "ok" : "failed"} ·
            ${discord.probe.status ?? ""} ${discord.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "discord",
        props,
        isConfigured: discord?.configured ?? false,
      })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn btn--sm" @click=${() => props.onRefresh(true)}>
          Probe
        </button>
      </div>
    </div>
  `;
}
