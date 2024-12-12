// backend/controllers/sheetController.js
const Sheet = require("../models/Sheet");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

exports.uploadSheet = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.userId;
    const sheetTitle = title || "악보_" + new Date().toISOString();
    const fileUrl = `/uploads/sheets/${req.file.filename}`;

    const newSheet = await Sheet.create({
      title: sheetTitle,
      fileUrl,
      uploadedBy: userId,
    });

    await User.findByIdAndUpdate(userId, { $push: { sheets: newSheet._id } });

    res.status(201).json({ message: "악보 업로드 성공", sheet: newSheet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserSheets = async (req, res) => {
  try {
    const userId = req.userId;
    const sheets = await Sheet.find({ uploadedBy: userId });
    res.status(200).json({ sheets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSheet = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const sheet = await Sheet.findById(id);
    if (!sheet) return res.status(404).json({ error: "악보를 찾을 수 없음" });
    if (sheet.uploadedBy.toString() !== userId) {
      return res.status(403).json({ error: "삭제 권한 없음" });
    }

    // 파일 삭제
    const uploadsPath = path.join(__dirname, "../uploads/sheets");
    const oldFilename = path.basename(sheet.fileUrl);
    const oldFilePath = path.join(uploadsPath, oldFilename);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    await Sheet.findByIdAndDelete(id);
    await User.findByIdAndUpdate(userId, { $pull: { sheets: id } });

    res.status(200).json({ message: "악보 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
};
