# 部署到 Sealos（交接清单）

这份文档写给**你**，不是写给我。我这台机器上没有 `gh`、没有 git 凭据、也没有 Docker，
所以下面这些步骤必须由你执行。

## 这条链路是怎么走的

```
你 git push main
      ↓
GitHub Actions（.github/workflows/docker.yml）构建镜像
      ↓
推到 ghcr.io/uzhang06-cpu/gerenzhuye:latest（同时打一个 :sha 标签）
      ↓
你在 Sealos 控制台点「重新部署」    ← 关键：Sealos 不会自动拉新镜像
      ↓
线上生效
```

**发版的关键点**：Sealos 侧的联动是手动的。推代码之后必须去 Sealos 点一次重新部署，
否则线上跑的还是旧镜像。这是你已经确认过的行为。

## 一、推送代码

```bash
cd /home/dev6423/projects/skillswap

# 首次需要设置 git 身份（本机目前没配过）
git config user.name "你的名字"
git config user.email "你的邮箱"

git add -A
git commit -m "替换为 SkillSwap 技能互换平台"
git push origin main
```

推送时如果要求凭据：用 GitHub 的 **Personal Access Token** 当密码（需要 `repo` 和 `write:packages` 权限），
或者在这台机器上先跑一次 `gh auth login`。

> **关于旧代码**：仓库原来那个个人主页（`index.html`、`portrait.png`、`resume.pdf`、校徽等 14 个文件）
> 会在这次提交里被删除。它仍然完整保留在 git 历史里，随时可以找回来：
> ```bash
> git log --oneline            # 找到 0c34510「添加 Sealos 容器部署配置」
> git checkout 0c34510 -- index.html portrait.png resume.pdf scu.png whu.png cards fonts nginx.conf
> ```
> 或者整体回到替换前的状态：`git revert <你这个新提交的 sha>`

## 二、等 Actions 跑完

去 `https://github.com/uzhang06-cpu/gerenzhuye/actions` 看构建结果。成功后镜像地址是：

- `ghcr.io/uzhang06-cpu/gerenzhuye:latest`
- `ghcr.io/uzhang06-cpu/gerenzhuye:sha-<短sha>`

**如果构建失败**，八成是 GHCR 权限问题：去仓库 `Settings → Actions → General → Workflow permissions`，
确认选中 **Read and write permissions**。

## 三、在 Sealos 点重新部署

在 Sealos 控制台找到这个应用，点「重新部署」。已经确认过的配置，**不需要改**：

| 配置项 | 值 | 说明 |
| --- | --- | --- |
| 镜像 | `ghcr.io/uzhang06-cpu/gerenzhuye:latest` | 与原来一致 |
| 容器端口 | `80` | 新镜像仍然监听 80，端口配置不用动 |
| 副本数 | 1 | 单用户原型，够用 |
| 资源 | 0.1 core / 128–256 MiB | 静态托管 + 一个轻量 API |

## 四、验证线上是新的

打开 `https://<你的域名>/api/health`，应当返回：

```json
{
  "ok": true,
  "version": "<commit sha>",
  "uptime": 12,
  "llm": { "configured": true, "mocked": false, "model": "deepseek-flash" }
}
```

`version` 就是你刚才那次 push 的 commit sha。**对上了就说明新版本真的上去了**；
如果还是旧的 sha、或者这个接口 404，说明 Sealos 没重新部署，或者拉到的还是旧镜像。

`llm.configured` 为 `false` 说明没配 key，此时「粘贴简历自动勾选」和「AI 生成大纲」会自动隐藏，
其余功能照常可用。

## 五、环境变量

在 Sealos 应用的「高级配置 → 环境变量」里加：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 你的 key | 只放在 Sealos，**不要**写进仓库、不要提交 |
| `DEEPSEEK_MODEL` | `deepseek-flash` | 留空则用服务端默认值；启动日志会打印账号下真实可用的模型 |
| `MOCK_LLM` | `1` | 可选。设为 1 时不调真实模型，走本地模拟（按别名匹配，产出的 id 天然合法），用来演示或跑验收而不烧额度 |

加上之后同样需要重新部署一次才会生效。

PDF / Word 简历的文字提取**不需要 key**，它是本地解析，不调任何外部服务。

## 六、部署后的验收清单

照着点一遍，几分钟能确认整条链路是通的：

1. `/api/health` 的 `version` 等于本次 commit sha，`llm.configured` 为 true
2. 打开根路径 → 出现「初见 · 你是谁」的引导弹窗（若没出现，先清一下站点 localStorage）
3. 走完三步引导 → 出来 5 步漫游指引 → 末步点「立即去发布」能唤起发布弹窗
4. 底部导航五格，「+」在正中间；四个页面都能切换
5. 集市里点任意一门课的「约课」→ 技能币减少，并跳到「交换中」看到新会话
6. 传一份 PDF 简历到「快速导入」→ 文字被提取出来 → 点解析能自动勾选技能
7. 发布弹层里选技能 + 写标题 → 点「AI 生成」能填出大纲

## 常见问题

**线上没变化** → 99% 是忘了在 Sealos 点重新部署。先用 `/api/health` 的 `version` 判断。

**Actions 里 ImagePullBackOff / 拉不到镜像** → GHCR 上的包默认是私有的。去 GitHub 的
`Packages` 页面把 `gerenzhuye` 这个包的可见性改成 Public（镜像里没有任何密钥，
密钥都是运行时的环境变量），或者改用 PAT 建 imagePullSecret。

**接口 404 / 页面白屏** → 先看 `/api/health` 通不通。通了但页面白屏，多半是 `index.html`
被缓存了，强刷一次。
