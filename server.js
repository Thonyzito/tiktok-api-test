const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Endpoint para intercambiar código por token
app.post("/get_token", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });

  try {
    const response = await axios.post(
      "https://open.tiktokapis.com/v2/oauth/token/",
      new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Unknown error" });
  }
});

// Endpoint para inicializar la subida de video
app.post("/init_upload", async (req, res) => {
  const access_token = req.headers.authorization;
  if (!access_token) return res.status(401).json({ error: "No access token provided" });

  try {
    const response = await axios.post(
      "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
      req.body,
      { headers: { Authorization: access_token, "Content-Type": "application/json" } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Unknown error" });
  }
});

// Endpoint para subir el video con PUT (upload_url se pasa por query)
app.put("/upload_video", async (req, res) => {
  const upload_url = req.query.upload_url;
  if (!upload_url) return res.status(400).json({ error: "No upload_url provided" });

  try {
    const response = await axios.put(upload_url, req.body, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes 0-${req.headers["content-length"] - 1}/${req.headers["content-length"]}`
      }
    });
    res.json({ status: response.status, data: response.data });
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Unknown error" });
  }
});

const port = process.env.PORT || 8000;
app.listen(port, () => console.log("Server running on port", port));
