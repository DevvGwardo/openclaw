import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { SignalStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

/** Body content for the Signal channel card. */
export function renderSignalBody(params: {
  props: ChannelsProps;
  signal?: SignalStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, signal, accountCountLabel } = params;

  return html`
    ${accountCountLabel}

    <div class="channel-card-v3__status-grid">
      <div class="channel-card-v3__status-item">
        <span class="label">Configured</span>
        <span class="${signal?.configured ? "status-value--yes" : "status-value--no"}">
          ${signal?.configured ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Running</span>
        <span class="${signal?.running ? "status-value--yes" : "status-value--no"}">
          ${signal?.running ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Base URL</span>
        <span>${signal?.baseUrl ?? "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last start</span>
        <span>${signal?.lastStartAt ? formatRelativeTimestamp(signal.lastStartAt) : "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last probe</span>
        <span>${signal?.lastProbeAt ? formatRelativeTimestamp(signal.lastProbeAt) : "n/a"}</span>
      </div>
    </div>

    ${
      signal?.lastError
        ? html`<div class="callout danger channel-card__callout">
            ${signal.lastError}
          </div>`
        : nothing
    }

    ${
      signal?.probe
        ? html`<div class="callout channel-card__callout">
            Probe ${signal.probe.ok ? "ok" : "failed"} ·
            ${signal.probe.status ?? ""} ${signal.probe.error ?? ""}
          </div>`
        : nothing
    }

    ${renderChannelConfigSection({
      channelId: "signal",
      props,
      isConfigured: signal?.configured ?? false,
    })}
  `;
}
