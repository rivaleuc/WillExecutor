# WillExecutor

**A digital will whose conditions are written in plain language and checked against live data — no lawyer, no manual trigger.**

WillExecutor lets you encode an inheritance condition in natural language ("if this obituary page goes live", "if this account is inactive for a year") together with a URL the contract can read. Anyone can poke the will to re-check; GenLayer validators fetch the referenced data and judge whether the condition is met, flipping the will to triggered by consensus. A separate read method exposes the trigger state so downstream systems (or an EVM payout contract) can act on it.

- **Contract (Bradbury, chain 4221):** `0x43c905a68c4f3aD67937eE9401E305B1f7f05f55`
- **Explorer:** https://explorer-bradbury.genlayer.com/contract/0x43c905a68c4f3aD67937eE9401E305B1f7f05f55
- **Live app:** https://willexecutor.pages.dev

## What it does

The `WillExecutor` contract has two writes and three views:

1. **`create_will(conditions, beneficiary, check_url)`** — stores a JSON will (owner address, conditions ≤2000 chars, beneficiary, check URL, `triggered: False`, `checks: 0`) in `wills: TreeMap[str, str]` keyed by an incrementing `will_count`. Returns the key.
2. **`check_conditions(key)`** — refuses if already triggered, then runs the non-deterministic check. The leader function calls `gl.nondet.web.get(will["check_url"]).body.decode("utf-8")` to pull the live context (truncated to 4000 chars), then `gl.nondet.exec_prompt(prompt, response_format="json")` to decide if the plain-language conditions are satisfied, returning `{"conditions_met": bool, "reasoning": "..."}`. Consensus runs via `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`; `validator_fn` accepts a `gl.vm.Return` only if `conditions_met` is a bool. The check counter increments, reasoning is stored, and if met the will flips `triggered = True`.
3. **`get_will(key)`** — view returning the full will record (or `{"exists": False}`).
4. **`read_trigger(key)`** — view returning `{"triggered": bool, "beneficiary": ...}`, the minimal surface a payout contract needs.
5. **`stats()`** — view returning `{"total_wills": <int>}`.

## Why GenLayer

A deterministic VM can't evaluate "has this condition come true?" when the condition is English and the evidence is a live web page. Smart-contract wills today rely on hardcoded oracles or a dead-man's switch; neither can read an obituary or interpret "inactive for a year."

GenLayer's Optimistic Democracy makes the trigger trustworthy: the leader fetches the data and proposes met/not-met, and independent validators each re-fetch and re-judge, finalising only if `validator_fn` passes. No single party — not even the owner — can fake the trigger.

Use GenLayer when the firing condition is interpretive and grounded in real-world data. Use a backend or a fixed oracle when the trigger is a deterministic on-chain event.

## Architecture

| Contract (GenLayer) | Frontend | EVM / off-chain |
| --- | --- | --- |
| `executor/will_executor.py` | `executor/app` (React + Vite) | none on-chain; `read_trigger` is the hook an EVM payout/settlement layer would consume |

## Tech

- **GenVM Python**, pinned to `py-genlayer:1jb45aa8…jpz09h6` via the `Depends` header. Wills are JSON-encoded into a `TreeMap[str, str]` with a `u256` counter; `read_trigger` exposes a slimmed view for external consumers.
- **Frontend** reads with `genlayer-js` (`createClient({ chain: testnetBradbury })` → `readContract`) and writes via **MetaMask without the snap** — it calls `wallet_switchEthereumChain` / `wallet_addEthereumChain` to put the wallet on Bradbury (chain `4221`, hex `0x107d`) and signs with `writeContract`, awaiting a `FINALIZED` receipt.
- **UI:** React 19 + Vite + Tailwind v4 with `framer-motion` and `sonner`. The app is a will manager: create a will with plain-language conditions and a check URL, run a condition check, and watch the triggered flag and validator reasoning.

## Project structure

```
WillExecutor/
├── executor/
│   ├── will_executor.py      ← GenLayer contract (WillExecutor)
│   └── app/                  ← production frontend
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig*.json
│       ├── public/           ← favicon.svg, icons.svg
│       └── src/
│           ├── App.tsx       ← UI
│           ├── genlayer.ts   ← client, wallet, read/write helpers
│           ├── main.tsx
│           └── index.css
└── README.md
```

## Develop

```bash
cd executor/app
npm install
npm run dev      # local dev server (Vite)
npm run build    # type-check + production build to dist/
```

## Deploy the frontend

Cloudflare Pages:

- **Root directory:** `executor/app`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment:** `NODE_VERSION=20`

## Why GenLayer (engineering notes)

- **`gl.nondet.web.get` vs `render`.** This contract uses `.get(url).body.decode("utf-8")` (raw HTTP body) rather than `render(mode="text")`, suited to structured/JSON endpoints; it's wrapped in try/except with a `"(no data)"` fallback so an unreachable URL doesn't revert the check.
- **Triggers are one-way.** `check_conditions` raises if `triggered` is already true, so once the will fires it can't be flipped back or re-judged — important for anything reading `read_trigger` to settle funds.
- **Minimal external read surface.** `read_trigger` returns only `triggered` + `beneficiary`, keeping the payout integration decoupled from the full (and larger) will record.
- **`validator_fn` pins the type.** It only accepts a `gl.vm.Return` whose `conditions_met` is a genuine bool; a string `"true"` or missing field fails consensus rather than triggering inheritance by accident.
- **TreeMap holds serialized JSON** — `json.loads` → mutate → `json.dumps` on every write.

## License

MIT
