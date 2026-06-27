require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(function (s) { return s.trim(); })
  .filter(Boolean);

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
}));

/* ── Telegram initData 驗證 ── */
function validateInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(function (a, b) { return a[0].localeCompare(b[0]); })
    .map(function (entry) { return entry[0] + "=" + entry[1]; })
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;
  try {
    return JSON.parse(userRaw);
  } catch (_) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const initData = req.headers["x-telegram-init-data"] || req.body.initData;
  const user = validateInitData(initData);

  if (!user && process.env.NODE_ENV === "production") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.telegramUser = user || { id: 0, first_name: "Dev" };
  next();
}

async function upsertUser(user) {
  if (!supabase || !user.id) return;
  await supabase.from("users").upsert({
    id: user.id,
    first_name: user.first_name || null,
    last_name: user.last_name || null,
    username: user.username || null,
    photo_url: user.photo_url || null,
    updated_at: new Date().toISOString(),
  });
}

/* ── 路由 ── */

app.get("/health", function (_req, res) {
  res.json({
    ok: true,
    supabase: !!supabase,
    bot: !!BOT_TOKEN,
  });
});

app.get("/api/messages", authMiddleware, async function (req, res) {
  if (!supabase) {
    return res.json({ messages: [] });
  }

  await upsertUser(req.telegramUser);

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender, text, image_url, created_at")
    .eq("user_id", req.telegramUser.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ messages: data || [] });
});

app.post("/api/messages", authMiddleware, async function (req, res) {
  const { text, imageUrl } = req.body;

  if (!text && !imageUrl) {
    return res.status(400).json({ error: "text or imageUrl required" });
  }

  if (!supabase) {
    return res.json({
      message: {
        id: "mock-" + Date.now(),
        sender: "user",
        text: text || null,
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
      },
    });
  }

  await upsertUser(req.telegramUser);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: req.telegramUser.id,
      sender: "user",
      text: text || null,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  /* TODO: 在此觸發 Bot 回覆邏輯，並 insert sender='bot' 的訊息 */
  res.json({ message: data });
});

app.listen(PORT, function () {
  console.log("API running on port " + PORT);
});
