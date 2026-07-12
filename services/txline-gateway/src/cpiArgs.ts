import { CpiSettleArgsSchema, EscrowOutcomeSchema } from "@natt-pundit/contracts";
import {
  buildValidateStatArgs,
  resolveCpiSettlementPlan,
  statsImplyOutcome,
  txlineHomeAwayPenKeys,
  txlineHomeAwayStatKeys,
  wcMatchFormat,
  type EscrowOutcome,
  type TxlineHomeAwayStatKeys,
} from "@natt-pundit/natt-core";
import { escrowCluster, escrowTxlineProgramId } from "./txlineEscrowClient.js";
import { discoverPenStatValidation, fetchTwoStatValidation } from "./txlineProof.js";
import { getFixtureById, getFixtureScores } from "./txline.js";

function wrapStandardArgs(
  validation: Parameters<typeof buildValidateStatArgs>[0],
  outcome: EscrowOutcome,
  programId: string,
  cluster: ReturnType<typeof escrowCluster>,
  cpiTarget: { home: number; away: number; mode: "regulation" },
  statKeys: TxlineHomeAwayStatKeys,
) {
  const args = buildValidateStatArgs(validation, outcome, programId, statKeys);
  const parsed = CpiSettleArgsSchema.parse(args);
  return {
    settleMode: "standard" as const,
    ...parsed,
    cluster,
    txlineProgramId: programId,
    cpiTarget,
  };
}

export async function getFixtureCpiArgs(fixtureId: string, outcome: EscrowOutcome) {
  const scores = await getFixtureScores(fixtureId);
  if (!scores?.score) {
    throw new Error("scores_unavailable");
  }

  const fixture = await getFixtureById(fixtureId);
  const format = wcMatchFormat(fixture?.kickoffAt ?? "");
  const plan = resolveCpiSettlementPlan(scores.score, format, scores.penScore, outcome);
  const cluster = escrowCluster();
  const programId = escrowTxlineProgramId(cluster);
  const p1IsHome = scores.participant1IsHome ?? true;
  const goalKeys = txlineHomeAwayStatKeys(p1IsHome);
  const penKeys = txlineHomeAwayPenKeys(p1IsHome);

  if (plan.kind === "standard") {
    const validation = await fetchTwoStatValidation(fixtureId, {
      target: plan.target,
      outcome: plan.outcome,
      statKeys: goalKeys,
    });
    return wrapStandardArgs(validation, plan.outcome, programId, cluster, plan.target, goalKeys);
  }

  const penValidation = await discoverPenStatValidation(
    fixtureId,
    plan.penScore,
    plan.penOutcome,
    penKeys,
  );
  if (penValidation) {
    return wrapStandardArgs(
      penValidation,
      plan.penOutcome,
      programId,
      cluster,
      plan.regulationTarget,
      penKeys,
    );
  }

  try {
    const decisive = await fetchTwoStatValidation(fixtureId, {
      target: plan.regulationTarget,
      outcome: plan.penOutcome,
      statKeys: goalKeys,
    });
    const home = decisive.statToProve?.value;
    const away = decisive.statToProve2?.value;
    if (home !== undefined && away !== undefined && statsImplyOutcome(home, away, plan.penOutcome)) {
      return wrapStandardArgs(
        decisive,
        plan.penOutcome,
        programId,
        cluster,
        plan.regulationTarget,
        goalKeys,
      );
    }
  } catch {
    /* fall through to fail-closed error below */
  }

  // F95N security: never emit settle args with a client-asserted pen winner. If TxLINE
  // cannot prove the shootout winner on-chain, the pool must stay unsettled (refund_all).
  throw new Error("pen_proof_unavailable_pool_refund_only");
}

export { EscrowOutcomeSchema };
