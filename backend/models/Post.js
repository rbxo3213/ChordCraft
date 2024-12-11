// backend/models/Post.js

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    musicFileUrl: { type: String, default: null },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
