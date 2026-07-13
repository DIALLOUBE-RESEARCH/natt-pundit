"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePresent } from "@/components/present/PresentProvider";
import { agentConnectCopy } from "@/lib/agentConnectI18n";
import {
  AGENT_CONNECT_CLIENT_STORAGE_KEY,
  AGENT_CONNECT_TABS,
  buildClaudeCodeCommand,
  buildCursorDeepLink,
  CLAUDE_WEB_CONNECTOR_DISPLAY_NAME,
  getAgentConnectConfig,
  isMcpLive,
  isMobileUserAgent,
  jsonForClient,
  normalizeMcpClientId,
  openClaudeConnectorInstall,
  type McpClientId,
} from "@/lib/agentConnect";

type AgentConnectModalProps = {
  open: boolean;
  onClose: () => void;
  /** prod = dark theme (legacy /). stitch = sandbox glass light. */
  variant?: "prod" | "stitch";
};

function readStoredClient(): McpClientId {
  if (typeof window === "undefined") return "cursor";
  const stored = window.localStorage.getItem(AGENT_CONNECT_CLIENT_STORAGE_KEY);
  return normalizeMcpClientId(stored);
}

export function AgentConnectModal({ open, onClose, variant = "prod" }: AgentConnectModalProps) {
  const { lang } = usePresent();
  const t = agentConnectCopy(lang);
  const [client, setClient] = useState<McpClientId>("cursor");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cfg = useMemo(() => {
    try {
      return getAgentConnectConfig();
    } catch {
      return null;
    }
  }, [open]);

  const deepLink = useMemo(() => (cfg ? buildCursorDeepLink(cfg) : ""), [cfg]);
  const jsonSnippet = useMemo(() => (cfg ? jsonForClient(cfg) : ""), [cfg]);
  const claudeCodeCommand = useMemo(() => (cfg ? buildClaudeCodeCommand(cfg) : ""), [cfg]);

  useEffect(() => {
    if (!open) return;
    setClient(readStoredClient());
    setToastMessage(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("natt-agent-connect-open");
    if (variant === "stitch") {
      document.body.classList.add("natt-agent-connect-open--stitch");
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const appShell = document.querySelector(".app-shell");
    if (appShell instanceof HTMLElement) {
      appShell.setAttribute("inert", "");
      appShell.setAttribute("aria-hidden", "true");
    }
    const stitchApp = document.querySelector(".stitch-light-app");
    if (stitchApp instanceof HTMLElement) {
      stitchApp.setAttribute("inert", "");
      stitchApp.setAttribute("aria-hidden", "true");
    }
    return () => {
      document.body.classList.remove("natt-agent-connect-open");
      document.body.classList.remove("natt-agent-connect-open--stitch");
      document.body.style.overflow = prev;
      const shell = document.querySelector(".app-shell");
      if (shell instanceof HTMLElement) {
        shell.removeAttribute("inert");
        shell.removeAttribute("aria-hidden");
      }
      const stitchShell = document.querySelector(".stitch-light-app");
      if (stitchShell instanceof HTMLElement) {
        stitchShell.removeAttribute("inert");
        stitchShell.removeAttribute("aria-hidden");
      }
    };
  }, [open, variant]);

  const selectClient = useCallback((next: McpClientId) => {
    setClient(next);
    setToastMessage(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AGENT_CONNECT_CLIENT_STORAGE_KEY, next);
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 8000);
  }, []);

  const copyText = useCallback(
    async (text: string, message?: string) => {
      await navigator.clipboard.writeText(text);
      showToast(message ?? t.copiedToast);
    },
    [showToast, t.copiedToast],
  );

  const openCursor = useCallback(() => {
    if (!deepLink) return;
    window.location.href = deepLink;
    showToast(t.cursorOpenToast);
  }, [deepLink, showToast, t.cursorOpenToast]);

  const openClaudeWeb = useCallback(async () => {
    if (!cfg) return;
    const mode = await openClaudeConnectorInstall(cfg);
    showToast(mode === "android_intent" ? t.claudeAppToast : t.claudeWebToast);
  }, [cfg, showToast, t.claudeAppToast, t.claudeWebToast]);

  const claudePrimaryLabel =
    typeof navigator !== "undefined" && isMobileUserAgent(navigator.userAgent)
      ? t.openInClaudeApp
      : t.openInClaudeWeb;

  const copyClaudeCodeCommand = useCallback(async () => {
    if (!claudeCodeCommand) return;
    await navigator.clipboard.writeText(claudeCodeCommand);
    showToast(t.claudeCodeToast);
  }, [claudeCodeCommand, showToast, t.claudeCodeToast]);

  const mcpLive = isMcpLive();

  if (!open || !mounted) return null;

  let panelBody: ReactNode = null;
  if (client === "cursor") {
    panelBody = (
      <>
        <div className="agent-connect-actions">
          <button type="button" className="agent-connect-primary" onClick={openCursor}>
            {t.openInCursor}
          </button>
        </div>
        <p className="agent-connect-hint">{t.cursorHint}</p>
      </>
    );
  } else if (client === "claude") {
    panelBody = (
      <>
        <div className="agent-connect-actions">
          <button type="button" className="agent-connect-primary" onClick={() => void openClaudeWeb()}>
            {claudePrimaryLabel}
          </button>
          <button
            type="button"
            className="agent-connect-secondary"
            onClick={() => void copyText(cfg!.mcpUrl, t.copiedUrlToast)}
          >
            {t.copyMcpUrl}
          </button>
          <button
            type="button"
            className="agent-connect-secondary"
            onClick={() => void copyClaudeCodeCommand()}
          >
            {t.copyClaudeCodeCommand}
          </button>
        </div>
        {cfg ? (
          <section className="agent-connect-fields" aria-labelledby="agent-connect-claude-fields">
            <h3 id="agent-connect-claude-fields" className="agent-connect-guide-title">
              {t.claudeWebFieldsTitle}
            </h3>
            <dl className="agent-connect-field-list">
              <div className="agent-connect-field-row">
                <dt>{t.claudeWebNameLabel}</dt>
                <dd>
                  <code>{CLAUDE_WEB_CONNECTOR_DISPLAY_NAME}</code>
                  <button
                    type="button"
                    className="agent-connect-field-copy"
                    onClick={() =>
                      void copyText(CLAUDE_WEB_CONNECTOR_DISPLAY_NAME, t.copiedNameToast)
                    }
                  >
                    {t.copyCommand}
                  </button>
                </dd>
              </div>
              <div className="agent-connect-field-row">
                <dt>{t.claudeWebUrlLabel}</dt>
                <dd>
                  <code title={cfg.mcpUrl}>{cfg.mcpUrl}</code>
                  <button
                    type="button"
                    className="agent-connect-field-copy"
                    onClick={() => void copyText(cfg.mcpUrl, t.copiedUrlToast)}
                  >
                    {t.copyMcpUrl}
                  </button>
                </dd>
              </div>
              <div className="agent-connect-field-row agent-connect-field-row--note">
                <dt>{t.claudeWebOAuthEmpty}</dt>
              </div>
            </dl>
          </section>
        ) : null}
        <p className="agent-connect-note agent-connect-note--ok">{t.claudeWebNoOAuth}</p>
        <section className="agent-connect-guide" aria-labelledby="agent-connect-claude-guide">
          <h3 id="agent-connect-claude-guide" className="agent-connect-guide-title">
            {t.claudeWebGuideTitle}
          </h3>
          <ol className="agent-connect-steps">
            {t.claudeWebSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section className="agent-connect-guide" aria-labelledby="agent-connect-claude-code">
          <h3 id="agent-connect-claude-code" className="agent-connect-guide-title">
            {t.claudeCodeGuideTitle}
          </h3>
          {claudeCodeCommand ? (
            <pre className="agent-connect-code">
              <code>{claudeCodeCommand}</code>
            </pre>
          ) : null}
          <button
            type="button"
            className="agent-connect-secondary agent-connect-copy-prompt"
            onClick={() => void copyClaudeCodeCommand()}
          >
            {t.copyClaudeCodeCommand}
          </button>
          <ol className="agent-connect-steps agent-connect-steps--compact">
            {t.claudeCodeSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section className="agent-connect-guide agent-connect-guide--after" aria-labelledby="agent-connect-claude-after">
          <h3 id="agent-connect-claude-after" className="agent-connect-guide-title">
            {t.claudeWebAfterTitle}
          </h3>
          <ol className="agent-connect-steps agent-connect-steps--compact">
            {t.claudeWebAfterSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <blockquote className="agent-connect-prompt-preview">{t.claudeWebFirstPrompt}</blockquote>
          <button
            type="button"
            className="agent-connect-secondary agent-connect-copy-prompt"
            onClick={() => void copyText(t.claudeWebFirstPrompt, t.copiedToast)}
          >
            {t.claudeWebCopyPrompt}
          </button>
        </section>
      </>
    );
  } else {
    panelBody = (
      <>
        <p className="agent-connect-hint">{t.otherHint}</p>
        <div className="agent-connect-actions">
          <button type="button" className="agent-connect-primary" onClick={() => void copyText(jsonSnippet)}>
            {t.copyConfig}
          </button>
          <button
            type="button"
            className="agent-connect-secondary"
            onClick={() => void copyText(cfg!.mcpUrl, t.copiedUrlToast)}
          >
            {t.copyMcpUrl}
          </button>
        </div>
      </>
    );
  }

  const overlayClass =
    variant === "stitch" ? "agent-connect-overlay stitch-agent-connect" : "agent-connect-overlay";

  return createPortal(
    <div className={overlayClass} role="presentation" onClick={onClose}>
      <div
        className="agent-connect-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-connect-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="agent-connect-modal-head">
          <div>
            <h2 id="agent-connect-title">{t.modalTitle}</h2>
            <p className="agent-connect-lead">{t.modalLead}</p>
          </div>
          <button type="button" className="agent-connect-close" onClick={onClose} aria-label={t.close}>
            ×
          </button>
        </header>

        {!cfg ? (
          <p className="agent-connect-banner">{t.mcpUrlMissing}</p>
        ) : (
          <>
            <p
              className={
                mcpLive
                  ? "agent-connect-banner agent-connect-banner--live"
                  : "agent-connect-banner agent-connect-banner--info"
              }
            >
              {mcpLive ? t.mcpLiveBanner : t.comingSoon}
            </p>
            <div
              className="agent-connect-tabs"
              role="tablist"
              aria-label={t.modalTitle}
              {...(variant === "stitch" ? { "data-client": client } : {})}
            >
              {variant === "stitch" ? <span className="agent-connect-tabs-thumb" aria-hidden /> : null}
              {AGENT_CONNECT_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`agent-connect-tab-${tab}`}
                  aria-selected={client === tab}
                  aria-controls={`agent-connect-panel-${tab}`}
                  className={client === tab ? "agent-connect-tab is-active" : "agent-connect-tab"}
                  onClick={() => selectClient(tab)}
                >
                  {tab === "cursor" ? t.tabCursor : tab === "claude" ? t.tabClaude : t.tabOther}
                </button>
              ))}
            </div>

            <div
              key={client}
              id={`agent-connect-panel-${client}`}
              className="agent-connect-panel"
              role="tabpanel"
              aria-labelledby={`agent-connect-tab-${client}`}
            >
              {panelBody}
            </div>
          </>
        )}

        {toastMessage ? <p className="agent-connect-toast">{toastMessage}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
