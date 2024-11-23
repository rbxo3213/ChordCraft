// frontend/js/auth.js

// 서버 URL 설정
const SERVER_URL = "http://localhost:5000";

// 회원가입 이벤트
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;

    const response = await fetch(`${SERVER_URL}/api/users/register`, {
      method: "POST",
      credentials: "include", // 인증 정보를 포함한 요청
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    alert(data.message);
  });

// 로그인 이벤트
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch(`${SERVER_URL}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    alert(data.message);
    // 로그인 성공 시 토큰 저장 및 페이지 이동
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    window.location.href = "guitar.html";
  } else {
    alert(data.message);
  }
});
