const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 10000;

const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://tiktok-api-test-vb3g.onrender.com/callback";

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root
app.get("/", (req, res) => {
  res.send("✅ Backend activo");
});

// Callback para recibir el code y obtener access_token
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ No se recibió código");

  try {
    const tokenResp = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI
      })
    });

    const data = await tokenResp.json();

    if (!data.access_token) {
      return res.send("❌ Error: " + JSON.stringify(data));
    }

    const accessToken = data.access_token;
    res.redirect(`https://thonyzito.github.io/tiktok-api-test/?token=${accessToken}`);
  } catch (err) {
    res.send("❌ Error inesperado: " + err.message);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
