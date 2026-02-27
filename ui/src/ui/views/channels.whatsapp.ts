import { html, nothing } from "lit";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { WhatsAppStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import { deriveChannelStatus } from "./channels.shared.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderWhatsAppCard(params: {
  props: ChannelsProps;
  whatsapp?: WhatsAppStatus;
  accountCountLabel: unknown;
}) {
  const { props, whatsapp, accountCountLabel } = params;
  const channelStatus = deriveChannelStatus({
    configured: whatsapp?.configured,
    running: whatsapp?.running,
    connected: whatsapp?.connected,
    lastError: whatsapp?.lastError,
  });

  return html`
    <div class="card card--static">
      <div class="channel-card__header">
        <div class="channel-card__title-row">
          <span class="channel-card__dot channel-card__dot--${channelStatus.dot}"></span>
          <div class="card-title">WhatsApp</div>
        </div>
        <span class="channel-card__badge channel-card__badge--${channelStatus.badgeVariant}">
          ${channelStatus.badge}
        </span>
      </div>
      <div class="card-sub">Link WhatsApp Web and monitor connection health.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">Configured</span>
          <span class="${whatsapp?.configured ? "status-value--yes" : "status-value--no"}">
            ${whatsapp?.configured ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Linked</span>
          <span class="${whatsapp?.linked ? "status-value--yes" : "status-value--no"}">
            ${whatsapp?.linked ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Running</span>
          <span class="${whatsapp?.running ? "status-value--yes" : "status-value--no"}">
            ${whatsapp?.running ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Connected</span>
          <span class="${whatsapp?.connected ? "status-value--yes" : "status-value--no"}">
            ${whatsapp?.connected ? "Yes" : "No"}
          </span>
        </div>
        <div>
          <span class="label">Last connect</span>
          <span class="status-value--no">
            ${whatsapp?.lastConnectedAt ? formatRelativeTimestamp(whatsapp.lastConnectedAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Last message</span>
          <span class="status-value--no">
            ${whatsapp?.lastMessageAt ? formatRelativeTimestamp(whatsapp.lastMessageAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">Auth age</span>
          <span class="status-value--no">
            ${whatsapp?.authAgeMs != null ? formatDurationHuman(whatsapp.authAgeMs) : "n/a"}
          </span>
        </div>
      </div>

      ${
        whatsapp?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${whatsapp.lastError}
          </div>`
          : nothing
      }

      ${
        props.whatsappMessage
          ? html`<div class="callout" style="margin-top: 12px;">
            ${props.whatsappMessage}
          </div>`
          : nothing
      }

      ${
        props.whatsappQrDataUrl
          ? html`<div class="qr-wrap">
            <img src=${props.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`
          : nothing
      }

      <div class="row" style="margin-top: 14px; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div class="row" style="gap: 6px; flex-wrap: wrap;">
          <button
            class="btn btn--sm primary"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppStart(false)}
          >
            ${props.whatsappBusy ? "Working…" : "Show QR"}
          </button>
          <button
            class="btn btn--sm"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppStart(true)}
          >
            Relink
          </button>
          <button
            class="btn btn--sm"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppWait()}
          >
            Wait for scan
          </button>
          <button class="btn btn--sm" @click=${() => props.onRefresh(true)}>Refresh</button>
        </div>
        <button
          class="btn btn--sm danger"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppLogout()}
        >
          Logout
        </button>
      </div>

      ${renderChannelConfigSection({
        channelId: "whatsapp",
        props,
        isConfigured: whatsapp?.configured ?? false,
      })}
    </div>
  `;
}
