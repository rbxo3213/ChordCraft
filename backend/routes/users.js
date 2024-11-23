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

module.exports = router;
