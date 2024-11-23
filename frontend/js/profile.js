// frontend/js/profile.js

// 서버 URL 설정
const SERVER_URL = "http://localhost:5000";

// 토큰 및 사용자 ID 가져오기
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

// 프로필 정보 가져오기
window.onload = async () => {
  const response = await fetch(`${SERVER_URL}/api/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (response.ok) {
    const musicList = document.getElementById("music-list");
    data.user.uploads.forEach((music) => {
      const listItem = document.createElement("li");
      listItem.textContent = music.title;
      // 음악 재생 버튼 추가
      const playButton = document.createElement("button");
      playButton.textContent = "재생";
      playButton.onclick = () => {
        const audio = new Audio(`${SERVER_URL}${music.fileUrl}`);
        audio.play();
      };
      listItem.appendChild(playButton);
      musicList.appendChild(listItem);
    });
  } else {
    alert(data.message);
  }
};
