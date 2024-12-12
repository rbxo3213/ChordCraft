// backend/models/Sheet.js
const mongoose = require("mongoose");

const SheetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sheet", SheetSchema);
