// backend/routes/users.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

// 회원가입
router.post("/register", userController.register);

// 로그인
router.post("/login", userController.login);

// 프로필 조회
router.get("/profile", authMiddleware, userController.getUserProfile);

// 비밀번호 변경
router.post("/change-password", authMiddleware, userController.changePassword);

// 회원탈퇴
router.delete("/delete", authMiddleware, userController.deleteUser);

// 프로필 사진 변경
router.put(
  "/profile-picture",
  authMiddleware,
  userController.updateProfilePicture
);

module.exports = router;
