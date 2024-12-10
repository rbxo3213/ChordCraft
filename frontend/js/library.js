// frontend/js/library.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

const musicTab = document.getElementById("music-tab");
const sheetTab = document.getElementById("sheet-tab");
const musicContent = document.getElementById("music-content");
const sheetContent = document.getElementById("sheet-content");

musicTab.addEventListener("click", () => {
  musicContent.classList.remove("hidden");
  sheetContent.classList.add("hidden");
});

sheetTab.addEventListener("click", () => {
  sheetContent.classList.remove("hidden");
  musicContent.classList.add("hidden");
});

async function loadUserMusic() {
  const response = await fetch(`${SERVER_URL}/api/music/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  const musicList = document.getElementById("music-list");
  musicList.innerHTML = "";
  if (!data.musicList || data.musicList.length === 0) {
    const li = document.createElement("li");
    li.textContent = "등록된 음악이 없습니다.";
    musicList.appendChild(li);
    return;
  }

  data.musicList.forEach((music) => {
    const li = document.createElement("li");
    li.textContent = `${music.title} `;
    const playButton = document.createElement("button");
    playButton.classList.add("btn");
    playButton.textContent = "재생";
    playButton.onclick = () => {
      const audio = new Audio(`${SERVER_URL}${music.fileUrl}`);
      audio.play();
    };
    li.appendChild(playButton);

    // 삭제 버튼 추가
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("정말 이 음악을 삭제하시겠습니까?")) return;
      const delRes = await fetch(`${SERVER_URL}/api/music/${music._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const delData = await delRes.json();
      if (delRes.ok) {
        alert("음악 삭제 성공");
        loadUserMusic();
      } else {
        alert("음악 삭제 실패: " + (delData.error || delData.message));
      }
    });
    li.appendChild(deleteBtn);

    musicList.appendChild(li);
  });
}

async function loadUserSheets() {
  const response = await fetch(`${SERVER_URL}/api/sheets/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  const sheetList = document.getElementById("sheet-list");
  sheetList.innerHTML = "";
  if (!data.sheets || data.sheets.length === 0) {
    const li = document.createElement("li");
    li.textContent = "등록된 악보가 없습니다.";
    sheetList.appendChild(li);
    return;
  }

  data.sheets.forEach((sheet) => {
    const li = document.createElement("li");
    li.textContent = `${sheet.title} `;
    const img = document.createElement("img");
    img.src = SERVER_URL + sheet.fileUrl;
    img.width = 50;
    img.height = 50;
    li.appendChild(img);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("정말 이 악보를 삭제하시겠습니까?")) return;
      const delRes = await fetch(`${SERVER_URL}/api/sheets/${sheet._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const delData = await delRes.json();
      if (delRes.ok) {
        alert("악보 삭제 성공");
        loadUserSheets();
      } else {
        alert("악보 삭제 실패: " + (delData.error || delData.message));
      }
    });
    li.appendChild(deleteBtn);

    sheetList.appendChild(li);
  });
}

// 악보 업로드
document
  .getElementById("sheet-upload-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("sheet-title").value;
    const file = document.getElementById("sheet-file").files[0];
    if (!file) return alert("파일을 선택하세요.");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("sheet", file);

    const res = await fetch(`${SERVER_URL}/api/sheets/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const resData = await res.json();
    if (res.ok) {
      alert("악보 업로드 성공");
      document.getElementById("sheet-title").value = "";
      document.getElementById("sheet-file").value = "";
      loadUserSheets();
    } else {
      alert("악보 업로드 실패: " + (resData.error || resData.message));
    }
  });

window.onload = () => {
  loadUserMusic();
  loadUserSheets();
};
