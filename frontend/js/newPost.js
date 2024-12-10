// frontend/js/newPost.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

let selectedMusicFile = null;
let selectedSheetFile = null;
let currentLibraryMode = "music"; // "music" or "sheet"

document
  .getElementById("attach-music-btn")
  .addEventListener("click", async () => {
    const modal = document.getElementById("music-modal");
    modal.style.display = "block";
    loadLibraryItems();
  });

document.getElementById("music-modal-close").addEventListener("click", () => {
  document.getElementById("music-modal").style.display = "none";
});

document
  .getElementById("library-music-switch")
  .addEventListener("click", () => {
    currentLibraryMode = "music";
    loadLibraryItems();
  });
document
  .getElementById("library-sheet-switch")
  .addEventListener("click", () => {
    currentLibraryMode = "sheet";
    loadLibraryItems();
  });

async function loadLibraryItems() {
  const list = document.getElementById("modal-library-list");
  list.innerHTML = "";

  let url;
  if (currentLibraryMode === "music") {
    url = `${SERVER_URL}/api/music/user`;
  } else {
    url = `${SERVER_URL}/api/sheets/user`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  let items;
  if (currentLibraryMode === "music") {
    items = data.musicList || [];
  } else {
    items = data.sheets || [];
  }

  if (items.length === 0) {
    list.textContent = "등록된 항목이 없습니다.";
    document.getElementById("selected-item").textContent = "";
    return;
  }

  // 선택된 항목 초기화
  selectedMusicFile = null;
  selectedSheetFile = null;
  document.getElementById("selected-item").textContent = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.title;
    li.addEventListener("click", () => {
      // 선택 효과
      list
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("selected"));
      li.classList.add("selected");

      if (currentLibraryMode === "music") {
        selectedMusicFile = item;
        selectedSheetFile = null;
      } else {
        selectedSheetFile = item;
        selectedMusicFile = null;
      }
      document.getElementById(
        "selected-item"
      ).textContent = `선택된 항목: ${item.title}`;
    });
    list.appendChild(li);
  });
}

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

    if (file) {
      formData.append("music", file);
    } else if (selectedMusicFile) {
      formData.append("libraryMusicId", selectedMusicFile._id);
    } else if (selectedSheetFile) {
      // 악보는 musicFileUrl가 아니므로 여기서는 그냥 게시글에 악보 첨부 용도로 musicFileUrl 대신?
      // 요구사항이 "악보 첨부"를 동일한 필드로 처리하는지 불명확.
      // 여기서는 게시글에 악보 첨부 로직이 없으므로 다음과 같이 가정:
      // 게시글에 악보 첨부를 위해서는 악보 URL을 어디엔가 저장해야 함.
      // Post 모델에 악보 필드 추가가 필요하지만 명시 안됨.
      // 여기서는 content에 악보 URL 추가하는 식으로 처리(간단한 예).
      const sheetUrl = selectedSheetFile.fileUrl;
      formData.append("content", content + `\n[악보: ${sheetUrl}]`);
    }

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
