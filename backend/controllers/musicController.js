// backend/controllers/musicController.js
const Music = require("../models/Music");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

exports.uploadMusic = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.userId;
    const musicTitle = title || "녹음_" + new Date().toISOString();
    const fileUrl = `/uploads/${req.file.filename}`;
    const newMusic = await Music.create({
      title: musicTitle,
      fileUrl,
      uploadedBy: userId,
    });

    await User.findByIdAndUpdate(userId, { $push: { uploads: newMusic._id } });

    res.status(201).json({ message: "음악 업로드 성공", music: newMusic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserMusic = async (req, res) => {
  try {
    const userId = req.userId;
    const musicList = await Music.find({ uploadedBy: userId });
    res.status(200).json({ musicList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMusic = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const music = await Music.findById(id);
    if (!music) return res.status(404).json({ error: "음악을 찾을 수 없음" });
    if (music.uploadedBy.toString() !== userId) {
      return res.status(403).json({ error: "삭제 권한 없음" });
    }

    // 파일 삭제
    const uploadsPath = path.join(__dirname, "../uploads");
    const oldFilename = path.basename(music.fileUrl);
    const oldFilePath = path.join(uploadsPath, oldFilename);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    await Music.findByIdAndDelete(id);
    await User.findByIdAndUpdate(userId, { $pull: { uploads: id } });

    res.status(200).json({ message: "음악 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류" });
  }
};
