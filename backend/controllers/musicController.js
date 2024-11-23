// backend/controllers/musicController.js
const Music = require("../models/Music");
const User = require("../models/User");

// 음악 업로드
exports.uploadMusic = async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.userId;
    const fileUrl = `/uploads/${req.file.filename}`;
    const newMusic = await Music.create({ title, fileUrl, uploadedBy: userId });

    // 사용자 모델에 업로드한 음악 추가
    await User.findByIdAndUpdate(userId, { $push: { uploads: newMusic._id } });

    res.status(201).json({ message: "음악 업로드 성공", music: newMusic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 사용자별 업로드한 음악 조회
exports.getUserMusic = async (req, res) => {
  try {
    const userId = req.userId;
    const musicList = await Music.find({ uploadedBy: userId });
    res.status(200).json({ musicList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
