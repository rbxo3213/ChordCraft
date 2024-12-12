// backend/controllers/postController.js
const Post = require("../models/Post");
const Music = require("../models/Music"); // 라이브러리 음악 조회를 위해 추가
const Sheet = require("../models/Sheet");
const fs = require("fs");
const path = require("path");

exports.createPost = async (req, res) => {
  try {
    const { title, content, libraryMusicId, librarySheetId } = req.body;
    let musicFileUrl = null;
    let sheetFileUrl = null;

    // 음악 처리
    if (libraryMusicId && !req.files.music) {
      const music = await Music.findById(libraryMusicId);
      if (!music) {
        return res.status(400).json({ message: "선택한 라이브러리 음악 없음" });
      }
      musicFileUrl = music.fileUrl;
    }
    if (req.files.music && req.files.music.length > 0) {
      musicFileUrl = `/uploads/${req.files.music[0].filename}`;
    }

    // 악보 처리
    if (librarySheetId && !req.files.sheet) {
      const sheet = await Sheet.findById(librarySheetId);
      if (!sheet) {
        return res.status(400).json({ message: "선택한 라이브러리 악보 없음" });
      }
      sheetFileUrl = sheet.fileUrl;
    }
    if (req.files.sheet && req.files.sheet.length > 0) {
      sheetFileUrl = `/uploads/sheets/${req.files.sheet[0].filename}`;
    }

    const newPost = await Post.create({
      author: req.userId,
      title,
      content,
      musicFileUrl,
      sheetFileUrl,
    });

    res.status(201).json({ message: "게시글 작성 성공", post: newPost });
  } catch (err) {
    console.error("Error in createPost:", err);
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
    console.error("Error in getPosts:", err);
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
    console.error("Error in getMyPosts:", err);
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
    console.error("Error in getPostById:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      removeMusic,
      removeSheet,
      libraryMusicId,
      librarySheetId,
    } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "게시글 없음" });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: "수정 권한 없음" });
    }

    post.title = title;
    post.content = content;

    const uploadsPath = path.join(__dirname, "../uploads");

    // 음악 파일 삭제 처리
    if (removeMusic === "true") {
      if (post.musicFileUrl) {
        const oldFilename = path.basename(post.musicFileUrl);
        const oldFilePath = path.join(uploadsPath, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old music file: ${oldFilePath}`);
        }
      }
      post.musicFileUrl = null;
    }

    // 음악 파일 업로드 처리
    if (req.files.music && req.files.music.length > 0) {
      if (post.musicFileUrl) {
        const oldFilename = path.basename(post.musicFileUrl);
        const oldFilePath = path.join(uploadsPath, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old music file: ${oldFilePath}`);
        }
      }
      post.musicFileUrl = `/uploads/${req.files.music[0].filename}`;
      console.log(`Uploaded new music file: ${post.musicFileUrl}`);
    }

    // 라이브러리 음악 파일 설정
    if (libraryMusicId) {
      if (post.musicFileUrl) {
        const oldFilename = path.basename(post.musicFileUrl);
        const oldFilePath = path.join(uploadsPath, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old music file: ${oldFilePath}`);
        }
      }
      const music = await Music.findById(libraryMusicId);
      if (!music) {
        return res.status(400).json({ message: "선택한 라이브러리 음악 없음" });
      }
      post.musicFileUrl = music.fileUrl;
      console.log(`Set musicFileUrl from library: ${post.musicFileUrl}`);
    }

    // 악보 파일 삭제 처리
    if (removeSheet === "true") {
      if (post.sheetFileUrl) {
        const oldSheetFilename = path.basename(post.sheetFileUrl);
        const oldSheetFilePath = path.join(
          uploadsPath,
          "sheets",
          oldSheetFilename
        );
        if (fs.existsSync(oldSheetFilePath)) {
          fs.unlinkSync(oldSheetFilePath);
          console.log(`Deleted old sheet file: ${oldSheetFilePath}`);
        }
      }
      post.sheetFileUrl = null;
    }

    // 악보 파일 업로드 처리
    if (req.files.sheet && req.files.sheet.length > 0) {
      if (post.sheetFileUrl) {
        const oldSheetFilename = path.basename(post.sheetFileUrl);
        const oldSheetFilePath = path.join(
          uploadsPath,
          "sheets",
          oldSheetFilename
        );
        if (fs.existsSync(oldSheetFilePath)) {
          fs.unlinkSync(oldSheetFilePath);
          console.log(`Deleted old sheet file: ${oldSheetFilePath}`);
        }
      }
      post.sheetFileUrl = `/uploads/sheets/${req.files.sheet[0].filename}`;
      console.log(`Uploaded new sheet file: ${post.sheetFileUrl}`);
    }

    // 라이브러리 악보 파일 설정
    if (librarySheetId) {
      if (post.sheetFileUrl) {
        const oldSheetFilename = path.basename(post.sheetFileUrl);
        const oldSheetFilePath = path.join(
          uploadsPath,
          "sheets",
          oldSheetFilename
        );
        if (fs.existsSync(oldSheetFilePath)) {
          fs.unlinkSync(oldSheetFilePath);
          console.log(`Deleted old sheet file: ${oldSheetFilePath}`);
        }
      }
      const sheet = await Sheet.findById(librarySheetId);
      if (!sheet) {
        return res.status(400).json({ message: "선택한 라이브러리 악보 없음" });
      }
      post.sheetFileUrl = sheet.fileUrl;
      console.log(`Set sheetFileUrl from library: ${post.sheetFileUrl}`);
    }

    await post.save();
    res.status(200).json({ message: "게시글 수정 성공", post });
  } catch (err) {
    console.error("Error in updatePost:", err);
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

    const uploadsPath = path.join(__dirname, "../uploads");

    // 음악 파일 삭제
    if (post.musicFileUrl) {
      const oldFilename = path.basename(post.musicFileUrl);
      const oldFilePath = path.join(uploadsPath, oldFilename);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Deleted music file: ${oldFilePath}`);
      }
    }

    // 악보 파일 삭제
    if (post.sheetFileUrl) {
      const oldSheetFilename = path.basename(post.sheetFileUrl);
      const oldSheetFilePath = path.join(
        uploadsPath,
        "sheets",
        oldSheetFilename
      );
      if (fs.existsSync(oldSheetFilePath)) {
        fs.unlinkSync(oldSheetFilePath);
        console.log(`Deleted sheet file: ${oldSheetFilePath}`);
      }
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "게시글 삭제 성공" });
  } catch (err) {
    console.error("Error in deletePost:", err);
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
    console.error("Error in addComment:", err);
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
    console.error("Error in updateComment:", err);
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
    console.error("Error in deleteComment:", err);
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
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res
      .status(200)
      .json({ message: "좋아요 반영 성공", likeCount: post.likes.length });
  } catch (err) {
    console.error("Error in toggleLike:", err);
    res.status(500).json({ message: "서버 오류" });
  }
};
