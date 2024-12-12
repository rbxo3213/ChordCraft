// frontend/js/editPost.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

let currentPostId = null;
let currentFileUrl = null;
let currentSheetFileUrl = null; // 악보 파일 URL
let selectedMusicFile = null;
let selectedSheetFile = null;
let currentEditLibraryMode = "music";
let removeMusic = false;
let removeSheet = false;

// 로드 시 게시글 데이터 불러오기
async function loadPostData() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("postId");
  currentPostId = postId;
  if (!postId) {
    alert("잘못된 접근입니다.");
    window.location.href = "board.html";
    return;
  }

  try {
    const response = await fetch(`${SERVER_URL}/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.message);
      window.location.href = "board.html";
      return;
    }

    const post = data.post;
    document.getElementById("edit-post-title").value = post.title;
    document.getElementById("edit-post-content").value = post.content;

    // 음악 파일 정보 표시
    if (post.musicFileUrl) {
      currentFileUrl = post.musicFileUrl;
      document.getElementById("current-file-name").textContent =
        post.musicFileUrl.split("/").pop();
      document.getElementById("current-file-info").style.display = "block";
      document.getElementById("file-actions").style.display = "block";
      document.getElementById("attached-file-text").textContent =
        post.musicFileUrl.split("/").pop();
      document.getElementById("attached-file-name").style.display = "block";
    }

    // 악보 파일 정보 표시
    if (post.sheetFileUrl) {
      currentSheetFileUrl = post.sheetFileUrl;
      document.getElementById("current-sheet-name").textContent =
        post.sheetFileUrl.split("/").pop();
      document.getElementById("current-sheet-info").style.display = "block";
      document.getElementById("sheet-file-actions").style.display = "block";
      document.getElementById("attached-sheet-file-text").textContent =
        post.sheetFileUrl.split("/").pop();
      document.getElementById("attached-sheet-file-name").style.display =
        "block";
    }
  } catch (error) {
    console.error("Error loading post data:", error);
    alert("게시글 데이터를 불러오는 데 실패했습니다.");
    window.location.href = "board.html";
  }
}

// 음악 파일 삭제 버튼 클릭 시
document.getElementById("delete-file-button").addEventListener("click", () => {
  if (confirm("정말 기존 음악 파일을 삭제하시겠습니까?")) {
    removeMusic = true;
    currentFileUrl = null;
    document.getElementById("current-file-info").style.display = "none";
    document.getElementById("file-actions").style.display = "none";
    document.getElementById("attached-file-name").style.display = "none";
    document.getElementById("attached-file-text").textContent = "";
  }
});

// 악보 파일 삭제 버튼 클릭 시
document.getElementById("delete-sheet-button").addEventListener("click", () => {
  if (confirm("정말 기존 악보 파일을 삭제하시겠습니까?")) {
    removeSheet = true;
    currentSheetFileUrl = null;
    document.getElementById("current-sheet-info").style.display = "none";
    document.getElementById("sheet-file-actions").style.display = "none";
    document.getElementById("attached-sheet-file-name").style.display = "none";
    document.getElementById("attached-sheet-file-text").textContent = "";
  }
});

// 게시글 수정 폼 제출 시
document
  .getElementById("edit-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("edit-post-title").value.trim();
    const content = document.getElementById("edit-post-content").value.trim();

    const musicFileInput = document.getElementById("edit-new-music-file");
    const musicFile = musicFileInput ? musicFileInput.files[0] : null;

    const sheetFileInput = document.getElementById("edit-new-sheet-file");
    const sheetFile = sheetFileInput ? sheetFileInput.files[0] : null;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    // 음악 파일 처리
    if (musicFile) {
      formData.append("music", musicFile);
      // 새로운 음악을 첨부할 때 기존 선택을 덮어씌웁니다.
      selectedMusicFile = null;
    } else if (selectedMusicFile) {
      formData.append("libraryMusicId", selectedMusicFile._id);
    }

    // 악보 파일 처리
    if (sheetFile) {
      formData.append("sheet", sheetFile);
      // 새로운 악보를 첨부할 때 기존 선택을 덮어씌웁니다.
      selectedSheetFile = null;
    } else if (selectedSheetFile) {
      formData.append("librarySheetId", selectedSheetFile._id);
    }

    // 음악 파일 삭제 처리
    if (removeMusic) {
      formData.append("removeMusic", "true");
    }

    // 악보 파일 삭제 처리
    if (removeSheet) {
      formData.append("removeSheet", "true");
    }

    try {
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
        // 폼 제출 후 플래그 초기화
        removeMusic = false;
        removeSheet = false;
        window.location.href = `postDetail.html?postId=${currentPostId}`;
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  });

// 라이브러리 모달 관련 코드
document.getElementById("library-music-btn").addEventListener("click", () => {
  const modal = document.getElementById("edit-music-modal");
  modal.style.display = "block";
  loadEditLibraryItems();
});

// 모달 닫기 버튼 클릭 시 모달 숨기기
document
  .getElementById("edit-music-modal-close")
  .addEventListener("click", () => {
    document.getElementById("edit-music-modal").style.display = "none";
  });

// 라이브러리 스위치 버튼 클릭 시 모드 변경 및 항목 로드
document
  .getElementById("edit-library-music-switch")
  .addEventListener("click", () => {
    currentEditLibraryMode = "music";
    loadEditLibraryItems();
    document.getElementById("edit-music-upload-section").style.display =
      "block";
    document.getElementById("edit-sheet-upload-section").style.display = "none";
  });
document
  .getElementById("edit-library-sheet-switch")
  .addEventListener("click", () => {
    currentEditLibraryMode = "sheet";
    loadEditLibraryItems();
    document.getElementById("edit-music-upload-section").style.display = "none";
    document.getElementById("edit-sheet-upload-section").style.display =
      "block";
  });

// 라이브러리 항목 로드 함수
async function loadEditLibraryItems() {
  const list = document.getElementById("edit-modal-library-list");
  list.innerHTML = "";

  let url;
  if (currentEditLibraryMode === "music") {
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
    if (currentEditLibraryMode === "music") {
      items = data.musicList || [];
    } else {
      items = data.sheets || [];
    }

    if (items.length === 0) {
      list.textContent = "등록된 항목이 없습니다.";
      document.getElementById("edit-selected-item").textContent = "";
      return;
    }

    // 선택된 항목 초기화
    selectedMusicFile = null;
    selectedSheetFile = null;
    document.getElementById("edit-selected-item").textContent = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.title;
      li.addEventListener("click", () => {
        // 선택 효과
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
      });
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading edit library items:", error);
    list.textContent = "라이브러리 항목을 불러오는 데 실패했습니다.";
  }
}

// '첨부' 버튼 클릭 시 선택된 항목을 폼에 표시하고 모달 숨기기
document.getElementById("edit-attach-button").addEventListener("click", () => {
  if (
    selectedMusicFile ||
    selectedSheetFile ||
    document.getElementById("edit-new-sheet-file").files.length > 0 ||
    document.getElementById("edit-new-music-file").files.length > 0
  ) {
    document.getElementById("edit-music-modal").style.display = "none";
    // 첨부된 파일을 폼에 표시
    const attachedFileName = document.getElementById("attached-file-text");
    const attachedSheetFileName = document.getElementById(
      "attached-sheet-file-text"
    );

    // 음악 파일 처리
    if (selectedMusicFile) {
      attachedFileName.textContent = `${selectedMusicFile.title} (라이브러리 음악)`;
    } else if (
      document.getElementById("edit-new-music-file").files.length > 0
    ) {
      const musicFile = document.getElementById("edit-new-music-file").files[0];
      attachedFileName.textContent = `${musicFile.name} (새 음악 업로드)`;
    } else {
      attachedFileName.textContent = "";
    }

    // 악보 파일 처리
    if (selectedSheetFile) {
      attachedSheetFileName.textContent = `${selectedSheetFile.title} (라이브러리 악보)`;
    } else if (
      document.getElementById("edit-new-sheet-file").files.length > 0
    ) {
      const sheetFile = document.getElementById("edit-new-sheet-file").files[0];
      attachedSheetFileName.textContent = `${sheetFile.name} (새 악보 업로드)`;
      document.getElementById("attached-sheet-file-name").style.display =
        "block";
    } else {
      document.getElementById("attached-sheet-file-name").style.display =
        "none";
      attachedSheetFileName.textContent = "";
    }
    document.getElementById("attached-file-name").style.display = "block";
  } else {
    alert("선택된 항목이 없습니다.");
  }
});

window.onload = () => {
  loadPostData();
};
