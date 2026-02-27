import { html } from "lit";
import { ConnectErrorDetailCodes } from "../../../../src/gateway/protocol/connect-error-details.js";
import { t, i18n, type Locale } from "../../i18n/index.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../external-link.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { GatewayHelloOk } from "../gateway.ts";
import { formatNextRun } from "../presenter.ts";
import type { UiSettings } from "../storage.ts";
import { shouldShowPairingHint } from "./overview-hints.ts";

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  privacyMode?: boolean;
  password: string;
  lastError: string | null;
  lastErrorCode: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
};

const _CREDENTIAL_QUERY_PATTERN = /(token|password|secret|key)=/i;

function maskCredential(value: string): string {
  if (!value.trim()) {
    return value;
  }
  return "••••••••";
}

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | {
        uptimeMs?: number;
        policy?: { tickIntervalMs?: number };
        authMode?: "none" | "token" | "password" | "trusted-proxy";
      }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : t("common.na");
  const tick = snapshot?.policy?.tickIntervalMs
    ? `${snapshot.policy.tickIntervalMs}ms`
    : t("common.na");
  const authMode = snapshot?.authMode;
  const isTrustedProxy = authMode === "trusted-proxy";
  const privacyMode = props.privacyMode ?? false;
  const showGatewayUrl = privacyMode
    ? maskCredential(props.settings.gatewayUrl)
    : props.settings.gatewayUrl;
  const sensitiveInputType = privacyMode ? "password" : "text";

  const pairingHint = (() => {
    if (!shouldShowPairingHint(props.connected, props.lastError, props.lastErrorCode)) {
      return null;
    }
    return html`
      <div style="margin-top: 8px; display: grid; gap: 6px;">
        <div class="muted">${t("overview.pairing.hint")}</div>
        <div>
          <span class="mono">openclaw devices list</span><br />
          <span class="mono">openclaw devices approve &lt;requestId&gt;</span>
        </div>
        <div class="muted">${t("overview.pairing.mobileHint")}</div>
        <div>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#device-pairing-first-connection"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Device pairing docs (opens in new tab)"
            >Docs: Device pairing</a
          >
        </div>
      </div>
    `;
  })();

  const authHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const authRequiredCodes = new Set<string>([
      ConnectErrorDetailCodes.AUTH_REQUIRED,
      ConnectErrorDetailCodes.AUTH_TOKEN_MISSING,
      ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING,
      ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED,
      ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED,
    ]);
    const authFailureCodes = new Set<string>([
      ...authRequiredCodes,
      ConnectErrorDetailCodes.AUTH_UNAUTHORIZED,
      ConnectErrorDetailCodes.AUTH_TOKEN_MISMATCH,
      ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH,
      ConnectErrorDetailCodes.AUTH_DEVICE_TOKEN_MISMATCH,
      ConnectErrorDetailCodes.AUTH_RATE_LIMITED,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISSING,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_PROXY_MISSING,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_WHOIS_FAILED,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISMATCH,
    ]);
    const authFailed = props.lastErrorCode
      ? authFailureCodes.has(props.lastErrorCode)
      : lower.includes("unauthorized") || lower.includes("connect failed");
    if (!authFailed) {
      return null;
    }
    const hasToken = Boolean(props.settings.token.trim());
    const hasPassword = Boolean(props.password.trim());
    const isAuthRequired = props.lastErrorCode
      ? authRequiredCodes.has(props.lastErrorCode)
      : !hasToken && !hasPassword;
    if (isAuthRequired) {
      return html`
        <div style="margin-top: 8px; display: grid; gap: 6px;">
          <div class="muted">${t("overview.auth.required")}</div>
          <div>
            <span class="mono">openclaw dashboard --no-open</span> → tokenized URL<br />
            <span class="mono">openclaw doctor --generate-gateway-token</span> → set token
          </div>
          <div>
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target=${EXTERNAL_LINK_TARGET}
              rel=${buildExternalLinkRel()}
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth</a
            >
          </div>
        </div>
      `;
    }
    return html`
      <div style="margin-top: 8px; display: grid; gap: 6px;">
        <div class="muted">
          ${t("overview.auth.failed", { command: "openclaw dashboard --no-open" })}
        </div>
        <div>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/dashboard"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth</a
          >
        </div>
      </div>
    `;
  })();

  const insecureContextHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
    if (isSecureContext) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const insecureContextCode =
      props.lastErrorCode === ConnectErrorDetailCodes.CONTROL_UI_DEVICE_IDENTITY_REQUIRED ||
      props.lastErrorCode === ConnectErrorDetailCodes.DEVICE_IDENTITY_REQUIRED;
    if (
      !insecureContextCode &&
      !lower.includes("secure context") &&
      !lower.includes("device identity required")
    ) {
      return null;
    }
    return html`
      <div style="margin-top: 8px; display: grid; gap: 6px;">
        <div class="muted">
          ${t("overview.insecure.hint", { url: "http://127.0.0.1:18789" })}
        </div>
        <div class="muted">
          ${t("overview.insecure.stayHttp", {
            config: "gateway.controlUi.allowInsecureAuth: true",
          })}
        </div>
        <div>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/gateway/tailscale"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#insecure-http"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `;
  })();

  const currentLocale = i18n.getLocale();

  return html`
    <!-- 1. Hero Status Banner -->
    <div class="overview-hero">
      <div class="overview-hero__status">
        <span
          class="overview-hero__dot overview-hero__dot--${props.connected ? "ok" : "offline"}"
        ></span>
        <span class="overview-hero__label">
          ${props.connected ? t("common.ok") : t("common.offline")}
        </span>
      </div>
      <div class="overview-hero__stats">
        <div class="overview-hero__stat">
          <span class="overview-hero__stat-label">${t("overview.snapshot.uptime")}</span>
          <span class="overview-hero__stat-value">${uptime}</span>
        </div>
        <div class="overview-hero__divider"></div>
        <div class="overview-hero__stat">
          <span class="overview-hero__stat-label">${t("overview.snapshot.tickInterval")}</span>
          <span class="overview-hero__stat-value">${tick}</span>
        </div>
        <div class="overview-hero__divider"></div>
        <div class="overview-hero__stat">
          <span class="overview-hero__stat-label"
            >${t("overview.snapshot.lastChannelsRefresh")}</span
          >
          <span class="overview-hero__stat-value">
            ${
              props.lastChannelsRefresh
                ? formatRelativeTimestamp(props.lastChannelsRefresh)
                : t("common.na")
            }
          </span>
        </div>
      </div>
    </div>

    <!-- 2. Error/Hint Banner — only renders when there's a lastError -->
    ${
      props.lastError
        ? html`
          <div class="overview-alert overview-alert--danger">
            <div class="overview-alert__icon">!</div>
            <div class="overview-alert__content">
              <div class="overview-alert__message">${props.lastError}</div>
              ${pairingHint ?? ""} ${authHint ?? ""} ${insecureContextHint ?? ""}
            </div>
          </div>
        `
        : ""
    }

    <!-- 3. Dashboard Stat Grid -->
    <section class="overview-dashboard">
      <div class="overview-dash-card" style="animation-delay: 100ms;">
        <div class="overview-dash-card__icon overview-dash-card__icon--teal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div class="overview-dash-card__content">
          <div class="overview-dash-card__value">${props.presenceCount}</div>
          <div class="overview-dash-card__label">${t("overview.stats.instances")}</div>
          <div class="overview-dash-card__sub">${t("overview.stats.instancesHint")}</div>
        </div>
      </div>
      <div class="overview-dash-card" style="animation-delay: 150ms;">
        <div class="overview-dash-card__icon overview-dash-card__icon--blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="overview-dash-card__content">
          <div class="overview-dash-card__value">${props.sessionsCount ?? t("common.na")}</div>
          <div class="overview-dash-card__label">${t("overview.stats.sessions")}</div>
          <div class="overview-dash-card__sub">${t("overview.stats.sessionsHint")}</div>
        </div>
      </div>
      <div class="overview-dash-card" style="animation-delay: 200ms;">
        <div class="overview-dash-card__icon overview-dash-card__icon--amber">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="overview-dash-card__content">
          <div class="overview-dash-card__value">
            ${
              props.cronEnabled == null
                ? t("common.na")
                : props.cronEnabled
                  ? t("common.enabled")
                  : t("common.disabled")
            }
          </div>
          <div class="overview-dash-card__label">${t("overview.stats.cron")}</div>
          <div class="overview-dash-card__sub">
            ${t("overview.stats.cronNext", { time: formatNextRun(props.cronNext) })}
          </div>
        </div>
      </div>
      <div class="overview-dash-card" style="animation-delay: 250ms;">
        <div class="overview-dash-card__icon overview-dash-card__icon--green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="overview-dash-card__content">
          <div class="overview-dash-card__value">
            ${
              props.lastChannelsRefresh
                ? formatRelativeTimestamp(props.lastChannelsRefresh)
                : t("common.na")
            }
          </div>
          <div class="overview-dash-card__label">${t("overview.snapshot.lastChannelsRefresh")}</div>
        </div>
      </div>
    </section>

    <!-- 4. Collapsible Connection Form -->
    <details class="overview-connection" ?open=${!props.connected}>
      <summary class="overview-connection__summary">
        <div class="overview-connection__header">
          <span class="overview-connection__title">${t("overview.access.title")}</span>
          <span class="overview-connection__url mono">${showGatewayUrl}</span>
        </div>
        <div class="overview-connection__actions">
          <button
            class="btn btn--sm"
            @click=${(e: Event) => {
              e.preventDefault();
              props.onConnect();
            }}
          >
            ${t("common.connect")}
          </button>
          <button
            class="btn btn--sm"
            @click=${(e: Event) => {
              e.preventDefault();
              props.onRefresh();
            }}
          >
            ${t("common.refresh")}
          </button>
          <span class="overview-connection__chevron">&#9662;</span>
        </div>
      </summary>
      <div class="overview-connection__body">
        <div class="form-grid" style="margin-top: 14px;">
          <label class="field">
            <span>${t("overview.access.wsUrl")}</span>
            <input
              type=${sensitiveInputType}
              .value=${props.settings.gatewayUrl}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onSettingsChange({ ...props.settings, gatewayUrl: v });
              }}
              placeholder="ws://100.x.y.z:18789"
            />
          </label>
          ${
            isTrustedProxy
              ? ""
              : html`
                <label class="field">
                  <span>${t("overview.access.token")}</span>
                  <input
                    type=${sensitiveInputType}
                    .value=${props.settings.token}
                    @input=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      props.onSettingsChange({ ...props.settings, token: v });
                    }}
                    placeholder="OPENCLAW_GATEWAY_TOKEN"
                  />
                </label>
                <label class="field">
                  <span>${t("overview.access.password")}</span>
                  <input
                    type="password"
                    .value=${props.password}
                    @input=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      props.onPasswordChange(v);
                    }}
                    placeholder="system or shared password"
                  />
                </label>
              `
          }
          <label class="field">
            <span>${t("overview.access.sessionKey")}</span>
            <input
              type=${sensitiveInputType}
              .value=${props.settings.sessionKey}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                props.onSessionKeyChange(v);
              }}
            />
          </label>
          <label class="field">
            <span>${t("overview.access.language")}</span>
            <select
              .value=${currentLocale}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value as Locale;
                void i18n.setLocale(v);
                props.onSettingsChange({ ...props.settings, locale: v });
              }}
            >
              <option value="en">${t("languages.en")}</option>
              <option value="zh-CN">${t("languages.zhCN")}</option>
              <option value="zh-TW">${t("languages.zhTW")}</option>
              <option value="pt-BR">${t("languages.ptBR")}</option>
            </select>
          </label>
        </div>
        <div class="row" style="margin-top: 14px;">
          <span class="muted">
            ${isTrustedProxy ? t("overview.access.trustedProxy") : t("overview.access.connectHint")}
          </span>
        </div>
      </div>
    </details>

    <!-- 5. Quick Actions — replaces the Notes section -->
    <section class="overview-actions">
      <a class="overview-action-pill" href="#/channels">
        <span class="overview-action-pill__icon">&#9889;</span>
        ${t("overview.quickActions.channels")}
      </a>
      <a class="overview-action-pill" href="#/sessions">
        <span class="overview-action-pill__icon">&#128172;</span>
        ${t("overview.quickActions.sessions")}
      </a>
      <a class="overview-action-pill" href="#/config">
        <span class="overview-action-pill__icon">&#9881;</span>
        ${t("overview.quickActions.config")}
      </a>
      <a
        class="overview-action-pill"
        href="https://docs.openclaw.ai/web/control-ui"
        target=${EXTERNAL_LINK_TARGET}
        rel=${buildExternalLinkRel()}
      >
        <span class="overview-action-pill__icon">&#128214;</span>
        ${t("overview.quickActions.docs")}
      </a>
    </section>
  `;
}
