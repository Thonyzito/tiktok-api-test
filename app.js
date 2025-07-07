const CLIENT_KEY = "sbaw2js9fngycsb2iz";
const CLIENT_SECRET = "LWEcZEW8HfnaBJpDW6agDrNLKbpNHqrR";
const REDIRECT_URI = "https://thonyzito.github.io/tiktok-api-test/callback.html";
const SCOPES = "user.info.basic,video.publish,video.upload";
const STATE = "login123"; // Mejor generar dinámico para producción

document.getElementById("loginBtn").onclick = () => {
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: "code",
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: STATE
  });
  const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  window.open(url, "tiktok_login", "width=600,height=600");
};

document.getElementById("uploadBtn").onclick = async () => {
  const code = localStorage.getItem('tiktok_auth_code');
  if(!code) {
    alert("Inicia sesión primero");
    return;
  }

  // Obtener access_token
  const tokenResp = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    })
  });
  const tokenData = await tokenResp.json();
  if(!tokenData.access_token) {
    alert("Error obteniendo token: " + JSON.stringify(tokenData));
    return;
  }

  const access_token = tokenData.access_token;
  const fileInput = document.getElementById("videoFile");
  if(fileInput.files.length === 0) {
    alert("Selecciona un video");
    return;
  }

  const file = fileInput.files[0];

  // Inicializar upload
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
  if(initResp.status !== 200 || initData.error.code !== "ok") {
    alert("Error init upload: " + JSON.stringify(initData));
    return;
  }

  const { upload_url, publish_id } = initData.data;

  // Subir video con PUT
  const putResp = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes 0-${file.size-1}/${file.size}`,
      "Content-Type": "video/mp4"
    },
    body: file
  });

  if (![200, 201].includes(putResp.status)) {
    alert("Error uploading video");
    return;
  }

  document.getElementById("result").innerText = `Video subido! publish_id: ${publish_id}`;
  document.getElementById("uploadSection").style.display = "none";
};

// Mostrar uploadSection solo si ya hay código guardado
if(localStorage.getItem('tiktok_auth_code')) {
  document.getElementById("uploadSection").style.display = "block";
}
