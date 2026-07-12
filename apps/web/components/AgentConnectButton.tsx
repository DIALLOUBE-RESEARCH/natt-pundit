"use client";

import { AgentConnectModal } from "@/components/AgentConnectModal";
import { usePresent } from "@/components/present/PresentProvider";
import { agentConnectCopy } from "@/lib/agentConnectI18n";
import { isAgentConnectEnabled } from "@/lib/agentConnect";
import { useAgentConnectOpen } from "@/lib/agentConnectOpen";

type AgentConnectButtonProps = {
  variant?: "header" | "hero";
};

export function AgentConnectButton({ variant = "header" }: AgentConnectButtonProps) {
  const { open, setOpen } = useAgentConnectOpen();
  const { lang } = usePresent();
  const t = agentConnectCopy(lang);
  const enabled = isAgentConnectEnabled();

  const className =
    variant === "hero"
      ? "agent-connect-btn agent-connect-btn--hero"
      : "agent-connect-btn";

  if (!enabled) {
    return (
      <span className={`${className} agent-connect-btn--disabled`} title={t.comingSoon}>
        {t.connectAgentCta}
      </span>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {t.connectAgentCta}
      </button>
      <AgentConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
