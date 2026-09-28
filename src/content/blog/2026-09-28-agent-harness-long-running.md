---
title: "长任务 Agent 真正难的不是模型，而是 Harness"
excerpt: "最近看 Anthropic 的《Harness design for long-running application development》，我真正记下来的不是「三 Agent 架构」这个形式，而是背后的工程判断：长任务 Agent 做……"
publishDate: "2026-09-28"
isFeatured: true
tags: 
  - "AI Agent"
  - "Codex"
  - "工程实践"
  - "软件开发"
issue: 62
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
- [十、下一步我准备怎么做](#part-9)

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

## 十、下一步我准备怎么做

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

> 我给一个足够清楚的目标以后，任务可以在几个 Agent 之间持续推进；换模型、换会话、换工具都不会丢状态；实现者不能自己宣布胜利；验收者必须拿证据说话。

如果做到这一点，我觉得 Codex、Qwen 甚至以后其他模型之间的差异，反而没有现在看起来那么重要。

模型决定单次工作的上限。

**Harness 决定这份能力能不能持续、稳定地被用出来。**

---

## 参考

- Anthropic, [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps), 2026-03-24
- Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

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
})();</script>
