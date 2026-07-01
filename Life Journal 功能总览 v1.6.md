# Life Journal — 功能总览 v1.6.0

## 核心架构

```
Life Journal = 日记工具 + AI情绪分析 + 可视化 + 深度洞察 + 双主题
```

---

## 一、用户系统

| 功能 | 技术 |
|---|---|
| 邮箱注册/登录/登出 | Supabase Auth + Server Actions |
| 路由保护 | Dashboard Server Component auth guard |
| Session 管理 | Supabase SSR cookies |
| 主题持久化 | localStorage + React Context |

## 二、日记编辑器

| 功能 | 技术 |
|---|---|
| 标题输入（可选，AI 自动生成） | 手动输入 / DeepSeek 5-10字 |
| 正文编辑 | Textarea，5000 字上限 |
| 保存 + AI 分析 | 一次 API 调用出全部结果 |
| 编辑 / 删除 | 确认式删除，编辑后重新分析 |
| ⌘↵ 快捷键保存 | |

## 三、AI 情绪分析（保存时自动）

| 输出 | 说明 |
|---|---|
| `emotion_tags` | 2-4 个情绪标签（20 种可选） |
| `primary_emotion` | 最主要的情绪 |
| `mood_score` | -1.0 ~ 1.0 数值 |
| `keywords` | 2-5 个实体/人物/活动（系统层，隐藏） |
| `topics` | 3-6 个客观分类（分析层，供筛选） |
| `life_themes` | 3-5 个人生主题（用户层，展示为 Themes） |
| `title` | 5-10 字标题（用户未输入时 AI 生成） |

## 四、AI Deep Insights（按需触发）

| 卡片 | 核心问题 |
|---|---|
| 👁️ 我看见 | 此刻的这个人，正在经历什么？ |
| 💡 我发现 | 四类潜意识模式（信念矛盾/拥有错位/重复课题/保护需求） |
| 🌱 我想告诉你 | 拉长时间轴，看见微小成长 |
| 🌅 留一个问题给未来的你 | 开放式问题，不说教 |

- 全部合并在单张「💭 今日洞察」卡片内
- 用户画像驱动（≥3 篇时注入历史模式）

## 五、用户画像（后台自动构建）

| 维度 | 内容 |
|---|---|
| 长期性格特质 | personality_hints |
| 反复出现的生活主题 | recurring_themes |
| 跨越时空的情绪模式 | emotional_patterns |
| 核心价值观 | core_values |
| 反复出现的内在冲突 | recurring_conflicts |
| 历史成长轨迹 | growth_history |

## 六、数据可视化

| 页面 | 功能 |
|---|---|
| Calendar — Year View | 12 月微型日历网格，情绪色着色，点击预览 |
| Calendar — Month View | 大月历 + 月度统计面板（mood 分布 / top emotions） |
| Mood — 趋势图 | 7d / 30d / 90d 情绪流面积图 |

## 七、浏览与筛选

| 筛选项 | 数据源 |
|---|---|
| 🔍 搜索 | 匹配标题 + 正文 |
| Emotion 下拉 | `emotion_tags`，多选 |
| Topic 下拉 | `topics`，多选 |
| 日期点击联动 | Calendar → 预览 → 跳转 Journal |

## 八、三条数据管线

| 管线 | 触发时机 | 输出 |
|---|---|---|
| **快速分析** | 保存日记 | emotions + mood + keywords + topics + life_themes + title |
| **深度洞察** | 点击 Insights | seen + hidden_pattern + growth_mirror + looking_ahead |
| **用户画像** | 生成 Insights 时 | personality + themes + patterns + values + conflicts |

## 九、双主题系统

| 主题 | 背景 | 风格 |
|---|---|---|
| 🌙 治愈暗夜 | `#11131e → #1a1c29` | 深蓝渐变 + 毛玻璃 |
| ☀️ 奶油晨曦 | `#f4f6fa → #e9ecf3` | 奶油渐变 + 柔和阴影 |

- ☀️/🌙 一键切换，500ms 过渡
- 所有组件 `dark:` 双适配
- 偏好 localStorage 持久化

## 十、Typography 排版系统（v1.6）

| 属性 | 值 |
|---|---|
| 字体 | MiSans / HarmonyOS / PingFang |
| 正文 | 18px / 500 / 1.95 / 0.02em |
| 标题 | 20px / 600 |
| 卡片 | rounded-2xl / p-10 / max-w-[720px] |
| 标签 chip | 36px 高 / rounded-full / 15px |
| Insights 模块间距 | 40px 留白（无分割线） |

## 十一、颜色系统（一层共享）

| 用途 | 方式 |
|---|---|
| 情绪标签 badge | `badgeStyle()` → hex 内联 |
| 日历格子 | `moodCellStyle()` → hex 内联 |
| 情绪圆点 | `dotStyle()` → hex 内联 |
| 情绪头像 | 莫兰迪 50 级底色 + 400 级线条 |

## 十二、技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 + TypeScript + Tailwind v4 |
| 后端/数据库 | Supabase (Auth + DB + RLS) |
| AI | DeepSeek Chat API |
| 部署 | Vercel (life-journal-wine.vercel.app) |
| 版本 | v1.6.0 |

## 十三、数据库表

| 表 | 字段数 | RLS |
|---|---|---|
| `profiles` | 7 列（含 deep_understanding） | 4 策略 |
| `entries` | 9 列（含 title） | 4 策略 |
| `analysis_results` | 13 列（含 insights + topics + life_themes） | 4 策略 |
