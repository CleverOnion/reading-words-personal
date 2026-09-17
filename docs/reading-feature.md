# 阅读原文与词汇对照

已收录用户提供的 2010–2026 年英语一 Reading Part A，68 篇、427 段。试题题干、选项与 Part B/C 不作为这批阅读原文导入。

原文来自用户 Word 文件，原始文件保持不变。2022 文件虽为 .docx 扩展名，实际与 2023 一样为 OLE Word 格式，按二进制 piece table 读取。已合并断页造成的段落分裂，整理多余空白；2023 的明显字符修复记录在 `scripts/prepare-reading-sources.py`。未在原文找到的词，可能来自题目、选项、词表扩展或转录差异，界面明确标注，不生成例句。

文档未附 Reading Part A 全文译文，中文为 AI 参考译文，并非官方译文。每篇按原文段落对应。2015-4 原文件 “dangerous goals” 存疑，保留并显示校对提示。

按用户要求，背词释义优先采用原 PDF。本次未改动 data/vocabulary.json：练习正确答案、错词本、原文词卡及重点词均从同一 PDF 词库读取；AI 译文只提供文章理解参考，不覆盖词条释义。

数据流程：

1. `python scripts/extract-reading-word.py <用户Word目录>`：只读提取原文件到忽略的 work/readings。
2. `python scripts/prepare-reading-sources.py`：按核对过的范围整理到 data/reading-sources。
3. data/reading-translations 存储逐段译文。
4. `node scripts/build-readings.mjs`：校验段落对应、生成 public/readings/{id}.json 与 docs/reading-match-report.json。

每次只加载当前篇原文。阅读弹层保留底层题目与反馈；弹层打开时禁用作答快捷键，并从题目用时中扣除阅读时间。手机使用底部释义栏，桌面使用侧栏。Esc、返回学习或关闭按钮返回原页面。

重点词保存到 D1 saved_words 表，以用户与词条为联合主键，收藏不产生虚假错题记录。在错词手记中可复习重点词。备份升级为版本 2（包含 saved_words）；导入脚本兼容版本 1。部署新代码前需先应用 0002 数据库迁移。

2024–2026 使用用户提供的《考研英语一YYYY年真题（整卷）.docx》，由 scripts/import-recent-reading-word.py 提取。重复的 2024 文件内容相同，仅导入一次。新增 12 篇、77 段译文；对应词义仍取自原 PDF 词库。
