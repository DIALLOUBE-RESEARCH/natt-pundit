"use client";

import { SettlementProofPanel } from "@/components/SettlementProofPanel";

type Props = {
  fixtureId: string;
  fixtureStatus: "scheduled" | "live" | "finished";
  score?: { home: number; away: number };
};

/** Merkle / proof — secondary section, not in the bet slip primary path. */
export function TransparencySection({ fixtureId, fixtureStatus, score }: Props) {
  if (fixtureStatus !== "finished") return null;
  return (
    <SettlementProofPanel fixtureId={fixtureId} fixtureStatus={fixtureStatus} score={score} />
  );
}
