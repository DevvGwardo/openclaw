import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { IMessageStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { deriveChannelStatus } from "./channels.shared.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderIMessageCard(params: {
  props: ChannelsProps;
  imessage?: IMessageStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, imessage, accountCountLabel } = params;
  const channelStatus = deriveChannelStatus({
    configured: imessage?.configured ?? undefined,
    running: imessage?.running ?? undefined,
    lastError: imessage?.lastError,
  });

  return html`
    <div class="card">
      <div class="channel-card__header">
        <div class="channel-card__title-row">
          <span class="channel-card__dot channel-card__dot--${channelStatus.dot}"></span>
          <div class="card-title">iMessage</div>
        </div>
        <span class="channel-card__badge channel-card__badge--${channelStatus.badgeVariant}">
          ${channelStatus.badge}
        </span>
      </div>
      <div class="card-sub">macOS bridge status and channel configuration.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span class="${imessage?.configured ? "status-value--yes" : "status-value--no"}">
            ${imessage?.configured ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Running</span>
          <span class="${imessage?.running ? "status-value--yes" : "status-value--no"}">
            ${imessage?.running ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span class="status-value--no">
            ${imessage?.lastStartAt ? formatRelativeTimestamp(imessage.lastStartAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span class="status-value--no">
            ${imessage?.lastProbeAt ? formatRelativeTimestamp(imessage.lastProbeAt) : "n/a"}
          </span>
        </div>
      </div>

      ${
        imessage?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${imessage.lastError}
          </div>`
          : nothing
      }

      ${
        imessage?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${imessage.probe.ok ? "ok" : "failed"} ·
            ${imessage.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "imessage",
        props,
        isConfigured: imessage?.configured ?? false,
      })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn btn--sm" @click=${() => props.onRefresh(true)}>
          Probe
        </button>
      </div>
    </div>
  `;
}
