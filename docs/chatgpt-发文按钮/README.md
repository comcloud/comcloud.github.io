# 给 ChatGPT 装一个「发文」按钮

配好之后你对它说「今天看了 XX，写一篇发出去」，它自己写完、自己调用 GitHub、自己上线。
你不用再碰 git，也不用再手动粘 issue。

原理：Custom GPT 的 Actions 可以直接打 GitHub REST API。ChatGPT 建一条打了「发文章」
标签的 issue，仓库里的 Actions 接手后面所有事。这条链路已经实测过（issue #2 就是用它建的）。

**需要 ChatGPT Plus / Pro / Team**，免费版没有 Custom GPTs。

---

## 1. 建一个最小权限的 token

去 <https://github.com/settings/personal-access-tokens/new>：

| 项                   | 填什么                                                       |
| -------------------- | ------------------------------------------------------------ |
| Name                 | `shouji-gpt`                                                 |
| Expiration           | 90 天（别设永不过期）                                        |
| Repository access    | **Only select repositories** → `comcloud/comcloud.github.io` |
| Permissions → Issues | **Read and write**                                           |
| 其它所有权限         | 不动，保持 No access                                         |

只要 Issues 这一项。它拿不到仓库代码、拿不到 Pages 设置、也碰不到别的仓库。

建完复制那串 `github_pat_...`。

## 2. 建 GPT

1. ChatGPT 左侧 → **Explore GPTs** → 右上角 **+ Create**；
2. 选 **Build** 标签页；
3. Name 填 `随手记`，Description 填 `成都犀牛的个人思考站点发文助手`；
4. **Instructions** 框里贴两部分，顺序如下：
   - 先贴 [`docs/给chatgpt的写作规范.md`](../给chatgpt的写作规范.md) 中「从这里开始复制」到结尾的那整段；
   - 再贴下面这段「发文按钮怎么用」。

### 追加到 Instructions 的内容

```text
# 发文按钮（你唯一的发布手段）

我有两个工具：
- publishPost：发布一篇新文章
- revisePost：修改一篇已经发出去的文章

## 什么时候发

写完一篇文章后，先把它完整显示给我，末尾问一句「发？」。
我说「发」「上线」「go」之类的，才调用 publishPost。
我说「直接发，别问」时，跳过确认。

## 调用 publishPost 时

- title：文章的中文标题
- body：元数据块 + 正文，跟前面「输出格式」那一节完全一致，不要包代码围栏
- labels：固定 ["发文章"]
- draft：必须是 false，true 会导致发不出去

## 发完之后

- 把返回的 issue 编号和链接告诉我，例如：「已提交，issue #37，约一分钟后上线」
- **自己记住这个编号**，我后面说「改一下刚才那篇」时要用 revisePost，不要新建一条
- 如果返回 401，直接说「token 过期或无效，去 GitHub 重新生成一个」，不要重试
- 如果返回 422，说清是哪条规则没过，改好再发

## 绝对不要做的事

- 不要为了同一篇文章调用两次 publishPost。改内容用 revisePost。
- 不要发正文少于 200 字的东西，那一定是你漏写了。
- 不要修改不是我发的那条 issue。
- 不要试图用别的方式发布，比如让我复制粘贴、或者建议我改代码。
```

## 3. 配 Actions

同一个 Create 页面往下滚到 **Actions**：

1. 点 **+ Create new action**（或 Import from URL，随便选，然后手动贴）；
2. **Schema** 框里贴 [`openapi.yaml`](openapi.yaml) 的全部内容；
3. **Authentication** → 选 **API Key**：
   - Custom header name：`Authorization`
   - Value：`Bearer <第 1 步那串 token>`
4. **Save**。

## 4. 测一下

在 GPT 的预览窗里说：

> 写一篇 300 字左右的测试文章，主题是「这个站点为什么用静态页」，写完直接发。

预期：它先给你看正文 → 你说「发」→ 它返回一个 issue 链接。
一分钟后打开 <https://comcloud.github.io/> 应该能看到这篇。

验证完去那条 issue 右上角 **Close comment** 关掉，或者直接删掉对应的 md 文件：

```bash
git rm src/content/blog/<那个 slug>.md && git commit -m "删掉测试稿" && git push
```

## 常见问题

**返回 401**：`Bearer` 前缀漏了，或者 token 过期。也可能 ChatGPT 又帮你加了一层
`Bearer`，变成 `Bearer Bearer ...`——把 Value 改成 `github_pat_xxx`（不带前缀）再试。

**返回 422 Validation Failed**：多半是标签名打错了。必须是 `发文章` 三个字，
不带空格、不用英文。

**Actions 面板里 Test 按钮报 CORS 或解析失败**：不影响实际调用，GitHub 的 API 对
浏览器预检不友好。直接到对话里让它试。

**它不肯调用工具，只把内容打出来给我**：Instructions 里那段「你唯一的发布手段」被它
忽略了。把「绝对不要做的事」那几条往上挪到显眼位置，或者在对话里明确说「用 publishPost 发」。

**token 泄露担心**：Actions 的认证头由 ChatGPT 服务端注入，模型本身看不到 token，
对话里问它也吐不出来。但**别把这个 GPT 设为 Public 或分享给别人**，保持
**Only me**。真泄露了去 GitHub 撤销这个 token 就行，影响面只有"别人能往你仓库发 issue"。
