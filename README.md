# 妞妞太郎聊天室

Telegram Mini App + PWA 聊天室前端，搭配 Supabase 與 Railway 後端。

## 專案結構

```
telegram-mini-app-chat/
├── frontend/          → Netlify 部署（PWA）
├── backend/           → Railway 部署（API）
├── supabase/          → 資料庫 SQL
└── netlify.toml
```

---

## 階段 1：PWA 前端（已完成）

- `manifest.json` — 加入主畫面用
- `sw.js` — 離線快取（不含推播）
- 已移除推播通知功能，保留 Telegram 震動回饋

### 本機預覽

```bash
cd frontend
npx serve .
```

手機測試 PWA 需 HTTPS，建議直接部署到 Netlify。

---

## 階段 2：GitHub + Netlify 部署

### Step 1 — 推上 GitHub

```bash
cd telegram-mini-app-chat
git init
git add .
git commit -m "Initial commit: PWA chat frontend + backend skeleton"
```

在 GitHub 建立新 repo（例如 `niuniu-chat`），然後：

```bash
git remote add origin https://github.com/你的帳號/niuniu-chat.git
git branch -M main
git push -u origin main
```

### Step 2 — Netlify 連線

1. 登入 [Netlify](https://app.netlify.com/)
2. **Add new site** → **Import an existing project** → 選 GitHub repo
3. 建置設定（通常會自動讀 `netlify.toml`）：
   - **Publish directory**: `frontend`
4. 按 **Deploy**

部署完成後會得到網址，例如：`https://niuniu-chat.netlify.app`

### Step 3 — 手機「加入主畫面」

**iPhone（Safari）**
1. 用 Safari 開啟 Netlify 網址
2. 點分享 → **加入主畫面**

**Android（Chrome）**
1. 用 Chrome 開啟網址
2. 選單 → **加入主畫面** 或 **安裝應用程式**

### Step 4 — Telegram Mini App 設定

1. Telegram 找 **@BotFather**
2. 建立 Bot：`/newbot`
3. 設定 Mini App：`/newapp` 或 `/setmenubutton`
4. 網址填入：`https://你的-netlify-網址.netlify.app`

---

## 階段 3：Supabase + Railway 後端

### Step 1 — Supabase 建表

1. 登入 [Supabase](https://supabase.com/) → 新建 Project
2. **SQL Editor** → 貼上 `supabase/migrations/001_init.sql` → Run
3. **Settings → API** 複製：
   - `Project URL`
   - `service_role` key（保密，只放後端）

### Step 2 — Railway 部署 API

1. 登入 [Railway](https://railway.app/)
2. **New Project** → **Deploy from GitHub repo** → 選同一個 repo
3. 設定：
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
4. **Variables** 填入（參考 `backend/.env.example`）：

| 變數 | 值 |
|------|-----|
| `BOT_TOKEN` | BotFather 給的 token |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `ALLOWED_ORIGINS` | `https://你的.netlify.app` |

5. Railway 會給 API 網址，例如：`https://xxx.up.railway.app`

### Step 3 — 前端接上 API（之後做）

在 `frontend/index.html` 加入：

```javascript
const API_URL = "https://你的-railway.up.railway.app";

// 送出時
fetch(API_URL + "/api/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": tg.initData,
  },
  body: JSON.stringify({ text: "你好" }),
});
```

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查 |
| GET | `/api/messages` | 取得聊天紀錄 |
| POST | `/api/messages` | 送出訊息 |

Header：`X-Telegram-Init-Data: Telegram.WebApp.initData`

---

## 下一步

- [ ] 推上 GitHub + Netlify 部署
- [ ] 手機測試加入主畫面
- [ ] Supabase 建表 + Railway 部署 API
- [ ] 前端改接真實 API（取代假資料）
