const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

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
    li.style.marginBottom = "10px";
    li.textContent = `${music.title} `;
    const playButton = document.createElement("button");
    playButton.classList.add("btn");
    playButton.textContent = "재생";
    playButton.onclick = () => {
      const audio = new Audio(`${SERVER_URL}${music.fileUrl}`);
      audio.play();
    };
    li.appendChild(playButton);
    musicList.appendChild(li);
  });
}

window.onload = () => {
  loadUserMusic();
};
