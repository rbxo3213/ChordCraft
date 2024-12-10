// frontend/js/editPost.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

let currentPostId = null;
let currentFileUrl = null;

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

  if (post.musicFileUrl) {
    currentFileUrl = post.musicFileUrl;
    document.getElementById("current-file-name").textContent = post.musicFileUrl
      .split("/")
      .pop();
    document.getElementById("current-file-info").style.display = "block";
    document.getElementById("file-actions").style.display = "block";
  }
}

document.getElementById("delete-file-button").addEventListener("click", () => {
  // 파일 삭제: currentFileUrl을 null 처리하여 서버에 수정 요청 시 파일 없는 상태로 업데이트
  currentFileUrl = null;
  document.getElementById("current-file-info").style.display = "none";
  document.getElementById("file-actions").style.display = "none";
});

document
  .getElementById("edit-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("edit-post-title").value;
    const content = document.getElementById("edit-post-content").value;
    const file = document.getElementById("edit-post-music-file").files[0];

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    // 파일 삭제 버튼을 눌렀을 경우 currentFileUrl = null
    // 서버에서는 이를 받아 기존 파일 삭제 처리 필요
    // 파일이 없고 currentFileUrl도 없으면 기존 파일 제거
    // 파일이 새로 업로드되면 그 파일로 교체
    if (file) {
      formData.append("music", file);
    } else if (currentFileUrl === null) {
      // 파일 없음 상태로 업데이트 (music 필드 null 처리)
      formData.append("removeMusic", "true");
    }

    const response = await fetch(`${SERVER_URL}/api/posts/${currentPostId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const resData = await response.json();
    if (!response.ok) {
      alert(resData.message || "서버 오류 발생");
    } else {
      alert(resData.message);
      window.location.href = `postDetail.html?postId=${currentPostId}`;
    }
  });

window.onload = () => {
  loadPostData();
};
