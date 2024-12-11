// backend/controllers/postController.js

const Post = require("../models/Post");
const Music = require("../models/Music"); // 라이브러리 음악 조회를 위해 추가

// 게시글 생성
exports.createPost = async (req, res) => {
  try {
    const { title, content, libraryMusicId, librarySheetUrl } = req.body;
    let musicFileUrl = null;

    if (libraryMusicId) {
      // 라이브러리에서 음악 선택한 경우
      const music = await Music.findById(libraryMusicId);
      if (!music) {
        return res
          .status(400)
          .json({ message: "선택한 라이브러리 음악을 찾을 수 없습니다." });
      }
      musicFileUrl = music.fileUrl; // 라이브러리 음악의 fileUrl 사용
    }

    // content에 악보 URL 추가
    let finalContent = content;
    if (librarySheetUrl) {
      finalContent += `\n[악보: ${librarySheetUrl}]`;
    }

    const newPost = await Post.create({
      author: req.userId,
      title,
      content: finalContent,
      musicFileUrl,
    });

    res.status(201).json({ message: "게시글 작성 성공", post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 모든 게시글 조회
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

// 내 게시글 조회
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

// 특정 게시글 조회
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate("author", "nickname profilePicture")
      .populate("comments.author", "nickname profilePicture");
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

    const postObj = post.toObject();
    postObj.likeCount = post.likes.length;

    res.status(200).json({ post: postObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 게시글 수정
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, removeMusic, libraryMusicId, librarySheetUrl } =
      req.body;

    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    if (post.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "게시글을 수정할 권한이 없습니다." });
    }

    if (title) post.title = title;
    if (content) post.content = content;

    if (libraryMusicId) {
      // 라이브러리에서 음악 선택
      const music = await Music.findById(libraryMusicId);
      if (!music) {
        return res
          .status(400)
          .json({ message: "선택한 라이브러리 음악을 찾을 수 없습니다." });
      }
      post.musicFileUrl = music.fileUrl;
    } else if (removeMusic === "true") {
      // 음악 제거
      post.musicFileUrl = null;
    }

    // content에 악보 URL 추가
    if (librarySheetUrl) {
      post.content += `\n[악보: ${librarySheetUrl}]`;
    }

    await post.save();
    res.status(200).json({ message: "게시글 수정 성공", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 게시글 삭제
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    if (post.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "게시글을 삭제할 권한이 없습니다." });
    }

    // 게시글 삭제 (라이브러리의 파일은 삭제하지 않음)
    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "게시글 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 댓글 추가
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const post = await Post.findById(id);
    if (!post)
      return res.status(400).json({ message: "게시글을 찾을 수 없습니다." });

    post.comments.push({ author: req.userId, content });
    await post.save();

    res.status(201).json({ message: "댓글 추가 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 댓글 수정
exports.updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { content } = req.body;
    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    if (comment.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "댓글을 수정할 권한이 없습니다." });
    }

    comment.content = content;
    await post.save();
    res.status(200).json({ message: "댓글 수정 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    if (comment.author.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "댓글을 삭제할 권한이 없습니다." });
    }

    post.comments.pull(commentId);
    await post.save();

    res.status(200).json({ message: "댓글 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

// 좋아요 토글
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post)
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });

    const userId = req.userId;
    const index = post.likes.findIndex((uid) => uid.toString() === userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json({
      message: "좋아요 상태가 변경되었습니다.",
      likeCount: post.likes.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};
