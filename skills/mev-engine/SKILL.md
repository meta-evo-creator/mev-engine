---
name: mev-engine
description: |
  MEV Engine v7.1 — Stage Checkpoint: five-layer receipts → durable resume + interrupt recovery. Zero new dependencies.
homepage: https://github.com/meta-evo-creator/mev-engine
version: 7.1.1
metadata:
  openclaw:
    emoji: ⚙️
    requires:
      bins: [python]
      env: []
---

# MEV Engine v7.1 ⚙️

> **v7.1: 新增 Stage Checkpoint 插件。五层回执 → 耐久化 + 中断恢复。零新依赖。**

## Architecture

```
┌─────────────────────────────────┐
│         核心内核（不可变）         │
│  SOUL.md: 身份+铁律+MEV骨架+工具表│
│  TOOLS.md: 工具选择+护栏          │
│  AGENTS.md: 工作区规则            │
│  MEMORY.md: 长期记忆              │
└────────────┬────────────────────┘
             │
    ┌────────┼────────┐
    ↓        ↓        ↓
┌────────┐┌────────┐┌────────────┐
│ active  ││ scene  ││ dormant     │
│ (常加载) ││ (按需)  ││ (休眠参考)  │
├────────┤├────────┤├────────────┤
│·cron规则││·深度调研 ││·Forum协作  │
│·工具唤醒││·证据链  ││·Report IR  │
│·核心less││·偏误检查││·Agent并行  │
│·搜索降级││·合规分析││           │
│·阶段存档││          ││           │
└────────┘└────────┘└────────────┘
```

## Lifecycle

```
新能力 → scene/ (30天试用)
  ↓ 触发≥3次
active/ ← 常加载
  ↓ 30天未触发
dormant/ ← 休眠
  ↓ 同类问题复现
scene/ ← 重新激活
```

## When to Use
Non-trivial tasks / Research / Cron / Multi-agent

## When NOT to Use
Simple Q&A / File-only / User says "skip"

---

## Execution

### Step 0: Kernel Boot (mandatory, unskippable)

```bash
node scripts/mev-prefight.cjs
```

Output required in delivery:
```
🔒 G0 PREFLIGHT
[✅/❌] Framework: v{version}
[✅/❌] Search: {full/rate_limited/degraded}
[✅/❌] Time: {ISO timestamp} Asia/Shanghai
→ {FULL | DEGRADED_OK | DEGRADED}
```

### Step 1: Tier + Plugin Activation

```
📊 Tier: L{1|2|3}
🔌 Plugins: {auto-detected from task context}
```

| Task Type | Auto-activate |
|:----------|:-------------|
| Cron isolated | active/cron-rules + scene/stage-checkpoint |
| L2 analysis | scene/stage-checkpoint |
| L3 research | scene/deep-research + scene/stage-checkpoint |
| Compliance analysis | scene/compliance-research + scene/stage-checkpoint |
| Task resume (interrupted) | scene/stage-checkpoint (强制激活) |

### Step 1.5: Stage Checkpoint (scene plugin)

> 插件：`plugins/scene/stage-checkpoint.plugin.md`
> 设计来源：OPL Framework stage attempt ledger → MEV 轻量等价实现

**核心机制：** 每层完成后写入结构化 receipt 到 `memory/checkpoints/{task-id}.md`，中断后可 resume。

| Tier | 行为 |
|:----:|:-----|
| L1 | 跳过 |
| L2 | 每层写入 receipt |
| L3 | 每层写入 receipt + 支持 resume |

**启动时：** 检查 `memory/checkpoints/{task-id}.md`，若存在则从断点 resume。

### Step 2: MEV Five Layers

Suit → Sense → Think → Optimize → Evolve (见 SOUL.md 内核)

每层完成后写入该层 receipt（见 stage-checkpoint 插件）。

### Step 3: Delivery Gates

```
🔒 DELIVERY CHECK
[✅/❌] G0 Preflight: {result}
[✅/❌] G6 IMA upload: {kb_name}
[✅/❌] G7 Falsifiable: {n}/≥3
[✅/❌] G8 Sources: A:{n} B:{n} C:{n}
```

---

## Gate Skip Rules

| Condition | Skip | Reason |
|:----------|:-----|:------|
| L1 task | G4-G8 | Annotate |
| Cron isolated | No sub-agents | Auto-rule |
| No search needed | G2=N/A | Preflight auto-detect |
| No IMA upload | G6=N/A | Annotate |

---

## Scripts

| Script | Purpose |
|:-------|:--------|
| `scripts/mev-prefight.cjs` | G1+G2+G3 unified preflight |
| `scripts/framework-check.cjs` | Version + integrity (24h cache) |
| `scripts/tavily-probe.cjs` | Tavily MCP availability |
| `scripts/ima-upload.cjs` | IMA KB upload |

---

## Changelog

| Version | Date | Changes |
|:----|:----|------|
| v6.5 | 05-12 | Trust-but-verify: unified preflight, Agent E verify, IMA fallback |
| **v7.0** | **05-13** | **Kernel+Plugin architecture. Core immutable, capabilities as plugins, auto-dormancy lifecycle. MEV skeleton preserved, specific rules moved to plugins.** |
| **v7.1** | **05-14** | **Stage checkpoint plugin (scene). Five-layer receipts → durable resume. Interrupt recovery for cron + L2/L3. Zero new dependencies. Inspired by OPL Framework stage attempt ledger.** |
