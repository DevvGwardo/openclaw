import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { DiscordStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

/** Body content for the Discord channel card. */
export function renderDiscordBody(params: {
  props: ChannelsProps;
  discord?: DiscordStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, discord, accountCountLabel } = params;

  return html`
    ${accountCountLabel}

    <div class="channel-card-v3__status-grid">
      <div class="channel-card-v3__status-item">
        <span class="label">Configured</span>
        <span class="${discord?.configured ? "status-value--yes" : "status-value--no"}">
          ${discord?.configured ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Running</span>
        <span class="${discord?.running ? "status-value--yes" : "status-value--no"}">
          ${discord?.running ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last start</span>
        <span>${discord?.lastStartAt ? formatRelativeTimestamp(discord.lastStartAt) : "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last probe</span>
        <span>${discord?.lastProbeAt ? formatRelativeTimestamp(discord.lastProbeAt) : "n/a"}</span>
      </div>
    </div>

    ${
      discord?.lastError
        ? html`<div class="callout danger channel-card__callout">
            ${discord.lastError}
          </div>`
        : nothing
    }

    ${
      discord?.probe
        ? html`<div class="callout channel-card__callout">
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
  `;
}
