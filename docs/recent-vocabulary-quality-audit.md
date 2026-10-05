# 2025—2026 阅读词汇校对（2026-10-05）

逐条检查原有 367 条阅读正文及选项词；修正 104 条释义，另补回 2025 Text 2 照片中的 ingenuity。现有词条 ID 和英文词头保持不变，新增词使用新的 ID，保留学习记录关联。

依据：用户提供的书页照片（190—196、199—204 页）及仓库阅读原文。照片本身存在少量错误，不能机械照抄，例如 literacy 对应了 scholarly 的音标和释义、colonist 被标了形容词、enlivening 被标了名词。已按英文词头及阅读语境纠正；保留原有正确的 literacy 释义。

主要问题：OCR 残留空括号和引号；跨行串义（piracy 被串成 upload）；词性删除造成释义粘连（commission、wireless）；换行截断（severe、blaze、deliver）；重要义项丢失（sequence、pinpoint）；语境义遗漏（Paramount 为公司名、ephemera 为短期印刷品）。

词典复核：[piracy](https://dictionary.cambridge.org/us/dictionary/english/piracy)、[domestication](https://dictionary.cambridge.org/dictionary/english/domestication)、[ephemera](https://dictionary.cambridge.org/us/dictionary/english/ephemera)、[desert](https://dictionary.cambridge.org/dictionary/english/desert)。英文阅读上下文仍以仓库原文为准。

2026 Text 3 的 sheer 至 broom 和 shrink 属于正文词；ingenuity 与 be accessible to 至 hum 属于选项词。按照片恢复分组，并为所有词条恢复实际所在书页。2025 Text 2 新补 ingenuity 在 192 页。

正式导入源为 `data/recent-reading-vocabulary.json`，不再使用未受版本控制的 `work/recent-vocabulary-final.json`。导入脚本校验已有词条 ID，不允许重排编号或丢失词条。逐条修订前后对照见 `recent-vocabulary-quality-audit.json`；语义修订表见 `data/recent-vocabulary-corrections.json`。

新增测试覆盖 OCR 残留、括号完整性、主要错义、正文与选项分界、正式来源与运行词库一致性。自动校验只能发现部分格式和回归问题，不能代替逐条语义校对。
