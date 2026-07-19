//! Parse TxLINE `validate_stat` instruction bytes and derive parimutuel winning side (F78N + F87).
use anchor_lang::prelude::Result;
use anchor_lang::require;

use crate::EscrowError;

/// Anchor discriminator for TxLINE `validate_stat`.
pub const VALIDATE_STAT_DISCRIMINATOR: [u8; 8] = [107, 197, 232, 90, 191, 136, 105, 185];

#[derive(Debug, PartialEq, Eq)]
pub enum Comparison {
    GreaterThan,
    LessThan,
    EqualTo,
}

/// Returns `(fixture_id, winning_side)` where side is 0=home, 1=draw, 2=away.
///
/// Lightweight parse — skips Merkle proof vecs to avoid BPF heap OOM on large CPI payloads.
pub fn parse_validate_stat_ix(data: &[u8]) -> Result<(i64, u8)> {
    require!(data.len() >= 8, EscrowError::InvalidTxlineIx);
    require!(
        data[..8] == VALIDATE_STAT_DISCRIMINATOR,
        EscrowError::InvalidTxlineIx
    );
    let payload = &data[8..];
    let (fixture_id, comparison) = parse_lightweight(payload)?;
    let side = comparison_to_side(comparison)?;
    Ok((fixture_id, side))
}

fn comparison_to_side(c: Comparison) -> Result<u8> {
    match c {
        Comparison::GreaterThan => Ok(0),
        Comparison::LessThan => Ok(2),
        Comparison::EqualTo => Ok(1),
    }
}

fn read_u32(cursor: &mut usize, payload: &[u8]) -> Result<u32> {
    let end = (*cursor)
        .checked_add(4)
        .ok_or(EscrowError::InvalidTxlineIx)?;
    require!(end <= payload.len(), EscrowError::InvalidTxlineIx);
    let mut buf = [0u8; 4];
    buf.copy_from_slice(&payload[*cursor..end]);
    *cursor = end;
    Ok(u32::from_le_bytes(buf))
}

fn skip_bytes(cursor: &mut usize, payload: &[u8], n: usize) -> Result<()> {
    let end = (*cursor).checked_add(n).ok_or(EscrowError::InvalidTxlineIx)?;
    require!(end <= payload.len(), EscrowError::InvalidTxlineIx);
    *cursor = end;
    Ok(())
}

fn skip_proof_vec(cursor: &mut usize, payload: &[u8]) -> Result<()> {
    let n = read_u32(cursor, payload)? as usize;
    // ProofNode: [u8;32] + bool (1 byte) in Borsh
    const NODE: usize = 33;
    let bytes = n
        .checked_mul(NODE)
        .ok_or(EscrowError::InvalidTxlineIx)?;
    skip_bytes(cursor, payload, bytes)
}

/// Walk Borsh layout without allocating proof vectors.
fn parse_lightweight(payload: &[u8]) -> Result<(i64, Comparison)> {
    let mut cur = 0usize;
    // ts: i64
    skip_bytes(&mut cur, payload, 8)?;
    // fixture_summary.fixture_id: i64
    require!(cur + 8 <= payload.len(), EscrowError::InvalidTxlineIx);
    let fixture_id = i64::from_le_bytes(payload[cur..cur + 8].try_into().unwrap());
    cur += 8;
    // update_stats: i32 + i64 + i64
    skip_bytes(&mut cur, payload, 20)?;
    // events_sub_tree_root: [u8; 32]
    skip_bytes(&mut cur, payload, 32)?;
    skip_proof_vec(&mut cur, payload)?;
    skip_proof_vec(&mut cur, payload)?;
    // predicate: threshold i32 + comparison u8 (Borsh enum)
    require!(cur + 5 <= payload.len(), EscrowError::InvalidTxlineIx);
    let _threshold = i32::from_le_bytes(payload[cur..cur + 4].try_into().unwrap());
    let tag = payload[cur + 4];
    let comparison = match tag {
        0 => Comparison::GreaterThan,
        1 => Comparison::LessThan,
        2 => Comparison::EqualTo,
        _ => return Err(EscrowError::InvalidPredicate.into()),
    };
    Ok((fixture_id, comparison))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Live TxLINE CPI vector (home win) — in-tree so CI never silent-skips.
    const HOME_B64: &str = include_str!("../fixtures/validate_stat_ix_home.b64");

    #[test]
    fn parse_home_fixture_vector() {
        let data = base64_decode(HOME_B64.trim());
        let (fixture_id, side) = parse_validate_stat_ix(&data).expect("parse home fixture");
        assert_eq!(fixture_id, 18_172_280);
        assert_eq!(side, 0, "GreaterThan → home");
    }

    #[test]
    fn reject_empty_ix() {
        assert!(parse_validate_stat_ix(&[]).is_err());
    }

    #[test]
    fn reject_wrong_discriminator() {
        let mut data = base64_decode(HOME_B64.trim());
        data[0] ^= 0xff;
        assert!(parse_validate_stat_ix(&data).is_err());
    }

    #[test]
    fn reject_truncated_after_discriminator() {
        assert!(parse_validate_stat_ix(&VALIDATE_STAT_DISCRIMINATOR).is_err());
    }

    #[test]
    fn comparison_to_side_1x2_mapping() {
        assert_eq!(comparison_to_side(Comparison::GreaterThan).unwrap(), 0);
        assert_eq!(comparison_to_side(Comparison::EqualTo).unwrap(), 1);
        assert_eq!(comparison_to_side(Comparison::LessThan).unwrap(), 2);
    }

    fn base64_decode(input: &str) -> Vec<u8> {
        const TABLE: &[u8; 64] =
            b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let bytes: Vec<u8> = input
            .bytes()
            .filter(|b| *b != b'=' && !b.is_ascii_whitespace())
            .collect();
        let mut out = Vec::new();
        let mut buf = 0u32;
        let mut bits = 0u32;
        for b in bytes {
            let val = TABLE.iter().position(|&t| t == b).expect("b64") as u32;
            buf = (buf << 6) | val;
            bits += 6;
            if bits >= 8 {
                bits -= 8;
                out.push((buf >> bits) as u8);
                buf &= (1 << bits) - 1;
            }
        }
        out
    }
}
