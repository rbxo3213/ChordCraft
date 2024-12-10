// backend/controllers/postController.js
const Post = require("../models/Post");
const fs = require("fs");
const path = require("path");

exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    let musicFileUrl = null;
    if (req.file) {
      musicFileUrl = `/uploads/${req.file.filename}`;
    }

    const newPost = await Post.create({
      author: req.userId,
      title,
      content,
      musicFileUrl,
    });

    res.status(201).json({ message: "게시글 작성 성공", post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "nickname profilePicture")
      .sort({ createdAt: -1 });

    const postsWithLikeCount = posts.map((post) => {
      const postObj = post.toObject();
      postObj.likeCount = post.likes.length;
      return postObj;
    });

    res.status(200).json({ posts: postsWithLikeCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const posts = await Post.find({ author: userId })
      .populate("author", "nickname profilePicture")
      .sort({ createdAt: -1 });

    const postsWithLikeCount = posts.map((post) => {
      const postObj = post.toObject();
      postObj.likeCount = post.likes.length;
      return postObj;
    });

    res.status(200).json({ posts: postsWithLikeCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate("author", "nickname profilePicture")
      .populate("comments.author", "nickname profilePicture");
    if (!post) return res.status(404).json({ message: "게시글 없음" });

    const postObj = post.toObject();
    postObj.likeCount = post.likes.length;

    res.status(200).json({ post: postObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, removeMusic } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: "수정 권한 없음" });
    }

    post.title = title;
    post.content = content;

    // 음악 파일 처리 로직
    // 실제 프로젝트 구조에 따라 파일 경로 조정 필요
    // 여기서는 uploads 폴더가 backend 하위라고 가정
    // post.musicFileUrl가 "/uploads/filename" 형태이므로 basename 추출
    const uploadsPath = path.join(__dirname, "../uploads");

    if (removeMusic === "true") {
      // 기존 파일 삭제
      if (post.musicFileUrl) {
        const oldFilename = path.basename(post.musicFileUrl);
        const oldFilePath = path.join(uploadsPath, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      post.musicFileUrl = null;
    } else if (req.file) {
      // 새 파일 업로드 -> 기존 파일 삭제 후 교체
      if (post.musicFileUrl) {
        const oldFilename = path.basename(post.musicFileUrl);
        const oldFilePath = path.join(uploadsPath, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      post.musicFileUrl = `/uploads/${req.file.filename}`;
    }
    // 파일 변경 없고 removeMusic 없으면 기존 유지

    await post.save();
    res.status(200).json({ message: "게시글 수정 성공", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: "삭제 권한 없음" });
    }

    // 삭제 시 음악파일도 제거
    if (post.musicFileUrl) {
      const uploadsPath = path.join(__dirname, "../uploads");
      const oldFilename = path.basename(post.musicFileUrl);
      const oldFilePath = path.join(uploadsPath, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "게시글 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(400).json({ message: "게시글 없음" });

    post.comments.push({ author: req.userId, content });
    await post.save();

    res.status(201).json({ message: "댓글 추가 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "댓글 없음" });
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: "수정 권한 없음" });
    }

    comment.content = content;
    await post.save();
    res.status(200).json({ message: "댓글 수정 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "댓글 없음" });
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: "삭제 권한 없음" });
    }

    post.comments.pull(commentId);
    await post.save();

    res.status(200).json({ message: "댓글 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });

    const userId = req.userId;
    const index = post.likes.findIndex((uid) => uid.toString() === userId);
    if (index === -1) {
      // 좋아요 추가
      post.likes.push(userId);
    } else {
      // 좋아요 취소
      post.likes.splice(index, 1);
    }

    await post.save();
    res
      .status(200)
      .json({ message: "좋아요 반영 성공", likeCount: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};
