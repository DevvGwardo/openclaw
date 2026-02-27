import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { SignalStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { deriveChannelStatus } from "./channels.shared.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderSignalCard(params: {
  props: ChannelsProps;
  signal?: SignalStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, signal, accountCountLabel } = params;
  const channelStatus = deriveChannelStatus({
    configured: signal?.configured ?? undefined,
    running: signal?.running ?? undefined,
    lastError: signal?.lastError,
  });

  return html`
    <div class="card">
      <div class="channel-card__header">
        <div class="channel-card__title-row">
          <span class="channel-card__dot channel-card__dot--${channelStatus.dot}"></span>
          <div class="card-title">Signal</div>
        </div>
        <span class="channel-card__badge channel-card__badge--${channelStatus.badgeVariant}">
          ${channelStatus.badge}
        </span>
      </div>
      <div class="card-sub">signal-cli status and channel configuration.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span class="${signal?.configured ? "status-value--yes" : "status-value--no"}">
            ${signal?.configured ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Running</span>
          <span class="${signal?.running ? "status-value--yes" : "status-value--no"}">
            ${signal?.running ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Base URL</span>
          <span class="status-value--no">${signal?.baseUrl ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span class="status-value--no">
            ${signal?.lastStartAt ? formatRelativeTimestamp(signal.lastStartAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span class="status-value--no">
            ${signal?.lastProbeAt ? formatRelativeTimestamp(signal.lastProbeAt) : "n/a"}
          </span>
        </div>
      </div>

      ${
        signal?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${signal.lastError}
          </div>`
          : nothing
      }

      ${
        signal?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
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

      <div class="row" style="margin-top: 12px;">
        <button class="btn btn--sm" @click=${() => props.onRefresh(true)}>
          Probe
        </button>
      </div>
    </div>
  `;
}
