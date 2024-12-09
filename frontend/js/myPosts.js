const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "index.html";
}

async function loadMyPosts() {
  const response = await fetch(`${SERVER_URL}/api/posts/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  const myBoardList = document.getElementById("my-board-list");
  myBoardList.innerHTML = "";

  data.posts.forEach((post, index) => {
    const tr = document.createElement("tr");

    const noTd = document.createElement("td");
    noTd.textContent = data.posts.length - index;
    tr.appendChild(noTd);

    const titleTd = document.createElement("td");
    const titleLink = document.createElement("a");
    titleLink.href = `postDetail.html?postId=${post._id}`;
    titleLink.textContent = post.title || "제목 없음";
    titleTd.appendChild(titleLink);
    tr.appendChild(titleTd);

    const authorTd = document.createElement("td");
    authorTd.textContent = post.author ? post.author.nickname : "알 수 없음";
    tr.appendChild(authorTd);

    const createdAtTd = document.createElement("td");
    const date = new Date(post.createdAt);
    createdAtTd.textContent = date.toLocaleString();
    tr.appendChild(createdAtTd);

    const likesTd = document.createElement("td");
    likesTd.textContent = post.likeCount || 0;
    tr.appendChild(likesTd);

    myBoardList.appendChild(tr);
  });
}

window.onload = () => {
  loadMyPosts();
};
