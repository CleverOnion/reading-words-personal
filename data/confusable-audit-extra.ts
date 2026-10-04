// Audited additions. Candidate membership is enforced against the syllabus dictionary at lookup.
// Explicit derived-form mappings avoid aggressive automatic stemming.
export const confusableAuditExtra: {words:string[];note:string}[] = [
  {
    "words": [
      "abundant",
      "redundant"
    ],
    "note": "abundant 表示丰富、充足；redundant 表示多余，也可指因岗位撤销而被裁员。"
  },
  {
    "words": [
      "accelerate",
      "accumulate",
      "accommodate"
    ],
    "note": "accelerate：加速；accumulate：积累；accommodate：容纳、为……提供住宿，或适应。留意 accel-、accum-、accom-。"
  },
  {
    "words": [
      "acquire",
      "require"
    ],
    "note": "acquire：获得、习得；require：需要、要求。"
  },
  {
    "words": [
      "administration",
      "admission"
    ],
    "note": "administration：管理、行政部门；admission：准许进入、入场费，或承认。"
  },
  {
    "words": [
      "aggressive",
      "progressive"
    ],
    "note": "aggressive：好斗的、积极进取的；progressive：逐步发展的、进步的。"
  },
  {
    "words": [
      "aggregation",
      "aggregate",
      "aggravate"
    ],
    "note": "aggregation：聚集、集合；aggregate：合计、集合体；aggravate：使恶化。注意 -greg- 与 -grav-。"
  },
  {
    "words": [
      "alleviate",
      "elevate"
    ],
    "note": "alleviate：减轻痛苦或负担；elevate：提高、提升。"
  },
  {
    "words": [
      "ancestor",
      "predecessor",
      "descendant"
    ],
    "note": "ancestor：祖先；predecessor：职位上的前任或被替代的事物；descendant：后代。"
  },
  {
    "words": [
      "arrogant",
      "ignorant"
    ],
    "note": "arrogant：傲慢的；ignorant：无知的、不知情的。"
  },
  {
    "words": [
      "artificial",
      "superficial"
    ],
    "note": "artificial：人造的、虚假的；superficial：表面的、肤浅的。注意 arti- 与 super-。"
  },
  {
    "words": [
      "autonomous",
      "automatic",
      "autonomy"
    ],
    "note": "autonomous：自治的、自主的；automatic：自动的；autonomy：自治、自主权。"
  },
  {
    "words": [
      "autobiography",
      "biography",
      "bibliography"
    ],
    "note": "autobiography：自传；biography：传记；bibliography：参考书目。"
  },
  {
    "words": [
      "archivist",
      "archive",
      "achieve"
    ],
    "note": "archivist：档案管理员；archive：档案、存档；achieve：实现、取得。archive 不是 achieve。"
  },
  {
    "words": [
      "available",
      "valuable"
    ],
    "note": "available：可获得的、可使用的、有空的；valuable：有价值的。"
  },
  {
    "words": [
      "benefactor",
      "beneficial",
      "benevolent"
    ],
    "note": "benefactor：捐助者、施恩者；beneficial：有益的；benevolent：仁慈的、乐善好施的。"
  },
  {
    "words": [
      "bias",
      "basis"
    ],
    "note": "bias：偏见、偏向；basis：基础、依据。basis 中间有 s。"
  },
  {
    "words": [
      "boundary",
      "border",
      "bound"
    ],
    "note": "boundary 指界限或分界线；border 常指国界、边缘；bound 作名词可指界限，也可作动词表示跳跃。"
  },
  {
    "words": [
      "campaign",
      "champion"
    ],
    "note": "campaign：活动、战役；champion：冠军、倡导者，作动词可表示拥护。"
  },
  {
    "words": [
      "capacity",
      "capable"
    ],
    "note": "capacity：容量、能力，是名词；capable：有能力的，常用 capable of。"
  },
  {
    "words": [
      "collapse",
      "elapse"
    ],
    "note": "collapse：倒塌、崩溃；elapse：时间流逝。"
  },
  {
    "words": [
      "compliance",
      "complaint"
    ],
    "note": "compliance：遵守、服从；complaint：抱怨、投诉。结尾 -ance 与 -aint 不同。"
  },
  {
    "words": [
      "consistent",
      "constant"
    ],
    "note": "consistent：一致的、始终如一的；constant：持续的、不变的。"
  },
  {
    "words": [
      "constituent",
      "constitute",
      "constitution"
    ],
    "note": "constituent：组成部分、选民；constitute：组成、构成；constitution：宪法、构造、体质。"
  },
  {
    "words": [
      "consensus",
      "census"
    ],
    "note": "consensus：共识；census：人口普查。"
  },
  {
    "words": [
      "contemplate",
      "contempt"
    ],
    "note": "contemplate：深思、考虑；contempt：轻蔑。contemplate 的 -plate 不可省略。"
  },
  {
    "words": [
      "contemptible",
      "contemptuous",
      "contempt"
    ],
    "note": "contemptible：可鄙的；contemptuous：表示轻蔑的；contempt：轻蔑。前者描述被鄙视者，后者描述态度。"
  },
  {
    "words": [
      "corporation",
      "corporate",
      "cooperate"
    ],
    "note": "corporation：公司、法人；corporate：公司的；cooperate：合作。cooperate 中间是 operate。"
  },
  {
    "words": [
      "corruption",
      "corrupt",
      "erupt"
    ],
    "note": "corruption：腐败、损坏；corrupt：腐败的、使腐化；erupt：爆发。不要把 corrupt 与 erupt 混淆。"
  },
  {
    "words": [
      "criterion",
      "critical"
    ],
    "note": "criterion：标准、准则；critical：批评的、关键的。criteria 是 criterion 的复数。"
  },
  {
    "words": [
      "descendant",
      "descend",
      "descent",
      "decent"
    ],
    "note": "descendant：后代；descend：下降；descent：下降、血统；decent：体面的、像样的。"
  },
  {
    "words": [
      "desperate",
      "separate"
    ],
    "note": "desperate：绝望的、拼命的；separate：分开的、使分离。desperate 中没有 separate 的第二个 a。"
  },
  {
    "words": [
      "discriminate",
      "distinguish"
    ],
    "note": "discriminate 可指辨别，但 discriminate against 表示歧视；distinguish 强调识别差别，常用 distinguish A from B。"
  },
  {
    "words": [
      "discontent",
      "discount"
    ],
    "note": "discontent：不满；discount：折扣、打折。"
  },
  {
    "words": [
      "disintegrate",
      "integrate"
    ],
    "note": "disintegrate：瓦解、解体；integrate：整合、融入。前缀 dis- 改变方向。"
  },
  {
    "words": [
      "domestic",
      "democratic"
    ],
    "note": "domestic：国内的、家庭的；democratic：民主的。注意 dome- 与 demo-。"
  },
  {
    "words": [
      "editorial",
      "edition",
      "editor"
    ],
    "note": "editorial：社论、编辑的；edition：版本；editor：编辑。"
  },
  {
    "words": [
      "elite",
      "eligible"
    ],
    "note": "elite：精英；eligible：符合资格的、合格的。"
  },
  {
    "words": [
      "embed",
      "embody"
    ],
    "note": "embed：嵌入；embody：体现、包含。"
  },
  {
    "words": [
      "entrepreneur",
      "enterprise"
    ],
    "note": "entrepreneur：企业家、创业者；enterprise：企业、事业，或进取心。"
  },
  {
    "words": [
      "erode",
      "erupt"
    ],
    "note": "erode：侵蚀、逐渐削弱；erupt：爆发。"
  },
  {
    "words": [
      "experiment",
      "experience"
    ],
    "note": "experiment：实验、试验；experience：经历、经验。不能用 experiment 表示工作经验。"
  },
  {
    "words": [
      "expedite",
      "expedition"
    ],
    "note": "expedite：加快、促进办理；expedition：远征、探险队。expedition 不表示加快的动作。"
  },
  {
    "words": [
      "external",
      "eternal"
    ],
    "note": "external：外部的；eternal：永恒的。external 多一个 x。"
  },
  {
    "words": [
      "exhibition",
      "exhibit",
      "inhibit"
    ],
    "note": "exhibition：展览；exhibit：展出、表现出；inhibit：抑制。exhibit 与 inhibit 方向不同。"
  },
  {
    "words": [
      "fatal",
      "vital"
    ],
    "note": "fatal：致命的；vital：至关重要的、生命的。"
  },
  {
    "words": [
      "fragile",
      "fragment"
    ],
    "note": "fragile：易碎的、脆弱的；fragment：碎片、片段。"
  },
  {
    "words": [
      "generous",
      "genuine"
    ],
    "note": "generous：慷慨的；genuine：真正的、真诚的。"
  },
  {
    "words": [
      "illustrate",
      "illuminate"
    ],
    "note": "illustrate：举例说明、加插图；illuminate：照亮、阐明。两者均可用于说明，但不等于所有语境可互换。"
  },
  {
    "words": [
      "image",
      "imagine"
    ],
    "note": "image：形象、图像，是名词；imagine：想象，是动词。"
  },
  {
    "words": [
      "impel",
      "compel",
      "repel"
    ],
    "note": "impel：促使、驱使；compel：强迫；repel：击退、排斥。"
  },
  {
    "words": [
      "impetus",
      "impulse"
    ],
    "note": "impetus：推动力、刺激；impulse：冲动、脉冲。"
  },
  {
    "words": [
      "inhabitant",
      "inhabit",
      "inherit",
      "inherent"
    ],
    "note": "inhabitant：居民；inhabit：居住于；inherit：继承；inherent：固有的。注意 inhabit 与 inherit。"
  },
  {
    "words": [
      "innovation",
      "invention"
    ],
    "note": "innovation：创新、新方法；invention：发明、发明物。innovation 不限于创造全新的物品。"
  },
  {
    "words": [
      "interference",
      "interfere",
      "intervene"
    ],
    "note": "interference：干涉、干扰；interfere：妨碍、干涉；intervene：介入、干预，未必带负面评价。"
  },
  {
    "words": [
      "inventory",
      "invention"
    ],
    "note": "inventory：库存、清单；invention：发明。注意 -tory 与 -tion。"
  },
  {
    "words": [
      "label",
      "labor",
      "laboratory"
    ],
    "note": "label：标签、贴标签；labor：劳动、劳动力；laboratory：实验室。不要把 laboratory 误读成劳动力。"
  },
  {
    "words": [
      "legitimate",
      "legal"
    ],
    "note": "legitimate 可表示合法的，也可表示合理正当的；legal 强调与法律有关或法律允许。"
  },
  {
    "words": [
      "liberal",
      "liberty"
    ],
    "note": "liberal：自由主义的、开明的、宽松的；liberty：自由，是名词。"
  },
  {
    "words": [
      "magnificent",
      "magnitude",
      "magnify"
    ],
    "note": "magnificent：宏伟的、壮丽的；magnitude：大小、量级；magnify：放大。"
  },
  {
    "words": [
      "manuscript",
      "manufacture"
    ],
    "note": "manuscript：手稿、原稿；manufacture：制造。注意 manu- 后的 script 与 facture。"
  },
  {
    "words": [
      "merit",
      "mercy"
    ],
    "note": "merit：优点、价值，作动词表示值得；mercy：仁慈、宽恕。"
  },
  {
    "words": [
      "monopoly",
      "monotonous"
    ],
    "note": "monopoly：垄断；monotonous：单调乏味的。不要仅凭 mono- 判断词义。"
  },
  {
    "words": [
      "novel",
      "noble"
    ],
    "note": "novel：小说、新颖的；noble：高贵的、贵族。"
  },
  {
    "words": [
      "obstacle",
      "spectacle"
    ],
    "note": "obstacle：障碍；spectacle：景象、壮观场面。留意相同结尾前的拼写。"
  },
  {
    "words": [
      "official",
      "officer"
    ],
    "note": "official：官方的，或官员；officer：军官、警官、官员，指人。"
  },
  {
    "words": [
      "outcome",
      "income"
    ],
    "note": "outcome：结果；income：收入。"
  },
  {
    "words": [
      "panel",
      "penalty"
    ],
    "note": "panel：面板、专家小组；penalty：处罚、罚金。"
  },
  {
    "words": [
      "permanent",
      "prominent"
    ],
    "note": "permanent：永久的；prominent：突出的、知名的。"
  },
  {
    "words": [
      "persistent",
      "persist",
      "insist"
    ],
    "note": "persistent：坚持不懈的、持续的；persist 常接 in doing；insist 常接 on doing，也可接 that 从句。"
  },
  {
    "words": [
      "populous",
      "population",
      "popular"
    ],
    "note": "populous：人口稠密的；population：人口；popular：受欢迎的。populous 不表示受欢迎。"
  },
  {
    "words": [
      "preoccupy",
      "occupy"
    ],
    "note": "preoccupy：使全神贯注、使心事重重；occupy：占据、占用。preoccupied with 常表示专注于或为……挂心。"
  },
  {
    "words": [
      "prior",
      "priority"
    ],
    "note": "prior：先前的、优先的，常用 prior to；priority：优先事项、优先权，是名词。"
  },
  {
    "words": [
      "procedure",
      "process"
    ],
    "note": "procedure：规定的步骤、手续；process：过程、流程，也可作动词表示加工处理。"
  },
  {
    "words": [
      "propaganda",
      "propagate"
    ],
    "note": "propaganda：宣传，常带有影响舆论的意味；propagate：传播、繁殖，是动词。"
  },
  {
    "words": [
      "prosecution",
      "prosecute",
      "persecute"
    ],
    "note": "prosecution：起诉、公诉方；prosecute：起诉；persecute：迫害。pro- 与 per- 不同。"
  },
  {
    "words": [
      "qualify",
      "quantify"
    ],
    "note": "qualify：取得资格、限定；quantify：量化。"
  },
  {
    "words": [
      "qualification",
      "qualitative",
      "quantitative"
    ],
    "note": "qualification：资格、条件；qualitative：定性的；quantitative：定量的。"
  },
  {
    "words": [
      "random",
      "rational"
    ],
    "note": "random：随机的；rational：理性的、合理的。"
  },
  {
    "words": [
      "recognise",
      "reconcile"
    ],
    "note": "recognise：认出、认可；reconcile：使和解、使一致。注意 -gnise 与 -concile。"
  },
  {
    "words": [
      "recognize",
      "reconcile"
    ],
    "note": "recognize 是 recognise 的另一拼写，表示认出、认可；reconcile 表示使和解、使一致。"
  },
  {
    "words": [
      "recruit",
      "recite"
    ],
    "note": "recruit：招募、新成员；recite：背诵、朗诵。"
  },
  {
    "words": [
      "retrospect",
      "prospect"
    ],
    "note": "retrospect：回顾；prospect：前景、可能性。in retrospect 表示回过头看。"
  },
  {
    "words": [
      "rigid",
      "rigorous"
    ],
    "note": "rigid：僵硬的、刻板的、严格不变的；rigorous：严密的、严格认真的。"
  },
  {
    "words": [
      "sentiment",
      "sensitive"
    ],
    "note": "sentiment：情感、看法，是名词；sensitive：敏感的，是形容词。"
  },
  {
    "words": [
      "servant",
      "service",
      "serve"
    ],
    "note": "servant：仆人、服务人员；service：服务；serve：服务、供应。civil servant 指公务员。"
  },
  {
    "words": [
      "speculate",
      "spectacle",
      "spectator"
    ],
    "note": "speculate：推测、投机；spectacle：壮观场面；spectator：观众。speculate 不是观看。"
  },
  {
    "words": [
      "sponsor",
      "spouse"
    ],
    "note": "sponsor：赞助者、赞助；spouse：配偶。"
  },
  {
    "words": [
      "spontaneous",
      "simultaneous"
    ],
    "note": "spontaneous：自发的、自然的；simultaneous：同时发生的。"
  },
  {
    "words": [
      "stimulate",
      "simulate"
    ],
    "note": "stimulate：刺激、激励；simulate：模拟、假装。simulate 没有第一个 t。"
  },
  {
    "words": [
      "stimulus",
      "stimulate",
      "simulate"
    ],
    "note": "stimulus：刺激、刺激因素；stimulate：刺激、激励；simulate：模拟。后两者只差一个 t。"
  },
  {
    "words": [
      "subscription",
      "subscribe",
      "prescription"
    ],
    "note": "subscription：订阅、订阅费；subscribe：订阅；prescription：处方。不能用 prescription 表示订阅。"
  },
  {
    "words": [
      "substantial",
      "substance",
      "substitute"
    ],
    "note": "substantial：大量的、实质性的；substance：物质、实质；substitute：替代者、代替。"
  },
  {
    "words": [
      "supplement",
      "complement"
    ],
    "note": "supplement：补充、增补物；complement：与某物相配使其完整、补足。两者均非 compliment（赞美）。"
  },
  {
    "words": [
      "subsequent",
      "sequence"
    ],
    "note": "subsequent：随后的；sequence：顺序、连续系列。subsequent to 表示在……之后。"
  },
  {
    "words": [
      "sustainable",
      "sustain",
      "retain"
    ],
    "note": "sustainable：可持续的；sustain：维持、支撑；retain：保留。注意 sustain 与 retain 的不同前缀。"
  },
  {
    "words": [
      "supervision",
      "supervise",
      "surveillance"
    ],
    "note": "supervision：监督、管理；supervise：监督；surveillance：持续监视，常用于安全或侦查。"
  },
  {
    "words": [
      "suppression",
      "suppress",
      "oppress"
    ],
    "note": "suppression：压制、抑制；suppress：抑制、镇压；oppress：压迫。suppress 感情与 oppress 人群的对象不同。"
  },
  {
    "words": [
      "technological",
      "technical",
      "technique",
      "technology"
    ],
    "note": "technological：科技的；technical：技术的、专业性的；technique：具体技巧；technology：技术体系、科技。"
  },
  {
    "words": [
      "testament",
      "testimony",
      "testify"
    ],
    "note": "testament：证明、遗嘱；testimony：证词、证据；testify：作证。testimony 不表示遗嘱。"
  },
  {
    "words": [
      "thoughtful",
      "thought",
      "thorough"
    ],
    "note": "thoughtful：体贴的、深思熟虑的；thought：思想、想法；thorough：彻底的。注意 thought 与 thorough。"
  },
  {
    "words": [
      "translate",
      "transit"
    ],
    "note": "translate：翻译、转变；transit：运输、通过。"
  },
  {
    "words": [
      "transparent",
      "apparent"
    ],
    "note": "transparent：透明的、易看穿的；apparent：明显的、表面上的。"
  },
  {
    "words": [
      "triumph",
      "trumpet"
    ],
    "note": "triumph：胜利、成功；trumpet：小号，作动词表示大力宣扬。"
  },
  {
    "words": [
      "unanimous",
      "anonymous"
    ],
    "note": "unanimous：全体一致的；anonymous：匿名的。"
  },
  {
    "words": [
      "undergraduate",
      "graduate"
    ],
    "note": "undergraduate：本科生；graduate：毕业生、毕业，英式用法也常指大学毕业生。"
  },
  {
    "words": [
      "postgraduate",
      "graduate"
    ],
    "note": "postgraduate：研究生、研究生的；graduate：毕业生、毕业；美式 graduate student 也指研究生。"
  },
  {
    "words": [
      "vacuum",
      "vacant",
      "vacation"
    ],
    "note": "vacuum：真空；vacant：空着的、未被占用的；vacation：假期。"
  },
  {
    "words": [
      "vehicle",
      "vessel"
    ],
    "note": "vehicle：车辆、运载工具，或表达媒介；vessel：船、容器、血管。"
  },
  {
    "words": [
      "victim",
      "victory"
    ],
    "note": "victim：受害者；victory：胜利。"
  },
  {
    "words": [
      "virtuous",
      "virtue",
      "virtual"
    ],
    "note": "virtuous：有德行的；virtue：美德；virtual：虚拟的、事实上的。virtual 不表示有德行。"
  },
  {
    "words": [
      "visibility",
      "visible",
      "vision"
    ],
    "note": "visibility：可见度、能见度；visible：看得见的；vision：视力、远见。"
  },
  {
    "words": [
      "accessibility",
      "assess",
      "excess"
    ],
    "note": "accessibility：n.易接近，可达性。结合基础词 access 辨析：access：进入、使用的机会或权利；assess：评估；excess：过量、超额。"
  },
  {
    "words": [
      "acquisition",
      "require"
    ],
    "note": "acquisition：n.取得；学到；养成(习惯)；获得的东西。结合基础词 acquire 辨析：acquire：获得、习得；require：需要、要求。"
  },
  {
    "words": [
      "adaptable",
      "adopt",
      "adept"
    ],
    "note": "adaptable：adj.适应性强的，能适应的。结合基础词 adapt 辨析：adapt：适应、改编；adopt：采用、收养；adept：熟练的。"
  },
  {
    "words": [
      "advisory",
      "advise"
    ],
    "note": "advisory：adj.提供咨询的；劝告的，忠告的。结合基础词 advice 辨析：advice 是不可数名词“建议”；advise 是动词“建议”。"
  },
  {
    "words": [
      "aggressiveness",
      "progressive"
    ],
    "note": "aggressiveness：n.进取精神：攻击性；霸气。结合基础词 aggressive 辨析：aggressive：好斗的、积极进取的；progressive：逐步发展的、进步的。"
  },
  {
    "words": [
      "alleviation",
      "elevate"
    ],
    "note": "alleviation：n.缓和。结合基础词 alleviate 辨析：alleviate：减轻痛苦或负担；elevate：提高、提升。"
  },
  {
    "words": [
      "ancestral",
      "predecessor",
      "descendant"
    ],
    "note": "ancestral：adj.祖先的；祖传的。结合基础词 ancestor 辨析：ancestor：祖先；predecessor：职位上的前任或被替代的事物；descendant：后代。"
  },
  {
    "words": [
      "assessment",
      "access",
      "excess"
    ],
    "note": "assessment：n.评估；评定；看法。结合基础词 assess 辨析：access：进入、使用的机会或权利；assess：评估；excess：过量、超额。"
  },
  {
    "words": [
      "assumption",
      "presume"
    ],
    "note": "assumption：n.假定，设想；采取；承担；推测；假装。结合基础词 assume 辨析：assume 常指未经证实便假定；presume 常指根据一定迹象推定，二者在部分语境可互换。"
  },
  {
    "words": [
      "availability",
      "valuable"
    ],
    "note": "availability：n.供应能力；可得性；有效；有益；可利用性。结合基础词 available 辨析：available：可获得的、可使用的、有空的；valuable：有价值的。"
  },
  {
    "words": [
      "complementary",
      "compliment"
    ],
    "note": "complementary：adj.互补的；补充的。结合基础词 complement 辨析：complement：补充、使完善；compliment：赞美、恭维。"
  },
  {
    "words": [
      "conformity",
      "confirm"
    ],
    "note": "conformity：一致、遵从。结合基础词 conform 辨析：confirm：确认、证实；conform：遵守、符合。"
  },
  {
    "words": [
      "consideration",
      "considerable"
    ],
    "note": "consideration：n.尊重，体谅；需要考虑的事，理由；考虑，思考；报酬。结合基础词 considerate 辨析：considerable：相当大的；considerate：体贴的。"
  },
  {
    "words": [
      "contractual",
      "contact",
      "contrast"
    ],
    "note": "contractual：adj.合同的。结合基础词 contract 辨析：contract：合同、收缩；contact：接触、联系；contrast：对比、差异。"
  },
  {
    "words": [
      "corruptive",
      "corruption",
      "erupt"
    ],
    "note": "corruptive：adj.腐败性的；使堕落的；使腐败的。结合基础词 corrupt 辨析：corruption：腐败、损坏；corrupt：腐败的、使腐化；erupt：爆发。不要把 corrupt 与 erupt 混淆。"
  },
  {
    "words": [
      "criteria",
      "critical"
    ],
    "note": "criteria：n.标准。结合基础词 criterion 辨析：criterion：标准、准则；critical：批评的、关键的。criteria 是 criterion 的复数。"
  },
  {
    "words": [
      "critique",
      "criterion"
    ],
    "note": "critique：n.批判；评论文章v.评判；对……发表评论。结合基础词 critical 辨析：criterion：标准、准则；critical：批评的、关键的。criteria 是 criterion 的复数。"
  },
  {
    "words": [
      "desperation",
      "separate"
    ],
    "note": "desperation：n.极度渴望；拼命。结合基础词 desperate 辨析：desperate：绝望的、拼命的；separate：分开的、使分离。desperate 中没有 separate 的第二个 a。"
  },
  {
    "words": [
      "domestication",
      "democratic"
    ],
    "note": "domestication：驯养、驯化。结合基础词 domestic 辨析：domestic：国内的、家庭的；democratic：民主的。注意 dome- 与 demo-。"
  },
  {
    "words": [
      "effectiveness",
      "efficient"
    ],
    "note": "effectiveness：n.效力；有效性。结合基础词 effective 辨析：efficient：效率高、少浪费资源；effective：有效、能达到目的。"
  },
  {
    "words": [
      "embodiment",
      "embed"
    ],
    "note": "embodiment：n.象征；化身；具体表现；体现。结合基础词 embody 辨析：embed：嵌入；embody：体现、包含。"
  },
  {
    "words": [
      "enforcement",
      "reinforce"
    ],
    "note": "enforcement：实施，执行。结合基础词 enforce 辨析：enforce：执行、强制实施；reinforce：加强、加固。"
  },
  {
    "words": [
      "entrepreneurship",
      "enterprise"
    ],
    "note": "entrepreneurship：企业家精神、创业活动。结合基础词 entrepreneur 辨析：entrepreneur：企业家、创业者；enterprise：企业、事业，或进取心。"
  },
  {
    "words": [
      "exhaustion",
      "exhibit"
    ],
    "note": "exhaustion：n.疲惫；筋疲力尽；耗尽。结合基础词 exhaust 辨析：exhaust：耗尽、使筋疲力尽；exhibit：展出、表现出。"
  },
  {
    "words": [
      "expedited",
      "expedition"
    ],
    "note": "expedited：adj.加快的，快速的。结合基础词 expedite 辨析：expedite：加快、促进办理；expedition：远征、探险队。expedition 不表示加快的动作。"
  },
  {
    "words": [
      "illustration",
      "illuminate"
    ],
    "note": "illustration：n.插图；图解；示例。结合基础词 illustrate 辨析：illustrate：举例说明、加插图；illuminate：照亮、阐明。两者均可用于说明，但不等于所有语境可互换。"
  },
  {
    "words": [
      "immigration",
      "emigrate"
    ],
    "note": "immigration：n.移民；移居；移民人数。结合基础词 immigrate 辨析：emigrate：从某国移出；immigrate：移入某国。"
  },
  {
    "words": [
      "implementation",
      "instrument"
    ],
    "note": "implementation：n.实施，执行。结合基础词 implement 辨析：instrument：仪器、乐器；implement：实施，也可作名词指工具。"
  },
  {
    "words": [
      "intellect",
      "intelligent"
    ],
    "note": "intellect：n.才智，智力；才智非凡的人。结合基础词 intellectual 辨析：intellectual：智力的、知识分子；intelligent：聪明的、有智能的。"
  },
  {
    "words": [
      "objectiveness",
      "objection"
    ],
    "note": "objectiveness：n.客观；客观性。结合基础词 objective 辨析：objective：目标、客观的；objection：反对、异议。"
  },
  {
    "words": [
      "objectivity",
      "objection"
    ],
    "note": "objectivity：n.客观性。结合基础词 objective 辨析：objective：目标、客观的；objection：反对、异议。"
  },
  {
    "words": [
      "peculiarity",
      "particular"
    ],
    "note": "peculiarity：n.特性。结合基础词 peculiar 辨析：particular：特定的、挑剔的；peculiar：奇怪的、独特的。"
  },
  {
    "words": [
      "persistently",
      "persist",
      "insist"
    ],
    "note": "persistently：adv.持续不断地；坚定地。结合基础词 persistent 辨析：persistent：坚持不懈的、持续的；persist 常接 in doing；insist 常接 on doing，也可接 that 从句。"
  },
  {
    "words": [
      "procedurally",
      "process"
    ],
    "note": "procedurally：adv.程序上地。结合基础词 procedure 辨析：procedure：规定的步骤、手续；process：过程、流程，也可作动词表示加工处理。"
  },
  {
    "words": [
      "proportionality",
      "portion"
    ],
    "note": "proportionality：n.均衡，比例(性)，相称；成比例。结合基础词 proportion 辨析：proportion：比例；portion：一部分、一份。"
  },
  {
    "words": [
      "speculation",
      "spectacle",
      "spectator"
    ],
    "note": "speculation：n.投机活动；思考；推测；猜测。结合基础词 speculate 辨析：speculate：推测、投机；spectacle：壮观场面；spectator：观众。speculate 不是观看。"
  },
  {
    "words": [
      "sustainability",
      "sustain",
      "retain"
    ],
    "note": "sustainability：n.持续性；永续性。结合基础词 sustainable 辨析：sustainable：可持续的；sustain：维持、支撑；retain：保留。注意 sustain 与 retain 的不同前缀。"
  },
  {
    "words": [
      "technologist",
      "technological",
      "technique",
      "technology"
    ],
    "note": "technologist：技术专家；工艺师。结合基础词 technical 辨析：technological：科技的；technical：技术的、专业性的；technique：具体技巧；technology：技术体系、科技。"
  },
  {
    "words": [
      "transferability",
      "transmit",
      "transform"
    ],
    "note": "transferability：n.可转移性。结合基础词 transfer 辨析：transmit：传输、传播；transform：转变；transfer：转移、调动。"
  },
  {
    "words": [
      "transferable",
      "transmit",
      "transform"
    ],
    "note": "transferable：可转让的、可转移的。结合基础词 transfer 辨析：transmit：传输、传播；transform：转变；transfer：转移、调动。"
  },
  {
    "words": [
      "discrimination",
      "distinguish"
    ],
    "note": "discrimination：n.歧视；识别；区别；鉴别。结合基础词 discriminate 辨析：discriminate 可指辨别，但 discriminate against 表示歧视；distinguish 强调识别差别，常用 distinguish A from B。"
  },
  {
    "words": [
      "intentionally",
      "tend",
      "attend"
    ],
    "note": "intentionally：故意地；有意地。结合基础词 intend 辨析：tend：倾向于、照料；intend：打算；attend：出席、照料。"
  },
  {
    "words": [
      "prohibition",
      "inhibit"
    ],
    "note": "prohibition：n.禁令，禁律。结合基础词 prohibit 辨析：inhibit：抑制、妨碍；prohibit：禁止。"
  },
  {
    "words": [
      "sympathetic",
      "symptom"
    ],
    "note": "sympathetic：同情的；赞同的。结合基础词 sympathy 辨析：sympathy：同情；symptom：症状、征兆。"
  },
  {
    "words": [
      "validity",
      "solid"
    ],
    "note": "validity：n.有效性；合法性；正当；确实。结合基础词 valid 辨析：solid：坚固的、扎实的；valid：有效的、有根据的。"
  },
  {
    "words": [
      "admiration",
      "admission"
    ],
    "note": "admiration：钦佩、赞赏；admission：承认、准许进入。注意 -miration 与 -mission。"
  }
];
