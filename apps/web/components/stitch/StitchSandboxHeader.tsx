"use client";

import { AgentConnectModal } from "@/components/AgentConnectModal";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { StitchThemeToggle } from "@/components/StitchThemeToggle";
import { usePresent } from "@/components/present/PresentProvider";
import { agentConnectCopy } from "@/lib/agentConnectI18n";
import { isAgentConnectEnabled } from "@/lib/agentConnect";
import { useAgentConnectOpen } from "@/lib/agentConnectOpen";
import { StitchWalletPill } from "@/components/stitch/StitchWalletPill";

type Props = {
  themeMode: "light" | "dark";
  onThemeChange: (mode: "light" | "dark") => void;
};

export function StitchSandboxHeader({ themeMode, onThemeChange }: Props) {
  const { lang } = usePresent();
  const agentCopy = agentConnectCopy(lang);
  const { open, setOpen } = useAgentConnectOpen();
  const agentEnabled = isAgentConnectEnabled();

  return (
    <header className="stitch-light-header">
      <div className="stitch-header-row">
        <StitchThemeToggle mode={themeMode} onChange={onThemeChange} />

        <div className="stitch-header-actions">
          <LiquidGlassPill
            variant="agent"
            className="stitch-lg-pill--header"
            onClick={agentEnabled ? () => setOpen(true) : undefined}
            disabled={!agentEnabled}
          >
            {agentCopy.connectAgentPill}
          </LiquidGlassPill>
          <StitchWalletPill />
          <LanguageSelector variant="stitch" />
        </div>
      </div>
      <AgentConnectModal open={open} onClose={() => setOpen(false)} variant="stitch" />
    </header>
  );
}
