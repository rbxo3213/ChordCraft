// frontend/js/postDetail.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");
let currentPostId = null;
let currentUserId = localStorage.getItem("userId"); // 로그인한 사용자 ID

async function loadPostDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("postId");
  currentPostId = postId;
  if (!postId) {
    alert("잘못된 접근입니다.");
    window.location.href = "board.html";
    return;
  }

  const response = await fetch(`${SERVER_URL}/api/posts/${postId}`);
  const data = await response.json();
  if (!response.ok) {
    alert(data.message);
    window.location.href = "board.html";
    return;
  }

  const post = data.post;
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-author").textContent = `작성자: ${
    post.author ? post.author.nickname : "알 수 없음"
  }`;
  const date = new Date(post.createdAt);
  document.getElementById(
    "post-date"
  ).textContent = `작성시간: ${date.toLocaleString()}`;
  document.getElementById("post-content").textContent = post.content;
  document.getElementById("like-count").textContent = post.likeCount || 0;

  const postMusicDiv = document.getElementById("post-music");
  postMusicDiv.innerHTML = "";
  if (post.musicFileUrl) {
    const playButton = document.createElement("button");
    playButton.textContent = "음악 재생";
    playButton.onclick = () => {
      const audio = new Audio(`${SERVER_URL}${post.musicFileUrl}`);
      audio.play();
    };
    postMusicDiv.appendChild(playButton);
  }

  // 댓글 표시
  const commentListDiv = document.getElementById("comment-list");
  commentListDiv.innerHTML = "";
  post.comments.forEach((comment) => {
    const div = document.createElement("div");
    div.classList.add("comment");
    const authorName = comment.author ? comment.author.nickname : "알 수 없음";
    div.innerHTML = `<span class="comment-author">${authorName}</span>: ${comment.content}`;

    // 댓글 작성자 본인이면 수정/삭제 버튼 표시
    if (comment.author && comment.author._id === currentUserId) {
      // 오른쪽 끝에 버튼을 배치하기 위한 컨테이너
      const btnContainer = document.createElement("span");
      btnContainer.style.float = "right";
      btnContainer.style.marginLeft = "10px";

      const editCommentBtn = document.createElement("button");
      editCommentBtn.textContent = "댓글 수정";
      editCommentBtn.onclick = async () => {
        const newContent = prompt("새 댓글 내용을 입력하세요", comment.content);
        if (!newContent) return;
        const res = await fetch(
          `${SERVER_URL}/api/posts/${currentPostId}/comments/${comment._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: newContent }),
          }
        );
        const resData = await res.json();
        if (res.ok) {
          alert(resData.message);
          window.location.reload();
        } else {
          alert(resData.message);
        }
      };
      btnContainer.appendChild(editCommentBtn);

      const deleteCommentBtn = document.createElement("button");
      deleteCommentBtn.textContent = "댓글 삭제";
      deleteCommentBtn.onclick = async () => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        const res = await fetch(
          `${SERVER_URL}/api/posts/${currentPostId}/comments/${comment._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const resData = await res.json();
        if (res.ok) {
          alert(resData.message);
          window.location.reload();
        } else {
          alert(resData.message);
        }
      };
      btnContainer.appendChild(deleteCommentBtn);

      div.appendChild(btnContainer);
    }

    commentListDiv.appendChild(div);
  });

  // 작성자 본인이면 수정/삭제 버튼 노출
  if (post.author && post.author._id === currentUserId) {
    document.getElementById("edit-button").style.display = "inline-block";
    document.getElementById("delete-button").style.display = "inline-block";
  }
}

document
  .getElementById("comment-submit")
  .addEventListener("click", async () => {
    const content = document.getElementById("comment-content").value.trim();
    if (!content) {
      alert("댓글 내용을 입력하세요.");
      return;
    }

    const res = await fetch(
      `${SERVER_URL}/api/posts/${currentPostId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    const resData = await res.json();
    if (res.ok) {
      alert(resData.message);
      window.location.reload();
    } else {
      alert(resData.message);
    }
  });

document.getElementById("like-button").addEventListener("click", async () => {
  const res = await fetch(`${SERVER_URL}/api/posts/${currentPostId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById("like-count").textContent = data.likeCount;
  } else {
    alert(data.message);
  }
});

document.getElementById("edit-button").addEventListener("click", () => {
  // 수정 버튼 클릭 시 editPost.html로 이동
  window.location.href = `editPost.html?postId=${currentPostId}`;
});

document.getElementById("delete-button").addEventListener("click", async () => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  const res = await fetch(`${SERVER_URL}/api/posts/${currentPostId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.ok) {
    alert(data.message);
    window.location.href = "board.html";
  } else {
    alert(data.message);
  }
});

window.onload = () => {
  loadPostDetail();
};
