// frontend/js/profile.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

window.onload = async () => {
  const response = await fetch(`${SERVER_URL}/api/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (response.ok) {
    // 프로필 정보 표시
    document.getElementById("nickname-display").textContent =
      data.user.nickname;

    let profilePicPath = data.user.profilePicture
      ? data.user.profilePicture
      : "/assets/images/profiles/default-profile.png";

    // 프로필 이미지는 SERVER_URL + 절대경로 로드
    document.getElementById("profile-picture").src =
      SERVER_URL + profilePicPath;

    const musicList = document.getElementById("music-list");
    data.user.uploads.forEach((music) => {
      const listItem = document.createElement("li");
      listItem.textContent = music.title;
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

// 비밀번호 변경
document
  .getElementById("change-password-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const response = await fetch(`${SERVER_URL}/api/users/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await response.json();
    alert(data.message);
  });

// 회원탈퇴
document
  .getElementById("delete-account")
  .addEventListener("click", async () => {
    if (!confirm("정말 회원탈퇴 하시겠습니까?")) return;
    const response = await fetch(`${SERVER_URL}/api/users/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    alert(data.message);
    if (response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "index.html";
    }
  });

// 프로필 사진 변경 모달
const modal = document.getElementById("profile-image-modal");
const changeBtn = document.getElementById("change-profile-pic");
const closeModalBtn = document.getElementById("close-modal");
const profileImageList = document.getElementById("profile-image-list");

changeBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

profileImageList.addEventListener("click", async (e) => {
  if (e.target.tagName === "IMG") {
    const selectedImg = e.target.getAttribute("data-img");
    // 프로필 사진 업데이트 요청
    const res = await fetch(`${SERVER_URL}/api/users/profile-picture`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profilePicture: selectedImg }),
    });
    const resData = await res.json();
    alert(resData.message);
    if (res.ok) {
      document.getElementById("profile-picture").src = SERVER_URL + selectedImg;
      modal.style.display = "none";
    }
  }
});
