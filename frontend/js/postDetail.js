// frontend/js/postDetail.js
const SERVER_URL = "http://localhost:5000";
const token = localStorage.getItem("token");
let currentPostId = null;
let currentUserId = localStorage.getItem("userId");

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
  document.getElementById("post-author").textContent = post.author
    ? post.author.nickname
    : "알 수 없음";
  const date = new Date(post.createdAt);
  document.getElementById("post-date").textContent = date.toLocaleString();

  // post.content을 HTML로 처리
  displayPostContent(post.content);

  document.getElementById("like-count").textContent = post.likeCount || 0;

  // 초기 좋아요 상태 반영
  const likeButton = document.getElementById("like-button");
  const userId = currentUserId;
  const userLiked =
    post.likes && post.likes.some((uid) => uid.toString() === userId);
  if (userLiked) {
    likeButton.classList.add("liked");
  } else {
    likeButton.classList.remove("liked");
  }

  const postMusicDiv = document.getElementById("post-music");
  postMusicDiv.innerHTML = "";
  if (post.musicFileUrl) {
    const playButton = document.createElement("button");
    playButton.textContent = "음악 재생";
    playButton.addEventListener("click", () => {
      const audio = new Audio(`${SERVER_URL}${post.musicFileUrl}`);
      audio.play();
    });
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

    if (comment.author && comment.author._id === currentUserId) {
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

function displayPostContent(content) {
  const contentElement = document.getElementById("post-content");
  const regex = /\[악보: (\/uploads\/sheets\/[^)]+)\]/g;
  const parts = content.split(regex);
  contentElement.innerHTML = ""; // 기존 내용 초기화

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // 일반 텍스트
      const p = document.createElement("p");
      p.textContent = parts[i];
      contentElement.appendChild(p);
    } else {
      // 악보 이미지 URL
      const img = document.createElement("img");
      img.src = `${SERVER_URL}${parts[i]}`;
      img.alt = "악보";
      img.style.maxWidth = "100%";
      contentElement.appendChild(img);
    }
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
    const likeButton = document.getElementById("like-button");
    // 토글 liked 클래스
    if (likeButton.classList.contains("liked")) {
      likeButton.classList.remove("liked");
    } else {
      likeButton.classList.add("liked");
    }
  } else {
    alert(data.message);
  }
});

document.getElementById("edit-button").addEventListener("click", () => {
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
