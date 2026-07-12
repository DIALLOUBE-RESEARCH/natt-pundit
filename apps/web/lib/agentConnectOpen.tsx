"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AgentConnectOpenContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AgentConnectOpenContext = createContext<AgentConnectOpenContextValue | null>(null);

export function AgentConnectOpenProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <AgentConnectOpenContext.Provider value={value}>{children}</AgentConnectOpenContext.Provider>;
}

export function useAgentConnectOpen(): AgentConnectOpenContextValue {
  const ctx = useContext(AgentConnectOpenContext);
  if (!ctx) {
    throw new Error("useAgentConnectOpen must be used within AgentConnectOpenProvider");
  }
  return ctx;
}
