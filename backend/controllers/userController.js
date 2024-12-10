// backend/controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const path = require("path");
require("dotenv").config();

exports.register = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;

    if (!validator.isAlphanumeric(username)) {
      return res
        .status(400)
        .json({ message: "아이디는 영문자와 숫자만 사용할 수 있습니다." });
    }

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

    if (!nickname || nickname.trim() === "") {
      return res.status(400).json({ message: "닉네임을 입력해주세요." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      nickname,
    });
    res.status(201).json({ message: "회원가입 성공", user: newUser });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "서버 오류가 발생했습니다. 관리자에게 문의하세요." });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(400)
        .json({ message: "아이디나 비밀번호가 틀렸습니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "아이디나 비밀번호가 틀렸습니다." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "로그인 성공", token, userId: user._id });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "서버 오류가 발생했습니다. 관리자에게 문의하세요." });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).populate("uploads");
    if (!user) return res.status(400).json({ message: "사용자 없음" });

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "서버 오류가 발생했습니다. 관리자에게 문의하세요." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "기존 비밀번호가 일치하지 않습니다." });

    if (
      newPassword.length < 8 ||
      !/\d/.test(newPassword) ||
      !/[a-zA-Z]/.test(newPassword)
    ) {
      return res.status(400).json({ message: "새 비밀번호 조건 불충족" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    res.status(200).json({ message: "비밀번호 변경 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.userId;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "회원탈퇴 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "사용자 없음" });

    if (req.file) {
      // 새 파일 업로드
      const fileUrl = `/uploads/${req.file.filename}`;
      user.profilePicture = fileUrl;
      await user.save();
      return res
        .status(200)
        .json({ message: "프로필 사진 변경 성공", fileUrl });
    } else if (req.body.profilePicture) {
      // 기존 이미지를 선택한 경우
      user.profilePicture = req.body.profilePicture;
      await user.save();
      return res
        .status(200)
        .json({
          message: "프로필 사진 변경 성공",
          fileUrl: req.body.profilePicture,
        });
    } else {
      return res.status(400).json({ message: "프로필 사진 정보 없음" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
};
