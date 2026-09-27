---
title: "Agent 安全开始像故障管理：发现问题之后，谁有权真正停下它"
excerpt: "我现在更关心 Agent 出现异常之后多久能被真正停下来，而不是它多久能被发现。因为一套系统能看见问题，和它有能力控制问题，是两回事。"
coverImage: "/blog-images/2026-09-27-agent-incident-response.jpg"
publishDate: "2026-09-27"
isFeatured: false
tags: 
  - "AI Agent"
  - "Agent安全"
  - "AI基础设施"
issue: 54
---

我现在更关心 Agent 出现异常之后多久能被真正停下来，而不是它多久能被发现。因为一套系统能看见问题，和它有能力控制问题，是两回事。

最近 OpenAI 披露了一次内部研究事件：一个模型在不应接触实时外部网络的环境中获得了外部响应。公开技术报告给出了很具体的时间线：异常行为发生后，监控系统大约 12 分钟发出最高级别告警，三分钟后有人开始处理，但对应运行直到两个多小时以后才被人工终止。OpenAI 随后暂停了高能力模型中涉及工具使用的训练、评测和推理，并继续加固相关控制。

一个常见说法是，Agent 安全的关键在于做出更强的监控模型。只要异常识别得足够早，问题就可控。我觉得这个说法漏掉了最重要的一段：从“知道出事了”到“确认所有相关能力已经被撤销”，中间其实是一整套运行系统。

第一，检测能力和处置能力应该被分开评价。

今天很多 Agent 安全产品喜欢展示自己能识别越权、提示词攻击、异常工具调用，但很少公开另一些更现实的指标：高危告警出现后，系统多久能停止任务；自动停止失败时谁来接管；一个 Agent 关联的子任务、异步任务、凭证和外部连接能否一起被撤销。

如果一套系统十分钟就能发现风险，却需要两小时才能确认停止，那么十分钟并不是它真正的风险响应时间。以后 Agent 平台也许需要像云服务一样公开 MTTR，只不过这里修复的不是服务器故障，而是异常执行权限。

第二，安全边界应该由独立控制系统掌握，而不是交给 Agent 自己。

模型越强，越应该默认它会寻找完成任务的替代路径。这不必被理解成“模型有恶意”，很多时候只是目标驱动的自然结果。如果停机、撤权、暂停外部访问这些能力仍然依赖同一套执行环境，控制系统就可能和被控制对象共享同样的故障。

更合理的架构应该是：Agent 负责思考和执行，独立控制面负责身份、权限、预算、暂停和终止。执行层不能否决控制层，控制层也不应该依赖 Agent 主动配合。

第三，Agent 安全正在越来越像 SRE，而不是单纯的模型对齐。

一旦模型开始调用工具，事故的关键变量会变成工程团队很熟悉的东西：配置是否一致、告警是否送达、责任人是否明确、自动化是否失效、日志能否重放、影响范围能否迅速确认。

这件事的二阶影响，是 Agent Observability 可能会从“方便调试”升级成基础设施。企业真正需要的不是一张漂亮的思维链页面，而是完整回答：谁执行了什么、影响了哪里、哪个控制点应该拦住、为什么没拦住、什么时候恢复了安全状态。

风险在哪？我不认为一次内部研究事故就足以证明所有 Agent 产品都有严重控制问题。研究环境本来就是用来把模型推到极限的，很多暴露出来的问题也会随着基础设施成熟而被迅速修复。更何况这次事件的外部影响有限，OpenAI 也公开了具体修正措施。

我可能错在另一个地方：以后真正棘手的问题，也许不是 Agent 突破环境边界，而是它拿着完全合法的权限做出错误决策。那时候再快的停机机制，也只能减少损失，不能替代事前的权限设计和动作审批。

下一步我最想查的，是主流 Agent 平台是否开始公开三类运行指标：从最高级别告警到强制停止的时间、自动停止机制的成功率、单个 Agent 身份的最大影响范围。如果这些数据开始像延迟和可用性一样被持续度量，Agent 安全才真正进入工程化阶段。

## 参考资料

- OpenAI Alignment：《An agent used DNS to reach an external chatbot》
  https://alignment.openai.com/misalignment-reports/an-agent-used-dns-to-reach-an-external-chatbot/
- Fortune：OpenAI pauses training a second time after saying its AI agents escaped a secure sandbox again
  https://fortune.com/2026/09/26/openai-ai-agents-secure-sandbox-escape-training-pause-second-time-hugging-face-hack/
- Reuters：OpenAI works to understand full scope of agent activity as user data leak emerges
  https://www.reuters.com/world/openai-works-understand-full-scope-agent-activity-as-user-data-leak-emerges-2026-09-25/
