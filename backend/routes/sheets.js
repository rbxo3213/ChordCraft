// backend/routes/sheets.js
const express = require("express");
const router = express.Router();
const sheetController = require("../controllers/sheetController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/sheets/"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// 악보 업로드
router.post(
  "/upload",
  authMiddleware,
  upload.single("sheet"),
  sheetController.uploadSheet
);

// 사용자의 악보 목록 조회
router.get("/user", authMiddleware, sheetController.getUserSheets);

// 악보 삭제 추가
router.delete("/:id", authMiddleware, sheetController.deleteSheet);

module.exports = router;
