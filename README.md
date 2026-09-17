# 读词 · 考研英语一阅读词汇

使用用户提供的《考研英语阅读真题词汇 - 英语一【公众号：学长小谭考研】》提取的 2,619 个语境词条，覆盖 2010—2026 年的 68 篇阅读。词条保留 PDF 释义、阅读分组及原始页码，不包含另行生成的释义。

## 功能

- 阅读书架支持复习全景、阅读卡片、紧凑清单；全景按年份 × Text 显示复习轮次、词条覆盖率和错词数。
- 英文选四个中文释义，可选择“不认识”；支持原文顺序、乱序、10/20/全部词条。
- 每题保存到 D1，重复提交幂等；中断后通过首页或历史续练。
- 重新点击同一篇优先续练，刷新可恢复当前会话；“新一轮”才会新建记录。保存退出后，首页优先显示最近学习的篇目。
- 错词保留出错次数，连续答对 3 次标记已巩固；答错重新计数。答对一次、两次分别在 1 天、3 天后到期。
- 学习足迹包含开始时间、练习类型、完成状态、答题数、正确率、用时及当次错词。
- 数据通过 Sites 认证用户 ID 隔离。仅布局偏好使用本机存储。

## 本地运行

Node.js 24+，安装锁定依赖后运行：

```sh
npm run dev
```

访问终端显示的地址，在页面点击登录使用本地模拟身份。云端由 Sites 的私有访问权限和身份转发保护；本地模拟用户不用于生产。

初次初始化本地数据库：

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_mushy_strong_guy.sql
```

上述迁移只执行一次。后续修改表结构使用 Drizzle 生成新的迁移，不重写已部署迁移。

## 验证

```sh
node --experimental-strip-types --test scripts/study.test.ts
node --experimental-strip-types --test scripts/regressions.test.ts scripts/questions.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

`scripts/verify-api.py` 用本地服务器测试重复提交、持久化、续练、结束练习、错词巩固和未登录访问。该脚本会创建本地测试记录，将测试会话 ID 写入忽略的 `work/api-test-sessions.json`。

`scripts/extract-vocabulary.py` 可从原 PDF 重新提取数据；文件路径在脚本中。提取统计位于 `docs/extraction-report.json`。

## 统计口径

完成一次按篇练习计 1 轮（含 10 / 20 词）；未完成练习和跨篇错词复习不计入篇目轮次。完整练完表示该次覆盖篇内全部词条。词条进度按“阅读篇目 + 词条”去重，同词不同语境独立记录。用时按每题显示至提交的时间累计，每题最多计 5 分钟，不含答案反馈页面停留时间。

