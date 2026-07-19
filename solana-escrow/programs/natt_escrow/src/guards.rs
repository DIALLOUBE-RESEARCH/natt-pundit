//! Pure settlement / refund guards (unit-tested without localnet).
//! CPI to TxLINE remains in `lib.rs`; these cover the money-logic preconditions.
use anchor_lang::prelude::*;

use crate::{funded_side_count, is_unmatched_pool, EscrowError};

/// Settle preconditions after `validate_stat` bytes were parsed (F78N).
pub fn check_settle_guards(
    settled: bool,
    side_totals: &[u64; 3],
    pool_fixture_id: u64,
    ix_fixture_id: i64,
    winning_side: u8,
    now_ts: i64,
    kickoff_ts: i64,
) -> Result<()> {
    require!(!settled, EscrowError::AlreadySettled);
    require!(
        !is_unmatched_pool(side_totals),
        EscrowError::UnmatchedPoolUseRefund
    );
    require!(
        ix_fixture_id as u64 == pool_fixture_id,
        EscrowError::FixtureMismatch
    );
    require!(winning_side < 3, EscrowError::InvalidSide);
    require!(now_ts >= kickoff_ts, EscrowError::TooEarly);
    Ok(())
}

/// Claim preconditions for a matched, settled pool.
pub fn check_claim_guards(
    settled: bool,
    side_totals: &[u64; 3],
    winning_side: u8,
    position_claimed: bool,
    position_side: u8,
) -> Result<()> {
    require!(settled, EscrowError::PoolNotSettled);
    require!(
        !is_unmatched_pool(side_totals),
        EscrowError::UnmatchedPoolUseRefund
    );
    require!(!position_claimed, EscrowError::AlreadyClaimed);
    require!(position_side == winning_side, EscrowError::NotWinner);
    let side_total = side_totals[winning_side as usize];
    require!(side_total > 0, EscrowError::VoidResultUseRefundAll);
    Ok(())
}

/// UNMATCHED refund after kickoff.
pub fn check_refund_unmatched_guards(
    settled: bool,
    side_totals: &[u64; 3],
    now_ts: i64,
    kickoff_ts: i64,
    position_claimed: bool,
    position_amount: u64,
) -> Result<()> {
    require!(!settled, EscrowError::PoolSettled);
    require!(
        is_unmatched_pool(side_totals),
        EscrowError::ParimutuelActive
    );
    require!(now_ts >= kickoff_ts, EscrowError::TooEarly);
    require!(!position_claimed, EscrowError::AlreadyClaimed);
    require!(position_amount > 0, EscrowError::ZeroPayout);
    Ok(())
}

/// refund_all when settled on a void (zero-liquidity) winning issue.
pub fn check_refund_all_guards(
    settled: bool,
    side_totals: &[u64; 3],
    winning_side: u8,
    position_claimed: bool,
    position_amount: u64,
) -> Result<()> {
    require!(settled, EscrowError::PoolNotSettled);
    require!(
        !is_unmatched_pool(side_totals),
        EscrowError::UnmatchedPoolUseRefund
    );
    require!(winning_side < 3, EscrowError::InvalidSide);
    require!(
        side_totals[winning_side as usize] == 0,
        EscrowError::WinningSideFunded
    );
    require!(!position_claimed, EscrowError::AlreadyClaimed);
    require!(position_amount > 0, EscrowError::ZeroPayout);
    Ok(())
}

/// Parimutuel payout: floor(stake * pool_total / winning_side_total).
pub fn parimutuel_payout(stake: u64, pool_total: u64, winning_side_total: u64) -> Result<u64> {
    require!(winning_side_total > 0, EscrowError::EmptyWinningSide);
    let payout = (stake as u128)
        .checked_mul(pool_total as u128)
        .ok_or(EscrowError::MathOverflow)?
        .checked_div(winning_side_total as u128)
        .ok_or(EscrowError::MathOverflow)? as u64;
    require!(payout > 0, EscrowError::ZeroPayout);
    Ok(payout)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unmatched_zero_or_one_side() {
        assert!(is_unmatched_pool(&[0, 0, 0]));
        assert!(is_unmatched_pool(&[100, 0, 0]));
        assert!(is_unmatched_pool(&[0, 50, 0]));
        assert_eq!(funded_side_count(&[10, 20, 0]), 2);
        assert!(!is_unmatched_pool(&[10, 20, 0]));
        assert!(!is_unmatched_pool(&[1, 1, 1]));
    }

    #[test]
    fn settle_guards_happy() {
        check_settle_guards(false, &[10, 20, 0], 42, 42, 0, 100, 50).unwrap();
    }

    #[test]
    fn settle_rejects_already_settled() {
        assert!(check_settle_guards(true, &[10, 20, 0], 42, 42, 0, 100, 50).is_err());
    }

    #[test]
    fn settle_rejects_unmatched() {
        assert!(check_settle_guards(false, &[10, 0, 0], 42, 42, 0, 100, 50).is_err());
    }

    #[test]
    fn settle_rejects_fixture_mismatch() {
        assert!(check_settle_guards(false, &[10, 20, 0], 42, 99, 0, 100, 50).is_err());
    }

    #[test]
    fn settle_rejects_bad_side() {
        assert!(check_settle_guards(false, &[10, 20, 0], 42, 42, 3, 100, 50).is_err());
    }

    #[test]
    fn settle_rejects_too_early() {
        assert!(check_settle_guards(false, &[10, 20, 0], 42, 42, 0, 40, 50).is_err());
    }

    #[test]
    fn claim_guards_happy() {
        check_claim_guards(true, &[30, 70, 0], 0, false, 0).unwrap();
    }

    #[test]
    fn claim_rejects_loser() {
        assert!(check_claim_guards(true, &[30, 70, 0], 0, false, 1).is_err());
    }

    #[test]
    fn claim_rejects_double() {
        assert!(check_claim_guards(true, &[30, 70, 0], 0, true, 0).is_err());
    }

    #[test]
    fn claim_rejects_void_winning_side() {
        // matched pool but winning side has 0 liquidity → refund_all path
        assert!(check_claim_guards(true, &[0, 50, 50], 0, false, 0).is_err());
    }

    #[test]
    fn refund_unmatched_happy() {
        check_refund_unmatched_guards(false, &[100, 0, 0], 100, 50, false, 100).unwrap();
    }

    #[test]
    fn refund_unmatched_rejects_parimutuel() {
        assert!(check_refund_unmatched_guards(false, &[50, 50, 0], 100, 50, false, 50).is_err());
    }

    #[test]
    fn refund_all_void_issue() {
        check_refund_all_guards(true, &[0, 40, 60], 0, false, 40).unwrap();
    }

    #[test]
    fn refund_all_rejects_funded_winner() {
        assert!(check_refund_all_guards(true, &[40, 60, 0], 0, false, 40).is_err());
    }

    #[test]
    fn payout_even_split() {
        // 2 winners put 50 each, total 100 → each gets 50 back if only winners? 
        // stake 50, total 100, side 50 → payout 100
        assert_eq!(parimutuel_payout(50, 100, 50).unwrap(), 100);
    }

    #[test]
    fn payout_sole_winner_takes_pool() {
        assert_eq!(parimutuel_payout(10, 100, 10).unwrap(), 100);
    }

    #[test]
    fn payout_rejects_empty_side() {
        assert!(parimutuel_payout(10, 100, 0).is_err());
    }
}
