const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("music-title").value;
  const fileInput = document.getElementById("music-file");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("music", fileInput.files[0]);

  const response = await fetch(`${SERVER_URL}/api/music/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  alert(data.message);
});
