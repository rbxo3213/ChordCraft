// backend/routes/posts.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// 저장 경로 및 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "sheet") {
      cb(null, path.join(__dirname, "../uploads/sheets/"));
    } else {
      cb(null, path.join(__dirname, "../uploads/"));
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 다중 파일 업로드 설정
const uploadFields = upload.fields([
  { name: "music", maxCount: 1 },
  { name: "sheet", maxCount: 1 },
]);

router
  .route("/")
  .get(postController.getPosts)
  .post(authMiddleware, uploadFields, postController.createPost);

router.get("/mine", authMiddleware, postController.getMyPosts);

router
  .route("/:id")
  .get(postController.getPostById)
  .put(authMiddleware, uploadFields, postController.updatePost)
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
