# Enterprise intranet MVP with OpenClaw

This guide shows the smallest practical way to adapt OpenClaw for an enterprise intranet where outbound internet access is restricted and model quality is close to open source baselines.

## Design goals

- Keep only a local web entrypoint for the first rollout.
- Route all model calls to an internal OpenAI-compatible endpoint.
- Disable risky or internet-dependent defaults.
- Use coarse grained internal tools that hide API complexity from weaker models.

## Step 1: generate a safe baseline config

Run this helper script from the repository root:

```bash
node --import tsx scripts/intranet-mvp-config.ts \
  --base-url http://llm-gateway.internal/v1 \
  --api-key "YOUR_INTERNAL_API_KEY" \
  --model qwen2.5-32b-instruct
```

This writes `~/.openclaw/openclaw.intranet.json` with these defaults:

- `model.provider = openai` and `model.baseURL` pointing to intranet LLM gateway
- update checks disabled
- external chat channels disabled (`whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`)
- risky/default internet-facing skills disabled (`shell`, `browser`, `web_search`)
- short context window (`agents.defaults.maxHistoryMessages`) to reduce weak model drift
- explicit skill allowlist with two placeholder internal tools

## Step 2: create coarse grained internal tools

For weak model backends, do not expose low level HTTP tools. Instead create business tools such as:

- `internal_ticket_lookup(ticket_id)`
- `internal_wiki_answer(query)`

The model should only decide intent and parameters. Authentication, retries, and API joins should stay in tool code.

## Step 3: run OpenClaw in intranet mode

```bash
openclaw gateway run --config ~/.openclaw/openclaw.intranet.json
```

For first launch, use OpenClaw Web UI as the primary entrypoint, then add internal IM channel plugins later.

## Step 4: production hardening checklist

- Point package manager mirrors to private registry for air gapped deployments.
- Keep skills in allowlist mode per agent.
- Add confirmation flow for write operations such as create or approve actions.
- Keep prompt history at 5 to 10 turns for weak model stability.
- Enable audit logging on every tool call.

## Quick rollout plan

1. Week 1: run single node PoC and validate model plus Web UI loop.
2. Week 2: implement two high-frequency internal tools.
3. Week 3: connect one internal IM channel and pilot in one engineering team.
