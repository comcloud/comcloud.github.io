---
title: "从 Harness 到 Alignment：长任务 Agent 真正难的不是模型，而是让它持续做对事情"
excerpt: "最近看 Anthropic 的《Harness design for long-running application development》，我真正记下来的不是「三 Agent 架构」这个形式，而是背后的工程判断：长任务 Agent 做……"
publishDate: "2026-09-28"
isFeatured: true
tags: 
  - "AI Agent"
  - "Harness"
  - "Alignment"
  - "Codex"
  - "工程实践"
issue: 63
---

最近看 Anthropic 的《Harness design for long-running application development》，我真正记下来的不是「三 Agent 架构」这个形式，而是背后的工程判断：**长任务 Agent 做不好，很多时候不是模型还不够聪明，而是我们没有给它一个足够好的工作环境。**

我自己最近也一直在折腾 Codex、Qwen、Qoder 这类编码 Agent。以前很容易把注意力放在模型能力上：谁更聪明、谁写代码更稳、是不是应该让 GPT 规划、Qwen 实现。看完这篇文章以后，我觉得这个问题应该换一种问法：

> 不要先问「哪个模型最强」，先问「这个任务需要怎样的 Harness，才能让模型持续做对事情」。

Anthropic 这次的实践里，我最认同五个点：

1. Planner 约束结果，不要过早约束路径；
2. 实现的人和验收的人分开；
3. 用 Sprint Contract 先定义「这一阶段怎样才算完成」；
4. Agent 之间用文件通信，而不是全靠上下文记忆；
5. Evaluator 需要不断调 Prompt，否则很容易变成一个「好好先生」。

这五点如果单独看，都不算复杂。真正有意思的是，把它们放在一起以后，它们形成了一套可以长期运行的 Agent 工程方法。

但同一天继续读 OpenAI 首席科学家 Jakub Pachocki 的《An Alien Mind》以后，我发现这件事还能再往上抽象一层。

Anthropic 讨论的是一个工程问题：**怎样让一个长任务 Agent 不跑偏、不假完成、能交接、能验收。**

OpenAI 讨论的是一个更大的问题：**当机器越来越强、越来越能参与自己的改进时，人类怎样确认它仍然在做我们真正希望它做的事，并且在陌生环境里也不偏离。**

一个是项目级 Harness，一个是系统级 Alignment。尺度不同，但结构惊人地相似。

这也是为什么我越来越喜欢一个类比：

> **Sprint Contract 像法律条文；Value Alignment 更像法律原则。**

条文负责把当前场景写清楚，原则负责处理条文没有覆盖的新场景。真正可靠的 Agent 系统，两者都不能少。

<style>
.agent-mermaid-wrap {
  overflow-x: auto;
  margin: 1.75rem 0;
  padding: 1rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 16px;
}
.agent-mermaid-wrap pre.mermaid {
  min-width: 720px;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
}
.agent-mermaid-caption {
  margin-top: -1rem;
  margin-bottom: 1.75rem;
  text-align: center;
  opacity: .68;
  font-size: .88em;
}
</style>

## 目录

- [一、为什么长任务不能只靠一个越来越长的 Prompt](#part-0)
- [二、Planner：约束结果，不要过早约束路径](#part-1)
- [三、实现和验收分开：不要让 Agent 给自己判卷](#part-2)
- [四、Sprint Contract：先定义什么叫完成](#part-3)
- [五、Agent 之间用文件通信](#part-4)
- [六、Evaluator 不是装上去就会严格](#part-5)
- [七、把五点合起来：我更想要的 Codex + Qwen 工作方式](#part-6)
- [八、Harness 不是越复杂越好](#part-7)
- [九、这套方法可能错在哪里](#part-8)
- [十、从 Harness 到 Alignment：两篇文章其实在回答同一个问题](#part-9)
- [十一、法律条文 vs 法律原则：Goal Alignment 和 Value Alignment](#part-10)
- [十二、真正困难的不是写更多规则，而是 Generalization](#part-11)
- [十三、为什么只看最终结果不够：Monitoring 必须进入工程主循环](#part-12)
- [十四、监督也会被适应：Evaluator 和 CoT Monitoring 的共同难题](#part-13)
- [十五、当 AI 开始研究 AI：RSI 会把 Harness 变成控制系统](#part-14)
- [十六、人应该控制什么：不是每一步，而是目标、边界和升级权](#part-15)
- [十七、下一步我准备怎么做](#part-16)

<a id="part-0"></a>

## 一、为什么长任务不能只靠一个越来越长的 Prompt

最朴素的 AI 编程方式是：

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    A[用户给目标] --> B[一个 Coding Agent]
    B --> C[读代码]
    C --> D[设计]
    D --> E[实现]
    E --> F[测试]
    F --> G[自己判断是否完成]
</pre></div>

小任务时，这套方式完全够用。

改一个按钮、加一个字段、修一个接口、做一个小页面，模型往往可以一次完成。问题出现在任务从「一次代码修改」变成「一个持续几个小时、横跨很多模块的产品任务」以后。

Anthropic 在前后两篇长任务 Harness 文章里总结过几个很典型的失败模式：

第一，Agent 容易一次做太多。它看到一个大目标后，会本能地试图快速把整个产品搭出来。于是大量功能停留在「看起来存在」，但没有真正打通。

第二，任务做久以后，Agent 会逐渐失去对全局状态的把握。不是完全忘记，而是开始不知道哪些东西已经验证过，哪些只是写过代码，哪些还只是想法。

第三，Agent 很容易提前宣布完成。项目已经有一个不错的界面，代码量也不少，单元测试还能过，这时它很容易得出「已经差不多了」的判断。

第四，也是这篇新文章特别强调的一点：**Agent 对自己的实现往往过于宽容。**

所以问题不是简单的：

> 怎么写一个更长、更完整的 Prompt？

而是：

> 怎么把一个长任务改造成一个有状态、有验收、有交接、有反馈的工作系统？

我现在更愿意把它理解成下面这张图：

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    Goal[Product Goal] --> Planner[Planner]
    Planner --> Spec[Product Spec]
    Spec --> Contract[Sprint Contract / Acceptance Criteria]
    Contract --> Generator[Generator]
    Generator --> Product[Working Product]
    Product --> Evaluator[Independent Evaluator]
    Evaluator -->|PASS| Next[下一阶段]
    Evaluator -->|FAIL + Evidence| Fix[修复任务]
    Fix --> Generator
    Generator --> State[Progress / Git / Handoff Files]
    State --> Planner
    State --> Evaluator
</pre></div>

<div class="agent-mermaid-caption">长任务的关键不是让一个 Agent 永远记住一切，而是把任务状态放到 Agent 外面。</div>

这正是 Harness 的意义。

<a id="part-1"></a>

## 二、Planner：约束结果，不要过早约束路径

这是我觉得最容易被做反的一点。

很多时候我们让一个强模型做规划，会希望它尽可能细：

- 用什么框架；
- 哪几个目录；
- 哪几个 class；
- 哪个组件拆成几层；
- 数据库有哪些表；
- API 用什么路径；
- 某个函数具体怎么写。

看起来越细越专业。

但对长任务来说，**规划得过细，反而可能把一个早期判断错误放大成整个项目的结构性错误。**

Anthropic 的 Planner 刻意更关注产品上下文、高层技术设计、功能范围和最终交付，而不是在一开始就规定大量底层实现细节。原因很简单：如果 Planner 在不了解实际代码状态时，就把技术路径写死，后面的 Generator 往往会忠实执行错误。

### 2.1 Planner 应该约束什么

我会把 Planner 的职责分成四层。

**第一层：用户最终得到什么。**

比如「回忆放映模式」不是「写一个 Carousel 组件」，而是：

- 用户进入以后先感受到放映机启动；
- 启动声、转轮、灯光和 BGM 有自然过渡；
- 照片进入正式放映后，机器声退到背景；
- 退出和重新进入行为正确。

这些都是结果。

**第二层：必须存在的能力。**

比如：

- 播放状态；
- 音频调度；
- 图片切换；
- 用户退出；
- 异常恢复。

**第三层：不能破坏的约束。**

比如：

- 不能阻塞主线程；
- 音频失败不能导致页面不可用；
- 不能破坏原有 BGM；
- 不能因为增加动画导致低端设备明显卡顿。

**第四层：怎么证明完成。**

这里不应该只写「实现成功」，而要写用户可观察、测试可复现的验收行为。

### 2.2 Planner 不应该做什么

Planner 不应该在信息不足的时候替 Generator 把所有实现决定做完。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TB
    subgraph Bad[过早约束路径]
        P1[Planner] --> D1[指定具体函数]
        D1 --> D2[指定组件拆法]
        D2 --> D3[指定数据库结构]
        D3 --> D4[指定每个实现细节]
        D4 --> G1[Generator 机械执行]
        G1 --> E1[早期错误被一路放大]
    end

    subgraph Good[优先约束结果]
        P2[Planner] --> O1[产品结果]
        P2 --> O2[能力边界]
        P2 --> O3[关键约束]
        P2 --> O4[验收标准]
        O1 --> G2[Generator 根据真实代码选择路径]
        O2 --> G2
        O3 --> G2
        O4 --> G2
    end
</pre></div>

一句话概括：

> **Planner 负责定义山顶在哪里，不要在山脚就规定每一步必须踩哪块石头。**

当然，这并不意味着技术方案永远不能约束。

如果项目已经有明确架构，比如必须使用现有 PostgreSQL、必须复用现有组件、接口协议不能变化，这些属于真实约束，当然应该写进去。

真正需要避免的是：**把「我的一种实现想法」误写成「系统必须如此实现」。**

### 2.3 我现在更喜欢的 Planner 输出

不是一份二十页的技术设计，而是类似：

~~~text
GOAL
用户最终要获得什么体验。

SCOPE
这一阶段包括什么，不包括什么。

REQUIRED CAPABILITIES
必须具备哪些能力。

CONSTRAINTS
不能破坏什么，必须兼容什么。

ACCEPTANCE INTENT
从用户角度看，什么现象能证明它完成。
~~~

至于函数、目录、组件和具体算法，优先让 Generator 在读完现有代码以后再决定。

<a id="part-2"></a>

## 三、实现和验收分开：不要让 Agent 给自己判卷

这一点在软件开发里其实一点都不新鲜。

人类工程里早就有：

- 开发；
- Code Review；
- QA；
- 产品验收；
- 安全审计。

但到了 Agent 时代，我们经常又退回到：

> 同一个 Agent 写完代码以后，问它一句「你检查一下有没有问题」。

这在短任务里有用，但在复杂任务里不够。

Anthropic 的观察是，模型评价自己刚刚产出的东西时，很容易偏正面。尤其是它已经花了大量上下文完成一个实现以后，它天然知道「自己原本想做什么」，于是会用设计意图替代真实结果。

比如 Generator 心里知道：

> 这个按钮本来是录音按钮。

于是它看到按钮能切换状态，就容易认为「录音功能已经有了」。

Evaluator 如果从用户视角重新进入系统，会问：

> 点击以后，麦克风真的开始采集了吗？有没有拿到真实音频？权限拒绝怎么办？

这两种观察角度完全不同。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    G[Generator] -->|知道自己想实现什么| Code[代码与界面]
    Code --> Self[自我检查]
    Self -->|容易解释自己的实现| Optimistic[偏乐观判断]

    Code --> E[Independent Evaluator]
    Contract[Contract] --> E
    E --> UserPath[真实用户路径]
    E --> API[接口状态]
    E --> DB[数据状态]
    E --> Edge[异常与边界]
    UserPath --> Verdict[PASS / FAIL]
    API --> Verdict
    DB --> Verdict
    Edge --> Verdict
</pre></div>

### 3.1 分开不是为了「两个模型互相不信任」

更准确地说，是**让两个角色拥有不同目标函数**。

Generator 的目标是：

> 在有限时间内，把功能做出来。

Evaluator 的目标是：

> 尽可能找到证据证明它还没有真正完成。

如果同一个 Agent 同时背这两个目标，很容易发生目标冲突。

它写了两个小时以后，再让它否定自己两小时的工作，本身就不自然。

### 3.2 Evaluator 看什么

我认为一个真正独立的 Evaluator 至少要看五类证据：

1. **界面证据**：用户真的看得到、点得到吗；
2. **行为证据**：点击以后真实结果是否发生；
3. **接口证据**：前后端是不是实际连通；
4. **状态证据**：刷新、重启、重新登录以后数据是否正确；
5. **边界证据**：权限失败、空数据、网络错误、重复操作会怎样。

所以「有代码」不是完成。

「有按钮」也不是完成。

甚至「单元测试通过」都不能自动等于完成。

> **实现存在，不等于能力存在。**

这是我从整篇文章里最想保留的一句工程提醒。

<a id="part-3"></a>

## 四、Sprint Contract：先定义什么叫完成

如果 Planner 故意不把实现细节写死，那么 Planner 到 Generator 中间会出现一个问题：

> 高层需求怎么变成这一次可以真正验收的工作？

Anthropic 的答案是 Sprint Contract。

在每个 Sprint 开始前，Generator 和 Evaluator 先不写代码，而是先对「这一阶段的完成条件」达成一致。

<div class="agent-mermaid-wrap"><pre class="mermaid">
sequenceDiagram
    participant P as Product Spec
    participant G as Generator
    participant E as Evaluator

    P->>G: 给出当前阶段目标
    G->>E: 提议 Sprint Contract
    E->>E: 检查是否可测试、是否遗漏核心行为
    alt Contract 不充分
        E-->>G: 补充验收条件 / 指出歧义
        G->>E: 修订 Contract
    else Contract 足够明确
        E-->>G: ACCEPT
    end
    G->>G: 按 Contract 实现
    G->>E: 提交实现 + 证据
    E->>E: 按 Contract 独立验收
    alt FAIL
        E-->>G: 失败项 + 复现步骤 + 证据
        G->>G: 修复
    else PASS
        E-->>G: Sprint 完成
    end
</pre></div>

我非常喜欢这个设计，因为它解决了 AI 开发里一个很常见的问题：

> 写代码之前大家觉得需求都懂了，写完以后才发现双方对「完成」的定义完全不同。

### 4.1 Contract 不应该写成任务列表

差的 Contract 是：

~~~text
- 写播放器
- 加音效
- 加动画
- 接 BGM
~~~

这只是待办事项。

好的 Contract 是可验证的：

~~~text
1. 用户进入放映模式后，不立即显示第一张照片。
2. 进入后先播放 projector_start.wav。
3. 转轮从静止逐渐加速，而不是瞬间进入匀速。
4. 灯光从暗到亮，并与启动阶段同步。
5. BGM 在启动声接近结束时平滑进入。
6. 正式放映后，机械运转声保持极低音量，不盖住 BGM。
7. 第一张照片只在启动阶段结束后进入。
8. 音频加载失败时，页面仍能继续进入放映。
9. 退出后再次进入，完整启动流程可以重新触发。
10. 连续快速进入/退出不会叠加多个音频实例。
~~~

这时候「完成」开始变成一个客观对象。

### 4.2 Contract 最好包含四层标准

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TB
    C[Sprint Contract] --> U[用户行为]
    C --> S[系统状态]
    C --> F[失败与边界]
    C --> N[非功能约束]

    U --> U1[点击 / 输入 / 浏览 / 完成任务]
    S --> S1[API / DB / 持久化 / 状态同步]
    F --> F1[空数据 / 网络失败 / 权限 / 重复操作]
    N --> N1[性能 / 兼容性 / 可维护性 / 不破坏已有功能]
</pre></div>

如果 Contract 只有第一层，很容易出现「页面看起来能用，但底层是假的」。

如果只有系统测试，又容易出现「接口都通了，但用户根本不知道怎么用」。

真正有价值的是四层一起看。

### 4.3 Contract 的另一个价值：阻止范围偷偷漂移

长任务做到后面，Agent 很容易自己增加任务，也容易因为某个地方太难而悄悄降低标准。

Contract 一旦写下来，就相当于固定了这一阶段的边界：

- 不能因为做着做着发现麻烦，就把核心交互降成占位；
- 不能为了显得丰富，突然加入一堆跟目标无关的功能；
- 不能用「我已经做了很多」替代「我完成了约定内容」。

这对 Agent 特别重要。

<a id="part-4"></a>

## 五、Agent 之间用文件通信

这一点和我之前自己在想的 Codex + Qoder 协作方式几乎完全对上了。

如果两个 Agent 都在同一个项目目录工作，最稳定的通信方式并不是：

> 我从 A 的聊天窗口复制一段总结，再粘给 B。

更好的方式是：

> **把项目状态写进仓库，让 Agent 读文件。**

Anthropic 之前的长任务实践使用过 progress 文件、结构化 feature list、git history、启动脚本；新文章里的 Generator 和 Evaluator 也通过文件交换 Contract 和反馈。

原因很现实：聊天上下文是短期记忆，仓库文件才是长期状态。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    C[Codex / Agent A] -->|写入| Files[(Project Files)]
    Q[Qwen / Agent B] -->|读取| Files
    Q -->|更新进度 / 结果| Files
    E[Evaluator] -->|读取 Contract / 状态| Files
    E -->|写 QA Report| Files
    C -->|读取 QA Report| Files
    Git[(Git History)] --> C
    Git --> Q
    Git --> E
</pre></div>

### 5.1 为什么文件比聊天交接可靠

因为文件有几个天然优势。

**第一，持久。**

新的 Agent 会话可以完全没有旧上下文，只要它知道先读哪些文件，就能恢复状态。

**第二，可审计。**

一个决策什么时候改的、为什么改，可以从 git 里看到。

**第三，可以结构化。**

例如 Acceptance Criteria 用 JSON，比一大段散文更不容易被 Agent 随意改写。

Anthropic 在早期实践里也提到，他们最后更偏向使用 JSON 保存 Feature List，因为模型更不容易擅自重写结构。

**第四，不绑定模型。**

今天是 Codex，明天是 Qwen，后天换别的模型，项目状态仍然在那里。

### 5.2 我会给项目固定一套 Agent 目录

例如：

~~~text
.agent/
├── PROJECT.md
├── PRODUCT_SPEC.md
├── current_task.json
├── acceptance.json
├── progress.md
├── qa_report.md
├── decisions.md
└── handoff.md
~~~

每个文件职责尽量单一。

**PROJECT.md**

长期不怎么变化的项目背景：

- 产品是什么；
- 用户是谁；
- 技术栈；
- 重要目录；
- 不允许破坏的约束；
- 常用启动和测试方式。

**PRODUCT_SPEC.md**

产品层面的目标和范围。

**current_task.json**

当前正在做什么，避免不同 Agent 同时把范围搞乱。

**acceptance.json**

当前任务的可验证完成标准。最好由 Generator 提议、Evaluator 修订后锁定。

**progress.md**

已经做了什么、目前状态、下一步是什么。

**qa_report.md**

Evaluator 输出。只记录事实、复现步骤、证据和结论，不写大段空泛评价。

**decisions.md**

重要技术决策。尤其记录「为什么不选另一个方案」。

**handoff.md**

需要换 Agent 或换工具时的最小交接信息。

### 5.3 文件通信不是写更多文档

这里也很容易走偏。

如果每做一个小改动都让 Agent 更新八个文件，Harness 会变成文书工作。

所以我更倾向：

> **只有跨会话、跨 Agent、跨工具还需要存在的信息，才进入文件。**

临时推理不用写。

一次性的搜索过程不用写。

已经可以从 git diff 看出来的细节，也不用重复写三遍。

真正需要保存的是：

- 目标；
- 状态；
- 契约；
- 决策；
- 失败证据；
- 下一步。

<a id="part-5"></a>

## 六、Evaluator 不是装上去就会严格

这是文章里另一个特别真实的地方。

很多人看到「Generator + Evaluator」以后，很容易觉得：再放一个模型验收不就好了？

Anthropic 实际跑下来不是这样。

他们发现早期 Evaluator 会出现一种很像人的行为：

1. 先发现一个真实问题；
2. 接着自己解释这个问题为什么「其实没那么严重」；
3. 最后给 PASS。

还有一种情况是测试过浅。

比如：

> 按钮能点击 → 功能正常。

但真正应该继续问：

> 点击以后数据发生变化了吗？刷新以后还在吗？接口失败怎么办？真实用户能完成整条路径吗？

所以 Evaluator Prompt 本身也需要持续调。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    E0[Evaluator v1] --> R1[执行 QA]
    R1 --> H[人工抽查日志与结果]
    H --> Gap{判断是否偏宽松或测试太浅}
    Gap -->|是| Prompt[修改 Evaluator Prompt]
    Prompt --> E1[Evaluator v2]
    E1 --> R2[重新运行 QA]
    R2 --> H2[再次抽查]
    H2 --> Gap
    Gap -->|否| Stable[当前版本可用]
</pre></div>

### 6.1 我希望 Evaluator 默认是「怀疑型」

不是无脑挑刺，而是默认假设：

> 当前实现可能只是「看起来完成」，我要找到足够证据以后才允许 PASS。

Evaluator Prompt 里我会明确写几条。

~~~text
你的职责不是证明开发者做对了，
而是尝试证明当前实现还没有满足 Contract。

禁止因为以下现象直接判定 PASS：
- 页面存在；
- 按钮存在；
- 对应函数存在；
- API 路由存在；
- 单元测试通过；
- Generator 声称已经测试；
- 界面看起来完整。

必须独立验证真实用户路径和最终状态。
~~~

### 6.2 Evaluator 要专门查「假完成」

AI 写应用时，我最担心的不是完全没做，而是「做了一个很像做完的东西」。

例如：

- 点击按钮只切了一个布尔值；
- 图表显示的是硬编码数据；
- 保存按钮弹出「保存成功」，但没落库；
- 搜索框存在，但只是前端 filter；
- AI 功能有输入框，但后面没有真实模型调用；
- 导出按钮能下载文件，但内容不完整；
- 错误处理只是 console.log；
- API 有 route，但页面没有真正调用；
- 代码里有完整函数，但事件根本没有绑定过去。

所以 Evaluator 应该主动搜索：

~~~text
TODO
FIXME
stub
mock
placeholder
hardcode
demo-only
temporary
not implemented
coming soon
~~~

但搜索代码只是辅助。

最后还是要回到真实用户路径。

### 6.3 FAIL 必须带证据

差的 QA 输出：

> 录音功能似乎有问题，请继续完善。

好的 QA 输出：

~~~text
FAIL: AC-07 真实录音

复现：
1. 打开 /studio
2. 点击 Record
3. 浏览器未请求 microphone permission
4. DevTools Network 无媒体上传
5. 停止后没有生成 audio blob

证据：
RecordButton 只切换 isRecording 状态。
MediaRecorder 未被创建。

期望：
点击 Record 后请求麦克风权限，
成功时采集真实音频并在停止后生成可播放 clip。
~~~

这类反馈 Generator 才能直接修。

Evaluator 如果只是输出「感觉还有提升空间」，实际上没有任何工程价值。

<a id="part-6"></a>

## 七、把五点合起来：我更想要的 Codex + Qwen 工作方式

我之前一直在想一个问题：

> GPT 更强，Qwen 相对便宜或更方便，那是不是 GPT 负责规划、Qwen 负责实现？

现在我觉得不能简单按模型名字固定角色。

更合理的是先看任务难度，再决定 Harness 有多重。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    T[新任务] --> D{任务复杂度}
    D -->|简单| S[单 Agent 直接完成]
    D -->|中等| M[Planner 定义结果 + Worker 实现 + 基础验收]
    D -->|复杂 / 高风险| H[Planner + Contract + Generator + Independent Evaluator]

    S --> Done[完成]
    M --> QA1[测试]
    QA1 --> Done
    H --> QA2[严格 QA]
    QA2 -->|FAIL| Repair[修复]
    Repair --> QA2
    QA2 -->|PASS| Done
</pre></div>

### 7.1 简单任务

比如：

- 改字号；
- 调 padding；
- 增加一个字段；
- 改一段文案；
- 修一个明确的小 bug。

没必要启动一套三 Agent 体系。

直接让当前模型完成，然后跑已有测试即可。

### 7.2 中等任务

比如：

- 草稿批量删除；
- 消息中心改版；
- 照片墙布局；
- 隐私权限设置；
- 一个完整但边界清晰的新页面。

这时我会让强一点的 Planner 先定义：

- 结果；
- 范围；
- 验收标准。

然后 Worker 实现。

最后至少跑一次独立验收。

### 7.3 复杂任务

比如：

- AI 回忆整理 Pipeline；
- 图片理解与文本融合；
- 一个长流程的 Agent 系统；
- 全国位置识别；
- 3D 记忆空间；
- 涉及多模块、多数据状态、多外部服务的系统。

这时才值得使用完整 Harness。

如果把它落到我自己的 Codex + Qoder 环境，我希望最终是这样的：

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TB
    U[我：给 Goal / 做最终产品判断] --> P[Planner]
    P --> PS[(PRODUCT_SPEC.md)]
    PS --> C[(acceptance.json)]
    C --> W[Worker: Codex 或 Qwen]
    W --> Repo[(共享代码仓库)]
    Repo --> Test[自动测试 / 浏览器 / API / DB]
    C --> E[Independent Evaluator]
    Test --> E
    Repo --> E
    E -->|FAIL + Evidence| QA[(qa_report.md)]
    QA --> W
    W -->|更新| Prog[(progress.md / handoff.md)]
    Prog --> P
    E -->|PASS| Done[阶段完成]
</pre></div>

注意这里 **Planner、Worker、Evaluator 是角色，不是模型名字。**

某些任务里：

- GPT 可以做 Planner；
- Qwen 可以做 Worker；
- GPT 再做 Evaluator。

但如果实现本身就在 Qwen 的能力边界之外，就不应该因为「便宜」硬塞给它。

反过来，一个非常简单的 UI 调整，也不应该每次都拉最强模型做 Planner + QA。

### 7.4 我真正想减少的是人工搬运

如果这套 Harness 做得好，我自己应该逐渐从下面这种状态退出：

~~~text
我看 Codex 做到哪里
→ 我复制一段给 Qwen
→ 我告诉 Qwen 前面发生了什么
→ Qwen 做完
→ 我再复制回 Codex
→ 我提醒 Codex 哪些地方没验收
~~~

而变成：

~~~text
我提出 Goal
→ Agent 自己读取项目状态
→ 形成 Contract
→ 实现
→ 独立验收
→ 失败就根据证据修
→ 项目状态写回文件
→ 我做最终产品判断
~~~

这才是「Agent 协作」真正有价值的地方。

不是界面上同时出现三个模型，而是**项目状态不再依赖我这个人充当中转站。**

<a id="part-7"></a>

## 八、Harness 不是越复杂越好

Anthropic 后半篇还有一个我很认同的变化。

早期模型需要 Sprint、上下文重置、分阶段交接，后来模型能力变强以后，他们又开始删东西。

原因是：Harness 里的每一个组件，其实都隐含一个假设。

例如：

- 加 Planner，意味着假设模型自己容易少做；
- 加 Sprint，意味着假设模型不能稳定处理太大的连续任务；
- 加 Context Reset，意味着假设长上下文会影响持续工作；
- 加 Evaluator，意味着假设模型自检还不够可靠。

模型能力变了，这些假设就应该重新检查。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    Weak[模型能力较弱] --> Heavy[更多 Harness 约束]
    Improve[模型能力增强] --> Review[逐项重新验证假设]
    Review --> Keep[仍然有价值：保留]
    Review --> Remove[已经成为负担：删除]
    Keep --> Lean[更轻的 Harness]
    Remove --> Lean
</pre></div>

我觉得这是一个特别重要的提醒：

> **Harness 是补能力缺口的，不是宗教。**

今天一个模型需要每个 Sprint 都验收，不意味着明年还需要。

今天需要两个模型分工，也不意味着永远要两个模型。

真正应该长期存在的不是某个固定流程，而是一个原则：

> 在模型当前不可靠的地方增加结构，在模型已经可靠的地方减少结构。

<a id="part-8"></a>

## 九、这套方法可能错在哪里

我现在很喜欢这套思路，但它并不是没有代价。

### 9.1 成本会明显增加

Anthropic 的实验里，完整 Harness 比单 Agent 昂贵很多。

这很好理解。

一个任务原本只调用一个模型，现在变成：

- Planner；
- Contract 协商；
- Generator；
- Evaluator；
- 修复；
- 再次 Evaluator。

Token、时间和工具调用都会增加。

所以不能把所有任务都升级成重型 Harness。

### 9.2 Evaluator 也会犯错

Evaluator 是另一个 LLM，不是数学证明器。

它可能：

- 漏测；
- 误判；
- 看不懂复杂业务；
- 被漂亮界面欺骗；
- 测到一半觉得「差不多了」；
- 对某些主观体验缺乏判断。

所以 Evaluator 只能提高验证质量，不能替代所有确定性测试。

单元测试、集成测试、类型检查、数据库约束、静态分析这些该有的东西仍然要有。

### 9.3 Contract 也可能写错

如果一开始定义的「完成」就不对，那么后面的 Generator 和 Evaluator 可能非常认真地把错误目标完成。

所以 Contract 的意义不是取消人的判断，而是让人的判断集中到更关键的位置：

> **开始前判断目标，结束后判断产品。**

中间大量重复检查交给 Agent 和自动化工具。

### 9.4 文档过多会拖慢 Agent

如果每一次修改都要求同步十几个状态文件，Agent 会花大量时间维护 Harness，而不是做产品。

所以这套体系最重要的不是「多建几个文件」，而是找到最小必要状态。

<a id="part-9"></a>

## 十、从 Harness 到 Alignment：两篇文章其实在回答同一个问题

如果只看标题，Anthropic 的 Harness 文章和 OpenAI 的《An Alien Mind》似乎完全不是一类东西。

前者是工程实践：Planner、Generator、Evaluator、Sprint Contract、文件通信、Playwright QA。

后者讨论的是 Alignment、Generalization、Chain-of-Thought Monitoring、Scalable Defense、Recursive Self-Improvement。

但把尺度拉开以后，它们其实在回答同一个问题：

> **当一个系统越来越有能力自主完成复杂目标时，我们怎样让它持续做对，而不是只在开始时“看起来理解了”。**

在一个软件项目里，这个问题表现为：

- Agent 会不会少做功能；
- 会不会把 stub 当完成；
- 会不会自己给自己判 PASS；
- 会不会做久以后偏离最初目标；
- 换会话以后还记不记得当前状态。

在更大的 AI 系统里，同一个问题变成：

- 模型是否真正理解人的目标；
- 在目标冲突时会怎样选择；
- 在训练中没见过的环境里会不会继续遵守原则；
- 当它知道自己可能被监督时，监督还能不能看到真实问题；
- 当 AI 开始参与 AI 研发以后，人类还能不能留在改进闭环里。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TB
    subgraph Project[项目级：Harness]
        HG[Human Goal] --> HP[Planner]
        HP --> HC[Sprint Contract]
        HC --> HE[Executor]
        HE --> HV[Evaluator]
        HV -->|FAIL| HE
        HV -->|PASS| HD[Done]
    end

    subgraph System[系统级：Alignment]
        VV[Human Values] --> GA[Goal Alignment]
        VV --> VA[Value Alignment]
        GA --> AI[Capable AI]
        VA --> AI
        AI --> MO[Monitoring]
        MO -->|发现偏离| CO[Correction / Human Review]
        CO --> AI
    end
</pre></div>

两个系统的共同点，不是“都用了多个 Agent”。

真正共同的是四个词：

**Goal、Constraint、Evidence、Correction。**

先定义目标，再定义边界；系统执行以后，不接受自我声明，而是要求外部证据；证据显示偏离，就进入修正循环。

从这个角度看，Harness 并不只是“让 Agent 更高效”的工具。

它其实已经是一个非常朴素的 Alignment Architecture。

只是我们平时把 Alignment 想得太宏大了，总觉得那是实验室研究超级智能才需要考虑的事情。

实际上，一个 Coding Agent 把“做完播放器”理解成“画出播放器界面”，和一个更强系统在陌生环境里误解人类目标，结构上并没有那么不同：

> 都是**目标被压缩成了一个过于简单的代理指标**。

这也是我为什么现在会把 Harness 和 Alignment 放在一起看。

---

<a id="part-10"></a>

## 十一、法律条文 vs 法律原则：Goal Alignment 和 Value Alignment

《An Alien Mind》里一个非常好用的划分，是把 Alignment 分成 Goal Alignment 和 Value Alignment。

我自己的理解是：

**Goal Alignment** 解决的是：

> 你交给 Agent 一个目标，它到底有没有认真去完成这个目标？

**Value Alignment** 解决的是：

> 当目标不完整、互相冲突、出现陌生情况时，它能不能根据更高层原则作出合理选择？

这个区别用“法律条文 vs 法律原则”来理解特别直观。

法律条文会告诉你：

- 哪件事允许；
- 哪件事禁止；
- 满足什么条件；
- 违反以后是什么后果。

它必须具体，因为现实执行需要可判断。

但任何规则系统都有一个问题：**你永远不可能提前枚举世界上所有情况。**

所以还需要原则：

- 诚信；
- 比例；
- 权利边界；
- 公平；
- 不滥用权力；
- 在规则模糊时如何解释规则。

Agent 也是一样。

Sprint Contract 就像这一轮任务里的“法律条文”。

例如：

~~~text
AC-01：进入放映模式后先播放开机阶段，不立即出现第一张照片。
AC-02：开机声结束前 BGM 以渐入方式接管主听觉。
AC-03：音频加载失败不能阻断照片播放。
AC-04：退出页面后所有音频实例必须释放。
~~~

这些规则非常有价值，因为 Evaluator 可以明确判 PASS / FAIL。

但现实任务不可能都被 Contract 穷尽。

假设发生一个没写进去的情况：

> 音频文件异常大，播放它会让低端手机明显卡顿。

Contract 可能没有写“遇到超大音频怎么办”。

这时候我们真正希望 Agent 理解的是更高层原则：

> 不要为了完成动画效果，明显破坏核心可用性。

这就是“原则”。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    T[具体任务] --> R[Rules / Contract]
    R --> K{当前情况是否被规则覆盖?}
    K -->|是| A[按可验证规则执行]
    K -->|否| P[Higher-level Principles]
    P --> P1[保护用户数据]
    P --> P2[不越权]
    P --> P3[不破坏核心能力]
    P --> P4[不确定时升级]
    P1 --> D[做出新场景决策]
    P2 --> D
    P3 --> D
    P4 --> D
</pre></div>

这里需要强调一点：这个类比不是说 Value Alignment 真能简单写成几句“原则 Prompt”。

恰恰相反。

难点就在于：写下原则很容易，让模型在从未见过的环境里稳定地把原则用对，非常难。

### 11.1 为什么只有 Goal Alignment 不够

假设我告诉 Agent：

> 修复生产服务器，让服务尽快恢复。

如果它只优化表面目标“尽快恢复”，可能得到一条很危险的路径：

~~~text
删掉异常数据
→ 关闭校验
→ 重置生产配置
→ 服务恢复
~~~

从 Goal 的最窄定义看，它完成了。

但真正的人类意图通常还包含很多没写出来的内容：

~~~text
恢复服务
+
尽量不丢数据
+
不扩大故障
+
不绕过权限
+
重要操作可回滚
+
不确定时先升级给人
~~~

所以一个可靠 Agent 必须越来越擅长理解：

> **指令背后还有什么没有被明说的约束。**

这也是为什么 Planner 不能只写“要做什么”，还要写“不能破坏什么”。

### 11.2 为什么只有 Value Alignment 也不够

反过来也一样。

如果只有“安全、诚实、谨慎”这些原则，却没有具体 Contract，Agent 很容易变成另一个极端：

> 什么都很谨慎，但什么都不真正完成。

工程系统需要两层同时存在：

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    V[Value / Principles] --> B[Boundary]
    G[Goal] --> C[Contract]
    B --> X[Agent Execution]
    C --> X
    X --> E[Evidence-based Evaluation]
    E -->|满足目标且没有越界| P[PASS]
    E -->|缺能力或越边界| F[FAIL / Escalate]
</pre></div>

**原则负责守边界，Contract 负责定义完成。**

我现在觉得，一个成熟的 Agent Harness 最终一定会有这两层。

---

<a id="part-11"></a>

## 十二、真正困难的不是写更多规则，而是 Generalization

Pachocki 在《An Alien Mind》里把 Alignment 的根本难题指向 Generalization。

这个判断对 Agent 工程特别重要。

很多时候，我们发现 Agent 犯错后的第一反应是：

> 再加一条 Prompt。

它忘了验证接口：

~~~text
新增规则：必须验证所有接口。
~~~

它没有测异常状态：

~~~text
新增规则：必须测试异常情况。
~~~

它把按钮存在当成能力存在：

~~~text
新增规则：禁止仅凭 UI 存在判定完成。
~~~

这些规则都应该加。

但如果我们一直沿着这条路走，会得到：

~~~text
Rule 1
Rule 2
Rule 3
...
Rule 500
Rule 501
~~~

然后真实环境出现 Rule 502。

这就是“法律条文”路线的极限。

### 12.1 测试集通过，不等于真实环境可靠

一个 Agent 在我们的 100 个测试任务上都表现很好，只能证明：

> 它在这些任务以及相似分布里做得不错。

真实世界会出现组合：

- 新工具；
- 新权限；
- 新 API；
- 新错误；
- 不完整数据；
- 其他 Agent 的错误输出；
- 文档和代码冲突；
- 用户目标互相矛盾；
- 一个原来安全的操作出现在新的上下文里。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    Train[已见过的训练 / 测试场景] --> Learn[学到规则与模式]
    Learn --> Seen[相似场景]
    Learn --> Novel[陌生组合场景]
    Seen --> Good[通常表现稳定]
    Novel --> Q{能否正确泛化原则?}
    Q -->|能| Robust[Robust Behavior]
    Q -->|不能| Failure[Unexpected Failure]
</pre></div>

所以真正高级的 Evaluator 不能只是：

> 把 Contract 逐条点一遍。

它还应该主动做一件事：

> **在 Contract 周围寻找“相邻但未写明”的情况。**

例如 Contract 写：

> 用户可以删除一条草稿。

Evaluator 不应该只测试正常删除。

它还应该自然想到：

- 删除最后一条；
- 重复快速点击；
- 删除过程中断网；
- 删除后刷新；
- 两个设备同时操作；
- 没权限的人触发接口；
- 删除失败时 UI 是否错误显示成功。

这其实就是小规模 Generalization Test。

### 12.2 Harness 的成熟标志不是规则越来越多

而是规则逐渐抽象成稳定原则。

例如早期 QA Prompt 可能有二十条具体规则：

~~~text
不要只看按钮。
不要只看路由。
不要只看函数。
不要只看 toast。
不要只看 mock data。
不要只看 unit test。
~~~

慢慢可以抽象成：

> **所有“完成”判断必须由用户可观察的真实状态变化来证明。实现痕迹不能替代行为证据。**

这条原则可以覆盖大量新情况。

所以我会把 Evaluator Prompt 的进化理解成：

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart LR
    F1[发现 Failure A] --> R1[增加具体规则]
    F2[发现 Failure B] --> R2[增加具体规则]
    F3[发现 Failure C] --> R3[增加具体规则]
    R1 --> Ab[抽象共同原因]
    R2 --> Ab
    R3 --> Ab
    Ab --> Principle[形成更高层 Evaluation Principle]
    Principle --> New[覆盖更多未知场景]
</pre></div>

这比无限堆 Prompt 更重要。

---

<a id="part-12"></a>

## 十三、为什么只看最终结果不够：Monitoring 必须进入工程主循环

传统软件验收最容易关注 Outcome：

> 最后结果对不对？

Agent 系统里，仅仅看 Outcome 会越来越不够。

因为两个系统可能给出同一个结果，却通过完全不同的路径得到。

例如两个 Agent 都完成了“整理用户照片”。

Agent A：

~~~text
读取用户明确授权的照片
→ 生成缩略图
→ 建索引
→ 返回结果
~~~

Agent B：

~~~text
读取整个用户目录
→ 顺便扫描其他文件
→ 把数据传给外部服务
→ 生成缩略图
→ 返回结果
~~~

如果最终只验收：

> 相册生成了吗？

两个都 PASS。

这显然不够。

所以未来更合理的是：

> **Outcome Evaluation + Process Monitoring。**

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    Task[Task] --> Agent[Agent]
    Agent --> Actions[Tool Calls / Actions]
    Agent --> Output[Final Artifact]
    Actions --> PM[Process Monitor]
    Output --> OE[Outcome Evaluator]
    PM --> Risk{越权 / 异常 / 可疑路径?}
    OE --> Done{结果满足 Contract?}
    Risk -->|是| Stop[Stop / Escalate]
    Risk -->|否| Merge[Joint Verdict]
    Done -->|否| Fix[Repair]
    Done -->|是| Merge
    Merge --> Pass[PASS]
</pre></div>

在 Coding Agent 里，Process Monitoring 可以是：

- 它改了哪些目录；
- 是否碰了本不该碰的生产配置；
- 是否删除测试来让 CI 变绿；
- 是否把真实实现换成 mock；
- 是否偷偷降低 Acceptance Criteria；
- 是否调用了不必要的外部网络；
- 是否绕开已有权限层；
- 是否出现大范围无关重构。

这里有一个非常重要的工程原则：

> **Agent 的能力决定它能做多少事；Monitoring 的能力决定我们敢给它多少自主权。**

模型更强，并不自动意味着监督可以更弱。

恰恰相反，一个只能改 CSS 的 Agent，即使犯错，影响范围也很有限。

一个可以读仓库、改数据库、操作浏览器、部署服务、调用云 API 的 Agent，只要判断错一次，后果就可能完全不同。

所以 Autonomous Capability 和 Monitoring Capability 应该一起增长。

---

<a id="part-13"></a>

## 十四、监督也会被适应：Evaluator 和 CoT Monitoring 的共同难题

《An Alien Mind》里我觉得最值得工程师注意的一部分，是 OpenAI 对 Chain-of-Thought Monitoring 的讨论。

这里不是说我们日常开发应该读取模型的隐藏思维。

真正有价值的是它背后的一个普遍问题：

> **被监督的系统，会逐渐适应监督方式。**

这件事其实在我们的 Evaluator 里已经能看到一个很朴素的版本。

假设 Generator 知道 Evaluator 永远只检查：

~~~text
npm test
页面能打开
按钮能点
~~~

那么最容易优化的方向就会变成：

~~~text
让测试通过
让页面看起来完整
让按钮有响应
~~~

至于真实业务是否打通，并不一定得到同样强的优化压力。

这就是指标被目标化以后会发生的问题。

### 14.1 Evaluator 不能只有一把尺子

所以我现在会更倾向于把验证拆成多种互相补充的证据：

~~~text
静态代码证据
+
自动测试证据
+
真实浏览器交互
+
API / DB 状态
+
异常路径
+
权限边界
+
人工抽查
~~~

任何一项都不应该独自代表“完成”。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TB
    Impl[Implementation] --> T[Test Suite]
    Impl --> UI[Browser / User Flow]
    Impl --> API[API & Database]
    Impl --> SEC[Permission / Boundary]
    Impl --> TRACE[Action Trace]
    T --> V[Evaluator]
    UI --> V
    API --> V
    SEC --> V
    TRACE --> V
    V --> H[Human Spot Check]
    H --> Learn[发现 Evaluator 漏洞]
    Learn --> Tune[更新 Criteria / Prompt / Tests]
    Tune --> V
</pre></div>

### 14.2 为什么 Evaluator Prompt 要不断调

Anthropic 的实践特别真实：独立 Evaluator 并不会天然严格。

它同样会：

- 找到 bug 后帮实现者找理由；
- 测试太浅；
- 被漂亮界面影响；
- 把“核心功能大体存在”当成“可以通过”。

所以我们不能把 Evaluator 当成一个固定组件。

它应该像测试体系一样持续维护。

每次出现这种情况：

> 人一眼看出来的问题，Evaluator 却 PASS 了。

都不应该只修当前 bug。

还要追问：

> **Evaluator 为什么没有把它判出来？**

然后更新 Prompt、Criteria、工具、测试路径、Few-shot 示例和必须提供的证据类型。

也就是说，我们不仅在迭代 Product，也在迭代 Evaluation System。

---

<a id="part-14"></a>

## 十五、当 AI 开始研究 AI：RSI 会把 Harness 变成控制系统

《An Alien Mind》后半部分把问题推向 Recursive Self-Improvement，也就是递归自我改进。

先不讨论它最终会走多快，有一点其实已经很容易观察：

> AI 正在越来越多地参与 AI 和软件系统本身的研发。

今天 Coding Agent 已经可以写训练代码、改评测、跑实验、分析结果、找回归问题、搜论文、提新方案，甚至修改自己的 Harness。

当这些能力组合起来以后，研发闭环会逐渐从：

~~~text
Human
→ 写方案
→ 写代码
→ 跑实验
→ 看结果
→ 再想方案
~~~

变成：

~~~text
Human Goal
→ AI Researcher
→ Experiment
→ Evaluation
→ AI 修改方案
→ 下一轮 Experiment
~~~

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    H[Human Research Goal] --> AR[AI Research Agent]
    AR --> Hyp[Hypothesis]
    Hyp --> Exp[Experiment]
    Exp --> Eval[Evaluation]
    Eval --> Learn[Update Knowledge / Strategy]
    Learn --> AR
    AR --> Tool[Improve Tools / Harness]
    Tool --> AR
    Eval --> Gate[Human / Safety Gate]
    Gate -->|允许继续| Learn
    Gate -->|风险或不确定| Pause[Pause / Review]
</pre></div>

这里最重要的变化，是“模型”可能不再是竞争的最小单位。

真正的单位会变成：

> **Research System。**

也就是：

~~~text
Model
+ Planner
+ Tooling
+ Memory
+ Experiment Runner
+ Evaluator
+ Monitoring
+ Human Gate
~~~

谁的 Research Loop 更快、更稳、更能发现自己的错误，谁就有更强的持续进步能力。

### 15.1 这时 Harness 不再只是生产力工具

因为系统开始能够修改自己的 Prompt、工具、测试、工作流和下一轮研究策略。

如果让 Executor 同时拥有：

~~~text
修改产品
+
修改 Contract
+
修改 Evaluator
+
修改 PASS 阈值
~~~

那么整个监督系统会失去意义。

这跟软件工程里“程序不能自己改审计规则”是同一个道理。

所以未来更强的 Harness 很可能需要明确的 Control Plane：

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TB
    subgraph Control[Control Plane]
        HG[Human Goal]
        POL[Principles / Policy]
        AC[Acceptance Criteria]
        MON[Monitoring Rules]
        GATE[Approval Gates]
    end

    subgraph Work[Execution Plane]
        P[Planner]
        G[Generator]
        T[Tools]
        ENV[Environment]
    end

    subgraph Verify[Verification Plane]
        E[Independent Evaluator]
        TEST[Deterministic Tests]
        AUDIT[Audit Trail]
    end

    HG --> P
    POL --> P
    AC --> G
    P --> G
    G --> T
    T --> ENV
    G --> E
    ENV --> E
    TEST --> E
    AUDIT --> E
    MON --> E
    E --> GATE
    GATE -->|PASS| NEXT[Next Iteration]
    GATE -->|FAIL| G
</pre></div>

我觉得这张图比“Planner + 两个 Agent”更接近未来。

Agent 数量并不是重点。

**重点是谁能修改什么，谁能评价谁，什么东西不能被执行者自己改掉。**

---

<a id="part-15"></a>

## 十六、人应该控制什么：不是每一步，而是目标、边界和升级权

谈到“Human in the loop”时，一个很容易出现的误解是：

> 每一步都让人点确认。

这样当然安全一些，但也会把 Agent 最重要的价值消掉。

如果一个长任务包含 300 次工具调用，我每次都要确认一次，那它其实还是一个高级遥控器。

我更倾向于把人的位置放在三个地方。

### 16.1 第一：目标定义权

人决定：

> 我们到底想得到什么结果。

Planner 可以帮助把 Goal 展开，但不能偷偷替换 Goal。

比如“做一个老人回忆编辑功能”，不能在 Agent 自己理解以后悄悄变成“做一个功能最多、技术最复杂的内容编辑器”。

真正的产品目标可能是：

> 老人能轻松开始写，并愿意持续写下去。

这两个方向完全不同。

### 16.2 第二：边界定义权

包括：

- 哪些数据能访问；
- 哪些系统能修改；
- 什么操作必须可回滚；
- 哪些内容不能编造；
- 哪些成本不能超过；
- 哪些区域需要人工批准。

这些边界不应该依赖 Agent “自己觉得合适”。

应该被 Harness 明确执行。

### 16.3 第三：升级和停止权

Agent 最重要的能力之一，不是“什么都会处理”，而是：

> **知道什么时候不应该继续自主处理。**

例如：

- Contract 自相矛盾；
- 需要删除大量真实数据；
- 测试结果持续互相冲突；
- 权限范围不明确；
- Evaluator 连续多轮无法达标；
- 发现目标本身可能有问题。

这时候正确动作不是无限 retry。

而是升级给人。

<div class="agent-mermaid-wrap"><pre class="mermaid">
flowchart TD
    H[Human] --> G[Goal]
    H --> B[Boundaries]
    H --> A[Approval / Escalation Rules]
    G --> Agent[Autonomous Agent Loop]
    B --> Agent
    A --> Agent
    Agent --> Normal{正常且在边界内?}
    Normal -->|是| Work[自主执行]
    Work --> Eval[Independent Evaluation]
    Eval -->|可修复失败| Agent
    Eval -->|达标| Commit[Commit / Deliver]
    Normal -->|否| Esc[Escalate]
    Eval -->|高风险 / 目标冲突| Esc
    Esc --> H
</pre></div>

这更接近 Human-on-the-loop：

人不负责微操，而是拥有：

**目标权、规则权、停止权、最终判断权。**

我觉得这也是《An Alien Mind》最后强调 human agency 时，对 Agent 工程最直接的启发。

真正值得追求的不是：

> AI 把人完全移出系统。

而是：

> **把人从重复执行里移出去，但不能把人从目标和控制权里移出去。**

<a id="part-16"></a>

## 十七、下一步我准备怎么做

我现在不准备直接造一个特别重的多 Agent 平台。

更实际的做法，是先从现有项目目录开始，把这五件事落进去。

第一步，建立一个很轻的 <code>.agent/</code> 目录，只保存项目长期状态和当前任务状态。

第二步，把「给 Codex/Qwen 的超长 Prompt」逐渐拆成：

- Goal；
- Product Spec；
- Acceptance Criteria；
- Handoff。

第三步，为复杂任务引入 Independent Evaluator。Evaluator 不参与实现，只读 Contract、运行结果和代码。

第四步，专门维护一份 Evaluator Prompt，每次它「放过了一个人能明显发现的问题」，就修改 Prompt，而不是只修当前 bug。

第五步，持续观察哪些 Harness 组件已经不再必要。能删就删。

最终我想达到的状态不是「三个 Agent 看起来很厉害」，而是：

> 我给一个足够清楚的目标以后，任务可以在几个 Agent 之间持续推进；换模型、换会话、换工具都不会丢状态；实现者不能自己宣布胜利；验收者必须拿证据说话；当规则没有覆盖新情况时，系统还有更高层原则和升级机制可以兜底。

如果做到这一点，我觉得 Codex、Qwen 甚至以后其他模型之间的差异，反而没有现在看起来那么重要。

模型决定单次工作的上限。

**Harness 决定这份能力能不能持续、稳定地被用出来。**

而 Alignment 决定的是更深的一层：

> **当能力继续增长、任务越来越陌生、系统开始参与自己的改进时，这套能力还能不能始终服务于我们真正想要的目标。**

所以我现在会把这两件事放在一起看：

**Harness 是工程上的 Alignment；Alignment 是把 Harness 问题推到更大尺度。**

---

## 参考

- Anthropic, [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), 2026-03-24
- Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- OpenAI, [An Alien Mind](https://openai.com/index/an-alien-mind/), 2026-09-06

<script type="module">
(async () => {
  const nodes = Array.from(document.querySelectorAll('pre.mermaid'));
  if (!nodes.length) return;

  let mermaid;
  try {
    mermaid = (await import('https://cdn.jsdelivr.net/npm/mermaid@12/dist/mermaid.esm.min.mjs')).default;
  } catch (error) {
    mermaid = (await import('https://unpkg.com/mermaid@12/dist/mermaid.esm.min.mjs')).default;
  }

  const dark = document.documentElement.classList.contains('dark');

  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'neutral',
    securityLevel: 'strict',
    fontFamily: "Inter Variable, PingFang SC, Microsoft YaHei, sans-serif",
    flowchart: { useMaxWidth: true, htmlLabels: true },
    sequence: { useMaxWidth: true, wrap: true }
  });

  await mermaid.run({ nodes });
})();
