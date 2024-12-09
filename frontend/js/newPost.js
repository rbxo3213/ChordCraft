const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

document
  .getElementById("new-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("new-post-title").value;
    const content = document.getElementById("new-post-content").value;
    const file = document.getElementById("new-post-music-file").files[0];

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (file) formData.append("music", file);

    const response = await fetch(`${SERVER_URL}/api/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const resData = await response.json();
    alert(resData.message);
    if (response.ok) {
      window.location.href = "board.html";
    }
  });
