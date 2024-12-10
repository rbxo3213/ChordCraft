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
    document.getElementById("nickname-display").textContent =
      data.user.nickname;

    let profilePicPath = data.user.profilePicture
      ? data.user.profilePicture
      : "/assets/images/profiles/default-profile.png";

    document.getElementById("profile-picture").src =
      SERVER_URL + profilePicPath;

    const musicList = document.getElementById("music-list");
    musicList.innerHTML = "";

    // 업로드한 음악/녹음한 음악(이미 library.js와 동일한 로직 사용 가능하다고 가정)
    // 여기서는 같은 사용자 업로드 음악을 표시
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
          const audio = new Audio(`${SERVER_URL}${music.fileUrl}`);
          audio.play();
        };
        listItem.appendChild(playButton);
        musicList.appendChild(listItem);
      });
    }
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

// 새 프로필 이미지 파일 업로드 처리
document
  .getElementById("upload-profile-pic-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("new-profile-pic-file");
    const file = fileInput.files[0];
    if (!file) return alert("파일을 선택해주세요.");

    const formData = new FormData();
    formData.append("profilePictureFile", file);

    // 프로필 업로드용 엔드포인트(파일로 업로드하는 pretend)
    // 서버에서도 multer등으로 처리 필요(여기서는 가정)
    const res = await fetch(`${SERVER_URL}/api/users/profile-picture`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const resData = await res.json();
    alert(resData.message);
    if (res.ok) {
      // 변경된 프로필 반영
      document.getElementById("profile-picture").src =
        SERVER_URL + "/uploads/" + file.name;
      modal.style.display = "none";
    }
  });
