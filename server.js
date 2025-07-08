const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
app.use(cors({
  origin: "https://thonyzito.github.io"  // o "*" para pruebas, pero mejor restringir
}));

const app = express();

app.use(express.json());
app.use(express.raw({ type: "video/mp4", limit: "100mb" }));

const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://tiktok-api-test-vb3g.onrender.com/callback";

app.get("/", (req, res) => res.send("✅ Backend activo"));

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ No se recibió código");

  const tokenResp = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await tokenResp.json();
  if (!data.access_token) return res.send("❌ Error: " + JSON.stringify(data));
  res.redirect(`https://thonyzito.github.io/tiktok-api-test/?token=${data.access_token}`);
});

app.post("/api/video/init", async (req, res) => {
  const access_token = req.headers.authorization?.split(" ")[1];
  const videoSize = req.body.video_size;
  if (!access_token || !videoSize) return res.status(400).json({ error: "Faltan parámetros" });

  const initResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }),
  });
  const initData = await initResp.json();
  res.json(initData);
});

app.put("/api/video/upload", async (req, res) => {
  const uploadUrl = req.headers["upload-url"];
  const contentRange = req.headers["content-range"];
  if (!uploadUrl || !contentRange) return res.status(400).json({ error: "Faltan headers" });

  const putResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Range": contentRange, "Content-Type": "video/mp4" },
    body: req.body,
  });
  const text = await putResp.text();
  res.status(putResp.status).send(text);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
