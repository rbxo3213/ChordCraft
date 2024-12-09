// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, required: true },
  profilePicture: { type: String },
  uploads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Music" }],
});

module.exports = mongoose.model("User", UserSchema);
