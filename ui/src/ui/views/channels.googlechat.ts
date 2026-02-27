import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { GoogleChatStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

/** Body content for the Google Chat channel card. */
export function renderGoogleChatBody(params: {
  props: ChannelsProps;
  googleChat?: GoogleChatStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, googleChat, accountCountLabel } = params;

  return html`
    ${accountCountLabel}

    <div class="channel-card-v3__status-grid">
      <div class="channel-card-v3__status-item">
        <span class="label">Configured</span>
        <span class="${googleChat?.configured ? "status-value--yes" : "status-value--no"}">
          ${googleChat ? (googleChat.configured ? "Yes" : "No") : "n/a"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Running</span>
        <span class="${googleChat?.running ? "status-value--yes" : "status-value--no"}">
          ${googleChat ? (googleChat.running ? "Yes" : "No") : "n/a"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Credential</span>
        <span>${googleChat?.credentialSource ?? "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Audience</span>
        <span>
          ${
            googleChat?.audienceType
              ? `${googleChat.audienceType}${googleChat.audience ? ` · ${googleChat.audience}` : ""}`
              : "n/a"
          }
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last start</span>
        <span>${googleChat?.lastStartAt ? formatRelativeTimestamp(googleChat.lastStartAt) : "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last probe</span>
        <span>${googleChat?.lastProbeAt ? formatRelativeTimestamp(googleChat.lastProbeAt) : "n/a"}</span>
      </div>
    </div>

    ${
      googleChat?.lastError
        ? html`<div class="callout danger channel-card__callout">
            ${googleChat.lastError}
          </div>`
        : nothing
    }

    ${
      googleChat?.probe
        ? html`<div class="callout channel-card__callout">
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
  `;
}
