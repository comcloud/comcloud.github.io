---
title: "小米 MiMo-V2.6 真正值得看的，不是登顶，而是 RL 开始变成模型工厂"
excerpt: "我更愿意把 MiMo-V2.6 看成一次“训练系统能力”的展示，而不是一次普通的模型榜单新闻。真正值得追的是：当预训练架构逐渐成熟以后，模型公司的差距会不会越来越取决于谁能持续制造高质量环境、奖励信号和验证器。"
coverImage: "/blog-images/2026-09-22-rl-grader-bottleneck.jpg"
publishDate: "2026-09-22"
isFeatured: false
tags: 
  - "大模型"
  - "强化学习"
  - "开源模型"
  - "Agent"
issue: 17
---

我更愿意把 MiMo-V2.6 看成一次“训练系统能力”的展示，而不是一次普通的模型榜单新闻。真正值得追的是：当预训练架构逐渐成熟以后，模型公司的差距会不会越来越取决于谁能持续制造高质量环境、奖励信号和验证器。

9 月 21 日，小米 MiMo 团队发布 MiMo-V2.6-Pro-RL 和 Flash-RL。官方模型卡给出的结构很夸张：Pro 是 1.02T 总参数、42B 激活参数的 MoE，支持文本、图像、视频、音频，最长 1M token。Artificial Analysis 当天把 Pro 放到其开放权重模型榜首，Intelligence Index 为 46，API 侧测到约 134 tokens/s。这个结果当然会自然引出“国产开放模型又追上了一步”的讨论。

但我觉得最容易误读的地方，是把成绩主要归因于“参数更大”。

官方技术材料真正花篇幅讲的不是参数规模，而是后训练。MiMo-V2.6 把 coding、通用 Agent、视觉任务和网络安全任务混在一次强化学习训练里，使用大批量异步 GRPO；更关键的是，团队没有满足于简单的 pass/fail 奖励，而是让 grader 在同一组 rollout 里继续比较已经通过的解法，区分路径质量、效率和完成方式，再重新分配 advantage。

换句话说，奖励系统本身也在变复杂。

第一，这意味着模型竞争的成本中心可能继续从“拿到更多文本”转向“构造可执行环境”。

互联网文本相对容易扩张，但 Agent 任务不是。要训练 coding agent，需要可运行仓库、测试、依赖和隔离环境；训练浏览器 Agent，需要可重放网站状态；训练网络安全能力，需要受控靶场和可靠 verifier。没有这些东西，强化学习很容易退化成在几个窄 benchmark 上刷分。

MiMo 的一个信号是，环境已经开始成为训练资产。真正稀缺的可能不是一道题，而是一套能反复执行、自动判定结果、能发现 reward hacking 的任务系统。

第二，grader compute 可能会成为新的隐藏算力。

以前我们习惯讨论训练 FLOPs、推理 FLOPs，现在还要多算一层：为了判断一个 rollout 好不好，还需要多少模型调用、规则验证和交叉检查。MiMo 的 Groupwise Reward Synthesis 和 Groupwise Advantage Redistribution，本质上是在增加“评判答案”的计算。

这件事很重要，因为未来大模型训练的单位可能不再只是 token。一个需要浏览网页、调用十个工具、跑代码、最后再让多个 grader 检查的 Agent 轨迹，成本远高于同长度的普通文本。

第三，所谓“开放模型追平闭源”，以后会越来越难用一个总榜解释。

Artificial Analysis 给 MiMo-V2.6-Pro 46 分，这是一个有用信号，但它仍然是聚合指标。官方模型卡里也能看到明显差异：它在一些通用 Agent、代码和视觉 Agent 项目上很强，但在部分网络安全 benchmark 上仍落后于更强闭源模型。不同 harness、工具环境和 verifier 还会继续改变结果。

因此，企业真正选模型时，应该越来越少问“总榜第几”，而多问“在我的执行环境里，成功完成一次任务要花多少钱”。

第四，这种训练方式会反过来改变 Agent 产品公司的壁垒。

如果一个团队积累了大量真实失败轨迹、可执行测试环境、质量规则和人工审查结果，它就掌握了一套很难从公开语料复制的训练资产。很多 Agent 公司今天把这些东西当运行日志，我怀疑几年后它们会把它们当成最核心的数据资产之一。

这也解释了为什么“模型公司”和“Agent 产品公司”的边界可能变模糊：产品层每天产生真实任务，训练层最缺的恰好是真实任务。

## 风险在哪

我对 MiMo-V2.6 的判断有几个明显风险。

首先，官方 benchmark 和第三方聚合榜都不等于长期真实使用。模型在公开评测里很强，可能仍然在长时间工具调用、异常恢复和企业私有系统里暴露问题。

其次，强化学习越依赖自动 grader，越要担心 grader 自己被利用。模型可能学会通过测试，而没有学会真正更好的行为。MiMo 官方专门提到 adversarial screening、异常检测和 verifier cross-check，本身就说明 reward hacking 不是边缘问题。

第三，开放权重也不等于低成本自部署。1.02T 总参数的模型，即使只有 42B 激活，对大多数企业仍然是很重的基础设施。API 很便宜和自己部署很便宜是两件不同的事。

什么证据会推翻我的判断？如果未来一年更强的模型主要还是靠预训练规模和架构变化获得提升，而复杂 RL 环境、grader 和 verifier 对真实任务的边际收益很快变小，那“训练系统成为主要壁垒”就是我高估了。

我下一步最想查四件事：MiMo 在独立长时程 Agent benchmark 上能否维持优势；一条成功 Agent 轨迹的实际训练成本是多少；grader compute 在总训练成本里占多大比例；以及这些从 coding、视觉和安全任务中学到的策略，究竟有多少能迁移到训练时没见过的新 harness。真正能回答这几个问题，才知道 MiMo-V2.6 是一次漂亮的榜单跃升，还是模型训练范式正在换重心。

## 参考资料

- XiaomiMiMo：MiMo-V2.6-Pro-RL 官方模型卡与技术说明  
  https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL
- XiaomiMiMo：MiMo-V2.6 Technical Report  
  https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL/blob/main/MiMo_V2_6_technical_report.pdf
- Artificial Analysis：MiMo-V2.6-Pro 独立性能与价格页面  
  https://artificialanalysis.ai/models/mimo-v2-6-pro
- VentureBeat：MiMo-V2.6-Pro / Flash 发布报道，2026-09-21  
  https://venturebeat.com/technology/better-than-deepseek-xiaomis-mimo-v2-6-pro-debuts-as-the-top-open-weights-model-in-the-world-alongside-cheaper-v2-6-flash
