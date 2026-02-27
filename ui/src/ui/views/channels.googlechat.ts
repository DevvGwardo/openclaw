import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { GoogleChatStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { deriveChannelStatus } from "./channels.shared.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderGoogleChatCard(params: {
  props: ChannelsProps;
  googleChat?: GoogleChatStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, googleChat, accountCountLabel } = params;
  const channelStatus = deriveChannelStatus({
    configured: googleChat?.configured ?? undefined,
    running: googleChat?.running ?? undefined,
    lastError: googleChat?.lastError,
  });

  return html`
    <div class="card">
      <div class="channel-card__header">
        <div class="channel-card__title-row">
          <span class="channel-card__dot channel-card__dot--${channelStatus.dot}"></span>
          <div class="card-title">Google Chat</div>
        </div>
        <span class="channel-card__badge channel-card__badge--${channelStatus.badgeVariant}">
          ${channelStatus.badge}
        </span>
      </div>
      <div class="card-sub">Chat API webhook status and channel configuration.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span class="${googleChat?.configured ? "status-value--yes" : "status-value--no"}">
            ${googleChat ? (googleChat.configured ? "Yes" : "No") : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Running</span>
          <span class="${googleChat?.running ? "status-value--yes" : "status-value--no"}">
            ${googleChat ? (googleChat.running ? "Yes" : "No") : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Credential</span>
          <span class="status-value--no">${googleChat?.credentialSource ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">Audience</span>
          <span class="status-value--no">
            ${
              googleChat?.audienceType
                ? `${googleChat.audienceType}${googleChat.audience ? ` · ${googleChat.audience}` : ""}`
                : "n/a"
            }
          </span>
        </div>
        <div>
          <span class="label">Last start</span>
          <span class="status-value--no">
            ${googleChat?.lastStartAt ? formatRelativeTimestamp(googleChat.lastStartAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last probe</span>
          <span class="status-value--no">
            ${googleChat?.lastProbeAt ? formatRelativeTimestamp(googleChat.lastProbeAt) : "n/a"}
          </span>
        </div>
      </div>

      ${
        googleChat?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${googleChat.lastError}
          </div>`
          : nothing
      }

      ${
        googleChat?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${googleChat.probe.ok ? "ok" : "failed"} ·
            ${googleChat.probe.status ?? ""} ${googleChat.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "googlechat",
        props,
        isConfigured: googleChat?.configured ?? false,
      })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn btn--sm" @click=${() => props.onRefresh(true)}>
          Probe
        </button>
      </div>
    </div>
  `;
}
