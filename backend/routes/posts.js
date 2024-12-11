// backend/routes/posts.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
// const multer = require("multer"); // 제거
// const path = require("path"); // 제거

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "../uploads/"));
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage }); // 제거

router
  .route("/")
  .get(postController.getPosts)
  .post(authMiddleware, postController.createPost); // multer 미들웨어 제거

router.get("/mine", authMiddleware, postController.getMyPosts);

router
  .route("/:id")
  .get(postController.getPostById)
  .put(authMiddleware, postController.updatePost) // multer 미들웨어 제거
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
