import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { SlackStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

/** Body content for the Slack channel card. */
export function renderSlackBody(params: {
  props: ChannelsProps;
  slack?: SlackStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, slack, accountCountLabel } = params;

  return html`
    ${accountCountLabel}

    <div class="channel-card-v3__status-grid">
      <div class="channel-card-v3__status-item">
        <span class="label">Configured</span>
        <span class="${slack?.configured ? "status-value--yes" : "status-value--no"}">
          ${slack?.configured ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Running</span>
        <span class="${slack?.running ? "status-value--yes" : "status-value--no"}">
          ${slack?.running ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last start</span>
        <span>${slack?.lastStartAt ? formatRelativeTimestamp(slack.lastStartAt) : "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last probe</span>
        <span>${slack?.lastProbeAt ? formatRelativeTimestamp(slack.lastProbeAt) : "n/a"}</span>
      </div>
    </div>

    ${
      slack?.lastError
        ? html`<div class="callout danger channel-card__callout">
            ${slack.lastError}
          </div>`
        : nothing
    }

    ${
      slack?.probe
        ? html`<div class="callout channel-card__callout">
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
  `;
}
