// backend/app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// CORS 옵션 설정
const corsOptions = {
  origin: "http://localhost:3000", // 프론트엔드 도메인 (포트 포함)
  credentials: true, // 인증 정보를 포함한 요청 허용
};

// CORS 설정 (가장 먼저 설정)
app.use(cors(corsOptions));

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공 (업로드된 파일 접근을 위해)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 라우터 설정
const userRoutes = require("./routes/users");
const musicRoutes = require("./routes/music");
app.use("/api/users", userRoutes);
app.use("/api/music", musicRoutes);

// 데이터베이스 연결 설정
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("DB Connected");
    // 서버 실행
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
  });
