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

  try {
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
      document.getElementById("current-file-name").textContent =
        post.musicFileUrl.split("/").pop();
      document.getElementById("current-file-info").style.display = "block";
      document.getElementById("file-actions").style.display = "block";
      document.getElementById("selected-library-music-id").value = ""; // 초기화
      document.getElementById("selected-library-sheet-url").value = ""; // 초기화
    }
  } catch (error) {
    console.error("Error loading post data:", error);
    alert("게시글 데이터를 불러오는 중 오류가 발생했습니다.");
    window.location.href = "board.html";
  }
}

// "파일 삭제" 버튼 클릭 시 처리
document.getElementById("delete-file-button").addEventListener("click", () => {
  currentFileUrl = null;
  document.getElementById("current-file-info").style.display = "none";
  document.getElementById("file-actions").style.display = "none";
  document.getElementById("selected-library-music-id").value = "";
  document.getElementById("selected-library-sheet-url").value = "";
});

// 게시글 수정 폼 제출
document
  .getElementById("edit-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("edit-post-title").value.trim();
    const content = document.getElementById("edit-post-content").value.trim();
    const libraryMusicId = document.getElementById(
      "selected-library-music-id"
    ).value;
    const librarySheetUrl = document.getElementById(
      "selected-library-sheet-url"
    ).value;

    if (!title || !content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    // JSON 객체 생성
    const data = {
      title,
      content,
      libraryMusicId: libraryMusicId || null,
      librarySheetUrl: librarySheetUrl || null,
    };

    try {
      const response = await fetch(`${SERVER_URL}/api/posts/${currentPostId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!response.ok) {
        alert(resData.message || "서버 오류 발생");
      } else {
        alert(resData.message);
        window.location.href = `postDetail.html?postId=${currentPostId}`;
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  });

// "첨부하기" 버튼 클릭 시 모달 열기
document.getElementById("library-music-btn").addEventListener("click", () => {
  const modal = document.getElementById("edit-music-modal");
  modal.style.display = "block";
  loadEditLibraryItems();
});

// 모달 닫기 버튼
document
  .getElementById("edit-music-modal-close")
  .addEventListener("click", () => {
    document.getElementById("edit-music-modal").style.display = "none";
    resetEditLibrarySelection();
  });

// 라이브러리 모드 전환 버튼들
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

// 라이브러리 항목 로드
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
      document.getElementById("attach-edit-selected-item").disabled = true;
      return;
    }

    // 선택된 항목 초기화
    selectedMusicFile = null;
    selectedSheetFile = null;
    document.getElementById("edit-selected-item").textContent = "";
    document.getElementById("attach-edit-selected-item").disabled = true;

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
          document.getElementById("selected-library-sheet-url").value = "";
          document.getElementById("selected-library-music-id").value = item._id;
        } else {
          selectedSheetFile = item;
          selectedMusicFile = null;
          document.getElementById("selected-library-music-id").value = "";
          document.getElementById("selected-library-sheet-url").value =
            item.fileUrl;
        }
        document.getElementById(
          "edit-selected-item"
        ).textContent = `선택된 항목: ${item.title}`;
        document.getElementById("attach-edit-selected-item").disabled = false;
      });
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading edit library items:", error);
    alert("라이브러리를 불러오는 중 오류가 발생했습니다.");
  }
}

// "첨부" 버튼 클릭 시 모달 닫기 및 알림
document
  .getElementById("attach-edit-selected-item")
  .addEventListener("click", () => {
    const modal = document.getElementById("edit-music-modal");
    modal.style.display = "none";
    alert("첨부가 완료되었습니다.");
  });

// 선택 초기화 함수
function resetEditLibrarySelection() {
  const list = document.getElementById("edit-modal-library-list");
  list.querySelectorAll("li").forEach((li) => li.classList.remove("selected"));
  document.getElementById("edit-selected-item").textContent = "";
  document.getElementById("attach-edit-selected-item").disabled = true;
}

window.onload = () => {
  loadPostData();
};
