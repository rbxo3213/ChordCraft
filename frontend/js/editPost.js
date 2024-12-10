// frontend/js/editPost.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

let currentPostId = null;
let currentFileUrl = null;
let selectedMusicFile = null;
let selectedSheetFile = null;
let currentEditLibraryMode = "music";

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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (currentFileUrl === null && !selectedMusicFile && !selectedSheetFile) {
      formData.append("removeMusic", "true");
    } else if (selectedMusicFile) {
      formData.append("libraryMusicId", selectedMusicFile._id);
    } else if (selectedSheetFile) {
      // 악보 첨부 로직
      const sheetUrl = selectedSheetFile.fileUrl;
      formData.append("content", content + `\n[악보: ${sheetUrl}]`);
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

document.getElementById("library-music-btn").addEventListener("click", () => {
  const modal = document.getElementById("edit-music-modal");
  modal.style.display = "block";
  loadEditLibraryItems();
});

document
  .getElementById("edit-music-modal-close")
  .addEventListener("click", () => {
    document.getElementById("edit-music-modal").style.display = "none";
  });

document
  .getElementById("edit-library-music-switch")
  .addEventListener("click", () => {
    currentEditLibraryMode = "music";
    loadEditLibraryItems();
  });

document
  .getElementById("edit-library-sheet-switch")
  .addEventListener("click", () => {
    currentEditLibraryMode = "sheet";
    loadEditLibraryItems();
  });

async function loadEditLibraryItems() {
  const list = document.getElementById("edit-modal-library-list");
  list.innerHTML = "";

  let url;
  if (currentEditLibraryMode === "music") {
    url = `${SERVER_URL}/api/music/user`;
  } else {
    url = `${SERVER_URL}/api/sheets/user`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  let items;
  if (currentEditLibraryMode === "music") {
    items = data.musicList || [];
  } else {
    items = data.sheets || [];
  }

  selectedMusicFile = null;
  selectedSheetFile = null;
  document.getElementById("edit-selected-item").textContent = "";

  if (items.length === 0) {
    list.textContent = "등록된 항목이 없습니다.";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.title;
    li.addEventListener("click", () => {
      list
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("selected"));
      li.classList.add("selected");

      if (currentEditLibraryMode === "music") {
        selectedMusicFile = item;
        selectedSheetFile = null;
      } else {
        selectedSheetFile = item;
        selectedMusicFile = null;
      }
      document.getElementById(
        "edit-selected-item"
      ).textContent = `선택된 항목: ${item.title}`;

      // 기존 파일 정보 숨기기
      currentFileUrl = null;
      document.getElementById("current-file-info").style.display = "none";
      document.getElementById("file-actions").style.display = "none";
    });
    list.appendChild(li);
  });
}
