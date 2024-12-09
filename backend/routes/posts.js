// backend/routes/posts.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // uploads 폴더 존재하는지 확인 후 없으면 만들어주세요.
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router
  .route("/")
  .get(postController.getPosts)
  .post(authMiddleware, upload.single("music"), postController.createPost);

router
  .route("/:id")
  .get(postController.getPostById)
  .put(authMiddleware, postController.updatePost)
  .delete(authMiddleware, postController.deletePost);

// 댓글 CRUD
router.post("/:id/comments", authMiddleware, postController.addComment);
router.put(
  "/:id/comments/:commentId",
  authMiddleware,
  postController.updateComment
);
router.delete(
  "/:id/comments/:commentId",
  authMiddleware,
  postController.deleteComment
);

// 좋아요 토글
router.post("/:id/like", authMiddleware, postController.toggleLike);

module.exports = router;
