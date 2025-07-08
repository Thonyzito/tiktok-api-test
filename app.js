const CLIENT_KEY = "sbaw2js9fngycsb2iz";
const REDIRECT_URI = "https://tiktok-api-test-vb3g.onrender.com";
const SCOPES = "user.info.basic,video.publish,video.upload";
const STATE = "login123";

// Guardar token si viene en la URL
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get("token");
if (tokenFromUrl) {
  localStorage.setItem("tiktok_access_token", tokenFromUrl);
  window.history.replaceState({}, document.title, "/tiktok-api-test/");
  document.getElementById("uploadSection").style.display = "block";
}

function setStatus(msg, color = "black") {
  const statusEl = document.getElementById("statusMsg");
  statusEl.textContent = msg;
  statusEl.style.color = color;
}

document.getElementById("loginBtn").onclick = () => {
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: "code",
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: STATE
  });
  const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  // Redirigir en lugar de abrir ventana para evitar problemas
  window.location.href = url;
};

document.getElementById("uploadBtn").onclick = async () => {
  const access_token = localStorage.getItem("tiktok_access_token");
  if (!access_token) return setStatus("⚠️ Inicia sesión primero", "red");

  const fileInput = document.getElementById("videoFile");
  if (fileInput.files.length === 0) return setStatus("⚠️ Selecciona un video", "orange");

  const file = fileInput.files[0];
  setStatus("🚀 Inicializando subida...");

  const initResp = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: file.size,
        chunk_size: file.size,
        total_chunk_count: 1
      }
    })
  });

  const initData = await initResp.json();
  if (initResp.status !== 200 || initData.error.code !== "ok") {
    return setStatus("❌ Error en init: " + JSON.stringify(initData), "red");
  }

  const { upload_url, publish_id } = initData.data;
  setStatus("📤 Subiendo video...");

  const putResp = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes 0-${file.size - 1}/${file.size}`,
      "Content-Type": "video/mp4"
    },
    body: file
  });

  if (![200, 201].includes(putResp.status)) {
    return setStatus("❌ Error subiendo video: " + putResp.status, "red");
  }

  setStatus(`✅ Video subido con éxito. publish_id: ${publish_id}`, "green");
};

// Mostrar uploadSection si ya hay token guardado
if (localStorage.getItem("tiktok_access_token")) {
  document.getElementById("uploadSection").style.display = "block";
}
