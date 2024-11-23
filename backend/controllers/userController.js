// backend/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
require("dotenv").config();

// 회원가입
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 사용자명 유효성 검증
    if (!validator.isAlphanumeric(username)) {
      return res
        .status(400)
        .json({ message: "아이디는 영문자와 숫자만 사용할 수 있습니다." });
    }

    // 비밀번호 유효성 검증
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "비밀번호는 최소 8자 이상이어야 합니다." });
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res
        .status(400)
        .json({ message: "비밀번호는 숫자와 문자를 포함해야 합니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: "회원가입 성공", user: newUser });
  } catch (err) {
    console.error(err); // 서버 로그에 에러 출력
    res
      .status(500)
      .json({ message: "서버 오류가 발생했습니다. 관리자에게 문의하세요." });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 사용자명 및 비밀번호 입력값 검증
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "사용자 없음" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "비밀번호 불일치" });

    // JWT 토큰 생성
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "로그인 성공", token, userId: user._id });
  } catch (err) {
    console.error(err); // 서버 로그에 에러 출력
    res
      .status(500)
      .json({ message: "서버 오류가 발생했습니다. 관리자에게 문의하세요." });
  }
};

// 사용자 정보 가져오기 (프로필)
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate("uploads");
    if (!user) return res.status(400).json({ message: "사용자 없음" });

    res.status(200).json({ user });
  } catch (err) {
    console.error(err); // 서버 로그에 에러 출력
    res
      .status(500)
      .json({ message: "서버 오류가 발생했습니다. 관리자에게 문의하세요." });
  }
};
