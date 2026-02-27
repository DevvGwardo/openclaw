import { html, nothing } from "lit";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { WhatsAppStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

/** Primary action shown in the summary row for WhatsApp. */
export function whatsappPrimaryAction(props: ChannelsProps) {
  return html`<button
    class="btn btn--xs primary"
    ?disabled=${props.whatsappBusy}
    @click=${(e: Event) => {
      e.stopPropagation();
      props.onWhatsAppStart(false);
    }}
  >
    ${props.whatsappBusy ? "Working…" : "Show QR"}
  </button>`;
}

/** Body content for the WhatsApp channel card. */
export function renderWhatsAppBody(params: {
  props: ChannelsProps;
  whatsapp?: WhatsAppStatus;
  accountCountLabel: unknown;
}) {
  const { props, whatsapp, accountCountLabel } = params;

  return html`
    ${accountCountLabel}

    <div class="channel-card-v3__status-grid">
      <div class="channel-card-v3__status-item">
        <span class="label">Configured</span>
        <span class="${whatsapp?.configured ? "status-value--yes" : "status-value--no"}">
          ${whatsapp?.configured ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Linked</span>
        <span class="${whatsapp?.linked ? "status-value--yes" : "status-value--no"}">
          ${whatsapp?.linked ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Running</span>
        <span class="${whatsapp?.running ? "status-value--yes" : "status-value--no"}">
          ${whatsapp?.running ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Connected</span>
        <span class="${whatsapp?.connected ? "status-value--yes" : "status-value--no"}">
          ${whatsapp?.connected ? "Yes" : "No"}
        </span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last connect</span>
        <span>${whatsapp?.lastConnectedAt ? formatRelativeTimestamp(whatsapp.lastConnectedAt) : "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Last message</span>
        <span>${whatsapp?.lastMessageAt ? formatRelativeTimestamp(whatsapp.lastMessageAt) : "n/a"}</span>
      </div>
      <div class="channel-card-v3__status-item">
        <span class="label">Auth age</span>
        <span>${whatsapp?.authAgeMs != null ? formatDurationHuman(whatsapp.authAgeMs) : "n/a"}</span>
      </div>
    </div>

    ${
      whatsapp?.lastError
        ? html`<div class="callout danger channel-card__callout">
            ${whatsapp.lastError}
          </div>`
        : nothing
    }

    ${
      props.whatsappMessage
        ? html`<div class="callout channel-card__callout">
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

    <div class="channel-card-v3__actions">
      <button
        class="btn btn--xs primary"
        ?disabled=${props.whatsappBusy}
        @click=${() => props.onWhatsAppStart(false)}
      >
        ${props.whatsappBusy ? "Working…" : "Show QR"}
      </button>
      <button
        class="btn btn--xs"
        ?disabled=${props.whatsappBusy}
        @click=${() => props.onWhatsAppStart(true)}
      >
        Relink
      </button>
      <button
        class="btn btn--xs"
        ?disabled=${props.whatsappBusy}
        @click=${() => props.onWhatsAppWait()}
      >
        Wait for scan
      </button>
      <button class="btn btn--xs" @click=${() => props.onRefresh(true)}>Refresh</button>
      <button
        class="btn btn--xs danger"
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
  `;
}
