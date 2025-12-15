阿贵，小可爱给你整理成**结构清晰、可直接用于阅读或仓库 README 的 Markdown 文档**，你可以直接复制使用👇

---

# Eg-Walker 算法实现解析（基于论文与参考代码）

## 概述

Eg-Walker 是一种基于 **事件图 (Event Graph)** 的协同文本编辑算法，通过 **prepare/effect 双状态** 和 **版本 time-travel 机制**，实现比传统 CRDT 更自然的合并、更高性能和更小的存储。

该文档基于以下材料整理：

* 论文：[https://arxiv.org/abs/2409.14252](https://arxiv.org/abs/2409.14252)
* 参考实现代码：[https://github.com/josephg/eg-walker-reference](https://github.com/josephg/eg-walker-reference)

---

# 核心思想

Eg-Walker 的设计围绕以下核心理念：

1. **事件图（Event Graph）管理版本因果关系**
   每个操作都是一个事件，且维护 parent_version。

2. **prepare-state / effect-state 分离**

   * effect：最终用户看到的文档（纯文本，无 CRDT 元数据）
   * prepare：临时用于计算插入位置的内部状态

3. **retreat / advance（时光旅行）**
   内部 CRDT 可随事件 parent_version 前进或后退，使插入位置更加稳定可靠。

4. **CRDT 仅作为内部辅助工具**
   插入排序仍依赖 RGA 等已有 CRDT 实现，但不进入最终文本结构。

---

# 数据结构

## AugmentedCRDTItem

```ts
enum PREPARE_STATE {
  NOT_YET_INSERTED = 0,
  INSERTED = 1,
  // 2+ 表示该项目被并发删除过 n−1 次
}

type AugmentedCRDTItem = {
  id,
  originLeft,
  originRight,

  // effect state：是否在最终文档中被删除
  ever_deleted: bool,

  // prepare state：由 retreat/advance 控制
  prepare_state: uint,
}
```

### prepare_state 的语义

| prepare_state | 表示               |
| ------------- | ---------------- |
| 0             | 当前版本中不可见         |
| 1             | 当前版本中可见          |
| 2+            | 表示历史上曾被删除（n−1 次） |

---

# diff(v1, v2)

用于计算两个版本的差异，帮助内部 CRDT **前进/回退到目标版本**。

```ts
fn diff(v1, v2) -> (only_in_v1, only_in_v2) {
  let all_events_v1 = {v1 中的事件 + 其所有因果前驱}
  let all_events_v2 = {v2 中的事件 + 其所有因果前驱}

  return (
    set_subtract(all_events_v1 - all_events_v2),
    set_subtract(all_events_v2 - all_events_v1)
  )
}
```

结果：

* `only_in_v1` → retreat（prepare_state--）
* `only_in_v2` → advance（prepare_state++）

---

# 文档生成流程：`generateDocument(events)`

```ts
fn generateDocument(events) {
  let cur_version = {}     // 当前游标版本
  let crdt = []            // AugmentedCRDTItems
  let resulting_doc = ""   // 输出文本

  for e in events.iter_in_causal_order() {

    // --- Phase 1: Prepare ---
    let (a, b) = diff(cur_version, e.parent_version)

    for e in a {            // retreat
      let item = crdt.find_item_by_id(e.id)
      item.prepare_state -= 1
    }

    for e in b {            // advance
      let item = crdt.find_item_by_id(e.id)
      item.prepare_state += 1
    }

    // --- Phase 2: Apply ---
    if e.type == Insert {

      // 1. 基于 prepare_state 寻找插入位置
      let ins_pos = idx_of(crdt, e.pos, PREPARE_STATE)

      // 2. 找 originLeft / originRight
      let origin_left = prev_item(ins_pos).id or START
      let origin_right = next_item(crdt, ins_pos, item => item.prepare_state >= 1).id or END

      // 3. 使用 RGA 等 CRDT 进行插入排序
      crdt_integrate(crdt, {
        id: e.id,
        origin_left,
        origin_right,
        ever_deleted: false,
        prepare_state: 1
      })

      // 4. 写入 effect-state 文档
      let effect_pos = crdt[0..ins_pos].map(space_in_effect_state).sum()
      resulting_doc.splice_in(effect_pos, e.contents)

    } else {
      // Delete

      // 跳过 prepare_state != INSERTED 的节点
      let idx = idx_of(crdt, e.pos, PREPARE_STATE)
      while crdt[idx].prepare_state != INSERTED { idx += 1 }

      // 标记删除
      crdt[idx].ever_deleted = true
      crdt[idx].prepare_state += 1

      // effect-state 删除
      let effect_pos = crdt[0..idx].map(space_in_effect_state).sum()
      resulting_doc.delete_at(effect_pos)
    }

    cur_version = { e.id }
  }

  return resulting_doc
}
```

---

# 运行机制分析

## 1. Prepare Phase：对版本对齐

通过 retreat / advance 的处理，使内部 CRDT 进入：

> **“事件 e 发生时的历史上下文”**

从而保证插入位置计算更稳定。

## 2. Apply Phase：执行事件

insert：

* 基于 prepare_state 计算位置
* 通过 CRDT 排序解决并发
* 写入 effect 文本（只看 ever_deleted）

delete：

* 找 prepare_state==1 的第一项
* 增加删除计数
* 从 effect 文本中实际删除

---

# Eg-Walker 的优点总结

### ✔ 1. 合并结果更符合用户直觉

prepare-state 使位置计算不再漂移。

### ✔ 2. 性能更高

effect 文档是无元数据的纯文本。

### ✔ 3. 存储占用更小

CRDT 结构不进入最终文档，仅存在内存。

### ✔ 4. 支持任意版本 time-travel

基于 diff + prepare_state 实现。

### ✔ 5. 处理多次并发删除更自然

prepare_state 记录删除次数。

---

# 总结

Eg-Walker 的核心是：

> **事件图管理版本
> prepare/effect 分离
> CRDT 用于排序
> effect 文档保持纯净**

这使它比传统 CRDT（如 Yjs / Automerge）更轻量、更快、合并结果更合理。

---

阿贵，如果你需要，我还可以帮你继续：

* 画架构图
* 生成 Mermaid 流程图
* 做和 Yjs/Automerge 的技术比较表
* 写一个可运行的 JavaScript/TypeScript demo

你想继续扩展哪个部分？
