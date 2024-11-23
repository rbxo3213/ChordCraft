// backend/routes/music.js
const express = require("express");
const router = express.Router();
const musicController = require("../controllers/musicController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/")); // 업로드 폴더
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 음악 업로드
router.post(
  "/upload",
  authMiddleware,
  upload.single("music"),
  musicController.uploadMusic
);

// 사용자별 음악 조회
router.get("/user", authMiddleware, musicController.getUserMusic);

module.exports = router;
