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

- Day 5: 日历热力图 + 情绪流可视化
