// backend/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(401).json({ message: "토큰 없음" });

  // 'Bearer ' 문자열 제거
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰" });
  }
};
