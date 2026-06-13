# WillExecutor

WillExecutor is a decentralized digital will system on GenLayer. Write conditions in plain language, specify a beneficiary and a URL to check against. Anyone can periodically trigger a condition check. When AI validators confirm the conditions are met, the will is triggered and the beneficiary can claim the assets.

## Why GenLayer

Will conditions like "if I don't commit to GitHub for 180 days" require fetching live data and interpreting activity patterns. A deterministic VM cannot check a GitHub profile and decide if someone has been inactive. GenLayer validators fetch the context URL, assess the conditions against real-world state, and reach consensus on whether the trigger has occurred.

## Deployed

**GenLayer (Bradbury):** `0xB0A44D12b898C641f2DD3d97c5268be076a56B80`

## Test

Created will: "If no commits for 180 days, transfer to beneficiary" (check_url: github.com/rivaleuc) → triggered: false, conditions not met yet.

## Structure

```
WillExecutor/
├── executor/
│   ├── will_executor.py  ← GenLayer contract
│   └── index.html        ← Frontend
└── .gitignore
```
