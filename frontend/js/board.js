// frontend/js/board.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

let currentPage = 1;
const postsPerPage = 10;
let allPosts = [];

async function loadPosts() {
  const response = await fetch(`${SERVER_URL}/api/posts`);
  const data = await response.json();
  allPosts = data.posts || [];
  renderPosts();
}

function renderPosts() {
  const boardList = document.getElementById("board-list");
  boardList.innerHTML = "";
  const start = (currentPage - 1) * postsPerPage;
  const end = start + postsPerPage;
  const pagePosts = allPosts.slice(start, end);

  pagePosts.forEach((post, index) => {
    const tr = document.createElement("tr");

    const noTd = document.createElement("td");
    noTd.textContent = allPosts.length - (start + index);
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

    boardList.appendChild(tr);
  });
}

document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPosts();
  }
});
document.getElementById("next-page").addEventListener("click", () => {
  if (currentPage * postsPerPage < allPosts.length) {
    currentPage++;
    renderPosts();
  }
});

window.onload = () => {
  loadPosts();
};
