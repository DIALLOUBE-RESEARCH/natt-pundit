use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
};
use anchor_spl::token::{self, InitializeAccount3, Mint, Token, TokenAccount, Transfer};

mod guards;
mod txline_ix;

/// TxLINE devnet program (F71N escrow CPI on devnet).
pub const TXLINE_PROGRAM_ID: Pubkey = pubkey!("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");

/// Circle USDC devnet mint (F80N — reject fake mint at create_pool / deposit).
pub const DEVNET_USDC_MINT: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

declare_id!("GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD");

#[program]
pub mod natt_escrow {
    use super::*;

    pub fn create_pool(ctx: Context<CreatePool>, fixture_id: u64, kickoff_ts: i64) -> Result<()> {
        let clock = Clock::get()?;
        require!(kickoff_ts > clock.unix_timestamp, EscrowError::KickoffInPast);

        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.fixture_id = fixture_id;
        pool.kickoff_ts = kickoff_ts;
        pool.settled = false;
        pool.winning_side = 255;
        pool.total_deposited = 0;
        pool.side_totals = [0, 0, 0];
        pool.bump = ctx.bumps.pool;
        pool.vault_bump = ctx.bumps.vault;

        token::initialize_account3(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            InitializeAccount3 {
                account: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
        ))?;

        Ok(())
    }

    pub fn open_position(ctx: Context<OpenPosition>, side: u8) -> Result<()> {
        require!(side < 3, EscrowError::InvalidSide);

        let pool = &ctx.accounts.pool;
        require!(!pool.settled, EscrowError::PoolSettled);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < pool.kickoff_ts, EscrowError::PoolClosed);

        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.depositor.key();
        position.pool = pool.key();
        position.side = side;
        position.amount = 0;
        position.claimed = false;
        position.bump = ctx.bumps.position;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount >= MIN_DEPOSIT, EscrowError::DepositTooSmall);

        let pool = &mut ctx.accounts.pool;
        require!(!pool.settled, EscrowError::PoolSettled);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < pool.kickoff_ts, EscrowError::PoolClosed);

        let position = &mut ctx.accounts.position;
        let side = position.side;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.depositor_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
        )?;

        position.amount = position
            .amount
            .checked_add(amount)
            .ok_or(EscrowError::MathOverflow)?;
        pool.side_totals[side as usize] = pool.side_totals[side as usize]
            .checked_add(amount)
            .ok_or(EscrowError::MathOverflow)?;
        pool.total_deposited = pool.total_deposited
            .checked_add(amount)
            .ok_or(EscrowError::MathOverflow)?;

        Ok(())
    }

    /// Forwards a pre-built TxLINE `validate_stat` instruction via CPI.
    /// Client builds `txline_ix_data` from gateway `/cpi-args` + Anchor TS encoder.
    /// F78N — `winning_side` is derived from TxLINE `validate_stat` ix data (not client-supplied).
    pub fn settle(ctx: Context<Settle>, txline_ix_data: Vec<u8>) -> Result<()> {
        let (fixture_id, winning_side) = txline_ix::parse_validate_stat_ix(&txline_ix_data)?;

        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;
        guards::check_settle_guards(
            pool.settled,
            &pool.side_totals,
            pool.fixture_id,
            fixture_id,
            winning_side,
            clock.unix_timestamp,
            pool.kickoff_ts,
        )?;

        let txline_ix = Instruction {
            program_id: TXLINE_PROGRAM_ID,
            accounts: vec![AccountMeta::new_readonly(
                ctx.accounts.daily_scores_merkle_roots.key(),
                false,
            )],
            data: txline_ix_data,
        };

        invoke(
            &txline_ix,
            &[
                ctx.accounts.daily_scores_merkle_roots.to_account_info(),
                ctx.accounts.txline_program.to_account_info(),
            ],
        )?;

        pool.settled = true;
        pool.winning_side = winning_side;
        Ok(())
    }

    // F95N SECURITY FIX — `settle_knockout_tab` removed.
    //
    // The previous instruction accepted `pen_winner_side: u8` as a CLIENT argument and only
    // proved the regulation tie via CPI. A caller could therefore settle a penalty-shootout
    // match on the WRONG side (the pen winner was never attested on-chain) and drain the
    // parimutuel pool — CRITICAL (audit F95N C-01).
    //
    // A penalty-shootout winner that TxLINE can prove is now settled through the standard
    // `settle` instruction using the pen-goal stat proof (keys 5001/5002): `winning_side` is
    // derived from the CPI predicate, never from the client. When TxLINE cannot prove the pen
    // winner, no settle is possible and the pool stays refundable via `refund_all` —
    // fail-closed, no payout on unproven data.

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let position = &mut ctx.accounts.position;
        guards::check_claim_guards(
            pool.settled,
            &pool.side_totals,
            pool.winning_side,
            position.claimed,
            position.side,
        )?;

        let side_total = pool.side_totals[pool.winning_side as usize];
        let payout = guards::parimutuel_payout(position.amount, pool.total_deposited, side_total)?;

        transfer_from_vault(
            &ctx.accounts.vault,
            &ctx.accounts.claimer_token_account,
            &ctx.accounts.pool,
            &ctx.accounts.token_program,
            payout,
        )?;

        position.claimed = true;
        Ok(())
    }

    /// UNMATCHED pool (<=1 funded side): full stake return after kickoff, no settle/CPI.
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let pool = &ctx.accounts.pool;
        let clock = Clock::get()?;
        guards::check_refund_unmatched_guards(
            pool.settled,
            &pool.side_totals,
            clock.unix_timestamp,
            pool.kickoff_ts,
            ctx.accounts.position.claimed,
            ctx.accounts.position.amount,
        )?;

        refund_full_position(
            pool,
            &mut ctx.accounts.position,
            &ctx.accounts.vault,
            &ctx.accounts.claimer_token_account,
            &ctx.accounts.token_program,
        )
    }

    /// PARIMUTUEL pool settled on a winning issue with zero liquidity — full refunds.
    pub fn refund_all(ctx: Context<Refund>) -> Result<()> {
        let pool = &ctx.accounts.pool;
        guards::check_refund_all_guards(
            pool.settled,
            &pool.side_totals,
            pool.winning_side,
            ctx.accounts.position.claimed,
            ctx.accounts.position.amount,
        )?;

        refund_full_position(
            pool,
            &mut ctx.accounts.position,
            &ctx.accounts.vault,
            &ctx.accounts.claimer_token_account,
            &ctx.accounts.token_program,
        )
    }
}

/// Count sides with deposits > 0. Deposits close at kickoff so totals are fixed post-kickoff.
pub fn funded_side_count(side_totals: &[u64; 3]) -> u8 {
    side_totals.iter().filter(|&&x| x > 0).count() as u8
}

/// UNMATCHED when at most one outcome has liquidity (no real parimutuel counterparty).
pub fn is_unmatched_pool(side_totals: &[u64; 3]) -> bool {
    funded_side_count(side_totals) <= 1
}

fn refund_full_position<'info>(
    pool: &Account<'info, Pool>,
    position: &mut Account<'info, UserPosition>,
    vault: &Account<'info, TokenAccount>,
    claimer_token_account: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
) -> Result<()> {
    require!(!position.claimed, EscrowError::AlreadyClaimed);
    let payout = position.amount;
    require!(payout > 0, EscrowError::ZeroPayout);

    transfer_from_vault(
        vault,
        claimer_token_account,
        pool,
        token_program,
        payout,
    )?;

    position.claimed = true;
    Ok(())
}

fn transfer_from_vault<'info>(
    vault: &Account<'info, TokenAccount>,
    claimer_token_account: &Account<'info, TokenAccount>,
    pool: &Account<'info, Pool>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    let fixture_bytes = pool.fixture_id.to_le_bytes();
    let pool_seeds = &[
        b"pool".as_ref(),
        fixture_bytes.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&pool_seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: vault.to_account_info(),
                to: claimer_token_account.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer,
        ),
        amount,
    )
}

pub const MIN_DEPOSIT: u64 = 10_000; // 0.01 USDC (6 decimals)

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub fixture_id: u64,
    pub kickoff_ts: i64,
    pub settled: bool,
    pub winning_side: u8,
    pub total_deposited: u64,
    pub side_totals: [u64; 3],
    pub bump: u8,
    pub vault_bump: u8,
}

impl Pool {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1 + 1 + 8 + (8 * 3) + 1 + 1;
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub side: u8,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}

impl UserPosition {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1 + 1;
}

#[derive(Accounts)]
#[instruction(fixture_id: u64, kickoff_ts: i64)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        constraint = usdc_mint.key() == DEVNET_USDC_MINT @ EscrowError::InvalidUsdcMint
    )]
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        space = Pool::LEN,
        seeds = [b"pool", fixture_id.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = authority,
        space = 165,
        seeds = [b"vault", fixture_id.to_le_bytes().as_ref()],
        bump,
        owner = token_program.key(),
    )]
    /// CHECK: spl-token vault PDA — initialized via initialize_account3 in handler
    pub vault: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = depositor,
        space = UserPosition::LEN,
        seeds = [b"position", pool.key().as_ref(), depositor.key().as_ref()],
        bump
    )]
    pub position: Account<'info, UserPosition>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"pool", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        seeds = [b"vault", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), depositor.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == depositor.key() @ EscrowError::Unauthorized
    )]
    pub position: Account<'info, UserPosition>,
    #[account(
        mut,
        constraint = depositor_token_account.mint == DEVNET_USDC_MINT @ EscrowError::InvalidUsdcMint,
        constraint = depositor_token_account.owner == depositor.key() @ EscrowError::Unauthorized,
        constraint = vault.mint == DEVNET_USDC_MINT @ EscrowError::InvalidUsdcMint,
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    /// CHECK: TxLINE daily scores Merkle roots PDA (validated by TxLINE program).
    pub daily_scores_merkle_roots: UncheckedAccount<'info>,
    /// CHECK: TxLINE program id
    #[account(address = TXLINE_PROGRAM_ID)]
    pub txline_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(
        seeds = [b"pool", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        seeds = [b"vault", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), claimer.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == claimer.key() @ EscrowError::Unauthorized
    )]
    pub position: Account<'info, UserPosition>,
    #[account(
        mut,
        constraint = claimer_token_account.mint == vault.mint @ EscrowError::InvalidUsdcMint,
        constraint = claimer_token_account.owner == claimer.key() @ EscrowError::Unauthorized,
        constraint = vault.mint == DEVNET_USDC_MINT @ EscrowError::InvalidUsdcMint,
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(
        seeds = [b"pool", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        seeds = [b"vault", pool.fixture_id.to_le_bytes().as_ref()],
        bump = pool.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), claimer.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == claimer.key() @ EscrowError::Unauthorized
    )]
    pub position: Account<'info, UserPosition>,
    #[account(
        mut,
        constraint = claimer_token_account.mint == vault.mint @ EscrowError::InvalidUsdcMint,
        constraint = claimer_token_account.owner == claimer.key() @ EscrowError::Unauthorized,
        constraint = vault.mint == DEVNET_USDC_MINT @ EscrowError::InvalidUsdcMint,
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum EscrowError {
    #[msg("Kickoff must be in the future")]
    KickoffInPast,
    #[msg("Invalid side (0=home,1=draw,2=away)")]
    InvalidSide,
    #[msg("Deposit below minimum")]
    DepositTooSmall,
    #[msg("Pool already settled")]
    PoolSettled,
    #[msg("Pool closed for deposits")]
    PoolClosed,
    #[msg("Side mismatch on additional deposit")]
    SideMismatch,
    #[msg("Pool not settled yet")]
    PoolNotSettled,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Not on winning side")]
    NotWinner,
    #[msg("Winning side has no deposits")]
    EmptyWinningSide,
    #[msg("Zero payout")]
    ZeroPayout,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Already settled")]
    AlreadySettled,
    #[msg("Too early to settle")]
    TooEarly,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Parimutuel pool active — use claim or refund_all")]
    ParimutuelActive,
    #[msg("Unmatched pool — use refund instead of settle/claim")]
    UnmatchedPoolUseRefund,
    #[msg("Winning side has liquidity — use claim")]
    WinningSideFunded,
    #[msg("Void result on unfunded issue — use refund_all")]
    VoidResultUseRefundAll,
    #[msg("Invalid TxLINE validate_stat instruction data")]
    InvalidTxlineIx,
    #[msg("Fixture id in CPI does not match pool")]
    FixtureMismatch,
    #[msg("Predicate is not a valid 1X2 outcome")]
    InvalidPredicate,
    #[msg("USDC mint must be Circle devnet canonical")]
    InvalidUsdcMint,
}
