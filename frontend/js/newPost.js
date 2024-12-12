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

// '업로드' 버튼 클릭 시 모달 표시 및 라이브러리 항목 로드
document.getElementById("attach-music-btn").addEventListener("click", () => {
  const modal = document.getElementById("music-modal");
  modal.style.display = "block";
  loadLibraryItems();
});

// 모달 닫기 버튼 클릭 시 모달 숨기기
document.getElementById("music-modal-close").addEventListener("click", () => {
  document.getElementById("music-modal").style.display = "none";
});

// 라이브러리 스위치 버튼 클릭 시 모드 변경 및 항목 로드
document
  .getElementById("library-music-switch")
  .addEventListener("click", () => {
    currentLibraryMode = "music";
    loadLibraryItems();
    document.getElementById("sheet-upload-section").style.display = "none";
  });
document
  .getElementById("library-sheet-switch")
  .addEventListener("click", () => {
    currentLibraryMode = "sheet";
    loadLibraryItems();
    document.getElementById("sheet-upload-section").style.display = "block";
  });

// 라이브러리 항목 로드 함수
async function loadLibraryItems() {
  const list = document.getElementById("modal-library-list");
  list.innerHTML = "";

  let url;
  if (currentLibraryMode === "music") {
    url = `${SERVER_URL}/api/music/user`;
  } else {
    url = `${SERVER_URL}/api/sheets/user`;
  }

  try {
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
  } catch (error) {
    console.error("Error loading library items:", error);
    list.textContent = "라이브러리 항목을 불러오는 데 실패했습니다.";
  }
}

// '첨부' 버튼 클릭 시 선택된 항목을 폼에 표시하고 모달 숨기기
document.getElementById("attach-button").addEventListener("click", () => {
  if (
    selectedMusicFile ||
    selectedSheetFile ||
    document.getElementById("new-sheet-file").files.length > 0
  ) {
    document.getElementById("music-modal").style.display = "none";
    // 첨부된 파일을 폼에 표시
    const attachedFileName = document.getElementById("attached-file-text");
    if (selectedMusicFile) {
      attachedFileName.textContent = `${selectedMusicFile.title} (라이브러리 음악)`;
    } else if (selectedSheetFile) {
      attachedFileName.textContent = `${selectedSheetFile.title} (라이브러리 악보)`;
    } else if (document.getElementById("new-sheet-file").files.length > 0) {
      const sheetFile = document.getElementById("new-sheet-file").files[0];
      attachedFileName.textContent = `${sheetFile.name} (새 악보 업로드)`;
    }
    document.getElementById("attached-file-name").style.display = "block";
  } else {
    alert("선택된 항목이 없습니다.");
  }
});

// 게시글 작성 폼 제출 시
document
  .getElementById("new-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("new-post-title").value.trim();
    const content = document.getElementById("new-post-content").value.trim();
    const musicFileInput = document.getElementById("new-post-music-file");
    const musicFile = musicFileInput.files[0];

    const sheetFileInput = document.getElementById("new-sheet-file");
    const sheetFile = sheetFileInput.files[0];

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    // 음악 파일 처리
    if (musicFile) {
      formData.append("music", musicFile);
    } else if (selectedMusicFile) {
      formData.append("libraryMusicId", selectedMusicFile._id);
    }

    // 악보 파일 처리
    if (sheetFile) {
      formData.append("sheet", sheetFile);
    } else if (selectedSheetFile) {
      formData.append("librarySheetId", selectedSheetFile._id);
    }

    try {
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
    } catch (error) {
      console.error("Error creating post:", error);
      alert("게시글 작성 중 오류가 발생했습니다.");
    }
  });
