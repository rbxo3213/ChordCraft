// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // 업로드한 음악 목록
  uploads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Music" }],
});

module.exports = mongoose.model("User", UserSchema);
