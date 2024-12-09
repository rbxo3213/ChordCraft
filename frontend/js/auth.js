// frontend/js/auth.js

const SERVER_URL = "http://localhost:5000";

// 로그인 이벤트
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch(`${SERVER_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    alert(data.message);
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    window.location.href = "guitar.html";
  } else {
    alert(data.message);
  }
});

// 회원가입 이벤트
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const nickname = document.getElementById("register-nickname").value;

    const response = await fetch(`${SERVER_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, nickname }),
    });

    const data = await response.json();
    alert(data.message);
  });
