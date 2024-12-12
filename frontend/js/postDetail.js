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

  try {
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
    document.getElementById("post-content").textContent = post.content;
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

    // 음악 파일 표시
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

    // 악보 파일 표시
    const postSheetDiv = document.getElementById("post-sheet");
    postSheetDiv.innerHTML = "";
    if (post.sheetFileUrl) {
      const img = document.createElement("img");
      img.src = `${SERVER_URL}${post.sheetFileUrl}`;
      img.alt = "악보 이미지";
      img.style.width = "300px";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        window.open(`${SERVER_URL}${post.sheetFileUrl}`, "_blank");
      });
      postSheetDiv.appendChild(img);
    }

    // 댓글 표시
    const commentListDiv = document.getElementById("comment-list");
    commentListDiv.innerHTML = "";
    post.comments.forEach((comment) => {
      const div = document.createElement("div");
      div.classList.add("comment");
      const authorName = comment.author
        ? comment.author.nickname
        : "알 수 없음";
      div.innerHTML = `<span class="comment-author">${authorName}</span>: ${comment.content}`;

      if (comment.author && comment.author._id === currentUserId) {
        const btnContainer = document.createElement("span");
        btnContainer.style.float = "right";
        btnContainer.style.marginLeft = "10px";

        const editCommentBtn = document.createElement("button");
        editCommentBtn.textContent = "댓글 수정";
        editCommentBtn.onclick = async () => {
          const newContent = prompt(
            "새 댓글 내용을 입력하세요",
            comment.content
          );
          if (!newContent) return;
          try {
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
          } catch (error) {
            console.error("Error editing comment:", error);
            alert("댓글 수정 중 오류가 발생했습니다.");
          }
        };
        btnContainer.appendChild(editCommentBtn);

        const deleteCommentBtn = document.createElement("button");
        deleteCommentBtn.textContent = "댓글 삭제";
        deleteCommentBtn.onclick = async () => {
          if (!confirm("댓글을 삭제하시겠습니까?")) return;
          try {
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
          } catch (error) {
            console.error("Error deleting comment:", error);
            alert("댓글 삭제 중 오류가 발생했습니다.");
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
  } catch (error) {
    console.error("Error loading post detail:", error);
    alert("게시글 상세 데이터를 불러오는 데 실패했습니다.");
    window.location.href = "board.html";
  }
}

// 댓글 작성
document
  .getElementById("comment-submit")
  .addEventListener("click", async () => {
    const content = document.getElementById("comment-content").value.trim();
    if (!content) {
      alert("댓글 내용을 입력하세요.");
      return;
    }

    try {
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
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  });

// 좋아요 버튼 토글
document.getElementById("like-button").addEventListener("click", async () => {
  try {
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
  } catch (error) {
    console.error("Error toggling like:", error);
    alert("좋아요 기능을 사용할 수 없습니다.");
  }
});

// 게시글 수정 버튼 클릭 시
document.getElementById("edit-button").addEventListener("click", () => {
  window.location.href = `editPost.html?postId=${currentPostId}`;
});

// 게시글 삭제 버튼 클릭 시
document.getElementById("delete-button").addEventListener("click", async () => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
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
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("게시글 삭제 중 오류가 발생했습니다.");
  }
});

window.onload = () => {
  loadPostDetail();
};
