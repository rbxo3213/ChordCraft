// frontend/js/editPost.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

let currentPostId = null;

async function loadPostData() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("postId");
  currentPostId = postId;
  if (!postId) {
    alert("잘못된 접근입니다.");
    window.location.href = "board.html";
    return;
  }

  const response = await fetch(`${SERVER_URL}/api/posts/${postId}`);
  const data = await response.json();
  if (!response.ok) {
    alert(data.message);
    window.location.href = "board.html";
    return;
  }

  const post = data.post;
  document.getElementById("edit-post-title").value = post.title;
  document.getElementById("edit-post-content").value = post.content;
}

document
  .getElementById("edit-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("edit-post-title").value;
    const content = document.getElementById("edit-post-content").value;
    const file = document.getElementById("edit-post-music-file").files[0];

    const reqBody = { title, content };

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (file) {
      formData.append("music", file);
    }

    const response = await fetch(`${SERVER_URL}/api/posts/${currentPostId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const resData = await response.json();
    alert(resData.message);
    if (response.ok) {
      window.location.href = `postDetail.html?postId=${currentPostId}`;
    }
  });

window.onload = () => {
  loadPostData();
};
