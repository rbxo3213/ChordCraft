// frontend/js/profile.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

let userData = null;

window.onload = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      userData = data.user;
      document.getElementById("nickname-display").textContent =
        data.user.nickname;

      let profilePicPath = data.user.profilePicture
        ? data.user.profilePicture
        : "/assets/images/profiles/default-profile.png";

      document.getElementById("profile-picture").src =
        SERVER_URL + profilePicPath;

      const musicList = document.getElementById("music-list");
      musicList.innerHTML = "";
      if (!data.user.uploads || data.user.uploads.length === 0) {
        const li = document.createElement("li");
        li.textContent = "등록된 음악이 없습니다.";
        musicList.appendChild(li);
      } else {
        data.user.uploads.forEach((music) => {
          const listItem = document.createElement("li");
          listItem.textContent = music.title + " ";
          const playButton = document.createElement("button");
          playButton.textContent = "재생";
          playButton.onclick = () => {
            const audioUrl = `${SERVER_URL}${music.fileUrl}`;
            const audio = new Audio(audioUrl);
            audio.play().catch((error) => {
              console.error("Audio playback failed:", error);
              alert("오디오 파일을 재생할 수 없습니다.");
            });
          };
          listItem.appendChild(playButton);
          musicList.appendChild(listItem);
        });
      }
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error fetching profile data:", error);
    alert("프로필 데이터를 불러오는 데 오류가 발생했습니다.");
  }
};

// 비밀번호 변경 동일
document
  .getElementById("change-password-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    try {
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
    } catch (error) {
      console.error("Error changing password:", error);
      alert("비밀번호 변경 중 오류가 발생했습니다.");
    }
  });

// 회원탈퇴 동일
document
  .getElementById("delete-account")
  .addEventListener("click", async () => {
    if (!confirm("정말 회원탈퇴 하시겠습니까?")) return;
    try {
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
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("회원탈퇴 중 오류가 발생했습니다.");
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

// 프로필 사진 변경 시
profileImageList.addEventListener("click", async (e) => {
  if (e.target.tagName === "IMG") {
    const selectedImg = e.target.getAttribute("data-img");
    try {
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
        // 즉시 반영
        document.getElementById("profile-picture").src =
          SERVER_URL + selectedImg;
        modal.style.display = "none";
      }
    } catch (error) {
      console.error("Error changing profile picture:", error);
      alert("프로필 사진 변경 중 오류가 발생했습니다.");
    }
  }
});

// 새 프로필 이미지 파일 업로드
document
  .getElementById("upload-profile-pic-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("new-profile-pic-file");
    const file = fileInput.files[0];
    if (!file) return alert("파일을 선택해주세요.");

    const formData = new FormData();
    formData.append("profilePictureFile", file);

    try {
      const res = await fetch(`${SERVER_URL}/api/users/profile-picture`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const resData = await res.json();
      alert(resData.message);
      if (res.ok && resData.fileUrl) {
        // 서버에서 fileUrl을 반환한다고 가정하면, 즉시 반영 가능
        document.getElementById("profile-picture").src =
          SERVER_URL + resData.fileUrl;
        modal.style.display = "none";
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("프로필 사진 업로드 중 오류가 발생했습니다.");
    }
  });
