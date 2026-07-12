#!/usr/bin/env python3
"""F72N — Full MCP tool battery (prod). Run before telling owner/Claude 'it works'."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://hypernatt.com/mcp-pundit/protocol"
FINISHED_FIXTURE = "18179759"
SCHEDULED_FIXTURE = "18179551"
TEST_WALLET = "Eygd1V74pe9wNzsApnfWhFF1L9SMtBsLCGPNc17m834f"
DUMMY_WALLET = "11111111111111111111111111111111"


def post(payload: dict, session_id: str | None = None) -> tuple[int, str, str | None]:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["mcp-session-id"] = session_id
    req = urllib.request.Request(
        BASE,
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return resp.status, resp.read().decode(), resp.headers.get("mcp-session-id")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode(), err.headers.get("mcp-session-id")


def parse_body(body: str) -> dict:
    for line in body.splitlines():
        if line.startswith("data: "):
            try:
                return json.loads(line[6:])
            except json.JSONDecodeError:
                pass
    body = body.strip()
    if body.startswith("{"):
        return json.loads(body)
    return {}


def tool_text(parsed: dict) -> str:
    try:
        return parsed["result"]["content"][0]["text"]
    except (KeyError, IndexError, TypeError):
        return json.dumps(parsed)[:500]


def init_session() -> str:
    status, _, sid = post(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "smoke-full-battery", "version": "1.0"},
            },
        }
    )
    if status != 200 or not sid:
        raise RuntimeError(f"init failed status={status}")
    post({"jsonrpc": "2.0", "method": "notifications/initialized"}, session_id=sid)
    return sid


def call_tool(sid: str, name: str, arguments: dict | None = None) -> tuple[bool, str]:
    status, body, _ = post(
        {
            "jsonrpc": "2.0",
            "id": 99,
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments or {}},
        },
        session_id=sid,
    )
    parsed = parse_body(body)
    text = tool_text(parsed)
    if status != 200:
        return False, f"http_{status} {text[:300]}"
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return False, f"non_json {text[:300]}"
    if data.get("isError") or data.get("error"):
        return False, text[:400]
    if parsed.get("result", {}).get("isError"):
        return False, text[:400]
    return True, text


def main() -> int:
    results: list[tuple[str, bool, str]] = []
    sid = init_session()

    # tools/list gate
    _, body, _ = post(
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        session_id=sid,
    )
    listed = parse_body(body)
    tools = listed.get("result", {}).get("tools", [])
    list_ok = len(tools) == 16
    results.append(("tools/list", list_ok, f"count={len(tools)}"))

    cpi_args_full: dict | None = None

    def run(name: str, args: dict | None = None, check=None):
        ok, detail = call_tool(sid, name, args)
        if ok and check:
            try:
                data = json.loads(detail)
                ok = bool(check(data))
                if not ok:
                    detail = f"check_failed keys={list(data.keys())[:8]}"
            except Exception as exc:
                ok = False
                detail = f"check_exc {exc}"
        results.append((name, ok, detail[:200] if len(detail) > 200 else detail))
        return ok

    run("get_pundit_manifest", {"locale": "en"}, lambda d: d.get("version") == "0.3.0")
    run("get_wc_fixtures", {"limit": 5}, lambda d: d.get("ok") and len(d.get("data", {}).get("fixtures", [])) > 0)
    run("get_settlement_proof", {"fixture_id": FINISHED_FIXTURE}, lambda d: d.get("ok"))
    run("verify_settlement_proof", {"fixture_id": FINISHED_FIXTURE}, lambda d: d.get("ok"))
    run("get_escrow_pool", {"fixture_id": FINISHED_FIXTURE}, lambda d: d.get("ok"))

    run("get_match_edge", {"fixture_id": SCHEDULED_FIXTURE, "agent_wallet": TEST_WALLET}, lambda d: d.get("ok"))
    run("get_edge_summary", {"agent_wallet": TEST_WALLET}, lambda d: d.get("ok"))
    run("get_match_odds", {"fixture_id": SCHEDULED_FIXTURE, "agent_wallet": TEST_WALLET}, lambda d: d.get("ok"))
    run("get_live_scores", {"fixture_id": SCHEDULED_FIXTURE, "agent_wallet": TEST_WALLET}, lambda d: d.get("ok"))

    ok_cpi, cpi_raw = call_tool(
        sid,
        "get_cpi_settle_args",
        {"fixture_id": FINISHED_FIXTURE, "outcome": "home", "agent_wallet": TEST_WALLET},
    )
    if ok_cpi:
        try:
            cpi_wrap = json.loads(cpi_raw)
            cpi_args_full = cpi_wrap.get("cpi_args") or cpi_wrap
            ok_cpi = bool(cpi_args_full)
        except json.JSONDecodeError:
            ok_cpi = False
    results.append(("get_cpi_settle_args", ok_cpi, (cpi_raw[:200] if cpi_raw else "")[:200]))

    run(
        "build_escrow_create_pool_tx",
        {
            "fixture_id": "99999999",
            "kickoff_at": "2026-12-01T20:00:00.000Z",
            "agent_wallet": DUMMY_WALLET,
        },
        lambda d: d.get("transaction_base64"),
    )
    run(
        "build_escrow_deposit_tx",
        {
            "fixture_id": SCHEDULED_FIXTURE,
            "outcome": "home",
            "amount_usdc": 0.01,
            "agent_wallet": TEST_WALLET,
        },
        lambda d: d.get("transaction_base64"),
    )

    # partial cpi_args must fail with explicit message (not undefined crash)
    ok_bad, bad_detail = call_tool(
        sid,
        "build_escrow_settle_tx",
        {
            "fixture_id": FINISHED_FIXTURE,
            "outcome": "home",
            "agent_wallet": TEST_WALLET,
            "cpi_args": {"fixtureSummary": {"fixtureId": 1}},
        },
    )
    bad_ok = (not ok_bad) and "cpi_args" in bad_detail and "missing" in bad_detail.lower()
    results.append(("build_escrow_settle_tx_partial_cpi", bad_ok, bad_detail[:160]))

    if cpi_args_full:
        run(
            "build_escrow_settle_tx",
            {
                "fixture_id": FINISHED_FIXTURE,
                "outcome": "home",
                "agent_wallet": TEST_WALLET,
                "cpi_args": cpi_args_full,
            },
            lambda d: d.get("transaction_base64"),
        )
    else:
        results.append(("build_escrow_settle_tx", False, "skipped_no_cpi_args"))

    run(
        "get_fixture_agent_status",
        {"fixture_id": SCHEDULED_FIXTURE, "agent_wallet": TEST_WALLET},
        lambda d: d.get("ok") and "next_action" in d,
    )

    ok_bad_submit, bad_submit = call_tool(
        sid,
        "submit_signed_escrow_tx",
        {
            "signed_transaction_base64": "not-valid",
            "agent_wallet": TEST_WALLET,
        },
    )
    bad_submit_ok = (not ok_bad_submit) and "submit" in bad_submit.lower()
    results.append(("submit_signed_escrow_tx_invalid", bad_submit_ok, bad_submit[:160]))

    run(
        "build_escrow_claim_tx",
        {"fixture_id": FINISHED_FIXTURE, "agent_wallet": TEST_WALLET},
        lambda d: d.get("transaction_base64"),
    )

    fails = 0
    print("=== Natt Pundit MCP full battery ===")
    print("endpoint", BASE)
    for name, ok, detail in results:
        if not ok:
            fails += 1
        print(f"{'PASS' if ok else 'FAIL':4} {name:40} {detail}")

    print(f"\nVERDICT {'PASS' if fails == 0 else 'FAIL'} ({len(results) - fails}/{len(results)})")
    return 0 if fails == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
