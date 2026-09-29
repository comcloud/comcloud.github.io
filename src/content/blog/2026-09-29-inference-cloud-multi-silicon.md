---
title: "100MW 的 Cerebras 订单说明，推理云正在从“GPU 云”变成“工作负载调度市场”"
excerpt: "我觉得 Cerebras 和 Gimlet Labs 这笔合作真正有意思的地方，不是又有人买了很多 AI 芯片，而是云计算的产品单位正在发生变化：客户未来买的可能不再是“某一种 GPU 的小时数”，而是一个具体工作负载所需要的延迟、吞吐和成……"
coverImage: "/blog-images/2026-09-29-inference-cloud-multi-silicon.jpg"
publishDate: "2026-09-29"
isFeatured: false
tags: 
  - "AI基础设施"
  - "推理云"
  - "芯片"
  - "创业机会"
issue: 67
---

我觉得 Cerebras 和 Gimlet Labs 这笔合作真正有意思的地方，不是又有人买了很多 AI 芯片，而是云计算的产品单位正在发生变化：客户未来买的可能不再是“某一种 GPU 的小时数”，而是一个具体工作负载所需要的延迟、吞吐和成本结果。

9 月 28 日，Cerebras 和 Gimlet Labs 宣布扩大合作。Reuters 报道，Cerebras 将向 Gimlet 提供约 100MW 规模的 AI 系统，设备将在一到两年内交付，Gimlet 计划从 2027 年开始通过自己的云向客户提供这些系统。双方官方公告则给出了更明确的产品目标：把 Cerebras 的 wafer-scale compute 集成进 Gimlet Cloud，为 Agent、语音和实时应用提供最高约 3000 tokens/s 的推理速度。

如果只把它理解成 Cerebras 拿到一个大客户，会漏掉 Gimlet 的角色。Gimlet 9 月初融资时公开说，它在做的是 multi-silicon inference cloud：把推理任务的不同阶段放到最合适的芯片上，而不是把整个模型固定在一种硬件上。公司还称已经获得数十亿美元合同收入，并管理数百兆瓦的异构基础设施。

这背后是一个我很想继续追踪的变化：AI 云正在从“卖通用算力”向“替客户调度异构算力”移动。

第一，推理市场开始允许不同芯片按任务分工。

训练时代有一个很强的规模效应：大家倾向于把大集群做成相对统一的硬件环境，因为通信、软件栈和运维越一致越好。但推理天然更碎。预填充、解码、长上下文、批处理、实时语音、视频、Agent 调用，对延迟和吞吐的要求完全不同。

如果 Gimlet 的模式真的跑通，一条用户请求可能没有必要从头到尾都跑在同一种芯片上。某些环节追求极低延迟，可以用 Cerebras；另一些环节追求吞吐和成本，可以继续用 GPU 或其他加速器。

这就像物流行业从“租一辆卡车”变成“买一个准时送达的服务”。客户不需要知道每一段路用了什么车，只关心速度、价格和可靠性。

第二，AI 基础设施的竞争单位可能从芯片品牌变成 SLA。

今天创业公司选算力时，经常还是按 GPU 型号比较价格。但真正商业化之后，企业更关心的其实是：一个语音 Agent 能不能在几百毫秒内响应；一个安全系统能不能实时判断威胁；一个金融分析应用能不能在固定成本下支持多少并发。

当这些指标变成采购标准，云厂商最重要的能力就不是“我有多少张卡”，而是能不能把不同硬件组合成稳定的服务，并把复杂性藏在 API 后面。

这会给 NVIDIA 之外的芯片公司创造一个现实入口。它们不必要求客户把整个技术栈迁过去，只需要在某一种工作负载上明显更好，然后被云平台作为一个新的执行后端接进去。

第三，真正值得创业者研究的，可能是异构算力上面的调度层。

如果未来数据中心里同时存在 GPU、wafer-scale 系统、专用推理 ASIC、CPU 和各种边缘芯片，那么决定经济性的会越来越像“路由”。

哪个模型放在哪种芯片；同一个模型的 prefill 和 decode 是否拆开；什么时候为了低延迟支付更高成本；什么时候可以批处理；硬件失败后如何迁移；不同芯片怎样统一计费和监控——这些问题很难由芯片厂商自己全部解决。

这意味着基础设施创业窗口不一定只在造芯片。编译器、运行时、调度、性能预测、模型路由、成本优化、可观测性和跨硬件兼容，都可能变成新的控制层。

第四，100MW 说明推理已经不是“小模型部署”的附属市场。

100MW 对一家创业云公司来说不是试验规模。更重要的是，Gimlet 自己在 9 月融资材料里说，推理已经成为主导 AI 工作负载，并且正在扩展到数百兆瓦异构基础设施。

厂商的话需要打折，但资本和采购规模在说明同一件事：AI 行业开始把越来越多的钱从“训练一个更大的模型”转向“让模型每天真实服务大量用户”。

一旦这个变化持续，商业价值会从训练集群的一次性峰值采购，逐渐扩散到全年持续运行的推理系统。对云、芯片、电力和软件公司来说，这种需求可能更稳定，也更接近日常业务收入。

## 风险在哪

异构计算听起来合理，但工程成本可能非常高。不同芯片的软件栈、内存模型、精度、编译器和故障模式都不同。如果为了省 20% 算力成本，却让开发和运维复杂度增加一倍，客户未必愿意买单。

3000 tokens/s 也是厂商目标，不代表所有模型、所有上下文和真实生产流量都能达到。真正重要的是 P95 延迟、利用率、稳定性和每百万 token 的完整成本。

还有一个风险是 NVIDIA 自己会继续快速优化推理。如果通用 GPU 的性价比和软件便利性下降得足够快，多芯片调度的收益可能不足以抵消复杂性。

我下一步最想查的，是 Gimlet 真正公开客户的工作负载分布：哪些请求被路由到 Cerebras，哪些留在 GPU；同一个模型跨芯片执行时能节省多少成本；以及客户是否愿意为了低延迟支付明显溢价。如果这些数字成立，AI 云下一阶段争夺的就不只是算力库存，而是谁能成为异构算力的调度入口。

## 参考资料

- Cerebras 官方：《Gimlet Labs Adds Cerebras to Deliver Ultrafast AI Inference through Gimlet Cloud》  
  https://www.cerebras.ai/press-release/gimlet-labs-adds-cerebras-to-deliver-ultrafast-ai-inference-through-gimlet-cloud-deployment
- Reuters：《Cerebras to supply AI systems to cloud computing startup Gimlet Labs》  
  https://www.reuters.com/technology/cerebras-supply-ai-systems-cloud-computing-startup-gimlet-labs-2026-09-28/
- Gimlet Labs Series B 公告（GlobeNewswire）：《Now Valued at $3 Billion, Gimlet Labs Raises $300 Million》  
  https://www.globenewswire.com/news-release/2026/09/04/3356707/0/en/now-valued-at-3-billion-gimlet-labs-raises-300-million-in-series-b-led-by-andreessen-horowitz-for-industry-s-first-multi-silicon-inference-cloud-for-agentic-ai.html
