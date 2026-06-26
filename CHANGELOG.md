# Life Journal — Changelog

## Day 1 — 2025-06-03

### ✅ 完成

**项目脚手架**
- 创建 `life-journal` 项目目录
- 初始化 Next.js 16 (App Router + TypeScript + Tailwind CSS + src/ 目录)
- 配置 `.env.local`（Supabase URL / Anon Key / Service Role Key）
- `.env.local` 已加入 `.gitignore`

**依赖安装**
- `next` `react` `react-dom` — Next.js 核心
- `@supabase/supabase-js` `@supabase/ssr` — Supabase 客户端 + SSR 集成
- `tailwindcss` `@tailwindcss/postcss` — 样式
- `typescript` `@types/react` `@types/react-dom` `@types/node` — 类型
- `eslint` `eslint-config-next` — 代码检查

**数据库 Schema（Supabase PostgreSQL）**

三张核心表全部建好，均启用 Row Level Security：

| 表 | 用途 | RLS 策略数 |
|---|---|---|
| `public.profiles` | 用户扩展资料（关联 `auth.users`） | 4 (CRUD) |
| `public.entries` | 日记条目 | 4 (CRUD) |
| `public.analysis_results` | AI 情绪分析结果 | 4 (CRUD) |

**自动化触发器**
- `on_auth_user_created` → 新用户注册时自动创建 profile
- `on_entry_before_upsert` → 自动计算 `word_count` + `entry_date`
- `on_entry_update` → 自动更新 `updated_at` 时间戳

**索引**
- `entries`: user_id, user_id+entry_date, user_id+status, user_id+created_at
- `analysis_results`: user_id, entry_id, user_id+analyzed_at

**安全模型**
- 所有表 RLS 强制 `user_id = auth.uid()` 隔离
- Service Role Key 绕过 RLS 供 Edge Functions 使用
- `ON DELETE CASCADE` 确保用户删除时数据联动清除

### 🔧 修复记录

- **v1 → v2**: `GENERATED ALWAYS AS` 改为触发器填充。原因：`char_length()` 在 PG 中是 `STABLE` 而非 `IMMUTABLE`，无法用于生成列。

### 📁 文件结构

```
life-journal/
├── .env.local              # Supabase 凭证（不入库）
├── .gitignore              # .env* 已在忽略列表
├── CHANGELOG.md            # 本文件
├── supabase/
│   └── schema.sql          # 完整 SQL Schema + RLS
├── scripts/
│   ├── run_schema.js       # （调试用）pg 直连执行脚本
│   └── run_schema_v2.js    # （调试用）多连接方式探测
├── src/
│   └── app/                # Next.js App Router
├── package.json
└── tsconfig.json
```

### ⏭️ 下一步

---

## Day 2 — 2025-06-04

### ✅ 完成

**Supabase Auth 集成**
- `src/lib/supabase/client.ts` — 浏览器端 Supabase 客户端（Client Components 用）
- `src/lib/supabase/server.ts` — 服务端 Supabase 客户端（Server Components / Server Actions 用）+ Service Role 客户端（Edge Functions 用，可绕过 RLS）

**认证流程**
- `src/lib/auth/actions.ts` — 三个 Server Actions：
  - `login()` — 邮箱 + 密码登录
  - `signup()` — 邮箱 + 密码注册（含密码长度校验）
  - `logout()` — 登出并重定向到 /login
- 表单使用 `useActionState` 管理验证错误和 pending 状态

**页面**
| 路由 | 说明 |
|---|---|
| `/` | Landing page — Get started / Sign in |
| `/login` | 登录页 — email + password form |
| `/signup` | 注册页 — email + password form |
| `/dashboard` | 受保护页 — 需登录，显示欢迎 + 登出按钮 |
| `/auth/callback` | Auth callback — 处理 email 验证后的 code 交换 |

**路由保护**
- `src/proxy.ts` — Next.js 16 Proxy 模式：
  - 刷新 Supabase session cookie（每次请求自动续期）
  - `/dashboard/*` 未登录 → 重定向到 /login
  - `/login` `/signup` 已登录 → 重定向到 /dashboard
  - 排除静态资源（`_next/static`, `_next/image`, 图片文件）

**组件**
- `src/components/auth-form.tsx` — 复用 Auth 表单（login/signup 共用），带错误展示

### 📁 新增文件

```
src/
├── proxy.ts                    # Route protection (Next.js 16 Proxy)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client + Service Role
│   └── auth/
│       └── actions.ts          # login / signup / logout Server Actions
├── components/
│   └── auth-form.tsx           # Reusable auth form component
└── app/
    ├── auth/callback/route.ts  # Email verification callback
    ├── login/page.tsx          # Login page
    ├── signup/page.tsx         # Signup page
    └── dashboard/
        ├── page.tsx            # Dashboard (protected)
        └── shell.tsx           # Dashboard layout with nav + logout
```

### ✅ Build 验证

```
✓ Compiled successfully in 2.2s
✓ TypeScript — no errors
ƒ Proxy (Middleware) — active
Routes: / /login /signup /dashboard /auth/callback
```

### ⏭️ 下一步

- Day 3: 日记编辑器组件（极简 Markdown 输入 → 写入 Supabase entries 表）✅
- Day 4: Edge Function（AI 情绪分析异步管道）

---

## Day 3 — 2025-06-05

### ✅ 完成

**日记 CRUD Server Actions**
- `src/lib/entries/actions.ts`
  - `createEntry(content)` — 写入 `entries` 表，返回创建的条目
  - `getEntries()` — 获取当前用户全部日记，含 `analysis_results` 联表（最新在前）
  - `deleteEntry(entryId)` — 删除日记（RLS 强制只能删自己的）

**日记编辑器**
- `src/components/entry-editor.tsx` — Client Component
  - 纯 textarea，无工具栏，极致简洁
  - `⌘↵` 快捷保存，`Esc` 清空
  - 5000 字符上限 + 实时字数
  - 保存时 disable 防重复提交
  - 错误提示内联展示

**日记列表（时间线）**
- `src/components/entry-list.tsx` — 展示所有日记
  - 情绪标签 badge（primary_emotion + emotion_tags）
  - "analyzing..." 骨架状态（status=pending 时脉冲动画）
  - AI 摘要（💡 一行洞察）
  - 空状态引导文案
- `src/components/delete-button.tsx` — 两步确认删除（hover → 点 Delete → 确认 Yes/No）

**Dashboard 交互**
- `src/app/dashboard/content.tsx` — 客户端容器，组合 Editor + List
- 乐观更新：新日记创建后立即 prepend 到列表，无需整页刷新
- `src/app/dashboard/page.tsx` — 服务端预取初始数据

### 📁 新增文件

```
src/
├── lib/entries/
│   └── actions.ts              # createEntry / getEntries / deleteEntry
└── components/
    ├── entry-editor.tsx        # Diary textarea + save
    ├── entry-list.tsx          # Timeline with mood badges + AI summary
    └── delete-button.tsx       # Confirm-then-delete
```

### ✅ Build 验证

```
✓ Compiled successfully in 1.8s
✓ TypeScript — no errors
ƒ Dashboard — dynamic (server-rendered)
```

### ⏭️ 下一步

- Day 4: Supabase Edge Function（AI 情绪分析异步管道）

---

## Day 4 — 2025-06-06

### ✅ 完成

**AI 情绪分析管道**
- `src/lib/ai/analyze.ts` — DeepSeek API 调用封装
  - 结构化 system prompt：强制返回 JSON（emotion_tags, primary_emotion, mood_score, summary, keywords）
  - `response_format: { type: "json_object" }` 确保格式稳定
  - temperature=0.3 保证一致性
  - 20 种情绪标签词汇表（happy, anxious, grateful, frustrated, nostalgic...）

**createEntry 流程升级**
1. 保存 entry → status='pending'
2. 调 DeepSeek API 分析 → 写入 `analysis_results` 表
3. 更新 entry → status='analyzed' + mood_score
4. 失败时 → status='error'

**UI 更新**
- Save 按钮文案改为 "Save & Analyze"
- 保存时显示 "Analyzing..."（含 DeepSeek 3-5s 延迟）
- 分析完成后情绪标签、emoji mood、AI 摘要即时展示

**环境变量新增**
```
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL  (default: https://api.deepseek.com/v1)
DEEPSEEK_MODEL     (default: deepseek-chat)
```

### 📁 新增文件

```
src/lib/ai/
└── analyze.ts                 # DeepSeek API analysis utility
```

### ⏭️ 下一步

---

## 2025-06-17 ~ 2025-06-24 — UI 重构、部署、Insights v1.1

### ✅ 完成

**两栏布局重构**
- Journal 页改为左右两栏：左侧 Emotion/Topic 下拉筛选 + 日记列表，右侧日记详情/编辑器
- `+ New Entry` 移至右侧顶部
- Emotion 和 Topic 筛选从 chips 改为下拉多选框（`MultiSelect` 组件）

**Calendar 页面重写**
- 新增 Year View（12 月微型日历网格）+ Month View（单月大日历 + 月度统计面板）
- 日历格子颜色改为按当天出现最多的具体情绪标签着色（不再用泛化的 positive/neutral/negative）
- 点击日期 → 底部弹出日记预览卡片 → 可跳转到 Journal 详情

**情绪颜色系统统一**
- 新建 `src/lib/emotion-colors.ts` —— 全站唯一数据源
- 全部改用 inline style（hex 色值），彻底解决 Tailwind JIT 动态类名编译丢失问题
- Journal 标签、日历格子、侧栏圆点、预览卡片全部统一着色

**AI Insights v1.1 升级**
- Prompt 从 3 字段升级为 5 字段：今日片段、此刻的自己、一个发现、成长轨迹、留给明天
- 新增人生教练角色：温暖、不评判、不说教
- 用户画像模块扩展：新增 core_values、recurring_conflicts、growth_history
- UI 自动检测旧格式 insights，隐藏空卡片并显示重新生成按钮

**Vercel 部署**
- 部署至 https://life-journal-wine.vercel.app
- 修复环境变量缺失（旧项目与新项目 env 隔离）
- 修复 Google Fonts 国内无法加载（改用系统字体苹方/Microsoft YaHei）
- 修复日历/标签颜色在 Vercel 生产环境丢失（Tailwind JIT → inline style）

**Debug 页面**
- 新增 `/debug` 页面用于检查 Cookies 和 Environment Variables（后删除）

### 🔧 修复记录

- **Dashboard 500 错误**: 环境变量未在 Vercel 新项目中配置
- **标签颜色不可见**: Tailwind JIT 无法编译 `bg-${color}-500/20` 动态类名 → 全部改为 inline hex
- **日历格子无色**: 同上 Tailwind 问题 + `avgMood` 改用 `dominantEmotion` 具体情绪
- **Google Fonts 构建失败**: 国内无法访问 Google Fonts → 改用系统字体
- **旧 insights 空卡片**: 新增旧格式检测，`"seen" in insights` → 否则显示重新生成按钮

### 📁 新增/变更文件

```
新增:
├── src/lib/emotion-colors.ts           # 统一情绪颜色系统
├── src/lib/ai/insights.ts             # v1.1 5字段 prompt
├── src/lib/ai/understanding.ts        # 扩展用户画像
├── src/components/visualizations/
│   ├── calendar-view.tsx              # Calendar 主页（年/月视图切换）
│   ├── year-view.tsx                  # 年视图（12月微型日历）
│   ├── month-view.tsx                 # 月视图（大日历+统计面板）
│   └── entry-preview.tsx             # 日期点击预览卡片
├── src/components/multi-select.tsx    # 下拉多选组件
└── src/app/dashboard/
    ├── detail.tsx                     # 日记详情（编辑+5卡片Insights）
    ├── sidebar.tsx                    # 左侧筛选+列表
    └── content.tsx                    # 三栏 Tab 主布局

变更:
├── src/app/layout.tsx                 # 移除 Google Fonts
├── src/app/globals.css                # 系统字体
├── src/lib/entries/actions.ts         # Insights 类型更新
└── src/lib/supabase/server.ts         # 移除 try/catch in setAll

删除:
└── src/components/visualizations/calendar-heatmap.tsx  # 被 calendar-view 替代
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.2.0 — 2025-06-25 — 三层关键词系统

### ✅ 完成

**关键词系统重构**
- 将原先单一的 `keywords` 字段拆分为三层架构：

| 层 | 字段 | 用途 | 展示 |
|---|---|---|---|
| 系统层 | `keywords` | 搜索、筛选、关联 | ❌ |
| 分析层 | `topics` | 统计、月报、Topic 筛选 | ❌ |
| 用户层 | `life_themes` | 人生主题 | ✅ ✨ 今日主题 |

- `life_themes` 要求 2-6 汉字，聚焦价值观、内在冲突、成长方向、深层需求
- 例如"陪妹妹住院"→「家庭陪伴」而非「健康」；"看纸质书"→「精神休息」而非「阅读」

**Prompt 更新**
- `analyze.ts` 输出从 5 字段扩展为 7 字段（新增 `topics`、`life_themes`）
- `life_themes` 有独立的产品原则：不是总结用户做了什么，而是总结用户今天在经历什么

**UI 更新**
- 日记详情：`Key` 区域替换为 `✨ 今日主题`，展示 `life_themes`
- 侧栏 Topic 筛选：数据源从 `keywords` 切换为 `topics`
- `keywords` 不再出现在任何 UI 中

**数据库**
- `analysis_results` 新增 `topics TEXT[]` 和 `life_themes TEXT[]` 列

### 📁 变更文件

```
src/lib/ai/analyze.ts              # 新 prompt: keywords + topics + life_themes
src/lib/entries/actions.ts         # 类型 + insert/select 增加新字段
src/app/dashboard/detail.tsx       # Key → ✨ 今日主题
src/app/dashboard/sidebar.tsx      # Topic 筛选读 topics
src/lib/supabase/server.ts         # 恢复 try/catch in setAll
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.3.0 — 2025-06-25 — Insights 重构：合并 seen/observation，单卡片布局

### ✅ 完成

**Insights 结构简化**
- `seen`（今日片段）和 `observation`（此刻的自己）合并为统一的 `seen`（被看见）
- 卡片从 5 张减为 4 张：被看见 / 一个发现 / 成长轨迹 / 留给明天
- 四段内容合并为单卡片「💭 今日洞察」，内部分段：我看见 / 我发现 / 我想告诉你 / 留一个问题给未来的你

**被看见 prompt 重写**
- 核心问题：回答"此刻的这个人，正在经历什么？"
- 禁止复述事件经过、禁止分析原因、禁止给建议
- 新增句法锚点：✅ 我看到你正在... / ❌ 你提到了...
- 聚焦一条主线，不列举多个观点

### 📁 变更文件

```
src/lib/ai/insights.ts       # seen/observation 合并，prompt 重写
src/app/dashboard/detail.tsx # UI 5→4 卡片，单卡片四段布局
src/lib/entries/actions.ts   # 移除 observation 字段
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.3.1 — 2025-06-25 — hidden_pattern 四类模式升级

### ✅ 完成

**hidden_pattern prompt 重构**
- 从通用"寻找潜意识模式"改为四类定向搜索：
  1. 用户口头信念与真实情绪之间的矛盾
  2. 用户追求的东西与已经拥有的东西之间的错位
  3. 用户不断重复出现的人生课题（自由与安全、连接与独处等）
  4. 用户试图解决的问题，是否其实在保护某种更深层需求
- 新增约束：只选最明显的一个来写，深入一个胜过浅尝四个

### 📁 变更文件

```
src/lib/ai/insights.ts       # hidden_pattern 四类模式 prompt
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.4.0 — 2025-06-25 — 双主题系统（治愈暗夜 / 奶油晨曦）

### ✅ 完成

**双主题一键切换**
- Tailwind v4 启用 `@custom-variant dark` class 模式
- 新增 `ThemeProvider`（React Context + localStorage 持久化）
- 右上角导航栏新增 ☀️/🌙 主题切换按钮
- 两种主题渐变背景：
  - 暗色：`#11131e → #1a1c29`
  - 亮色：`#f4f6fa → #e9ecf3`
- 全局 `transition-colors duration-500` 丝滑过渡

**全组件双主题适配（17 个文件）**
- 文字颜色：`text-zinc-700 dark:text-zinc-200/300` 确保双模式下清晰可读
- 输入框/下拉：`bg-white/80 border-slate-200 dark:bg-zinc-800 dark:border-zinc-700`
- 卡片背景：`bg-white dark:bg-zinc-900` + `shadow-sm`
- 分割线：`border-slate-200 dark:border-zinc-800`
- 标签/药丸：`bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300`
- 选中态：`bg-slate-200/70 dark:bg-zinc-800 ring-1`

### 📁 变更文件

```
新增:
├── src/components/theme-provider.tsx      # 主题 Context + localStorage

变更 (16 files):
├── src/app/globals.css                    # 启用 class-based dark mode
├── src/app/layout.tsx                     # 双渐变背景 + ThemeProvider
├── src/app/page.tsx                       # 首页双主题
├── src/app/login/page.tsx                 # 登录页背景
├── src/app/signup/page.tsx                # 注册页背景
├── src/app/dashboard/shell.tsx            # 导航栏 + 主题切换按钮
├── src/app/dashboard/content.tsx          # Tab 栏 + 分割线
├── src/app/dashboard/detail.tsx           # 日记详情全适配
├── src/app/dashboard/sidebar.tsx          # 搜索/筛选/列表全适配
├── src/components/auth-form.tsx           # 表单全适配
├── src/components/entry-editor.tsx        # 编辑器全适配
├── src/components/entry-list.tsx          # 时间线适配
├── src/components/multi-select.tsx        # 下拉框全适配
├── src/components/visualizations/ (4)     # 日历/趋势图适配
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.4.1 — 2025-06-25 — UI 卡片包裹重构

### ✅ 完成

**区域卡片模块化**
- 左侧栏整体包裹 `rounded-2xl bg-white dark:bg-slate-900/40 shadow-sm p-4` 卡片
- 右侧日记详情包裹 `rounded-2xl bg-white dark:bg-slate-900/40 shadow-sm p-6` 卡片
- Insights 卡片圆角升级为 `rounded-2xl`，统一视觉语言
- 编辑器同等待遇：`rounded-2xl shadow-sm p-6`
- 右侧面板 `space-y-4` 间距，卡片之间有呼吸感
- 暗色模式 `dark:backdrop-blur-md` 毛玻璃效果

### 📁 变更文件

```
src/app/dashboard/content.tsx   # 移除左侧 border-r
src/app/dashboard/detail.tsx    # 内容卡片 + Insights 卡片重构
src/app/dashboard/sidebar.tsx   # 左侧卡片包裹
src/components/entry-editor.tsx # 编辑器卡片升级
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.4.2 — 2025-06-25 — UI 细节精致化

### ✅ 完成

**左侧列表选中态优化**
- 选中日记卡片：`bg-slate-100/80 dark:bg-white/10` + `shadow-sm` + `ring-1 ring-slate-200 dark:ring-white/10`
- 圆角 `rounded-xl`，过渡 `transition-all`，层次感明显

**搜索框与下拉框精致化**
- `rounded-xl px-4 py-2`，更圆润，文字不再贴边

**顶部导航栏悬浮感**
- `backdrop-blur-md` + `bg-white/60 dark:bg-transparent`
- 滚动时透明悬浮毛玻璃效果

### 📁 变更文件

```
src/app/dashboard/shell.tsx     # 导航栏 backdrop-blur
src/app/dashboard/sidebar.tsx   # 选中态 + 搜索框圆角
src/components/multi-select.tsx # 下拉框圆角
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.4.3 — 2025-06-25 — 下拉筛选器重构 + Themes 标签

### ✅ 完成

**MultiSelect 下拉菜单全面重构**
- 容器：`min-w-[14rem] rounded-xl p-2` + `shadow-xl backdrop-blur-md`
- 选项：`flex justify-between px-3 py-2 rounded-lg` + hover 高亮
- 复选框：`h-4 w-4 rounded` 黑白反色
- Emotion 选项前带彩色情绪小圆点
- 滚动条完全隐藏（`scrollbar-none` utility）
- 数量靠右 `tabular-nums`

**Trigger 按钮极简化**
- 父容器 `grid grid-cols-2 gap-2 w-full` 确保各占 50%
- 按钮内部仅两个固定元素：分类名 + `▾` 箭头
- 不显示任何动态文本，彻底消除重叠/换行问题

**Themes 标签重命名**
- `✨` → `Themes`

### 📁 变更文件

```
src/components/multi-select.tsx  # 下拉菜单 + trigger 全面重构
src/app/dashboard/sidebar.tsx    # 父容器 grid-cols-2
src/app/dashboard/detail.tsx     # ✨ → Themes
src/app/globals.css              # scrollbar-none utility
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定

---

## v1.5.0 — 2025-06-26 — 标题输入 + AI 自动生成

### ✅ 完成

**标题系统**
- 编辑器新增标题输入框（正文上方，分割线分隔）
- 用户可手动输入，不填时 AI 自动生成 5-10 字标题
- AI 标题生成复用 `analyzeEntry()` 调用，零额外延迟
- 数据库 `entries` 新增 `title TEXT` 列

**侧栏简化**
- 仅显示日期 + 标题（移除 AI 摘要）
- 旧日记无标题时显示正文前 40 字作为 fallback
- 搜索同时匹配标题和正文

**详情页**
- 内容卡片顶部展示标题 `text-xl font-semibold`

### 📁 变更文件

```
src/lib/ai/analyze.ts           # prompt 新增 title 字段
src/lib/entries/actions.ts      # Entry 类型 + CRUD 全链路 + 自动标题
src/components/entry-editor.tsx # 标题输入框
src/app/dashboard/sidebar.tsx   # 侧栏显示标题 + 搜索匹配标题
src/app/dashboard/detail.tsx    # 详情页展示标题
```

### ⏭️ 下一步

- 信息图生成（satori HTML→SVG→PNG）
- 自定义域名绑定
