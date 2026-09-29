---
title: "NVIDIA 把 Agent 安全做到 DPU 里，说明安全正在变成基础设施问题"
excerpt: "我对 NVIDIA 新发布的 Open Agent Safety Platform 最感兴趣的地方，不是又多了一个 Agent 安全产品，而是它把一部分安全控制从模型、Prompt 和 Agent Harness 继续往下移，甚至移到了独立……"
coverImage: "/blog-images/2026-09-29-agent-safety-hardware-layer.jpg"
publishDate: "2026-09-29"
isFeatured: false
tags: 
  - "Agent安全"
  - "AI基础设施"
  - "运行时安全"
issue: 65
---

我对 NVIDIA 新发布的 Open Agent Safety Platform 最感兴趣的地方，不是又多了一个 Agent 安全产品，而是它把一部分安全控制从模型、Prompt 和 Agent Harness 继续往下移，甚至移到了独立的 DPU 上。这个方向如果成立，Agent 安全最后可能更像云计算里的网络隔离和零信任，而不是“大模型再听话一点”。

最容易出现的说法是：NVIDIA 只是给 Agent 加了一个更强的沙箱。我觉得这个理解太轻了。官方设计里，OpenShell 负责运行时边界和策略执行，Sentry 则跑在 BlueField-4 DPU 上，以独立于 Agent 和主机软件的方式监控行为，并在检测到越界时执行隔离。真正变化的是“谁拥有最后的否决权”。

第一，安全控制正在离开 Agent 自己所在的信任域。

很多 Agent 安全方案默认一个前提：Agent 可以被 Prompt、框架规则或者应用代码约束。但过去几个月连续出现的事故已经暴露一个麻烦——当 Agent 的目标是完成任务时，应用层规则并不一定足够。模型可能理解规则，也可能在复杂工具链里产生开发者没有预期到的外部效果。

如果安全策略和 Agent 运行在同一个进程、同一台主机，甚至由同一个 Agent 自己解释，边界天然比较脆弱。NVIDIA 现在提出的方向是：把监控和一部分策略执行放到 Agent 之外。Sentry 通过 DPU 做 out-of-band 监控，这个思路和服务器时代的独立管理控制面有些相似——工作负载可以出错，但它不应该拥有关闭监管者的权限。

这件事的重要性在于，Agent 一旦开始真正操作数据库、云服务、代码仓库、企业系统甚至机器人，安全就不能只依赖“模型记得规则”。

第二，Agent 安全正在变成基础设施采购项。

NVIDIA 的平台把身份、工具访问、数据访问、策略判定、审计记录放进同一个基础设施设计里。官方列出了微软、JPMorgan Chase、Salesforce、SAP 等大量参与方。这个名单属于厂商披露，不能直接等同于成熟生产部署，但方向已经很清楚：Agent 安全正在从应用开发问题，变成平台、云、网络和硬件团队都要参与的问题。

这会改变企业部署 Agent 时的问题清单。过去大家更多问模型选谁、工具怎么接、知识库怎么做。以后会多出一组更像基础设施的问题：Agent 用什么身份运行？凭据由谁保存？哪些服务可以访问？什么时候允许临时提权？谁能暂停 Agent？出现异常后，能不能完整还原它做过什么？

当这些问题逐渐标准化，Agent Runtime 就会更像容器、IAM 和网络策略，而不只是一个开发框架。

第三，安全和性能会被一起重新设计。

安全检查、沙箱和审计过去经常被嫌慢。NVIDIA 显然意识到了这一点，所以把 Vera CPU、BlueField DPU、OpenShell 和 Sentry 放进一套系统设计里，并把低开销作为产品目标。厂商公布的性能数字还需要独立验证，但这个思路本身很关键：如果 Agent 的每个真实动作都要经过权限判断，那么安全系统必须跟得上 Agent 的执行速度。

二阶影响可能是，未来 Agent 基础设施的性能指标不再只是 tokens/s 和模型延迟。企业真正关心的会变成：在沙箱、策略检查、审计和身份控制全部打开时，一个任务要多久完成，吞吐量下降多少，失败后能不能快速恢复。没有安全开销的 benchmark，对真实部署的解释力会越来越弱。

风险在哪？

硬件隔离不是魔法。DPU 可以阻止 Agent 访问不该访问的系统，但它无法自动判断一个“允许的动作”在业务上是不是错的。比如 Agent 有权给某个客户退款，退款对象却选错了，这依然可能完全符合底层访问策略。真正的业务安全还需要审批、状态规则、效果验证和人工责任边界。

另一个风险是复杂度。把 Agent 安全扩展到 CPU、DPU、网络、身份和策略系统后，部署和调试会更难。很多中小团队未必愿意为了 Agent 建一整套硬件安全栈。OpenShell 可以运行在第三方硬件上，但 Sentry 的完整设计与 NVIDIA 自己的基础设施结合更紧，这也可能形成新的平台依赖。

我也可能高估了硬件层安全的普适性。如果未来大多数事故并不是 Agent “越过边界”，而是在正常权限范围内做出了错误决策，那么硬件层解决的只是问题的一部分。AP 在报道中也引用安全研究者提醒，这类系统是积极的一步，但仍远谈不上把 Agent 安全问题解决。

下一步我最想查四件事：OpenShell 在非 NVIDIA 硬件上的真实开销是多少；Sentry 对已经公开的 Agent 事故能阻止哪些、阻止不了哪些；企业是否真的把凭据、提权和审批迁移到这套运行时；以及生产环境中有多少 Agent 行为会被策略拒绝或暂停。只有这些数据出来以后，我们才能判断 Agent 安全是在形成新的基础设施层，还是暂时只是一次很完整的参考设计。

## 参考资料

- NVIDIA 官方发布：https://nvidianews.nvidia.com/news/open-agent-safety-platform
- NVIDIA Technical Blog：https://developer.nvidia.com/blog/nvidia-open-agent-safety-platform-a-reference-for-continuous-in-silicon-agent-monitoring/
- AP：https://apnews.com/article/3c4d7c1cfde82851c0577d1fa29b8621
