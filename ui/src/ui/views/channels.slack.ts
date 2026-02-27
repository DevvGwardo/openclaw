import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { SlackStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { deriveChannelStatus } from "./channels.shared.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderSlackCard(params: {
  props: ChannelsProps;
  slack?: SlackStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, slack, accountCountLabel } = params;
  const channelStatus = deriveChannelStatus({
    configured: slack?.configured ?? undefined,
    running: slack?.running ?? undefined,
    lastError: slack?.lastError,
  });

  return html`
    <div class="card card--static">
      <div class="channel-card__header">
        <div class="channel-card__title-row">
          <span class="channel-card__dot channel-card__dot--${channelStatus.dot}"></span>
          <div class="card-title">Slack</div>
        </div>
        <span class="channel-card__badge channel-card__badge--${channelStatus.badgeVariant}">
          ${channelStatus.badge}
        </span>
      </div>
      <div class="card-sub">Socket mode status and channel configuration.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span class="${slack?.configured ? "status-value--yes" : "status-value--no"}">
            ${slack?.configured ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Running</span>
          <span class="${slack?.running ? "status-value--yes" : "status-value--no"}">
            ${slack?.running ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span class="status-value--no">
            ${slack?.lastStartAt ? formatRelativeTimestamp(slack.lastStartAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span class="status-value--no">
            ${slack?.lastProbeAt ? formatRelativeTimestamp(slack.lastProbeAt) : "n/a"}
          </span>
        </div>
      </div>

      ${
        slack?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${slack.lastError}
          </div>`
          : nothing
      }

      ${
        slack?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${slack.probe.ok ? "ok" : "failed"} ·
            ${slack.probe.status ?? ""} ${slack.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "slack",
        props,
        isConfigured: slack?.configured ?? false,
      })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn btn--sm" @click=${() => props.onRefresh(true)}>
          Probe
        </button>
      </div>
    </div>
  `;
}
