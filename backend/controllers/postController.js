// backend/controllers/postController.js
const Post = require("../models/Post");

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
    res.status(200).json({ posts });
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
    postObj.likeCount = post.likes.length; // likeCount는 likes 배열 길이로 계산

    res.status(200).json({ post: postObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: "수정 권한 없음" });
    }

    post.title = title;
    post.content = content;
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

    await Post.findByIdAndDelete(id); // post.remove() 대신 findByIdAndDelete 사용
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
