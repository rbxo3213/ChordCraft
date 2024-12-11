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

// "첨부하기" 버튼 클릭 시 모달 열기
document
  .getElementById("attach-music-btn")
  .addEventListener("click", async () => {
    const modal = document.getElementById("music-modal");
    modal.style.display = "block";
    loadLibraryItems();
  });

// 모달 닫기 버튼
document.getElementById("music-modal-close").addEventListener("click", () => {
  document.getElementById("music-modal").style.display = "none";
  resetLibrarySelection();
});

// 라이브러리 모드 전환 버튼들
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

// 라이브러리 항목 로드
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
      document.getElementById("attach-selected-item").disabled = true;
      return;
    }

    // 선택된 항목 초기화
    selectedMusicFile = null;
    selectedSheetFile = null;
    document.getElementById("selected-item").textContent = "";
    document.getElementById("attach-selected-item").disabled = true;

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
          "selected-item"
        ).textContent = `선택된 항목: ${item.title}`;
        document.getElementById("attach-selected-item").disabled = false;
      });
      list.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading library items:", error);
    alert("라이브러리를 불러오는 중 오류가 발생했습니다.");
  }
}

// "첨부" 버튼 클릭 시 모달 닫기 및 알림
document
  .getElementById("attach-selected-item")
  .addEventListener("click", () => {
    const modal = document.getElementById("music-modal");
    modal.style.display = "none";
    alert("첨부가 완료되었습니다.");
  });

// 선택 초기화 함수
function resetLibrarySelection() {
  const list = document.getElementById("modal-library-list");
  list.querySelectorAll("li").forEach((li) => li.classList.remove("selected"));
  document.getElementById("selected-item").textContent = "";
  document.getElementById("attach-selected-item").disabled = true;
}

// 게시글 작성 폼 제출
document
  .getElementById("new-post-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("new-post-title").value.trim();
    const content = document.getElementById("new-post-content").value.trim();
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
      const response = await fetch(`${SERVER_URL}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      alert(resData.message);
      if (response.ok) {
        window.location.href = "board.html";
      }
    } catch (error) {
      console.error("Error creating new post:", error);
      alert("새 게시글 작성 중 오류가 발생했습니다.");
    }
  });
