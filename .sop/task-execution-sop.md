# 任务执行标准作业程序（SOP）

> MEV Engine v6.5 — 1条预检命令 + 9强制门控 + 信任但验证
> 规则：强制门控必须在对话中显式输出。跳过需标注原因。

---

## 一、执行模型

```
PHASE 1: PRE-FLIGHT
  node scripts/mev-prefight.cjs（一条命令跑G1+G2+G3）
  G4(显式): 级别+Agent E+Context预算
  G5(显式): 缺口扫描表
    ↓
PHASE 2: DELIVERY
  G5.5(显式): Agent E验证（Agent E完成后）
  G6(显式): IMA上传 + 降级保底
  G7(显式): ≥3条可证伪判断
  G8(显式): 来源分级
```

---

## 二、PHASE 1：PRE-FLIGHT

### G1-G3：统一预检命令
```bash
node scripts/mev-prefight.cjs
```
一次调用覆盖：框架版本、Tavily可用性、当前时间。输出JSON。

### G4：级别与分流
```
📊 级别: L{1|2|3}
🔀 Agent E分流: {是|否|N/A}
📉 Context预算: {green|yellow|red}%
```
- Context>50%或≥4子代理 → Agent E=是
- Context>100% → Agent E强制

### G5：缺口扫描
```
| 已知确信 | 明确未知 | 优先级 | 采集方向 |
|----------|----------|:------:|----------|
```
≥3缺口 → 进入采集。检查采集方向在当前搜索状态下是否可行。

---

## 三、G5.5：Agent E验证（新增）

```
🔍 E-VERIFY
[✅/❌] 上传JSON有效: ima-upload返回 {"ok":true}
[✅/❌] 可证伪判断数: {n} (≥3)
[✅/❌] 来源分级: A={n}, B={n}, C={n} (A+B>0)
→ PASS / PASS with note / FAIL (重新派Agent E)
```

**目的：防止盲目信任Agent E输出。仅验证数量指标，不验证内容质量。**

---

## 四、PHASE 2：DELIVERY

### G6：IMA上传 + 降级保底
```
[✅/❌] ima-upload → {KB_ID}
       🆘 失败降级: 保存本地 → 推送本地路径
```

### G7：可证伪判断
```
≥3条。格式：「判断X：…… 支撑：…… 可证伪条件：……」
```

### G8：来源分级
```
A级(n): ... | B级(n): ... | C级(n): ...
最低要求：A+B > 0
```

---

## 五、跳过规则

| 条件 | 跳哪些 |
|:------|:------|
| L1任务 | G4-G8 |
| Cron隔离 | G4 Agent E=N/A |
| 无搜索 | G2=N/A（preflight自动检测） |
| 无IMA上传 | G6=N/A |
| 未启动Agent E | G5.5=N/A |

---

## 六、场景能力（非强制）
偏误快检 / 迭代循环 / 多Agent并行 / Evolve教训 → 根据场景判断

## 七、Cron规则
禁止子代理 / 禁止写lessons / 交付前自检 / failureAlert配置

## 八、模型选择
默认Flash，Pro仅石冰指定

---

> v6.5: 统一preflight命令+Agent E验证+IMA降级+Context门控
