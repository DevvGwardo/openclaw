import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { ChannelAccountSnapshot, TelegramStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

/** Body content for the Telegram channel card. */
export function renderTelegramBody(params: {
  props: ChannelsProps;
  telegram?: TelegramStatus;
  telegramAccounts: ChannelAccountSnapshot[];
  accountCountLabel: unknown;
}) {
  const { props, telegram, telegramAccounts, accountCountLabel } = params;
  const hasMultipleAccounts = telegramAccounts.length > 1;

  const renderAccountCard = (account: ChannelAccountSnapshot) => {
    const probe = account.probe as { bot?: { username?: string } } | undefined;
    const botUsername = probe?.bot?.username;
    const label = account.name || account.accountId;
    return html`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">
            ${botUsername ? `@${botUsername}` : label}
          </div>
          <div class="account-card-id">${account.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">Running</span>
            <span class="${account.running ? "status-value--yes" : "status-value--no"}">
              ${account.running ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span class="label">Configured</span>
            <span class="${account.configured ? "status-value--yes" : "status-value--no"}">
              ${account.configured ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span class="label">Last inbound</span>
            <span class="status-value--no">
              ${account.lastInboundAt ? formatRelativeTimestamp(account.lastInboundAt) : "n/a"}
            </span>
          </div>
          ${
            account.lastError
              ? html`
                <div class="account-card-error">
                  ${account.lastError}
                </div>
              `
              : nothing
          }
        </div>
      </div>
    `;
  };

  return html`
    ${accountCountLabel}

    ${
      hasMultipleAccounts
        ? html`
          <div class="account-card-list">
            ${telegramAccounts.map((account) => renderAccountCard(account))}
          </div>
        `
        : html`
          <div class="channel-card-v3__status-grid">
            <div class="channel-card-v3__status-item">
              <span class="label">Configured</span>
              <span class="${telegram?.configured ? "status-value--yes" : "status-value--no"}">
                ${telegram?.configured ? "Yes" : "No"}
              </span>
            </div>
            <div class="channel-card-v3__status-item">
              <span class="label">Running</span>
              <span class="${telegram?.running ? "status-value--yes" : "status-value--no"}">
                ${telegram?.running ? "Yes" : "No"}
              </span>
            </div>
            <div class="channel-card-v3__status-item">
              <span class="label">Mode</span>
              <span>${telegram?.mode ?? "n/a"}</span>
            </div>
            <div class="channel-card-v3__status-item">
              <span class="label">Last start</span>
              <span>${telegram?.lastStartAt ? formatRelativeTimestamp(telegram.lastStartAt) : "n/a"}</span>
            </div>
            <div class="channel-card-v3__status-item">
              <span class="label">Last probe</span>
              <span>${telegram?.lastProbeAt ? formatRelativeTimestamp(telegram.lastProbeAt) : "n/a"}</span>
            </div>
          </div>
        `
    }

    ${
      telegram?.lastError
        ? html`<div class="callout danger channel-card__callout">
            ${telegram.lastError}
          </div>`
        : nothing
    }

    ${
      telegram?.probe
        ? html`<div class="callout channel-card__callout">
            Probe ${telegram.probe.ok ? "ok" : "failed"} ·
            ${telegram.probe.status ?? ""} ${telegram.probe.error ?? ""}
          </div>`
        : nothing
    }

    ${renderChannelConfigSection({
      channelId: "telegram",
      props,
      isConfigured: telegram?.configured ?? false,
    })}
  `;
}
