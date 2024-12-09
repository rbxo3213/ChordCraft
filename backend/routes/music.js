const express = require("express");
const router = express.Router();
const musicController = require("../controllers/musicController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post(
  "/upload",
  authMiddleware,
  upload.single("music"),
  musicController.uploadMusic
);
router.get("/user", authMiddleware, musicController.getUserMusic);

module.exports = router;
